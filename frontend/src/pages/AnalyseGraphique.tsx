import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DonneeAPI {
  categorie_ligne: string;
  categorie_colonne: string;
  valeur: number;
}

interface ReponseAPI {
  titre: string;
  donnees: DonneeAPI[];
  type: string;
}

interface DonneeGraphique {
  annee?: string;
  groupe?: string;
  moyenne: number;
}

const AnalyseGraphique = () => {
  const { id } = useParams();
  const [donnees, setDonnees] = useState<DonneeGraphique[]>([]);
  const [titre, setTitre] = useState<string>("");
  const [type, setType] = useState<string>("");

  useEffect(() => {
    if (!id) return;

    axios
      .get<ReponseAPI>(`/api/tableaux/${id}/analyse/`)
      .then((response) => {
        const { donnees, titre, type } = response.data;
        setTitre(titre);
        setType(type);

        if (type === "annees") {
          const grouped: Record<string, { total: number; count: number }> = {};
          donnees.forEach((item) => {
            const annee = item.categorie_colonne;
            if (!grouped[annee]) {
              grouped[annee] = { total: 0, count: 0 };
            }
            grouped[annee].total += item.valeur;
            grouped[annee].count += 1;
          });

          const moyennes: DonneeGraphique[] = Object.entries(grouped).map(
            ([annee, { total, count }]) => ({
              annee,
              moyenne: parseFloat((total / count).toFixed(4)),
            })
          );

          setDonnees(moyennes);
        } else {
          const grouped: Record<string, { total: number; count: number }> = {};
          donnees.forEach((item) => {
            const groupe = item.categorie_ligne;
            if (!grouped[groupe]) {
              grouped[groupe] = { total: 0, count: 0 };
            }
            grouped[groupe].total += item.valeur;
            grouped[groupe].count += 1;
          });

          const moyennes: DonneeGraphique[] = Object.entries(grouped).map(
            ([groupe, { total, count }]) => ({
              groupe,
              moyenne: parseFloat((total / count).toFixed(4)),
            })
          );

          setDonnees(moyennes);
        }
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des données :", error);
      });
  }, [id]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-4">{titre}</h2>
      {donnees.length === 0 ? (
        <p className="text-center text-gray-500">Aucune donnée à afficher</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={donnees}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={type === "annees" ? "annee" : "groupe"} />
            <YAxis />
            <Tooltip
              formatter={(value: number) => value.toFixed(4)}
              labelFormatter={(label) => `${label}`}
            />
            <Bar dataKey="moyenne" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default AnalyseGraphique;
