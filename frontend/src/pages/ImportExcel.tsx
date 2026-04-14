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
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const [categorie, setCategorie] = useState(user?.categorie || null);

  /* =======================
     🔁 Chargement initial
  ======================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les catégories une seule fois si superuser/staff
        if ((user?.is_superuser || user?.is_staff) && categories.length === 0) {
          const res = await axiosInstance.get("/categories/");
          setCategories(res.data);
        }

        // Charger les thèmes selon la catégorie
        if (categorie?.id) {
          const res = await axiosInstance.get("/themes/");
          const filtered = res.data.filter(
            (theme: any) => theme.categorie === categorie.id
          );
          setThemes(filtered);
        } else {
          setThemes([]); // vider les thèmes si aucune catégorie
        }
      } catch (err) {
        console.error("Erreur chargement:", err);
      }
    };

    fetchData();
  }, [user?.id, categorie?.id]); // ⬅️ évite la boucle infinie

  /* =======================
     📤 Soumission du fichier
  ======================= */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file || !selectedTheme) {
      setMessage("❗ Veuillez choisir un fichier et un thème.");
      return;
    }

    setLoading(true);
    setMessage("⏳ Importation en cours...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("cat_id", categorie?.id);
    formData.append("theme_id", selectedTheme);

    try {
      const token = sessionStorage.getItem("access");
      const res = await axiosInstance.post("/import-excel/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ Import réussi
      setMessage(`✅ Fichier "${file.name}" importé avec succès !`);
      setLoading(false);

      // 🧹 Réinitialiser les champs
      setFile(null);
      setSelectedTheme("");
      if (user?.is_superuser) {
        setCategorie(null); // ✅ vider catégorie pour nouvelle sélection
        setThemes([]); // vider thèmes
      }
      (e.target as HTMLFormElement).reset();

      // 🕓 Effacer le message après 4 secondes
      setTimeout(() => setMessage(""), 4000);
    } catch (err: any) {
      console.error("Erreur import:", err.response?.data || err);
      setLoading(false);
      setMessage("❌ Erreur lors de l'importation.");
      setTimeout(() => setMessage(""), 4000);
    }
  };

  /* =======================
     🎨 Interface
  ======================= */
  return (
    <div className="bg-[#f0f7f4] p-10 rounded-xl shadow-lg w-full max-w-xl">
      <h2 className="text-2xl font-bold text-green-800 mb-6 text-center">
        📁 Importer un fichier Excel structuré
      </h2>

      {/* 🟡 Message d’état */}
      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm text-center font-medium ${
            message.includes("✅")
              ? "bg-green-100 text-green-800"
              : message.includes("❌")
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* 🧾 Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Fichier */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Fichier Excel
          </label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full border border-green-700 rounded p-2"
            disabled={loading}
          />
        </div>

        {/* Catégorie */}
        {user?.is_superuser ? (
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={categorie?.id || ""}
              onChange={(e) => {
                const selectedId = parseInt(e.target.value);
                const selectedCat = categories.find(
                  (cat) => cat.id === selectedId
                );
                setCategorie(selectedCat || null);
                setSelectedTheme("");
                setThemes([]); // 🔄 vider temporairement avant rechargement
              }}
              className="w-full border border-green-700 rounded p-2"
              disabled={loading}
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
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Catégorie
            </label>
            <input
              type="text"
              value={categorie?.nom_cat || "Non défini"}
              disabled
              className="w-full px-4 py-2 border rounded bg-gray-100"
            />
          </div>
        )}

        {/* Thème */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">Thème</label>
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full border border-green-700 rounded p-2"
            disabled={loading || !categorie?.id}
          >
            <option value="">Choisir un thème</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.nom_theme}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton d’import */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white font-semibold py-2 rounded transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-700 hover:bg-green-800"
          }`}
        >
          {loading ? "⏳ Importation..." : "📤 Importer"}
        </button>
      </form>

      {/* Bouton retour */}
      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-sm text-green-700 hover:underline"
          disabled={loading}
        >
          ← Retour au Dashboard
        </button>
      </div>
    </div>
  );
};

export default ImportExcel;
