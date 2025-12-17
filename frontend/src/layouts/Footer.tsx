import React from "react";

const Footer: React.FC = () => (
  <section className="bg-white border-t">
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 text-center text-xs md:text-sm text-slate-600">
      © {new Date().getFullYear()} — Tous droits réservés | Agence Nationale de la Statistique et de l’Analyse Démographique et Économique
    </div>
  </section>
);

export default Footer;
