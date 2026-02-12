
// TableauDetail.tsx — version complète avec filtrage fonctionnel

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
  useLayoutEffect,
} from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance"; // 
import BackButton from "./BackButton";
import {
  buildExportFileName,
  // extractVisibleTableData,
  // cleanNumericValue,
  buildExcelAOA ,
  buildHeaderMerges,
} from "../utils/exportUtils";



/* ---------- Types ---------- */
type Valeurs = Record<string, Record<string, string>>;
type ColonnesOrderItem = { principal: string; sous: string };

type SousIndicateur = { nom: string; valeurs: Valeurs };
type Row = {
  indicateur: string;
  niveau?: number;
  valeurs?: Valeurs;
  sous_indicateurs?: SousIndicateur[];
  is_section?: boolean;
  is_pourcentage?: boolean; 
};

type Payload = {
  colonnes_groupées: Record<string, string[]>;
  colonnes_order?: ColonnesOrderItem[];
  data: Row[];
  has_sous_indicateurs: boolean;
  meta?: {
  titre: string;
  source: string;
  etiquette_ligne: string;
  categorie_id?: number;
  date_verrouillage?: string | null;
  tableau_heterogene?: boolean;
  tableau_numerique?: boolean;
  colonnes_pourcentage?: string[];

  };

  format?: "ancien" | "nouveau";
  notes?: string[];
};

type Meta = {
  titre: string;
  source: string;
  etiquette_ligne: string;
  categorie_id?: number;
  date_verrouillage?: string | null;
  nom_feuille?: string;   // ✅ AJOUT
  theme_nom?: string; 
};


type FilterOptions = { lignes: string[]; colonnes: string[] };

/* ---------- Const ---------- */

const COL_SPACING_X = 1;
const LEFT1_W = "clamp(180px, 22vw, 290px)";
const LEFT2_W = "clamp(140px, 18vw, 220px)";
const LEFT1_MIN = 180;
const LEFT2_MIN = 140;
const DATA_MIN = 120;
const ANNEES_RECENSEMENT = ["1977", "1988", "2000", "2013", "2023"];

/* ---------- Base styles ---------- */
const thBase =
  "sticky top-0 z-30 text-[13.5px] md:text-[14px] font-semibold text-slate-800 bg-emerald-50 border border-emerald-200 px-3 py-2 backdrop-blur";
const tdBase =
  "px-3 py-2 border border-slate-200 text-[13.5px] align-middle";
const tdRight = `${tdBase} text-right whitespace-nowrap`;
const tdLeft = `${tdBase} text-left `;
const zebra = "odd:bg-white even:bg-slate-50/60";

/* ---------- Helpers ---------- */
function buildOrderFromGroups(groups: Record<string, string[]>): ColonnesOrderItem[] {
  const order: ColonnesOrderItem[] = [];
  Object.entries(groups).forEach(([principal, sous]) => {
    const list = sous && sous.length ? sous : [""];
    for (const s of list) order.push({ principal, sous: s });
  });
  return order;
}

function getCell(vals: Valeurs | undefined, item: ColonnesOrderItem): string {
  if (!vals) return "";
  const { principal, sous } = item;
  return (
    vals[principal]?.[sous] ??
    vals[principal]?.[""] ??
    vals[""]?.[principal] ??
    ""
  );
}

function formatCell(
  raw?: string | null,
  row?: Row,
  showDecimals?: boolean,
  isHeterogene?: boolean,
  isNumerique?: boolean,
  columnLabel?: string,
  colonnesPourcentage?: string[]
): string {
  if (!raw) return "NA";

  const s = String(raw).trim();
  if (!s) return "NA";

  const num = parseFloat(s.replace(/\s/g, "").replace(",", "."));
  if (isNaN(num)) return s;

  const isColPct = colonnesPourcentage?.includes(columnLabel || "");

  /* 🟠 PRIORITÉ ABSOLUE : % ligne OU % colonne */
  if (row?.is_pourcentage || isColPct) {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /* 🟢 TABLEAU NUMÉRIQUE (pur ou hétérogène) */
  if (isNumerique) {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  /* 🔵 AUTRES TABLEAUX */
  if (showDecimals) {
    return num.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return num.toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}




/* ---------- Toolbar ---------- */
function Toolbar({
  tableId,
  title,
  onFilter,
  user,
  payload,
  showDecimals,
  setShowDecimals,
  isHeterogene,
}: {
  tableId: string;
  title: string;
  onFilter: () => void;
  user: any;
  payload: any;
  showDecimals: boolean;
  setShowDecimals: (val: boolean) => void;
  isHeterogene: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* ✅ Bouton décimales visible seulement pour admin ou chef autorisé */}
      {!isHeterogene &&
        (user?.is_superuser ||
          (user?.is_chef &&
            user?.categorie?.id === payload?.meta?.categorie_id)) && (
          <button
            onClick={async () => {
              const newValue = !showDecimals;

              try {
                await axiosInstance.post(
                  `/tableaux/${tableId}/toggle-decimals/`,
                  { afficher_decimales: newValue }
                );
                setShowDecimals(newValue);
              } catch (err) {
                console.error("Erreur toggle:", err);
                alert("Impossible de modifier la préférence décimales");
              }
            }}
            className={`inline-flex items-center gap-2 rounded-lg border text-sm font-medium shadow-sm transition px-3 py-2
              ${
                showDecimals
                  ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                  : "bg-white text-emerald-700 border-emerald-400 hover:bg-emerald-50"
              }`}
          >
            {showDecimals ? "Masquer décimales" : "Afficher décimales"}
          </button>
      )}


      {/* 🔍 Filtrage */}
      <button
        onClick={onFilter}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-emerald-300 transition"
      >
        <span className="text-emerald-600">🔎</span> Filtrage
      </button>

      {/* ⬇️ Exporter */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-emerald-300 transition"
        >
          ⬇️ Exporter
        </button>
        {open && (
          <div
            className="absolute right-0 mt-1 w-40 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
            onMouseLeave={() => setOpen(false)}
          >
            <button
              className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() =>
               exportTableToExcel(
                tableId,
                payload.meta,
                payload.meta.theme_nom,
                payload
              )
              

              }

            >
              XLSX (Excel)
            </button>
            <button
              className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => exportTableToPDF(tableId, payload.meta,
                  payload.meta.theme_nom)}
            >
              PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


/* ---------- Modal filtrage ---------- */
function FilterModal({
  show,
  onClose,
  id,
  setPayload,
}: {
  show: boolean;
  onClose: () => void;
  id: string;
  setPayload: (p: Payload) => void;
}) {
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [selectedLignes, setSelectedLignes] = useState<string[]>([]);
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (!show) return;
    (async () => {
      const { data } = await axiosInstance.get(`/tableaux/${id}/filtres-options/`);
      setOptions(data);
      setLoading(false);
    })();
  }, [show, id]);

  const handleApply = async () => {
    const { data } = await axiosInstance.post(`/tableaux/${id}/filtrer-structure/`, {
      lignes: selectedLignes,
      colonnes: selectedCols,
    });
    setPayload(data);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative max-h-[85vh] overflow-auto">
        <h2 className="text-lg font-semibold text-emerald-800 mb-3">
          Filtrage avancé
        </h2>

        {loading && <p>Chargement des options…</p>}

        {!loading && options && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-slate-700 mb-2">Lignes</h3>
              <div className="max-h-[55vh] overflow-auto border rounded-lg p-2">
                {options.lignes.map((l) => (
                  <label key={l} className="block text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="mr-2 accent-emerald-600"
                      checked={selectedLignes.includes(l)}
                      onChange={() =>
                        setSelectedLignes((prev) =>
                          prev.includes(l)
                            ? prev.filter((x) => x !== l)
                            : [...prev, l]
                        )
                      }
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-slate-700 mb-2">Colonnes</h3>
              <div className="max-h-[55vh] overflow-auto border rounded-lg p-2">
                {options.colonnes.map((c) => (
                  <label key={c} className="block text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="mr-2 accent-emerald-600"
                      checked={selectedCols.includes(c)}
                      onChange={() =>
                        setSelectedCols((prev) =>
                          prev.includes(c)
                            ? prev.filter((x) => x !== c)
                            : [...prev, c]
                        )
                      }
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
          >
            Annuler
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page principale ---------- */
export default function TableauDetail() {
  const { id } = useParams();
  if (!id) {
  return <div>Tableau introuvable</div>;
}

  const tableId = id;
  const [payload, setPayload] = useState<Payload | null>(null);
  const isHeterogene = payload?.meta?.tableau_heterogene === true;
  const isNumerique = payload?.meta?.tableau_numerique === true;
  const colonnesPourcentage = payload?.meta?.colonnes_pourcentage || [];
  const user = JSON.parse(localStorage.getItem("user") || "null");
  console.log("USER =", user);
  

  const [visibleStatuts, setVisibleStatuts] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
 

  const scrollerRef = useRef<HTMLDivElement>(null);
  const headRow1Ref = useRef<HTMLTableRowElement>(null);
  const headCol1Ref = useRef<HTMLTableCellElement>(null);
  const [head1H, setHead1H] = useState(0);
  const [left1Wpx, setLeft1Wpx] = useState(0);

  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSource, setEditingSource] = useState(false);
  const [sourceSuggestions, setSourceSuggestions] = useState<string[]>([]);
  const [showDecimals, setShowDecimals] = useState(false);


  const [newTitle, setNewTitle] = useState("");
  const [newSource, setNewSource] = useState("");
  const canEdit =
    user?.is_superuser ||
    (user?.is_chef && user?.categorie?.id === payload?.meta?.categorie_id);


  const dateVerrou = payload?.meta?.date_verrouillage;
  const isLocked = dateVerrou ? new Date() > new Date(dateVerrou) : false;



  // 🔥 Charger la préférence globale depuis le backend
  useEffect(() => {
    axiosInstance.get(`/tableaux/${id}/structure/`)
      .then((res) => {
        setShowDecimals(res.data.meta?.afficher_decimales ?? true);
      })
      .catch(() => console.warn("Impossible de charger la préférence décimales"));
  }, [id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axiosInstance.get(`/tableaux/${id}/structure/`);
        console.log("META =", data.meta); 
        if (!alive) return;
        setPayload(data);
        const m = data?.meta || {};
        setMeta({
          titre: m.titre ?? "",
          source: m.source ?? "",
          etiquette_ligne: m.etiquette_ligne ?? "",
        });
        const visibles = detectVisibleStatuts(data.data || [], data.statuts || []);
        setVisibleStatuts(visibles);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const isOld =
    payload?.format === "ancien" || payload?.has_sous_indicateurs === true;

  const order: ColonnesOrderItem[] = useMemo(
    () =>
      payload
        ? payload.colonnes_order?.length
          ? payload.colonnes_order
          : buildOrderFromGroups(payload.colonnes_groupées || {})
        : [],
    [payload]
  );

  const singleHeaderRow = useMemo(
    () => order.length > 0 && order.every((o) => !o.sous || o.sous === ""),
    [order]
  );

  const hasAnySubs = useMemo(
    () =>
      isOld &&
      !!payload?.data?.some(
        (r) => r.sous_indicateurs && r.sous_indicateurs.length > 0
      ),
    [isOld, payload]
  );

  const nCols = Math.max(order.length, 1);
  const spacingPx = Math.max(0, COL_SPACING_X * order.length);
  const dataColWidthCalc = hasAnySubs
    ? `calc((100% - (${LEFT1_W} + ${LEFT2_W}) - ${spacingPx}px) / ${nCols})`
    : `calc((100% - ${LEFT1_W} - ${spacingPx}px) / ${nCols})`;

  const minTablePx = hasAnySubs
    ? LEFT1_MIN + LEFT2_MIN + nCols * DATA_MIN + spacingPx
    : LEFT1_MIN + nCols * DATA_MIN + spacingPx;

  // Gestion flèches
  useLayoutEffect(() => {
    const measure = () => {
      setHead1H(
        headRow1Ref.current
          ? Math.ceil(headRow1Ref.current.getBoundingClientRect().height)
          : 0
      );
      setLeft1Wpx(
        headCol1Ref.current
          ? Math.ceil(headCol1Ref.current.getBoundingClientRect().width)
          : 0
      );

      const sc = scrollerRef.current;
      if (!sc) return;
      const canScroll = sc.scrollWidth > sc.clientWidth + 2;
      const atStart = sc.scrollLeft <= 2;
      const atEnd = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 2;
      setShowLeftArrow(canScroll && !atStart);
      setShowRightArrow(canScroll && !atEnd);
    };

    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [payload, nCols, hasAnySubs]);

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const onScroll = () => {
      const canScroll = sc.scrollWidth > sc.clientWidth + 2;
      const atStart = sc.scrollLeft <= 2;
      const atEnd = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 2;
      setShowLeftArrow(canScroll && !atStart);
      setShowRightArrow(canScroll && !atEnd);
    };
    sc.addEventListener("scroll", onScroll);
    return () => sc.removeEventListener("scroll", onScroll);
  }, []);

  const scrollStep = (dir: "left" | "right") => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const step = Math.max(Math.round(sc.clientWidth * 0.6), 320);
    sc.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  };

  if (loading || !payload || !meta) {
    return (
      <div className="p-6">
        <BackButton />
        <p className="mt-6 text-center text-slate-500">Chargement…</p>
      </div>
    );
  }
  // ✅ Détection des statuts réellement présents dans le tableau
function detectVisibleStatuts(data: any[], statuts: string[]) {
  const visibles = new Set<string>();

  const checkValeurs = (valeurs: Record<string, Record<string, string>>) => {
    for (const col of Object.values(valeurs || {})) {
      for (const val of Object.values(col)) {
        if (statuts.includes(val?.toUpperCase?.())) visibles.add(val.toUpperCase());
      }
    }
  };

  data.forEach((row) => {
    checkValeurs(row.valeurs);
    if (row.sous_indicateurs) {
      row.sous_indicateurs.forEach((sous: any) => checkValeurs(sous.valeurs));
    }
  });

  return Array.from(visibles);
}

function isProjectionColumn(label: string, source?: string): boolean {
  const year = label?.trim?.() || "";
  const safeSource = source?.toLowerCase() || "";

  // ✅ Seulement si la source contient "projection"
  const isProjectionSource = safeSource.includes("projection");

  return (
    isProjectionSource &&
    /^\d{4}$/.test(year) &&
    !ANNEES_RECENSEMENT.includes(year)
  );
}


  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="pt-1">
          <BackButton />
        </div>

        <div className="flex-1 text-center">

          {/* ---------- MODE NORMAL ---------- */}
          {!editingTitle ? (
            <div className="inline-flex items-center gap-2">

              <h1 className="text-xl md:text-2xl font-bold text-emerald-900">
                {meta.titre}
              </h1>

              {canEdit && !isLocked && (
                <button
                  onClick={() => {
                    setNewTitle(meta.titre);
                    setEditingTitle(true);
                  }}
                  className="text-slate-500 hover:text-emerald-700 transition"
                  title="Modifier le titre"
                >
                  <span className="text-lg">✐</span>
                </button>
              )}
            </div>
          ) : (

            /* ---------- MODE ÉDITION ---------- */
            <div className="flex flex-col items-center gap-3 w-full max-w-2xl mx-auto">

              {/* Champ de saisie large et stylé */}
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-center text-lg shadow-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              />

              {/* Boutons OK & Annuler */}
              <div className="flex items-center gap-4">
                
                {/* OK */}
                <button
                  onClick={async () => {
                    try {
                      console.log("PATCH →", `/api/tableaux/${id}/update-meta/`);

                      const response = await axiosInstance.patch(
                        `/tableaux/${id}/update-meta/`,
                        { titre: newTitle }
                      );

                      console.log("PATCH OK:", response.data);

                      setEditingTitle(false);
                      window.location.reload();

                    } catch (err) {
                      console.error("PATCH ERROR:", err);
                      alert("Erreur lors de l’enregistrement du titre");
                    }
                  }}
                  className="px-4 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition text-sm"
                >
                  OK
                </button>

                {/* Annuler */}
                <button
                  onClick={() => setEditingTitle(false)}
                  className="px-4 py-1 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 transition text-sm"
                >
                  Annuler
                </button>

              </div>
            </div>
          )}

        </div>


 
        <Toolbar
          tableId={id} 
          title={meta.titre}
          onFilter={() => setShowFilter(true)}
          user={user}
          payload={payload}
          showDecimals={showDecimals}
          setShowDecimals={setShowDecimals}
          isHeterogene={isHeterogene}
        />

      </div>

      {/* Tableau */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm relative">
        {showLeftArrow && (
          <button
            onClick={() => scrollStep("left")}
            className="hidden sm:flex items-center justify-center absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full border bg-white/95 shadow hover:bg-white"
          >
            ←
          </button>
        )}
        {showRightArrow && (
          <button
            onClick={() => scrollStep("right")}
            className="hidden sm:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full border bg-white/95 shadow hover:bg-white"
          >
            →
          </button>
        )}

        <div ref={scrollerRef} className="overflow-x-auto overflow-y-auto rounded-xl">
          <table
            id={tableId}
            className="w-full border-separate table-fixed"
            style={{
              borderSpacing: `${COL_SPACING_X}px 0`,
              minWidth: `${minTablePx}px`,
            }}
          >
            <colgroup>
              <col style={{ width: LEFT1_W }} />
              {/* Plus de colonne spéciale pour sous-indicateurs */}

              {order.map((_, i) => (
                <col key={`col-${i}`} style={{ width: dataColWidthCalc, minWidth: DATA_MIN }} />
              ))}
            </colgroup>

            <thead>
              <tr ref={headRow1Ref}>
                <th
                  ref={headCol1Ref}
                  className={`${thBase} text-left sticky top-0 left-0 z-40`}
                  rowSpan={singleHeaderRow ? 1 : 2}
                >
                  {meta.etiquette_ligne || ""}
                </th>

               

                {singleHeaderRow ? (
                  order.map((it, i) => (
                    <th key={`one-${i}`} className={`${thBase} text-center align-middle whitespace-normal break-words leading-snug`}>
                      {it.principal}
                    </th>
                  ))
                ) : (
                  <>
                    {/* Ligne 1 : principaux (ancien format uniquement) */}
                    {isOld &&
                      Object.entries(payload.colonnes_groupées).map(([principal, sous]) => {
                        const hasSous = sous && sous.length > 1 && sous.some((s) => s.trim() !== "");
                        return hasSous ? (
                          <th
                            key={`top-${principal}`}
                            className={`${thBase} text-center`}
                            colSpan={sous.length}
                          >
                            {principal}
                          </th>
                        ) : (
                          <th
                            key={`top-${principal}`}
                            className={`${thBase} text-center`}
                            rowSpan={2}
                          >
                            {principal}
                          </th>
                        );
                      })}

                    {/* Ligne 1 : nouveau format (inchangé) */}
                    {!isOld &&
                      (() => {
                        const cells: { label: string; span: number }[] = [];
                        let i = 0;
                        while (i < order.length) {
                          const cur = order[i].principal;
                          let span = 1,
                            j = i + 1;
                          while (j < order.length && order[j].principal === cur) {
                            span++;
                            j++;
                          }
                          cells.push({ label: cur, span });
                          i = j;
                        }
                        return cells.map((c, idx) => (
                          <th key={`top-${idx}`} className={`${thBase} text-center align-middle whitespace-normal break-words leading-snug`} colSpan={c.span}>
                            {c.label}
                          </th>
                        ));
                      })()}
                  </>
                )}

              </tr>

              {!singleHeaderRow && (
                <tr>
                  {Object.entries(payload.colonnes_groupées).flatMap(([principal, sous]) => {
                    // Si la colonne a des sous-colonnes réelles, on les affiche ici
                    const hasSous = sous && sous.length > 1 && sous.some((s) => s.trim() !== "");
                    if (hasSous) {
                      return sous.map((s, i) => (
                        <th
                          key={`sub-${principal}-${i}`}
                          className={`${thBase} text-center `}
                          style={{ top: head1H }}
                        >
                          {s}
                        </th>
                      ));
                    }
                    // Sinon on ne renvoie rien : le principal est déjà fusionné (rowSpan=2)
                    return [];
                  })}
                </tr>
              )}

            </thead>

            <tbody className="text-slate-800">
              {isOld &&
                payload.data.map((row, idx) => {
                  const subs = row.sous_indicateurs || [];
                  const hasSubs = subs.length > 0;

                  // 🔍 Détection si la ligne principale contient déjà des valeurs
                  const hasMainValues =
                    row.valeurs &&
                    Object.values(row.valeurs).some((cols) =>
                      Object.values(cols || {}).some((v) => v && v.trim() !== "")
                    );

                  return (
                    <Fragment key={`old-${idx}`}>

                      {/* --------------------------------------
                          1) LIGNE PRINCIPALE (section / ou avec valeurs)
                      ----------------------------------------- */}
                      <tr className={zebra}>
                        <td
                          className={`${tdLeft} sticky left-0 z-10 bg-slate-50 font-semibold text-emerald-900`}
                        >
                          {row.indicateur}
                        </td>

                        {/* Cas 1 : indicateur principal contient des valeurs */}
                        {hasMainValues &&
                          order.map((it, i) => (
                            <td
                              key={`main-val-${idx}-${i}`}
                              className={tdRight}
                              style={{
                                backgroundColor: isProjectionColumn(it.principal, meta.source)
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : "transparent",
                              }}
                            >
                              {formatCell(
                                getCell(row.valeurs, it),
                                row,
                                showDecimals,
                                isHeterogene,
                                isNumerique,
                                it.principal,                 
                                colonnesPourcentage,
                            )}

                            </td>
                          ))}

                        {/* Cas 2 : indicateur principal ne contient PAS de valeurs */}
                        {!hasMainValues &&
                          order.map((it, i) => (
                            <td
                              key={`main-empty-${idx}-${i}`}
                              className={tdRight}
                              style={{
                                backgroundColor: isProjectionColumn(it.principal, meta.source)
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : "transparent",
                              }}
                            >
                              {/* cellule vide */}
                            </td>
                          ))}
                      </tr>

                      {/* --------------------------------------
                          2) SOUS-INDICATEURS AFFICHÉS EN DESSOUS
                      ----------------------------------------- */}
                      {subs.map((s, k) => (
                        <tr key={`old-sub-${idx}-${k}`} className={zebra}>
                          <td
                            className={`${tdLeft} sticky left-0 z-10 bg-white`}
                          >
                            {"\u00A0\u00A0\u00A0\u00A0" + s.nom}
                          </td>


                          {order.map((it, j) => (
                            <td
                              key={`old-subcell-${idx}-${k}-${j}`}
                              className={tdRight}
                              style={{
                                backgroundColor: isProjectionColumn(it.principal, meta.source)
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : "transparent",
                              }}
                            >
                              {formatCell(
                                getCell(s.valeurs, it),
                                row,
                                showDecimals,
                                isHeterogene,
                                isNumerique,
                                it.principal,                 
                                colonnesPourcentage,
                            )}

                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}


              {!isOld &&
                payload.data.map((row, i) => {
                  const lvl = row.niveau ?? 0;
                  const pad = 10 + lvl * 18;
                  const isTop = lvl === 0;
                  const leftBg = isTop
                    ? "bg-slate-50"
                    : row.is_section
                    ? "bg-slate-100"
                    : "bg-white";
                  return (
                    <tr key={`new-${i}`} className={zebra}>
                      <td className={`${tdLeft} sticky left-0 z-10 ${leftBg}`} style={{ paddingLeft: pad }}>
                        <span className={isTop || row.is_section ? "font-medium text-emerald-900" : ""}>
                          {"\u00A0\u00A0\u00A0".repeat(lvl) + row.indicateur}
                        </span>
                      </td>
                      {order.map((it, j) => {
                        const cellValue = getCell(row.valeurs, it);
                        const parent = (row as any).parent_code || "";

                        // Vérifie si la ligne est entièrement vide (toutes les valeurs vides ou NA)
                        const isRowEmpty = Object.values(row.valeurs || {}).every(
                          (cols) => Object.values(cols || {}).every((v) => !v || v === "NA")
                        );

                        // Condition : si statut vide et parent vide
                        const isEmptyStatutNoParent = (!cellValue || cellValue === "") && parent === "";

                        // ✅ Cas 1 : ligne entièrement vide → ne rien afficher
                        if (isEmptyStatutNoParent && isRowEmpty) {
                          return (
                            <td
                              key={`newcell-${i}-${j}`}
                              className={tdRight}
                              style={{
                                backgroundColor: isProjectionColumn(it.principal, meta.source)
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : "transparent",
                              }}
                            >
                              {""}
                            </td>
                          );
                        }

                        // ✅ Cas 2 : ligne non vide mais statut et parent vides → afficher "NA"
                        if (isEmptyStatutNoParent && !isRowEmpty) {
                          return (
                            <td
                              key={`newcell-${i}-${j}`}
                              className={tdRight}
                              style={{
                                backgroundColor: isProjectionColumn(it.principal, meta.source)
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : "transparent",
                              }}
                            >
                              {"NA"}
                            </td>
                          );
                        }

                        // ✅ Cas normal : affichage standard avec style dynamique
                        const isNumeric =
                          typeof cellValue === "number" ||
                          (cellValue && /^[\d\s.,]+$/.test(cellValue.toString()));

                        return (
                          <td
                            key={`newcell-${i}-${j}`}
                            className={`${tdRight} ${isNumeric ? "whitespace-nowrap min-w-[110px]" : ""}`}
                            style={{
                              backgroundColor: isProjectionColumn(it.principal, meta.source)
                                ? "rgba(16, 185, 129, 0.08)"
                                : "transparent",
                            }}
                          >
                            {formatCell(
                              getCell(row.valeurs, it),
                              row,
                              showDecimals,
                              isHeterogene,
                            

                          )}


                          </td>
                        );
                      })}





                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source */}
      {/* ⭐ SOURCE – édition inline */}
      <div className="mt-3 text-sm text-slate-600 italic">

        {!editingSource ? (
          <p className="flex items-start gap-2">

            <span className="mr-1">📌</span>
            <span className="font-medium not-italic">Source :</span>

            <span>{meta.source || "—"}</span>

            {/* Icône ✐ pour éditer */}
            {canEdit && !isLocked && (
              <button
                onClick={() => {
                  setNewSource(meta.source || "");
                  setEditingSource(true);
                }}
                className="text-slate-400 hover:text-emerald-700 ml-2"
                title="Modifier la source"
              >
                <span className="text-base">✐</span>
              </button>
            )}
          </p>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-2xl">

            {/* Champ édition source */}
            <textarea
              autoFocus
              value={newSource}
              onChange={async (e) => {
                const val = e.target.value;
                setNewSource(val);

                // Charger les suggestions
                if (val.trim().length >= 3) {
                  try {
                    const res = await axiosInstance.get(
                      `/tableaux/sources/suggest/?q=${encodeURIComponent(val)}`
                    );
                    setSourceSuggestions(res.data);
                  } catch (err) {
                    console.error(err);
                  }
                } else {
                  setSourceSuggestions([]);
                }
              }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-[15px] shadow-sm focus:ring-2 focus:ring-emerald-300"
              rows={2}
            />

            {/* 🔍 Suggestions */}
            {sourceSuggestions.length > 0 && (
              <div className="border border-slate-200 bg-white rounded-lg shadow p-2 max-h-40 overflow-auto mt-1">
                {sourceSuggestions.map((s, i) => (
                  <p
                    key={i}
                    onClick={() => {
                      setNewSource(s);
                      setSourceSuggestions([]);
                    }}
                    className="px-2 py-1 text-sm cursor-pointer hover:bg-emerald-50 rounded"
                  >
                    {s}
                  </p>
                ))}
              </div>
            )}

            {/* Boutons OK / Annuler */}
            <div className="flex gap-4">

              {/* OK */}
              <button
                onClick={async () => {
                  try {
                    await axiosInstance.patch(
                      `/tableaux/${id}/update-meta/`,
                      { source: newSource }
                    );
                    setEditingSource(false);
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                    alert("Erreur lors de l’enregistrement de la source");
                  }
                }}
                className="px-4 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
              >
                OK
              </button>

              {/* Annuler */}
              <button
                onClick={() => setEditingSource(false)}
                className="px-4 py-1 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 text-sm"
              >
                Annuler
              </button>

            </div>
          </div>
        )}
      </div>

      {payload?.notes && payload.notes.length > 0 && (
        <div className="mt-1 text-sm text-slate-600 italic">
          {payload.notes.map((n, i) => (
            <p key={i}>
              <span className="text-black mr-1">*</span>
              {n}
            </p>
          ))}
        </div>
      )}
      {visibleStatuts.length > 0 && (
        <div className="mt-2 text-sm text-slate-700 italic">
          {visibleStatuts.includes("N/D") && (
            <p><span className="font-semibold">N/D</span> : Non déclaré</p>
          )}
          {visibleStatuts.includes("NS") && (
            <p><span className="font-semibold">NS</span> : Non spécifié</p>
          )}
          {visibleStatuts.includes("NA") && (
            <p><span className="font-semibold">NA</span> : Non applicable</p>
          )}
       </div>
      )}
      {/* 🟢 Légende pour projections (toujours visible s'il y a au moins une colonne colorée) */}
      {meta.source?.toLowerCase().includes("projection") && order.some((it) => isProjectionColumn(it.principal, meta.source)) && (

        <div className="mt-2 text-sm text-slate-700 italic">
          <p className="mt-1 text-slate-600">
            <span className="inline-block w-3 h-3 mr-2 align-middle rounded-sm bg-emerald-100 border border-emerald-200"></span>
            Les colonnes colorées représentent les <span className="font-medium">projections</span>.
          </p>
        </div>
      )}





      {/* Modal filtrage */}
      {showFilter && (
        <FilterModal
          show={showFilter}
          onClose={() => setShowFilter(false)}
          id={id!}
          setPayload={setPayload}
        />
      )}
    </div>
  );
}

/* ---------- Export helpers ---------- */


function exportTableToExcel(
  tableId: string,
  meta: Meta,
  themeName: string,
  payload: any
) {
  import("xlsx").then((XLSX) => {

    const aoa = buildExcelAOA(payload, meta);

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    /* 🔗 FUSIONS UNIQUEMENT SI SOUS-COLONNES */
    if (payload.colonnes_groupées) {
      const hasRealSubs = Object.values(payload.colonnes_groupées)
        .some((s: any) => s.filter((x: string) => x && x.trim()).length > 1);

      if (hasRealSubs) {
        ws["!merges"] = buildHeaderMerges(
          payload.colonnes_groupées,
          2 // ligne header (0-based)
        );
      }
    }

    ws["A1"].s = { font: { bold: true, sz: 14 } };

    const wb = XLSX.utils.book_new();
    const sheetName = (meta.nom_feuille || "Tableau").substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const fileName = buildExportFileName(themeName, meta.titre);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  });
}





function exportTableToPDF(
  tableId: string,
  meta: Meta,
  themeName: string
) {
  const el = document.getElementById(tableId);
  if (!el) return;

  import("html2canvas").then(({ default: html2canvas }) => {
    import("jspdf").then(({ default: jsPDF }) => {
      html2canvas(el, { scale: 2 }).then((canvas) => {
        const pdf = new jsPDF("l", "pt", "a4");

        const pageW = pdf.internal.pageSize.getWidth();
        const imgW = pageW - 40;
        const imgH = (canvas.height * imgW) / canvas.width;

        // 🔹 TITRE
        pdf.setFontSize(14);
        pdf.text(meta.titre, 20, 30);

        // 🔹 TABLEAU
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          20,
          50,
          imgW,
          imgH
        );

        // 🔹 SOURCE
        pdf.setFontSize(10);
        pdf.text(
          `Source : ${meta.source}`,
          20,
          50 + imgH + 20
        );

        const fileName = buildExportFileName(themeName, meta.titre);
        pdf.save(`${fileName}.pdf`);
      });
    });
  });
}

