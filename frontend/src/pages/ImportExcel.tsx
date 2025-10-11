import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

type Props = {
  onBack: () => void;
};

const ImportExcel: React.FC<Props> = ({ onBack }) => {
  const [themes, setThemes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [selectedTheme, setSelectedTheme] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [categorie, setCategorie] = useState(user?.categorie || null);

  useEffect(() => {
  if (user?.is_superuser || user?.is_staff) {
    // Charger toutes les catégories
    axiosInstance.get("http://localhost:8000/api/categories/")
      .then(res => setCategories(res.data))
      .catch(err => console.error(err));
  }

  // Toujours charger les thèmes quand une catégorie est sélectionnée
  if (categorie?.id) {
    axiosInstance.get("http://localhost:8000/api/themes/")
      .then(res => {
        const filtered = res.data.filter((theme: any) => theme.categorie === categorie.id);
        setThemes(filtered);
      })
      .catch(err => console.error(err));
  }
}, [categorie, user]);



const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!file || !selectedTheme) {
    setMessage("❗ Veuillez remplir tous les champs.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("cat_id", categorie?.id);
  formData.append("theme_id", selectedTheme);

  try {
    const token = localStorage.getItem("access");

    const res = await axiosInstance.post("/import-excel/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`, // ⬅️ AJOUT OBLIGATOIRE ICI
      },
    });

    console.log("✅ Réponse backend :", res.data);
    setMessage("✅ Importation réussie !");
  } catch (err: any) {
    if (err.response) {
      console.error("Erreur backend :", err.response.data);
      setMessage(`❌ Erreur: ${JSON.stringify(err.response.data)}`);
    } else {
      console.error("Erreur inconnue :", err);
      setMessage("❌ Une erreur s'est produite.");
    }
  }
};



  return (
    <div className="bg-[#f0f7f4] p-10 rounded-xl shadow-lg w-full max-w-xl">
      <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">
        Importer un fichier Excel structuré
      </h2>

      {message && (
        <div className="mb-4 p-3 rounded bg-blue-100 text-blue-800 text-sm text-center font-medium">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Fichier Excel</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-green-700 rounded p-2"
          />
        </div>

        {user?.is_superuser ? (
          <div className="mb-4">
            <label className="block mb-1">Catégorie</label>
            <select
              value={categorie?.id || ""}
              onChange={(e) => {
                const selectedId = parseInt(e.target.value);
                const selectedCat = categories.find(cat => cat.id === selectedId);
                setCategorie(selectedCat || null);
                setSelectedTheme(""); // réinitialiser le thème si la catégorie change
              }}
              className="w-full px-4 py-2 border rounded"
            >
              <option value="">Choisir une catégorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom_cat}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block mb-1">Catégorie</label>
            <input
              type="text"
              value={categorie?.nom_cat || "Non défini"}
              disabled
              className="w-full px-4 py-2 border rounded bg-gray-100"
            />
          </div>
        )}


        <div>
          <label className="block font-semibold text-gray-700 mb-1">Thème</label>
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full border border-green-700 rounded p-2"
          >
            <option value="">Choisir un thème</option>
            {themes.map(theme => (
              <option key={theme.id} value={theme.id}>{theme.nom_theme}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded"
        >
          Importer
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-sm text-green-700 hover:underline"
        >
          ← Retour au Dashboard
        </button>
      </div>
    </div>
  );
};

export default ImportExcel;
