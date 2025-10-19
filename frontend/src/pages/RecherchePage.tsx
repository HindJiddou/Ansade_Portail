import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaSearch, FaDatabase } from "react-icons/fa";

interface Resultat {
  type: string;
  id: number;
  nom: string;
  source?: string;
}

const RecherchePage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [afficherTout, setAfficherTout] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length > 1) {
        axios
          .get(`/api/recherche-globale/?q=${encodeURIComponent(query)}`)
          .then((res) => {
            setResultats(res.data);
            setAfficherTout(false);
          })
          .catch((err) => console.error("Erreur de recherche :", err));
      } else {
        setResultats([]);
      }
      setIsTyping(false);
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const resultatsAffiches = afficherTout ? resultats : resultats.slice(0, 6);

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#f6f9ff] py-10 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Titre principal */}
        <div className="flex items-center gap-3 mb-6">
          <FaSearch className="text-emerald-600 text-2xl" />
          <h1 className="text-2xl font-bold text-emerald-800">Recherche globale</h1>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <div className="flex items-center bg-white shadow-md rounded-xl px-4 py-2 border border-slate-200">
            <FaSearch className="text-slate-400 mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsTyping(true);
              }}
              placeholder="Rechercher une catégorie, un thème, un tableau ou une source..."
              className="w-full outline-none bg-transparent text-slate-700 placeholder-slate-400"
            />
          </div>

          {/* Liste déroulante des résultats */}
          {query.length > 1 && resultats.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-slate-200 mt-2 rounded-xl shadow-md max-h-80 overflow-y-auto">
              {resultatsAffiches.map((r, idx) => (
                <li
                  key={idx}
                  className="border-b last:border-0 hover:bg-slate-50 transition"
                >
                  <Link
                    to={
                      r.type === "Tableau"
                        ? `/tableaux/${r.id}`
                        : r.type === "Categorie"
                        ? `/categories/${r.id}`
                        : r.type === "Theme"
                        ? `/themes/${r.id}`
                        : "#"
                    }
                    className="block px-4 py-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-700 font-semibold">
                        {r.type}
                      </span>
                      {r.source && (
                        <span className="text-xs text-slate-400 italic">
                          {r.source}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-800 text-sm font-medium truncate">
                      {r.nom}
                    </div>
                  </Link>
                </li>
              ))}

              {!afficherTout && resultats.length > 6 && (
                <li
                  onClick={() => setAfficherTout(true)}
                  className="text-center text-emerald-700 font-medium hover:bg-emerald-50 cursor-pointer p-3"
                >
                  Voir tous les résultats ({resultats.length})
                </li>
              )}
            </ul>
          )}

          {/* Aucun résultat */}
          {query.length > 1 && !isTyping && resultats.length === 0 && (
            <div className="absolute w-full bg-white border border-slate-200 mt-2 rounded-xl p-3 text-center text-slate-500 italic shadow-sm">
              Aucun résultat trouvé.
            </div>
          )}
        </div>

        {/* Résultats complets (vue élargie) */}
        {afficherTout && resultats.length > 6 && (
          <div className="mt-8 bg-white shadow rounded-xl border border-slate-200 p-4">
            <h2 className="text-lg font-semibold text-emerald-700 mb-3 flex items-center gap-2">
              <FaDatabase className="text-emerald-500" /> Tous les résultats
            </h2>
            <ul className="space-y-2">
              {resultats.map((r, idx) => (
                <li
                  key={idx}
                  className="p-2 rounded-lg hover:bg-slate-50 transition border-b last:border-0"
                >
                  <Link
                    to={
                      r.type === "Tableau"
                        ? `/tableaux/${r.id}`
                        : r.type === "Categorie"
                        ? `/categories/${r.id}`
                        : r.type === "Theme"
                        ? `/themes/${r.id}`
                        : "#"
                    }
                    className="block"
                  >
                    <span className="font-semibold text-emerald-700">{r.type} :</span>{" "}
                    <span className="text-slate-800">{r.nom}</span>
                    {r.source && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        Source : {r.source}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
};

export default RecherchePage;
