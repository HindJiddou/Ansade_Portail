import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaChartBar,
  FaDatabase,
  FaSearch,
  FaSyncAlt,
  FaShieldAlt,
  FaGlobeAfrica,
} from "react-icons/fa";

// Animations réutilisables
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const Accueil: React.FC = () => {
  return (
    <main className="min-h-[calc(100vh-120px)] w-full bg-[#f6f9ff]">
      {/* ========= HERO ========= */}
      <section className="relative overflow-hidden">
        {/* dégradé élégant + halos subtils */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500" />
        <div className="absolute -top-24 -right-16 w-[38rem] h-[38rem] bg-teal-300/30 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-10 w-[28rem] h-[28rem] bg-emerald-300/25 blur-3xl rounded-full" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative max-w-6xl mx-auto px-6 py-14 md:py-16 flex flex-col md:flex-row items-center gap-8 text-white"
        >
          {/* (logo retiré du hero) */}
          <div className="flex-1">
            <motion.h1
              variants={fadeUp}
              className="text-3xl md:text-4xl font-extrabold tracking-tight"
            >
              Portail officiel des statistiques – ANSADE
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-3 leading-relaxed text-white/90">
              Bienvenue sur le portail de l’<span className="font-semibold">Agence Nationale de la Statistique
              et de l’Analyse Démographique et Économique</span>. Ce site donne accès à des données
              fiables et des tableaux normalisés pour soutenir la planification, la recherche et la prise de décision
              en Mauritanie.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/statistiques"
                className="inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-white/90 px-4 py-2 rounded-xl shadow transition active:scale-[0.98]"
              >
                <FaChartBar /> Consulter les statistiques
              </Link>
              <Link
                to="/sources"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl border border-white/20 backdrop-blur transition active:scale-[0.98]"
              >
                <FaDatabase /> Voir les sources
              </Link>
              <Link
                to="/recherche"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl border border-white/20 backdrop-blur transition active:scale-[0.98]"
              >
                <FaSearch /> Recherche
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ========= MISSION / MISE À JOUR / QUALITÉ ========= */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <FaGlobeAfrica />,
              title: "Mission",
              text:
                "Produire, centraliser et diffuser les statistiques officielles nationales conformément aux standards internationaux, en garantissant qualité et cohérence.",
            },
            {
              icon: <FaSyncAlt />,
              title: "Mise à jour continue",
              text:
                "Les tableaux et séries sont mis à jour régulièrement par les départements concernés et leurs chefs, avec traçabilité des versions.",
            },
            {
              icon: <FaShieldAlt />,
              title: "Qualité & Gouvernance",
              text:
                "Métadonnées, sources, unités et définitions sont affichées pour chaque tableau afin d’assurer transparence et comparabilité.",
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

      {/* ========= DOMAINES COUVERTS ========= */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-extrabold text-emerald-800">Domaines couverts</h2>
          <p className="mt-2 text-slate-700">
            Explorez les statistiques par thématique. Chaque domaine regroupe des tableaux,
            des séries temporelles et leurs sources officielles.
          </p>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { titre: "Démographie", desc: "Population, répartition, structure par âge et sexe." },
              { titre: "Éducation", desc: "Scolarisation, taux de réussite, infrastructures." },
              { titre: "Santé", desc: "Indicateurs sanitaires, couverture, personnel et équipements." },
              { titre: "Agriculture", desc: "Production, surfaces, élevage, sécurité alimentaire." },
              { titre: "Économie", desc: "PIB, prix, commerce, marché du travail." },
              { titre: "Social & Pauvreté", desc: "Conditions de vie, pauvreté, inégalités." },
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
                <div className="mt-3 h-[2px] w-0 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-20 transition-all" />
              </motion.div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              to="/statistiques"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-full shadow transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              Parcourir toutes les thématiques
            </Link>
          </div>
        </div>
      </section>

      {/* ========= COMMENT UTILISER ========= */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-extrabold text-emerald-800">Comment utiliser le portail</h2>

        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            {
              t: "1. Rechercher",
              d: (
                <>
                  Utilisez la barre <span className="font-medium">Recherche</span> pour trouver un tableau,
                  un indicateur ou une année spécifique.
                </>
              ),
            },
            {
              t: "2. Filtrer & Analyser",
              d: "Appliquez des filtres avancés (lignes/colonnes) et visualisez des cartes ou graphiques.",
            },
            {
              t: "3. Exporter",
              d: (
                <>
                  Exportez en <span className="font-medium">Excel</span> ou <span className="font-medium">PDF</span>.
                 les donnees que vous voulez.
                </>
              ),
            },
          ].map((x, i) => (
            <motion.div
              key={x.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl bg-white/95 backdrop-blur p-6 ring-1 ring-slate-200 shadow-sm hover:shadow-md transition"
            >
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold shadow-sm">
                {i + 1}
              </div>
              <h4 className="mt-3 font-semibold text-slate-900">{x.t}</h4>
              <p className="mt-2 text-slate-700">{x.d}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/recherche"
            className="inline-flex items-center gap-2 bg-white ring-1 ring-slate-200 hover:bg-slate-50 text-slate-800 px-5 py-3 rounded-xl transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <FaSearch /> Lancer une recherche
          </Link>
          <Link
            to="/mise-a-jour"
            className="inline-flex items-center gap-2 bg-white ring-1 ring-slate-200 hover:bg-slate-50 text-slate-800 px-5 py-3 rounded-xl transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <FaSyncAlt /> Espace mise à jour
          </Link>
        </div>
      </section>

    
    </main>
  );
};

export default Accueil;
