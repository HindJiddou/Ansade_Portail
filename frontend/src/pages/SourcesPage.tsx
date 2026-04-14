import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { Link } from "react-router-dom";
import {
  FaDatabase,
  FaFolderOpen,
  FaArrowLeft,
  FaChevronRight,
  FaChevronDown,
} from "react-icons/fa/index.js";
import { motion, AnimatePresence } from "framer-motion";

const SourcesPage: React.FC = () => {
  const [sources, setSources] = useState<Record<string, Record<string, string[]>>>({});
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedFamille, setSelectedFamille] = useState<string | null>(null);
  const [tableaux, setTableaux] = useState<{ id: number; titre: string }[]>([]);
  const [openFamille, setOpenFamille] = useState<string | null>(null);

  useEffect(() => {
    axiosInstance
      .get("/sources/grouped-auto/")
      .then((res:any) => {
        const data = Array.isArray(res.data)
          ? Object.assign({}, ...res.data)
          : res.data;
        console.log("✅ Réponse API sources :", data);
        setSources(data);
      })
      .catch((err) => console.error("Erreur lors du chargement des sources :", err));
  }, []); // ← important ! le [] ici


  // 🔹 Clic sur une sous-source
  const handleSourceClick = (source: string) => {
    setSelectedFamille(null);
    setSelectedSource(source);
    setTableaux([]);

    axiosInstance
      .get(`/sources/tableaux/?source=${encodeURIComponent(source)}`)
      .then((res:any) => setTableaux(res.data))
      .catch((err) =>
        console.error("Erreur lors du chargement des tableaux :", err)
      );
  };

  // 🔹 Clic sur un groupe entier (RGPH, EPCV, etc.)
  const handleFamilleClick = (famille: string, sourcesList: string[]) => {
    setSelectedSource(null);
    setSelectedFamille(famille);
    setOpenFamille((prev) => (prev === famille ? null : famille));
    setTableaux([]);

    // Charge tous les tableaux liés à cette famille
    Promise.all(
      sourcesList.map((src) =>
        axiosInstance.get(`/sources/tableaux/?source=${encodeURIComponent(src)}`)
      )
    )
      .then((responses) => {
        const merged = responses.flatMap((r) => r.data);
        const unique = Array.from(new Map(merged.map((t) => [t.id, t])).values());
        setTableaux(unique);
      })
      .catch((err) =>
        console.error(`Erreur lors du chargement des tableaux pour ${famille}:`, err)
      );
  };

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f6f9ff] p-6">
      <div className="max-w-7xl mx-auto">
        {/* ---------- Titre principal ---------- */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-emerald-800 flex items-center gap-3">
            <FaDatabase className="text-emerald-600" /> Sources de données
          </h1>

          {(selectedSource || selectedFamille) && (
            <button
              onClick={() => {
                setSelectedSource(null);
                setSelectedFamille(null);
                setTableaux([]);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
            >
              <FaArrowLeft /> Retour
            </button>
          )}
        </div>

        {/* ---------- Grille principale ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne gauche : arborescence */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 h-fit">
            {["ANSADE", "AUTRES"].map((section) => (
              <div key={section} className="mb-8">
                <h2 className="text-xl font-bold text-emerald-700 mb-4 border-b border-emerald-400 pb-2 uppercase">
                  {section}
                </h2>

                {Object.entries(sources?.[section] || {}).map(([famille, srcs]) => (
                  <div key={famille} className="mb-3">
                    {/* Famille principale */}
                    <div
                      onClick={() => handleFamilleClick(famille, srcs)}
                      className={`flex items-center justify-between cursor-pointer px-2 py-1 rounded-md transition-all ${
                        openFamille === famille
                          ? "bg-emerald-100 text-emerald-800 font-semibold shadow-inner"
                          : "hover:bg-slate-50 hover:text-emerald-700"
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm">
                        📊 {famille}
                      </span>
                      {openFamille === famille ? (
                        <FaChevronDown className="text-emerald-600" />
                      ) : (
                        <FaChevronRight className="text-slate-400" />
                      )}
                    </div>

                    {/* Sous-sources animées */}
                    <AnimatePresence initial={false}>
                      {openFamille === famille && (
                        <motion.ul
                          className="pl-5 mt-1 space-y-1 text-sm text-slate-700"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          {srcs.map((s, i) => (
                            <li key={i}>
                              <div
                                onClick={() => handleSourceClick(s)}
                                className={`cursor-pointer px-2 py-1 rounded-md transition ${
                                  s === selectedSource
                                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                                    : "hover:bg-slate-50 hover:text-emerald-700"
                                }`}
                              >
                                {s}
                              </div>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Colonne droite : tableaux liés */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-emerald-700 mb-3">
              {selectedSource
                ? `Tableaux associés à la source :`
                : selectedFamille
                ? `Tableaux liés au groupe :`
                : "Sélectionnez une source ou un groupe pour voir ses tableaux"}
            </h2>

            {(selectedSource || selectedFamille) && (
              <p className="text-slate-600 mb-5 text-sm font-medium">
                {selectedSource || selectedFamille}
              </p>
            )}

            <AnimatePresence>
              {tableaux.length > 0 ? (
                <motion.ul
                  key="tableaux-list"
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {tableaux.map((t) => (
                    <motion.li
                      key={t.id}
                      className="border border-slate-200 rounded-lg p-3 hover:shadow-sm hover:border-emerald-300 transition bg-slate-50/40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Link
                        to={`/tableaux/${t.id}`}
                        className="text-emerald-700 font-medium hover:underline"
                      >
                        {t.titre}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (selectedSource || selectedFamille) ? (
                <motion.p
                  key="aucun"
                  className="text-slate-500 italic mt-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Aucun tableau trouvé pour cette sélection.
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SourcesPage;
