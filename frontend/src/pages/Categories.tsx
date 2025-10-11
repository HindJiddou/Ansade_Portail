// src/pages/Categories.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaHandHoldingHeart,
  FaLeaf,
  FaChartLine,
  FaFolderOpen,
} from "react-icons/fa";
import BackButton from "./BackButton";

interface Categorie { id: number; nom_cat: string; }

const fadeIn = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const metaByCategory = (nom: string) => {
  const n = nom.toLowerCase();
  if (n.includes("démograph")) return { icon: FaUsers, desc: "Statistiques de population, structure, dynamiques." };
  if (n.includes("pauvret"))   return { icon: FaHandHoldingHeart, desc: "Conditions de vie, vulnérabilités, bien-être." };
  if (n.includes("environnement")) return { icon: FaLeaf, desc: "Environnement, territoires, gouvernance." };
  if (n.includes("économ") || n.includes("econom")) return { icon: FaChartLine, desc: "Activité, prix, emploi et revenus." };
  return { icon: FaFolderOpen, desc: "Tableaux et indicateurs thématiques." };
};

export default function Categories() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [query, setQuery] = useState(""); // tu peux le garder si tu réactives une barre de recherche plus tard
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/categories/")
      .then(r => setCategories(r.data))
      .catch(console.error);
  }, []);

  // 👉 Tri par id (croissant) après filtrage éventuel
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = q
      ? categories.filter(c => c.nom_cat.toLowerCase().includes(q))
      : [...categories];

    // Tri strict par id croissant
    arr.sort((a, b) => a.id - b.id);
    return arr;
  }, [categories, query]);

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8">
      <div className="pt-6"><BackButton /></div>

      {/* En-tête */}
      <header className="text-center mt-6 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Catégories statistiques
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed max-w-3xl mx-auto">
          Les statistiques officielles de l’
          <span className="font-semibold text-emerald-700">ANSADE</span> sont
          regroupées en <span className="font-medium">quatre grandes catégories</span>.
          Chaque catégorie regroupe plusieurs{" "}
          <span className="font-medium">thèmes</span> couvrant les principaux domaines
          du développement national.
        </p>
      </header>

      {/* Grille 2 par ligne */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {filtered.map((cat) => {
          const meta = metaByCategory(cat.nom_cat);
          const Icon = meta.icon;

          return (
            <motion.button
              key={cat.id}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeIn}
              whileHover={{ y: -3 }}
              onClick={() => navigate(`/categories/${cat.id}`)}
              className={[
                "text-left group w-full rounded-xl",
                "bg-white border border-slate-200 hover:border-emerald-300",
                "shadow-sm hover:shadow-lg transition",
                "focus:outline-none focus:ring-2 focus:ring-emerald-400",
                "p-6 flex items-start gap-4"
              ].join(" ")}
            >
              <div className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700">
                <Icon className="text-xl" />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 leading-snug">
                  {cat.nom_cat}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {meta.desc}
                </p>
                <div className="mt-3 h-[2px] w-0 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-16 transition-all" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
