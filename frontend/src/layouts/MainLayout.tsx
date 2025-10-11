import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const MainLayout: React.FC = () => {
  const location = useLocation();

  // Masquer le Header et le Footer uniquement sur la page de connexion
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!isLoginPage && <Header />}

      {/* Contenu principal */}
      <main className="flex-grow pt-24 px-6 bg-white">
        <Outlet />
      </main>

      {!isLoginPage && <Footer />}
    </div>
  );
};

export default MainLayout;
