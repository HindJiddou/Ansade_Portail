import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isChef = user?.is_chef;
  const isSuperUser = user?.is_superuser || user?.is_staff;
  const canUpdate = isChef || isSuperUser;

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Styles des liens (gros, clairs, effet bouton + anim click)
  const baseBtn =
    "relative inline-flex items-center justify-center rounded-full px-4 py-2 text-lg font-medium " +
    "text-gray-800/90 hover:text-green-800 transition " +
    "hover:bg-green-600/10 hover:shadow active:scale-[0.97]";
  const underline =
    "after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-1 after:h-[2px] after:w-0 " +
    "after:bg-green-700 after:transition-all after:duration-300 hover:after:w-10";
  const activeBtn =
    "text-green-800 bg-green-600/10 after:w-10"; // trait visible et fond léger si actif
  
  const isActive = (path: string) => {
    if (path === "/accueil") return location.pathname === "/accueil" || location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const linkCls = (path: string) =>
    [baseBtn, underline, isActive(path) ? activeBtn : ""].join(" ");

  return (
    <header className="fixed w-full top-0 left-0 z-50 border-b bg-gradient-to-r from-green-100 via-white to-green-100 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center">
        {/* Colonne gauche : logo */}
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition"
          onClick={() => navigate("/accueil")}
        >
          <img src="/logo.png" alt="Logo" className="h-12" />
          <span className="text-xl font-bold text-green-800 tracking-wide">ANSADE</span>
        </div>

        {/* Colonne centre : NAV centré (reste centré même sans user) */}
        <div className="flex-1 flex justify-center">
          <nav className="flex flex-wrap items-center gap-3 md:gap-5">
            <Link to="/accueil" className={linkCls("/accueil")}>Accueil</Link>
            <Link to="/categories" className={linkCls("/categories")}>Statistiques</Link>
            <Link to="/sources" className={linkCls("/sources")}>Sources</Link>
            <Link to="/recherche" className={linkCls("/recherche")}>Recherche</Link>
            {canUpdate && (
              <>
                <Link to="/chef-departement" className={linkCls("/chef-departement")}>
                  Mise à jour
                </Link>
                <a
                  href="http://127.0.0.1:8000/admin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[baseBtn, underline].join(" ")}
                >
                  Gestion
                </a>
              </>
            )}
          </nav>
        </div>

        {/* Colonne droite : actions utilisateur (placeholder si non connecté pour garder le centre parfait) */}
        {user ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg shadow hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition"
            >
              🔌 Déconnexion
            </button>
         
          </div>
        ) : (
          // réserve l’espace pour que la nav reste centée quand on n’est pas connecté
          <div className="w-[150px]" />
        )}
      </div>
    </header>
  );
};

export default Header;
