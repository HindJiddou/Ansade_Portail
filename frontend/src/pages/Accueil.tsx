import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import InfoCard from "../Components/InfoCard";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import {
  FaShieldAlt,
  FaSyncAlt,
  FaGlobeAfrica,
  FaChartBar,
  FaChartLine,
  FaDatabase,
  FaSearch,
} from "react-icons/fa";

/* ================= TITRE DE SECTION ================= */
const SectionTitle = ({ title }: { title: string }) => (
  <h2 className="text-2xl md:text-3xl font-bold text-emerald-800 mb-6 flex items-center gap-3">
    <span className="inline-block w-1.5 h-7 bg-emerald-600 rounded-full" />
    {title}
  </h2>
);

/* ================= PAGE ACCUEIL ================= */
const Accueil: React.FC = () => {
  return (
    <main className="bg-slate-50 font-sans text-slate-800">

      {/* ================= HERO ================= */}
      <section className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Portail des statistiques officielles – ANSADE
          </h1>

          <p className="mt-4 text-lg leading-relaxed text-white/90 max-w-4xl">
            Bienvenue sur le portail de l’
            <span className="font-semibold">
              Agence Nationale de la Statistique et de l’Analyse Démographique
              et Économique
            </span>
            , une plateforme dédiée à la diffusion et à la
            valorisation des statistiques officielles de la Mauritanie.
            Elle offre un accès centralisé aux données et indicateurs officiels
            pour soutenir la planification, la recherche et la prise de décision.
          </p>
        </div>
      </section>

      {/* ================= OBJECTIF ================= */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <SectionTitle title="Objectif du portail" />

        <p className="text-slate-700 text-base leading-relaxed max-w-5xl text-justify">
          Le portail national des statistiques a pour objectif de mettre à la disposition du public un{" "}
          <span className="font-semibold text-emerald-700">
            espace numérique, interactif et centralisé
          </span>{" "}
          permettant de consulter, d’analyser et d’exploiter les{" "}
          <span className="font-semibold text-emerald-700">
            données statistiques officielles
          </span>{" "}
          de la Mauritanie.
        </p>

        <p className="mt-4 text-slate-700 text-base leading-relaxed max-w-5xl text-justify">
          Ce portail vise à{" "}
          <span className="font-semibold text-emerald-700">
            renforcer la transparence
          </span>{" "}
          dans la diffusion de l’information publique, à{" "}
          <span className="font-semibold text-emerald-700">
            encourager la recherche
          </span>{" "}
          et à{" "}
          <span className="font-semibold text-emerald-700">
            appuyer la prise de décision fondée sur des données fiables
          </span>.
          Il valorise également le travail statistique national en le rendant plus accessible,
          compréhensible et utile à tous.
        </p>
      </section>

      {/* ================= ENGAGEMENTS ================= */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <SectionTitle title="Nos engagements" />

        <div className="grid md:grid-cols-3 gap-6">
          <InfoCard
            icon={<FaShieldAlt />}
            title="Fiabilité & Transparence"
            text="Toutes les statistiques proviennent de sources officielles vérifiées, assurant cohérence, rigueur et confiance."
          />
          <InfoCard
            icon={<FaSyncAlt />}
            title="Mise à jour continue"
            text="Les données sont régulièrement actualisées pour garantir leur pertinence."
          />
          <InfoCard
            icon={<FaGlobeAfrica />}
            title="Accessibilité"
            text="Les données sont ouvertes et accessibles à tous."
          />
        </div>
      </section>

      {/* ================= STRUCTURE ================= */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <SectionTitle title="Structure du portail" />

        <p className="text-slate-700 max-w-3xl mb-6 text-justify">
          Le portail national des statistiques est organisé de manière hiérarchique afin
          de faciliter l’accès, la lecture et la compréhension des données.
          Les <span className="font-semibold text-emerald-700">catégories</span> regroupent plusieurs <span className="font-semibold text-emerald-700">thèmes</span>, et chaque thème comprend des{" "} <span className="font-semibold text-emerald-700">tableaux de données</span> interactifs, filtrables et exportables. </p>
      

        <div className="grid md:grid-cols-3 gap-6">
          <InfoCard
            icon={<FaChartBar />}
            title="Catégories"
            text="Statistiques démographiques et sociales, Statistiques économiques, etc."
          />
          <InfoCard
            icon={<FaChartLine />}
            title="Thèmes"
            text="Démographie, Conditions de vie, Education, Commerce extérieur, Comptes nationaux, etc."
          />
          <InfoCard
            icon={<FaDatabase />}
            title="Tableaux"
            text="Affichage de tableaux de données indexés par thème, avec options de filtrage et d'exportation (Excel, PDF)"
          />
        </div>
      </section>

      {/* ================= DOMAINES COUVERTS ================= */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <SectionTitle title="Domaines couverts" />

          <p className="mt-2 text-slate-700 mb-6 max-w-3xl">
            Explorer les principaux domaines de statistiques nationales regroupant
            des données historiques et des indicateurs désagregés.
          </p>

          <DomainesCouvertsLiens />
        </div>
      </section>

      {/* ================= GUIDE ================= */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <SectionTitle title="Comment utiliser le portail" />

        <div className="grid md:grid-cols-3 gap-6">
          <InfoCard
            icon={<FaChartLine />}
            title="Consulter les statistiques"
            text="Parcourir les catégories dans l’onglet « Statistiques » pour visualiser, filtrer et exporter les données."
          />
          <InfoCard
            icon={<FaSearch />}
            title="Lancer une recherche"
            text="Utiliser l’onglet « Recherche » pour trouver rapidement un tableau, un indicateur ou un thème spécifique."
          />
          <InfoCard
            icon={<FaDatabase />}
            title="Consulter les sources"
            text="Accéder aux sources et métadonnées officielles pour mieux comprendre la provenance et la fiabilité des données."
          />
        </div>
      </section>
    </main>
  );
};

/* ================= DOMAINES COUVERTS LOGIQUE ================= */
const DomainesCouvertsLiens = () => {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<any[]>([]);

  useEffect(() => {
    axios.get("/api/themes/").then((res) => setThemes(res.data));
  }, []);

  const normalize = (str: string) =>
    str
      ?.toLowerCase()
      ?.normalize("NFD")
      ?.replace(/[\u0300-\u036f]/g, "")
      ?.trim();

  const getLink = (titre: string) => {
    const norm = normalize(titre);

    if (["demographie", "education", "sante"].includes(norm)) {
      const theme = themes.find((t) =>
        normalize(t.nom_theme).includes(norm)
      );
      return theme ? `/themes/${theme.id}` : null;
    }

    if (norm.includes("economie")) return "/categories/6";
    if (norm.includes("environnement")) {
      const theme = themes.find((t) =>
        normalize(t.nom_theme).includes("environnement")
      );
      return theme ? `/themes/${theme.id}` : null;
    }

    if (norm.includes("conditions")) {
      const theme = themes.find((t) =>
        normalize(t.nom_theme).includes("conditions de vie")
      );
      return theme ? `/themes/${theme.id}` : null;
    }

    return null;
  };

  const domaines = [
    { titre: "Démographie", desc: "Population, structure par âge et sexe, croissance" },
    { titre: "Éducation", desc: "Scolarisation, alphabétisation, infrastructures" },
    { titre: "Santé", desc: "Indicateurs de santé, couverture, personnel, équipements" },
    { titre: "Économie", desc: "PIB, commerce exterieur, prix" },
    { titre: "Environnement", desc: "Ressources naturelles, climat, territoires" },
    { titre: "Conditions de vie", desc: "Pauvreté, inégalités, développement humain" },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {domaines.map((d, i) => {
        const link = getLink(d.titre);
        return (
          <motion.div
            key={d.titre}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
          >
            <div
              onClick={() => link && navigate(link)}
              className={`
                rounded-2xl
                p-5
                bg-white
                ring-1 ring-slate-200
                shadow-sm
                transition
                hover:ring-emerald-300
                hover:bg-emerald-50/40
                flex flex-col justify-start
                min-h-[110px]
                ${link ? "cursor-pointer" : "opacity-60 pointer-events-none"}
              `}
            >
              <h3 className="font-semibold text-slate-900">{d.titre}</h3>
              <p className="mt-1 text-slate-700 text-sm">{d.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Accueil;
