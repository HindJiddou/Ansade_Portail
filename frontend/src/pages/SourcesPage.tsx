// src/pages/SourcesPage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const SourcesPage: React.FC = () => {
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [tableaux, setTableaux] = useState<{ id: number; titre: string }[]>([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/sources/")
      .then(res => setSources(res.data))
      .catch(err => console.error("Erreur lors du chargement des sources :", err));
  }, []);

  const handleSourceClick = (source: string) => {
    setSelectedSource(source);
    axios.get(`http://127.0.0.1:8000/api/sources/${encodeURIComponent(source)}/tableaux/`)
      .then(res => setTableaux(res.data))
      .catch(err => console.error("Erreur lors du chargement des tableaux :", err));
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Sources disponibles</h1>
      <div className="flex space-x-8">
        {/* Liste des sources */}
        <div className="w-1/3">
          <ul className="bg-white shadow rounded p-4 space-y-2">
            {sources.map((src, idx) => (
              <li
                key={idx}
                onClick={() => handleSourceClick(src)}
                className={`cursor-pointer p-2 rounded ${
                  src === selectedSource ? "bg-yellow-100 text-yellow-800 font-bold" : "hover:bg-gray-100"
                }`}
              >
                {src}
              </li>
            ))}
          </ul>
        </div>

        {/* Liste des tableaux */}
        <div className="w-2/3">
          <h2 className="text-lg font-semibold mb-2">
            {selectedSource ? `Tableaux de : ${selectedSource}` : "Sélectionnez une source"}
          </h2>
          <ul className="bg-white shadow rounded p-4 space-y-2">
            {tableaux.map(t => (
              <li key={t.id} className="border p-2 rounded hover:bg-gray-100">
                <Link
                  to={`/tableaux/${t.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {t.titre}
                </Link>
              </li>
            ))}
            {selectedSource && tableaux.length === 0 && (
              <li className="text-gray-500 italic">Aucun tableau trouvé.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SourcesPage;
