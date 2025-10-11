// src/pages/RecherchePage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

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
          .get(`http://127.0.0.1:8000/api/recherche-globale/?q=${encodeURIComponent(query)}`)
          .then((res) => {
            setResultats(res.data);
            setAfficherTout(false);
          })
          .catch((err) => console.error("Erreur de recherche :", err));
      } else {
        setResultats([]);
      }
      setIsTyping(false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const resultatsAffiches = afficherTout ? resultats : resultats.slice(0, 5);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Recherche globale</h1>

      <div className="mb-4 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsTyping(true);
          }}
          placeholder="Rechercher une catégorie, un thème, un tableau ou une source..."
          className="border px-4 py-2 rounded w-full"
        />

        {query.length > 1 && resultats.length > 0 && (
          <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow max-h-64 overflow-y-auto">
            {resultatsAffiches.map((r, idx) => (
              <li key={idx} className="p-2 hover:bg-gray-100 border-b">
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
                  <span className="font-medium">{r.type} :</span> {r.nom}
                  {r.source && (
                    <div className="text-sm text-gray-500">Source : {r.source}</div>
                  )}
                </Link>
              </li>
            ))}

            {!afficherTout && resultats.length > 5 && (
              <li
                onClick={() => setAfficherTout(true)}
                className="text-center text-blue-600 hover:underline cursor-pointer p-2"
              >
                Voir tous les résultats ({resultats.length})
              </li>
            )}
          </ul>
        )}

        {query.length > 1 && !isTyping && resultats.length === 0 && (
          <div className="absolute bg-white border mt-1 rounded p-2 text-gray-500">
            Aucun résultat trouvé.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecherchePage;
