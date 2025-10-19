import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const Breadcrumb: React.FC = () => {
  const location = useLocation();

  // Divise le chemin d’accès (ex: /categories/3/themes/5)
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Ne rien afficher sur la page d'accueil
  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-sm text-gray-700 mb-4">
      <Link
        to="/"
        className="hover:text-emerald-700 font-medium italic transition-colors"
      >
        Accueil
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = "/" + pathnames.slice(0, index + 1).join("/");
        const isLast = index === pathnames.length - 1;

        // Transforme "categories" → "Catégories", "tableaux" → "Tableaux"
        const label =
          name.charAt(0).toUpperCase() +
          name
            .slice(1)
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <div key={name} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
            {isLast ? (
              <span className="italic text-gray-900">{label}</span>
            ) : (
              <Link
                to={routeTo}
                className="hover:text-emerald-700 italic font-medium transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
