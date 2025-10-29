import React from "react";
import { motion } from "framer-motion";
import { BandeActualites } from "./BandeActualites";
import {
  FaChartBar,
  FaDatabase,
  FaSearch,
  FaSyncAlt,
  FaShieldAlt,
  FaGlobeAfrica,
  FaChartLine,
} from "react-icons/fa";

// Animations réutilisables
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const SectionTitle = ({ title }: { title: string }) => (
  <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-800 mb-8 flex items-center gap-3 tracking-wide">
    <span className="inline-block w-1.5 h-8 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
    {title}
  </h2>
);

const Accueil: React.FC = () => {
  return (
    <main className="min-h-[calc(100vh-120px)] w-full bg-[#f6f9ff] font-sans antialiased">
      {/* ========= HERO ========= */}
      <section className="relative overflow-hidden">
        {/* Fond dégradé + halos subtils */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500" />
        <div className="absolute -top-24 -right-16 w-[38rem] h-[38rem] bg-teal-300/30 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-10 w-[28rem] h-[28rem] bg-emerald-300/25 blur-3xl rounded-full" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-6xl mx-auto px-6 py-14 md:py-20 text-white"
        >
          <motion.h1
            variants={fadeUp}
            className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight"
          >
            Portail officiel des statistiques – ANSADE
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-4 text-lg leading-relaxed text-white/90 max-w-4xl"
          >
            Bienvenue sur le portail de l’
            <span className="font-semibold">
              Agence Nationale de la Statistique et de l’Analyse Démographique
              et Économique
            </span>
            , la plateforme officielle dédiée à la diffusion et à la
            valorisation des statistiques nationales de la Mauritanie.  
            Elle offre un accès centralisé aux données et indicateurs officiels
            pour soutenir la planification, la recherche et la prise de décision.
          </motion.p>
        </motion.div>

        {/* Bande d’actualités */}
        <BandeActualites />
      </section>

      {/* ========= OBJECTIF ========= */}
      <section className="relative max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-white rounded-3xl shadow-md ring-1 ring-slate-200 p-10 md:p-14 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-white opacity-70 pointer-events-none" />
          <div className="relative z-10">
            <SectionTitle title="Objectif du portail" />
            <p className="text-slate-700 text-lg leading-relaxed md:leading-loose max-w-5xl text-justify">
              Le portail national des statistiques a pour objectif de mettre à la disposition du public un{" "}
              <span className="font-semibold text-emerald-700">
                espace numérique moderne, interactif et centralisé
              </span>{" "}
              permettant de consulter, d’analyser et d’exploiter les{" "}
              <span className="font-medium">données statistiques officielles</span> de la Mauritanie.
            </p>

            <p className="mt-5 text-slate-700 text-lg leading-relaxed md:leading-loose max-w-5xl text-justify">
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

            <div className="mt-10 h-[3px] w-40 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full opacity-80" />
          </div>
        </motion.div>
      </section>

      {/* ========= NOS ENGAGEMENTS ========= */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionTitle title="Nos engagements" />

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <FaShieldAlt />,
              title: "Fiabilité & Transparence",
              text: "Toutes les statistiques proviennent de sources officielles vérifiées, assurant cohérence, rigueur et confiance.",
            },
            {
              icon: <FaSyncAlt />,
              title: "Mise à jour continue",
              text: "Les données sont régulièrement actualisés par les départements de l’ANSADE pour garantir leur pertinence.",
            },
            {
              icon: <FaGlobeAfrica />,
              title: "Accessibilité nationale",
              text: "Les données sont ouvertes et accessibles à tous : décideurs, chercheurs, étudiants et citoyens intéressés.",
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl bg-white/95 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-lg transition"
            >
              <div className="absolute inset-x-0 -top-px h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-t-2xl opacity-80" />
              <div className="inline-flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 p-3 shadow-sm group-hover:bg-emerald-100 transition">
                <span className="text-2xl">{c.icon}</span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{c.title}</h3>
              <p className="mt-2 text-slate-700 leading-relaxed">{c.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========= STRUCTURE DU PORTAIL ========= */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionTitle title="Structure du portail" />

        <p className="text-slate-700 max-w-3xl mb-10 text-justify">
          Le portail national des statistiques est organisé de manière hiérarchique afin
          de faciliter l’accès, la lecture et la compréhension des données.  
          Les <span className="font-semibold text-emerald-700">catégories</span> regroupent
          plusieurs <span className="font-medium">thèmes</span>, et chaque thème comprend des{" "}
          <span className="font-medium">tableaux de données</span> interactifs, filtrables
          et exportables.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <FaChartBar />,
              title: "Catégories",
              desc: "Les grands domaines statistiques nationaux : Statistiques Démographiques et sociales, Statistiques Economiques,etc.",
            },
            {
              icon: <FaChartLine />,
              title: "Thèmes",
              desc: "Chaque catégorie contient plusieurs thèmes présentant des indicateurs spécifiques et des analyses sectorielles.",
            },
            {
              icon: <FaDatabase />,
              title: "Tableaux",
              desc: "Les tableaux affichent les données de chaque thème, avec des options de filtrage et d’exportation (Excel, PDF).",
            },
          ].map((x, i) => (
            <motion.div
              key={x.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl bg-white/95 backdrop-blur p-6 ring-1 ring-slate-200 shadow-sm hover:shadow-md transition"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 text-xl shadow-sm">
                {x.icon}
              </div>
              <h4 className="mt-3 font-semibold text-slate-900">{x.title}</h4>
              <p className="mt-2 text-slate-700">{x.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========= DOMAINES COUVERTS ========= */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <SectionTitle title="Domaines couverts" />
          <p className="mt-2 text-slate-700 mb-8 max-w-3xl">
            Explorez les principaux domaines statistiques nationaux regroupant
            des tableaux, séries temporelles et sources officielles.
          </p>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { titre: "Démographie", desc: "Population, structure par âge et sexe, croissance." },
              { titre: "Éducation", desc: "Scolarisation, réussite, infrastructures, alphabétisation." },
              { titre: "Santé", desc: "Indicateurs sanitaires, couverture, personnel et équipements." },
              { titre: "Économie", desc: "PIB, emploi, commerce, prix et activités économiques." },
              { titre: "Environnement", desc: "Ressources naturelles, climat, territoires et gouvernance." },
              { titre: "Conditions de vie", desc: "Pauvreté, inégalités, développement humain." },
            ].map((d, i) => (
              <motion.div
                key={d.titre}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.04 }}
                whileHover={{ y: -3 }}
                className="group rounded-2xl p-5 bg-white ring-1 ring-slate-200 hover:ring-emerald-300 hover:bg-emerald-50/40 transition shadow-sm hover:shadow-md"
              >
                <h3 className="font-semibold text-slate-900">{d.titre}</h3>
                <p className="mt-1 text-slate-700">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========= GUIDE ========= */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionTitle title="Comment utiliser le portail" />

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <FaChartLine />,
              title: "Consulter les statistiques",
              desc: "Parcourez les categories dans l’onglet « Statistiques » pour visualiser, filtrer et exporter les données.",
            },
            {
              icon: <FaSearch />,
              title: "Lancer une recherche",
              desc: "Utilisez l’onglet « Recherche » pour trouver rapidement un tableau, un indicateur ou un thème spécifique.",
            },
            {
              icon: <FaDatabase />,
              title: "Consulter les sources",
              desc: "Accédez aux sources et métadonnées officielles pour mieux comprendre la provenance et la fiabilité des données.",
            },
          ].map((x, i) => (
            <motion.div
              key={x.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl bg-white/95 backdrop-blur p-6 ring-1 ring-slate-200 shadow-sm hover:shadow-md transition"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 text-xl shadow-sm">
                {x.icon}
              </div>
              <h4 className="mt-3 font-semibold text-slate-900">{x.title}</h4>
              <p className="mt-2 text-slate-700">{x.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Accueil;
