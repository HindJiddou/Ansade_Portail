import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaUserFriends,
  FaHeartbeat,
  FaBookOpen,
  FaIdCard,
  FaChartBar,
  FaSearch,
} from "react-icons/fa";
import BackButton from "./BackButton";

interface Theme { id: number; nom_theme: string; categorie: number; }
interface Categorie { id: number; nom_cat: string; }

const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const metaByTheme = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("démograph") || n.includes("demograph"))
    return { icon: <FaUserFriends className="text-emerald-700" />, desc: "Population et structure." };
  if (n.includes("sant"))
    return { icon: <FaHeartbeat className="text-emerald-700" />, desc: "Couverture, personnel, équipements." };
  if (n.includes("éduc") || n.includes("educ"))
    return { icon: <FaBookOpen className="text-emerald-700" />, desc: "Scolarisation, réussite, infrastructures." };
  if (n.includes("etat civil") || n.includes("état civil"))
    return { icon: <FaIdCard className="text-emerald-700" />, desc: "Naissances, mariages, décès." };
  return { icon: <FaChartBar className="text-emerald-700" />, desc: "Indicateurs clés du thème." };
};

export default function Themes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [categorie, setCategorie] = useState<Categorie | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!id) return;

    // Charger les thèmes de cette catégorie
    axios
      .get("/api/themes/")
      .then((res) => {
        const filtered = res.data.filter((t: Theme) => t.categorie === parseInt(id, 10));
        setThemes(filtered);
      })
      .catch(console.error);

    // Charger la catégorie (pour le titre)
    axios
      .get(`/api/categories/${id}/`)
      .then((res) => setCategorie(res.data))
      .catch(console.error);
  }, [id]);

  // Liste triée par id (référence de base)
  const themesById = useMemo(
    () => [...themes].sort((a, b) => a.id - b.id),
    [themes]
  );

  // Filtrage par texte mais on conserve l'ordre par id
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return themesById;
    return themesById.filter((t) => t.nom_theme.toLowerCase().includes(q));
  }, [themesById, query]);

  const handlePick = (value: string) => {
    setQuery(value);
    const match = themesById.find(
      (t) => t.nom_theme.toLowerCase() === value.toLowerCase()
    );
    if (match) navigate(`/themes/${match.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8">
      <div className="pt-6">
        <BackButton />
      </div>

      {/* En-tête : titre dynamique avec nom de la catégorie */}
      <header className="text-center mt-6 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Thèmes de la catégorie{" "}
          <span className="text-emerald-700">{categorie?.nom_cat || "..."}</span>
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
          Choisissez un <span className="font-medium">thème</span> pour consulter
          les tableaux et indicateurs associés à ce domaine.
        </p>
      </header>

      {/* Barre de recherche compacte à droite */}
      <div className="flex justify-end mb-4">
        <label className="relative w-full sm:w-auto">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            list="themes-list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={(e) => handlePick(e.target.value)}
            placeholder="Rechercher un thème..."
            className="pl-10 pr-3 py-2 w-full sm:w-72 rounded-lg border border-slate-200 bg-white text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
          />
          {/* 👉 Menu déroulant trié par id */}
          <datalist id="themes-list">
            {themesById.map((t) => (
              <option key={t.id} value={t.nom_theme} />
            ))}
          </datalist>
        </label>
      </div>

      {/* Grille de cartes 2 par ligne (ordre par id) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((theme) => {
          const meta = metaByTheme(theme.nom_theme);
          return (
            <motion.button
              key={theme.id}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeIn}
              whileHover={{ y: -3 }}
              onClick={() => navigate(`/themes/${theme.id}`)}
              className={[
                "text-left group w-full rounded-xl",
                "bg-white border border-slate-200 hover:border-emerald-300",
                "shadow-sm hover:shadow-lg transition",
                "focus:outline-none focus:ring-2 focus:ring-emerald-400",
                "p-6 flex items-start gap-4",
              ].join(" ")}
            >
              <div className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700">
                <span className="text-xl">{meta.icon}</span>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 leading-snug">
                  {theme.nom_theme}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{meta.desc}</p>
                <div className="mt-3 h-[2px] w-0 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-16 transition-all" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
