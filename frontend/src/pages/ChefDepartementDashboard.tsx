import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 👈 Import navigation
import ImportExcel from "./ImportExcel";

const ChefDepartementDashboard: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate(); // 👈 Initialisation

  return (
    <main className="flex-1 flex justify-center items-start py-10 bg-[#f1f5fb]">
      {showForm ? (
        <ImportExcel onBack={() => setShowForm(false)} />
      ) : (
        <div className="bg-[#fff7ea] p-12 rounded-2xl shadow-xl text-center w-full max-w-3xl mt-6">
          <h2 className="text-4xl font-bold text-green-800 mb-10">
            🔐Mise à jour
          </h2>

          <button
            onClick={() => setShowForm(true)}
            className=" bg-white text-green-800 font-semibold px-6 py-4 rounded-md border border-green-800 w-full hover:bg-green-100 transition"
          >
            📁 Importer un fichier Excel structuré
          </button>

          <div className="mt-8">
            <button
              onClick={() => navigate("/categories")} // 👈 Redirection ici
              className="bg-green-700 text-white px-5 py-2 rounded hover:bg-green-800"
            >
              ⬅️ Retour au Site
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ChefDepartementDashboard;
