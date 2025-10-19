import React, { useRef, useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { Link } from "react-router-dom";

export const BandeActualites = () => {
  const controls = useAnimation();
  const [paused, setPaused] = useState(false);
  const bandRef = useRef<HTMLDivElement>(null);

  const actualites = [
    { titre: "Nouveau tableau : Répartition démographique par région (T1.6)", lien: "/tableaux/16" },
    { titre: "Mise à jour : Indicateurs macroéconomiques 2023", lien: "/tableaux/22" },
    { titre: "Publication : Statistiques sur la scolarisation nationale", lien: "/tableaux/9" },
    { titre: "Ajout : Enquête sur les conditions de vie des ménages 2022", lien: "/sources" },
    { titre: "Amélioration du filtrage des tableaux interactifs", lien: "/statistiques" },
  ];

  const startAnimation = async () => {
    if (!bandRef.current) return;
    const width = bandRef.current.scrollWidth;
    await controls.start({
      x: [0, -width / 2],
      transition: {
        ease: "linear",
        duration: 35,
        repeat: Infinity,
      },
    });
  };

  useEffect(() => {
    startAnimation();
  }, []);

  useEffect(() => {
    if (paused) controls.stop();
    else startAnimation();
  }, [paused]);

  return (
    <div
      className="relative bg-emerald-700/25 backdrop-blur-sm text-white py-2 overflow-hidden cursor-default"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-6xl mx-auto flex items-center px-4">
        <div className="overflow-hidden whitespace-nowrap flex-1">
          <motion.div ref={bandRef} animate={controls} className="inline-block">
            {[...actualites, ...actualites].map((a, i) => (
              <Link
                key={i}
                to={a.lien}
                className="mx-6 inline-block text-white/90 hover:text-white text-[14px]"
              >
                • {a.titre}
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
