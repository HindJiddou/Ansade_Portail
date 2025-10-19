import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";

const BackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const path = location.pathname;
    const segs = path.split("/").filter(Boolean); // ["categories","3"] etc.

    // Réinitialiser le label à chaque changement de route
    setLabel(null);

    async function resolveLabel() {
      try {
        // Accueil ou liste des catégories
        if (segs.length === 0 || (segs[0] === "categories" && segs.length === 1)) {
          setLabel("Accueil");
          return;
        }

        // Catégorie (on affiche le nom exact de la catégorie)
        if (segs[0] === "categories" && segs[1]) {
          const { data } = await axios.get(`/api/categories/${segs[1]}/`, {
            signal: controller.signal,
          });
          setLabel(data?.nom_cat || "Catégorie");
          return;
        }

        // Thèmes d’une catégorie (on affiche le nom exact du thème)
        if (segs[0] === "themes" && segs[1]) {
          const { data } = await axios.get(`/api/themes/${segs[1]}/`, {
            signal: controller.signal,
          });
          setLabel(data?.nom_theme || "Thème");
          return;
        }

        // Détail d’un tableau : on force “Tableaux” immédiatement (sans API)
        if (segs[0] === "tableaux" && segs[1]) {
          setLabel("Tableaux");
          return;
        }

        // Par défaut
        setLabel("Accueil");
      } catch (err) {
        // En cas d’erreur ou d’annulation, on évite tout flash
        setLabel("Accueil");
      }
    }

    resolveLabel();
    return () => controller.abort();
  }, [location.pathname]);

  return (
    <button
      onClick={() => navigate(-1)}
      className="group inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium text-base transition-all mb-6"
      aria-label="Retour"
    >
      <div className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-emerald-600 group-hover:bg-emerald-600 transition duration-200 shadow-sm hover:shadow-md">
        <ArrowLeft className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
      </div>

      {/* On n’affiche le texte que quand il est prêt : pas de mot parasite */}
      {label && <span className="text-[15px] group-hover:underline">{label}</span>}
    </button>
  );
};

export default BackButton;
