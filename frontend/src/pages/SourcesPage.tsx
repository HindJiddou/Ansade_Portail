import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaDatabase, FaFolderOpen, FaArrowLeft } from "react-icons/fa";

const SourcesPage: React.FC = () => {
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [tableaux, setTableaux] = useState<{ id: number; titre: string }[]>([]);

  useEffect(() => {
    axios
      .get("/api/sources/")
      .then((res) => setSources(res.data))
      .catch((err) => console.error("Erreur lors du chargement des sources :", err));
  }, []);

  const handleSourceClick = (source: string) => {
    setSelectedSource(source);
    axios
      .get(`/api/sources/${encodeURIComponent(source)}/tableaux/`)
      .then((res) => setTableaux(res.data))
      .catch((err) => console.error("Erreur lors du chargement des tableaux :", err));
  };

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f6f9ff] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Titre principal */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-emerald-800 flex items-center gap-3">
            <FaDatabase className="text-emerald-600" /> Sources de données
          </h1>

          {selectedSource && (
            <button
              onClick={() => setSelectedSource(null)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition"
            >
              <FaArrowLeft /> Retour
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Liste des sources */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 h-fit">
            <h2 className="text-lg font-semibold text-emerald-700 mb-3 flex items-center gap-2">
              <FaFolderOpen className="text-emerald-500" /> Liste des sources
            </h2>

            <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
              {sources.length === 0 && (
                <li className="text-sm text-slate-500 italic py-3">
                  Aucune source disponible.
                </li>
              )}

              {sources.map((src, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSourceClick(src)}
                  className={`cursor-pointer p-2 rounded-lg text-sm transition-all ${
                    src === selectedSource
                      ? "bg-emerald-100 text-emerald-800 font-semibold shadow-inner"
                      : "hover:bg-slate-50 hover:text-emerald-700"
                  }`}
                >
                  {src}
                </li>
              ))}
            </ul>
          </div>

          {/* Liste des tableaux (2 colonnes fusionnées sur grand écran) */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-md border border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-emerald-700 mb-3">
              {selectedSource
                ? `Tableaux associés à :`
                : "Sélectionnez une source pour voir ses tableaux"}
            </h2>

            {selectedSource && (
              <p className="text-slate-600 mb-4 text-sm font-medium">
                {selectedSource}
              </p>
            )}

            <ul className="space-y-2">
              {selectedSource && tableaux.length > 0 ? (
                tableaux.map((t) => (
                  <li
                    key={t.id}
                    className="border border-slate-200 rounded-lg p-3 hover:shadow-sm hover:border-emerald-300 transition bg-slate-50/40"
                  >
                    <Link
                      to={`/tableaux/${t.id}`}
                      className="text-emerald-700 font-medium hover:underline"
                    >
                      {t.titre}
                    </Link>
                  </li>
                ))
              ) : selectedSource ? (
                <li className="text-slate-500 italic">
                  Aucun tableau trouvé pour cette source.
                </li>
              ) : (
                <li className="text-slate-400 italic">Aucune sélection.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SourcesPage;
