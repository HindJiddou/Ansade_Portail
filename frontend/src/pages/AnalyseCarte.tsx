import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface DonneesCarte {
  titre: string;
  annees: string[];
  valeurs: Record<string, number>;
}

const AnalyseCarte = () => {
  const { id } = useParams();
  const [geoData, setGeoData] = useState<any>(null);
  const [donnees, setDonnees] = useState<DonneesCarte | null>(null);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState<string>("");

  // Charger la carte GeoJSON
  useEffect(() => {
    fetch("/data/mauritania.geojson")
      .then((res) => res.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Charger les données du backend (valeurs + années)
  const chargerDonnees = (annee: string) => {
    if (!id) return;

    fetch(`/api/tableaux/${id}/carte/?annee=${annee}`)
      .then((res) => res.json())
      .then((data) => {
        setDonnees(data);
      })
      .catch(console.error);
  };

  // Charger les données dès la 1ère fois (avec l’année par défaut)
  useEffect(() => {
    if (!id) return;

    fetch(`/api/tableaux/${id}/carte/`)
      .then((res) => res.json())
      .then((data) => {
        setDonnees(data);
        if (data.annees.length > 0) {
          setAnneeSelectionnee(data.annees[0]);
          chargerDonnees(data.annees[0]);
        }
      })
      .catch(console.error);
  }, [id]);

  // Style de chaque wilaya selon la valeur
  const getStyle = (feature: any) => {
    const nom = feature.properties.name;
    const valeur = donnees?.valeurs?.[nom] || 0;

    // Couleur basée sur la valeur
    let color = "#ccc";
    if (valeur > 10000000) color = "#084081";
    else if (valeur > 5000000) color = "#0868ac";
    else if (valeur > 1000000) color = "#2b8cbe";
    else if (valeur > 500000) color = "#4eb3d3";
    else if (valeur > 100000) color = "#7bccc4";
    else if (valeur > 0) color = "#a8ddb5";

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: "gray",
      fillOpacity: 0.7,
    };
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-center my-4">
        {donnees?.titre || "Carte des données"}
      </h2>

      {donnees && (
        <div className="text-center my-4">
          <label className="mr-2 font-medium">📅 Année : </label>
          <select
            value={anneeSelectionnee}
            onChange={(e) => {
              const newAnnee = e.target.value;
              setAnneeSelectionnee(newAnnee);
              chargerDonnees(newAnnee);
            }}
            className="border rounded px-3 py-1"
          >
            {donnees.annees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      )}

      {geoData && (
        <MapContainer
          style={{ height: "500px", width: "100%" }}
          center={[20.3, -10.5]}
          zoom={5}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON data={geoData} style={getStyle} />
        </MapContainer>
      )}
    </div>
  );
};

export default AnalyseCarte;
