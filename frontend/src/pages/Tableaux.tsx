import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import BackButton from "./BackButton";
import { FaSearch, FaRegEye, FaDownload, FaTable } from "react-icons/fa";

interface Tableau {
  id: number;
  titre: string;
  theme: number;
}
interface ThemeMeta {
  id: number;
  nom_theme: string;
  categorie: number;
}

const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const extraireTitre = (titre: string) => {
  const debut = titre.indexOf(":");
  const fin = titre.indexOf(";");
  if (debut !== -1 && fin !== -1 && fin > debut) return titre.slice(debut + 1, fin).trim();
  if (debut !== -1) return titre.slice(debut + 1).trim();
  return titre;
};

export default function Tableaux() {
  const { id } = useParams(); // id du thème
  const navigate = useNavigate();

  const [tableaux, setTableaux] = useState<Tableau[]>([]);
  const [themeMeta, setThemeMeta] = useState<ThemeMeta | null>(null);

  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Charger tableaux de ce thème
  useEffect(() => {
    axios
      .get("/api/tableaux/")
      .then((res) => {
        const filtered = res.data.filter((t: Tableau) => t.theme === parseInt(id || "0", 10));
        setTableaux(filtered);
      })
      .catch(console.error);
  }, [id]);

  // Charger nom du thème pour le titre
  useEffect(() => {
    if (!id) return;
    axios.get(`/api/themes/${id}/`).then((res) => setThemeMeta(res.data)).catch(console.error);
  }, [id]);

  // Base triée par id (référence unique d'ordre)
  const tableauxById = useMemo(() => [...tableaux].sort((a, b) => a.id - b.id), [tableaux]);

  // Liste affichée : filtre par texte mais conserve l'ordre par id
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tableauxById;
    return tableauxById.filter((t) => extraireTitre(t.titre).toLowerCase().includes(q));
  }, [tableauxById, query]);

  // Sélection datalist -> navigation si correspondance exacte
  const handlePick = (val: string) => {
    setQuery(val);
    const match = tableauxById.find(
      (t) => extraireTitre(t.titre).toLowerCase() === val.toLowerCase()
    );
    if (match) navigate(`/tableaux/${match.id}`);
  };

  // Téléchargement: adapte l’URL selon ton API
  const handleDownload = (tbl: Tableau, fmt: "pdf" | "xlsx") => {
    const url = `/api/tableaux/${tbl.id}/export?format=${fmt}`;
    window.open(url, "_blank");
    setOpenMenuId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8">
      <div className="pt-6">
        <BackButton />
      </div>

      {/* En-tête sobre, titre dynamique */}
      <header className="text-center mt-6 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Tableaux du thème{" "}
          <span className="text-emerald-700">{themeMeta?.nom_theme || "..."}</span>
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
          Consultez et exportez les tableaux normalisés liés à ce thème (PDF ou Excel).
        </p>
      </header>

      {/* Barre de recherche compacte à droite (input + datalist trié par id) */}
      <div className="flex justify-end mb-4">
        <label className="relative w-full sm:w-auto">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            list="tableaux-list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={(e) => handlePick(e.target.value)}
            placeholder="Rechercher un tableau…"
            className="pl-10 pr-3 py-2 w-full sm:w-80 rounded-lg border border-slate-200 bg-white text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
          />
          <datalist id="tableaux-list">
            {tableauxById.map((t) => (
              <option key={t.id} value={extraireTitre(t.titre)} />
            ))}
          </datalist>
        </label>
      </div>

      {/* Grille 2 par ligne — cartes sobres, actions à droite (ordre par id) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((t) => {
          const titreCourt = extraireTitre(t.titre);
          return (
            <motion.div
              key={t.id}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeIn}
              whileHover={{ y: -2 }}
              onMouseLeave={() => setOpenMenuId((cur) => (cur === t.id ? null : cur))}
              className={[
                "w-full rounded-xl",
                "bg-white border border-slate-200 hover:border-emerald-300",
                "shadow-sm hover:shadow-lg transition",
                "p-5 flex items-start gap-4",
              ].join(" ")}
            >
              {/* Icône */}
              <div className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700">
                <FaTable className="text-xl" />
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 leading-snug truncate">
                  {titreCourt}
                </h2>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                  Tableau normalisé | Sources et métadonnées disponibles sur la page détail.
                </p>
                <div className="mt-3 h-[2px] w-0 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-16 transition-all" />
              </div>

              {/* Actions */}
              <div className="relative flex items-center gap-2">
                {/* Visualiser */}
                <button
                  onClick={() => navigate(`/tableaux/${t.id}`)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 bg-white
                             hover:bg-slate-50 text-slate-700 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  title="Visualiser"
                >
                  <FaRegEye className="text-base" />
                </button>

                {/* Télécharger (menu) */}
                <button
                  onClick={() => setOpenMenuId((cur) => (cur === t.id ? null : t.id))}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 bg-white
                             hover:bg-slate-50 text-slate-700 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  title="Télécharger"
                >
                  <FaDownload className="text-base" />
                </button>

                {/* Menu déroulant format */}
                {openMenuId === t.id && (
                  <div
                    className="absolute right-0 top-10 z-20 w-36 rounded-md border border-slate-200 bg-white shadow-lg p-1"
                    role="menu"
                  >
                    <button
                      onClick={() => handleDownload(t, "pdf")}
                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-slate-700"
                    >
                      Télécharger en PDF
                    </button>
                    <button
                      onClick={() => handleDownload(t, "xlsx")}
                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-50 text-slate-700"
                    >
                      Télécharger en XLSX
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
