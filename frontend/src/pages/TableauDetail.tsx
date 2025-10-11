// TableauDetail.tsx — flèches fixes, défilement par pas, source en bas
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
};

type Meta = { titre: string; source: string; etiquette_ligne: string };

/* ---------- UI const ---------- */
const COL_SPACING_X = 1;

const LEFT1_W = "clamp(180px, 22vw, 290px)";
const LEFT2_W = "clamp(140px, 18vw, 220px)";

const LEFT1_MIN = 180;
const LEFT2_MIN = 140;
const DATA_MIN = 96;

/* ---------- Styles ---------- */
const thBase =
  "sticky top-0 z-30 text-[13.5px] md:text-[14px] font-semibold text-slate-800 bg-emerald-50 border border-emerald-200 px-3 py-2 backdrop-blur";
const tdBase =
  "px-3 py-2 border border-slate-200 text-[13.5px] align-middle";
const tdRight = `${tdBase} text-center`;
const tdLeft = `${tdBase} text-left`;
const zebra = "odd:bg-white even:bg-slate-50/60";
type FilterOptions = {
  lignes: string[];
  colonnes: string[];
};

const [showFilter, setShowFilter] = useState(false);
const [filterOpts, setFilterOpts] = useState<FilterOptions | null>(null);
const [selLignes, setSelLignes] = useState<string[]>([]);
const [selCols, setSelCols] = useState<string[]>([]);
const [isFiltering, setIsFiltering] = useState(false);


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
      <button
        onClick={() => alert("Analyse à venir")}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:border-emerald-300 transition"
      >
        📈 Analyser
      </button>
    </div>
  );
}

/* ---------- Page ---------- */
export default function TableauDetail() {
  const { id } = useParams();
  const tableId = `tableau-${id}`;

  const [payload, setPayload] = useState<Payload | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const headRow1Ref = useRef<HTMLTableRowElement>(null);
  const headCol1Ref = useRef<HTMLTableCellElement>(null);
  const [head1H, setHead1H] = useState(0);
  const [left1Wpx, setLeft1Wpx] = useState(0);

  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

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

  // Mesures + état des flèches
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

  // Défilement par PAS (60% de la largeur visible, min 320 px)
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

  return (
    <div className="p-4 sm:p-6">
      {/* Header ligne */}
      <div className="flex items-start justify-between gap-3">
        <div className="pt-1">
          <BackButton />
        </div>

        <div className="flex-1 text-center">
          <h1 className="inline-flex items-center gap-2 text-xl md:text-2xl font-bold text-emerald-900">
            <span className="text-emerald-600">📊</span>
            {meta.titre}
          </h1>
        </div>

        <Toolbar
          tableId={tableId}
          title={meta.titre}
          onFilter={() => setShowFilter(true)}
        />
      </div>

      {/* Carte du tableau */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Wrapper relatif pour positionner les flèches HORS contenu scrollable */}
        <div className="relative">
          {/* Flèche gauche (pas) */}
          {showLeftArrow && (
            <button
              aria-label="Défiler vers la gauche"
              title="Voir les colonnes précédentes"
              className="hidden sm:flex items-center justify-center absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full border bg-white/95 shadow hover:bg-white"
              onClick={() => scrollStep("left")}
            >
              ←
            </button>
          )}

          {/* Flèche droite (pas) */}
          {showRightArrow && (
            <button
              aria-label="Défiler vers la droite"
              title="Voir les colonnes suivantes"
              className="hidden sm:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-7 h-7 rounded-full border bg-white/95 shadow hover:bg-white"
              onClick={() => scrollStep("right")}
            >
              →
            </button>
          )}

          {/* Zone scrollable */}
          <div
            ref={scrollerRef}
            className="overflow-x-auto overflow-y-auto rounded-xl"
          >
            <table
              id={tableId}
              className="w-full border-separate table-fixed"
              style={{
                borderSpacing: `${COL_SPACING_X}px 0`,
                minWidth: `${minTablePx}px`,
              }}
            >
              {/* Largeurs */}
              <colgroup>
                <col style={{ width: LEFT1_W }} />
                {hasAnySubs && <col style={{ width: LEFT2_W }} />}
                {order.map((_, i) => (
                  <col
                    key={`col-${i}`}
                    style={{ width: dataColWidthCalc, minWidth: DATA_MIN }}
                  />
                ))}
              </colgroup>

              {/* THEAD */}
              <thead>
                <tr ref={headRow1Ref}>
                  <th
                    ref={headCol1Ref}
                    className={`${thBase} text-left sticky top-0 left-0 z-40`}
                    rowSpan={singleHeaderRow ? 1 : 2}
                  >
                    {isOld
                      ? meta.etiquette_ligne?.trim() || "Indicateur"
                      : "Indicateur"}
                  </th>

                  {hasAnySubs && (
                    <th
                      className={`${thBase} text-left sticky top-0 z-40`}
                      style={{ left: left1Wpx }}
                      rowSpan={singleHeaderRow ? 1 : 2}
                    />
                  )}

                  {singleHeaderRow
                    ? order.map((it, i) => (
                        <th key={`one-${i}`} className={`${thBase} text-center`}>
                          {it.principal}
                        </th>
                      ))
                    : (() => {
                        const cells: { label: string; span: number }[] = [];
                        let i = 0;
                        while (i < order.length) {
                          const cur = order[i].principal;
                          let span = 1,
                            j = i + 1;
                          while (
                            j < order.length &&
                            order[j].principal === cur
                          ) {
                            span++;
                            j++;
                          }
                          cells.push({ label: cur, span });
                          i = j;
                        }
                        return cells.map((c, idx) => (
                          <th
                            key={`top-${idx}`}
                            className={`${thBase} text-center`}
                            colSpan={c.span}
                          >
                            {c.label}
                          </th>
                        ));
                      })()}
                </tr>

                {!singleHeaderRow && (
                  <tr>
                    {order.map((it, i) => (
                      <th
                        key={`bot-${i}`}
                        className={`${thBase} text-center`}
                        style={{ top: head1H }}
                      >
                        {it.sous || it.principal}
                      </th>
                    ))}
                  </tr>
                )}
              </thead>

              {/* TBODY */}
              <tbody className="text-slate-800">
                {/* Ancien format */}
                {isOld &&
                  payload.data.map((row, idx) => {
                    const subs = row.sous_indicateurs || [];
                    const hasSubs = subs.length > 0;

                    if (!hasSubs) {
                      return (
                        <tr key={`old-${idx}`} className={zebra}>
                          <td className={`${tdLeft} sticky left-0 z-10 bg-white`}>
                            <span className="font-medium text-emerald-900">
                              {row.indicateur}
                            </span>
                          </td>
                          {hasAnySubs && (
                            <td
                              className={`${tdLeft} sticky z-10 bg-white`}
                              style={{ left: left1Wpx }}
                            />
                          )}
                          {order.map((it, i) => (
                            <td
                              key={`old-alone-${idx}-${i}`}
                              className={tdRight}
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
                            <td
                              className={`${tdLeft} sticky z-10 bg-white`}
                              style={{ left: left1Wpx }}
                            >
                              {s.nom}
                            </td>
                            {order.map((it, i) => (
                              <td
                                key={`old-subcell-${idx}-${k}-${i}`}
                                className={tdRight}
                              >
                                {formatCell(getCell(s.valeurs, it))}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}

                {/* Nouveau format */}
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
                        <td
                          className={`${tdLeft} sticky left-0 z-10 ${leftBg}`}
                          style={{ paddingLeft: pad }}
                        >
                          <span
                            className={
                              isTop || row.is_section
                                ? "font-medium text-emerald-900"
                                : ""
                            }
                          >
                            {row.indicateur}
                          </span>
                        </td>
                        {order.map((it, j) => (
                          <td key={`newcell-${i}-${j}`} className={tdRight}>
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
      </div>

      {/* Source sous le tableau */}
      {meta.source && (
        <div className="mt-3 text-sm text-slate-600 italic">
          <p>
            <span className="mr-1">📌</span>
            <span className="font-medium not-italic">Source :</span> {meta.source}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- Export helpers ---------- */
function exportTableToExcel(tableId: string) {
  const el = document.getElementById(tableId);
  if (!el) return;
  import("xlsx").then((XLSX) => {
    // @ts-ignore
    const wb = XLSX.utils.table_to_book(el as any, { sheet: "Données" });
    // @ts-ignore
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
