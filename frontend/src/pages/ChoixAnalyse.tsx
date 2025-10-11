import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const ChoixAnalyse = () => {
  const { id } = useParams(); // id du tableau
  const [type, setType] = useState("");
  const [etiquetteLigne, setEtiquetteLigne] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/tableaux/${id}/`)
      .then((res) => {
        const el = res.data.etiquette_ligne;
        setEtiquetteLigne(el);
      })
      .catch((err) =>
        console.error("Erreur récupération etiquette_ligne", err)
      );
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setType(selected);
    if (selected === "graphique" || selected === "carte") {
      navigate(`/tableaux/${id}/analyser/${selected}`);
    }
  };

  return (
    <div className="text-center py-10">
      <h2 className="text-2xl font-semibold mb-4">🧪 Choisissez un type d’analyse</h2>
      <select
        onChange={handleChange}
        value={type}
        className="border border-yellow-500 rounded px-4 py-2 text-lg"
      >
        <option value="">-- Choisir une analyse --</option>
        <option value="graphique">📊 Graphique</option>
        {etiquetteLigne === "Wilaya" && (
          <option value="carte">🗺️ Carte</option>
        )}
      </select>
      <p className="mt-4 text-gray-500">
        Aucune analyse chargée. {etiquetteLigne === "Wilaya"
          ? "Choisissez une analyse ci-dessus."
          : "La carte n’est disponible que pour les tableaux par wilaya."}
      </p>
    </div>
  );
};

export default ChoixAnalyse;
