import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isChef = user?.is_chef;
  const isSuperUser = user?.is_superuser || user?.is_staff;
  const canUpdate = isChef || isSuperUser;

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 🔹 TES STYLES (INCHANGÉS)
  const baseBtn =
    "relative inline-flex items-center justify-center rounded-full px-4 py-2 text-lg font-medium " +
    "text-gray-800/90 hover:text-green-800 transition " +
    "hover:bg-green-600/10 hover:shadow active:scale-[0.97]";
  const underline =
    "after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-1 after:h-[2px] after:w-0 " +
    "after:bg-green-700 after:transition-all after:duration-300 hover:after:w-10";
  const activeBtn =
    "text-green-800 bg-green-600/10 after:w-10";

  const isActive = (path: string) => {
    if (path === "/accueil") {
      return location.pathname === "/accueil";
    }
    return location.pathname.startsWith(path);
  };

  const linkCls = (path: string) =>
    [baseBtn, underline, isActive(path) ? activeBtn : ""].join(" ");

  return (
    <header className="fixed w-full top-0 left-0 z-50 border-b bg-gradient-to-r from-green-100 via-white to-green-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center">

        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition"
          onClick={() => navigate("/accueil")}
        >
          <img src="/logo.png" alt="Logo" className="h-10 md:h-12" />
          <span className="text-lg md:text-xl font-bold text-green-800 tracking-wide">
            ANSADE
          </span>
        </div>

        {/* NAV DESKTOP (INCHANGÉE) */}
        <div className="hidden md:flex flex-1 justify-center">
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

        {/* Actions desktop */}
        {user ? (
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg shadow hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition"
            >
              🔌 Déconnexion
            </button>
          </div>
        ) : (
          <div className="hidden md:block w-[150px]" />
        )}

        {/* Bouton menu mobile */}
        <button
          onClick={() => setOpen(!open)}
          className="ml-auto md:hidden text-2xl px-2"
        >
          ☰
        </button>
      </div>

      {/* MENU MOBILE (STYLE CONSERVÉ) */}
      {open && (
        <div className="md:hidden bg-white border-t shadow-inner">
          <nav className="flex flex-col items-center gap-2 py-4">
            <Link to="/accueil" onClick={() => setOpen(false)} className={linkCls("/accueil")}>Accueil</Link>
            <Link to="/categories" onClick={() => setOpen(false)} className={linkCls("/categories")}>Statistiques</Link>
            <Link to="/sources" onClick={() => setOpen(false)} className={linkCls("/sources")}>Sources</Link>
            <Link to="/recherche" onClick={() => setOpen(false)} className={linkCls("/recherche")}>Recherche</Link>

            {canUpdate && (
              <>
                <Link to="/chef-departement" onClick={() => setOpen(false)} className={linkCls("/chef-departement")}>
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

            {user && (
              <button
                onClick={handleLogout}
                className="mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg"
              >
                🔌 Déconnexion
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
