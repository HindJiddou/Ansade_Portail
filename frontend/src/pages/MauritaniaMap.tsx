import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MauritaniaMap = () => {
  const [geoData, setGeoData] = useState<any>(null);

  // Charger le fichier GeoJSON dynamiquement
  useEffect(() => {
    fetch("/data/mauritania.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Erreur de chargement GeoJSON:", err));
  }, []);

  // Définir les événements pour chaque wilaya
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties?.name) {
      layer.bindTooltip(feature.properties.name, {
        permanent: false,
        direction: "top",
        className: "bg-white text-sm text-green-800 font-semibold shadow p-1 rounded",
      });
    }

    layer.on({
      mouseover: () => {
        (layer as L.Path).setStyle({ fillOpacity: 0.7 });
      },
      mouseout: () => {
        (layer as L.Path).setStyle({ fillOpacity: 0.5 });
      },
    });
  };

  return (
    <div className="h-[500px] w-full mt-6 rounded shadow overflow-hidden">
      <MapContainer center={[20.2, -10.9]} zoom={5} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoData && (
          <GeoJSON
            data={geoData}
            onEachFeature={onEachFeature}
            style={{
              color: "#2d6a4f",
              weight: 1,
              fillColor: "#95d5b2",
              fillOpacity: 0.5,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MauritaniaMap;
