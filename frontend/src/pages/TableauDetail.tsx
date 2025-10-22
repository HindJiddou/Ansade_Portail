
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
import axios from "axios";
import BackButton from "./BackButton";

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
};

type Payload = {
  colonnes_groupées: Record<string, string[]>;
  colonnes_order?: ColonnesOrderItem[];
  data: Row[];
  has_sous_indicateurs: boolean;
  meta?: { titre: string; source: string; etiquette_ligne: string };
  format?: "ancien" | "nouveau";
  notes?: string[];
};

type Meta = { titre: string; source: string; etiquette_ligne: string };

type FilterOptions = { lignes: string[]; colonnes: string[] };

/* ---------- Const ---------- */
const COL_SPACING_X = 1;
const LEFT1_W = "clamp(180px, 22vw, 290px)";
const LEFT2_W = "clamp(140px, 18vw, 220px)";
const LEFT1_MIN = 180;
const LEFT2_MIN = 140;
const DATA_MIN = 96;
const ANNEES_RECENSEMENT = ["1977", "1988", "2000", "2013", "2023"];

/* ---------- Base styles ---------- */
const thBase =
  "sticky top-0 z-30 text-[13.5px] md:text-[14px] font-semibold text-slate-800 bg-emerald-50 border border-emerald-200 px-3 py-2 backdrop-blur";
const tdBase =
  "px-3 py-2 border border-slate-200 text-[13.5px] align-middle";
const tdRight = `${tdBase} text-center `;
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

function formatCell(raw?: string | null): string {
  if (!raw) return "NA";
  const s = String(raw).trim();
  if (!s) return "NA";
  if (s.includes("%")) return s;
  const noSpaces = s.replace(/\s/g, "");
  const m = noSpaces.match(/^(-?\d+)([.,]\d+)?$/);
  if (!m) return s;
  const intPart = m[1].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const decPart = m[2] ?? "";
  return intPart + decPart;
}

/* ---------- Toolbar ---------- */
function Toolbar({
  tableId,
  title,
  onFilter,
}: {
  tableId: string;
  title: string;
  onFilter: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onFilter}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-emerald-300 transition"
      >
        <span className="text-emerald-600">🔎</span> Filtrage
      </button>
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
              onClick={() => exportTableToExcel(tableId)}
            >
              XLSX (Excel)
            </button>
            <button
              className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => exportTableToPDF(tableId, title)}
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
      const { data } = await axios.get(`/api/tableaux/${id}/filtres-options/`);
      setOptions(data);
      setLoading(false);
    })();
  }, [show, id]);

  const handleApply = async () => {
    const { data } = await axios.post(`/api/tableaux/${id}/filtrer-structure/`, {
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
  const tableId = `tableau-${id}`;
  const [payload, setPayload] = useState<Payload | null>(null);
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await axios.get(`/api/tableaux/${id}/structure/`);
        if (!alive) return;
        setPayload(data);
        const m = data?.meta || {};
        setMeta({
          titre: m.titre ?? "",
          source: m.source ?? "",
          etiquette_ligne: m.etiquette_ligne ?? "Indicateur",
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
          <h1 className="inline-flex items-center gap-2 text-xl md:text-2xl font-bold text-emerald-900">
            {meta.titre}
          </h1>
        </div>

        <Toolbar
          tableId={tableId}
          title={meta.titre}
          onFilter={() => setShowFilter(true)}
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
              {hasAnySubs && <col style={{ width: LEFT2_W }} />}
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
                  {meta.etiquette_ligne || "Indicateur"}
                </th>

                {hasAnySubs && (
                  <th
                    className={`${thBase} text-left sticky top-0 z-40`}
                    style={{ left: left1Wpx }}
                    rowSpan={singleHeaderRow ? 1 : 2}
                  />
                )}

                {singleHeaderRow ? (
                  order.map((it, i) => (
                    <th key={`one-${i}`} className={`${thBase} text-center`}>
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
                          <th key={`top-${idx}`} className={`${thBase} text-center`} colSpan={c.span}>
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
                          className={`${thBase} text-center`}
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
                  if (!hasSubs) {
                    return (
                      <tr key={`old-${idx}`} className={zebra}>
                        <td className={`${tdLeft} sticky left-0 z-10 bg-white`}>
                          <span className="font-medium text-emerald-900">{row.indicateur}</span>
                        </td>
                        {hasAnySubs && (
                          <td className={`${tdLeft} sticky z-10 bg-white`} style={{ left: left1Wpx }} />
                        )}
                        {order.map((it, i) => (
                          <td
                            key={`oldcell-${i}-${i}`}
                            className={tdRight}
                            style={{
                              backgroundColor: isProjectionColumn(it.principal, meta.source)
                                ? "rgba(16, 185, 129, 0.08)"
                                : "transparent",
                            }}

                          >
                            {formatCell(getCell(row.valeurs, it))}
                          </td>

                        ))}
                      </tr>
                    );
                  }
                  return (
                    <Fragment key={`old-${idx}`}>
                      {subs.map((s, k) => (
                        <tr key={`old-sub-${idx}-${k}`} className={zebra}>
                          {k === 0 && (
                            <td
                              className={`${tdLeft} sticky left-0 z-10 bg-slate-50 font-medium text-emerald-900`}
                              rowSpan={subs.length}
                            >
                              {row.indicateur}
                            </td>
                          )}
                          <td className={`${tdLeft} sticky z-10 bg-white`} style={{ left: left1Wpx }}>
                            {s.nom}
                          </td>
                          {order.map((it, i) => (
                            <td
                              key={`old-subcell-${idx}-${k}-${i}`}
                              className={tdRight}
                              style={{
                                backgroundColor: isProjectionColumn(it.principal, meta.source)
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : "transparent",
                              }}
                            >
                              {formatCell(getCell(s.valeurs, it))}
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
                          {row.indicateur}
                        </span>
                      </td>
                      {order.map((it, j) => (
                        <td
                          key={`newcell-${i}-${j}`}
                          className={tdRight}
                          style={{
                            backgroundColor: isProjectionColumn(it.principal, meta.source)
                              ? "rgba(16, 185, 129, 0.08)"
                              : "transparent",
                          }}
                        >
                          {formatCell(getCell(row.valeurs, it))}
                        </td>
                      ))}

                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source */}
      {meta.source && (
        <div className="mt-3 text-sm text-slate-600 italic">
          <p>
            <span className="mr-1">📌</span>
            <span className="font-medium not-italic">Source :</span> {meta.source}
          </p>
        </div>
      )}
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
            <p><span className="font-semibold">N/D</span> : Non disponible</p>
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
function exportTableToExcel(tableId: string) {
  const el = document.getElementById(tableId);
  if (!el) return;
  import("xlsx").then((XLSX) => {
    const wb = XLSX.utils.table_to_book(el as any, { sheet: "Données" });
    XLSX.writeFile(wb, `${tableId}.xlsx`);
  });
}

function exportTableToPDF(tableId: string, title: string) {
  const el = document.getElementById(tableId);
  if (!el) return;
  import("html2canvas").then(({ default: html2canvas }) => {
    import("jspdf").then(({ default: jsPDF }) => {
      html2canvas(el as any, { scale: 2 }).then((canvas) => {
        const pdf = new jsPDF("l", "pt", "a4");
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const imgW = pageW - 40;
        const imgH = (canvas.height * imgW) / canvas.width;
        const img = canvas.toDataURL("image/png");
        pdf.text(title || "Tableau", 20, 24);
        let rendered = 0;
        while (rendered < imgH) {
          pdf.addImage(img, "PNG", 20, 40 - rendered, imgW, imgH);
          rendered += pageH - 60;
          if (rendered < imgH) pdf.addPage();
        }
        pdf.save(`${tableId}.pdf`);
      });
    });
  });
}
