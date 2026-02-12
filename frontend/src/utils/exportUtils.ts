// src/utils/exportUtils.ts

// 1️⃣ Extraire le numéro du tableau depuis le titre
export function extractTableNumber(titre: string): string | null {
  if (!titre) return null;

  const match = titre.match(/Tableau\s+([\d.]+)/i);
  return match ? match[1] : null;
}

// 2️⃣ Construire le nom final du fichier
export function buildExportFileName(
  themeName: string,
  titre: string
): string {
  const num = extractTableNumber(titre);

  const safeTheme = themeName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  return num ? `${safeTheme}_${num}` : safeTheme;
}

// 3️⃣ Extraire UNIQUEMENT les cellules visibles du tableau HTML
export function extractVisibleTableData(
  table: HTMLTableElement
): string[][] {
  const rows = Array.from(table.rows);

  return rows.map((row, rowIndex) => {
  const cells = Array.from(row.cells)
    .filter((cell) => {
      const style = window.getComputedStyle(cell);
      return style.display !== "none";
    })
    .map((cell) => cell.innerText);

  // 🔑 CAS CRITIQUE : ligne des sous-en-têtes
  // Si la ligne a moins de cellules que la ligne précédente,
  // on ajoute une cellule vide au début (colonne indicateur)
  if (rowIndex > 0 && cells.length > 0) {
    const prevCells =
      rowIndex > 0
        ? Array.from(rows[rowIndex - 1].cells).filter(
            (c) => window.getComputedStyle(c).display !== "none"
          )
        : [];

    if (cells.length < prevCells.length) {
      cells.unshift(""); // 👈 cellule vide colonne A
    }
  }

  return cells;
});

}

export function cleanNumericValue(val: string): string | number {
  if (!val) return val;

  // Cas NA, N/D, NS
  if (/^(NA|N\/D|NS)$/i.test(val)) return val;

  // Enlever espaces (français)
  const cleaned = val.replace(/\s/g, "").replace(",", ".");

  // Si c’est un nombre → retourner number
  return isNaN(Number(cleaned)) ? val : Number(cleaned);
}

// src/utils/exportUtils.ts

// 🔗 Construire les fusions d’en-têtes Excel (Sexe → Masculin/Féminin, etc.)
export function buildHeaderMerges(
  colonnesGroupées: Record<string, string[]>,
  startRow: number
) {
  const merges: any[] = [];

  // 🟢 1) Fusion verticale de la colonne "Groupe d'âge"
  merges.push({
    s: { r: startRow, c: 0 },     // A3
    e: { r: startRow + 1, c: 0 }, // A4
  });

  let colIndex = 1; // B

  Object.entries(colonnesGroupées).forEach(([principal, sous]) => {
    const realSous = sous.filter(s => s && s.trim() !== "");

    // 🟢 Cas colonnes avec sous-colonnes (Sexe)
    if (realSous.length > 1) {
      merges.push({
        s: { r: startRow, c: colIndex },
        e: { r: startRow, c: colIndex + realSous.length - 1 },
      });
      colIndex += realSous.length;
    }
    // 🟢 Cas colonne simple (Total)
    else {
      merges.push({
        s: { r: startRow, c: colIndex },
        e: { r: startRow + 1, c: colIndex },
      });
      colIndex += 1;
    }
  });

  return merges;
}

export function buildExcelAOA(payload: any, meta: any): any[][] {
  const aoa: any[][] = [];

  /* =======================
     1️⃣ TITRE
  ======================= */
  aoa.push([meta.titre]);
  aoa.push([]);

  /* =======================
     2️⃣ EN-TÊTES
  ======================= */
  const header1: any[] = [meta.etiquette_ligne || ""];
  const header2: any[] = [""];

  let hasSubHeaders = false;

  Object.entries(payload.colonnes_groupées || {}).forEach(
    ([principal, sous]) => {
      const realSous = (sous as string[]).filter(s => s && s.trim() !== "");

      if (realSous.length > 1) {
        hasSubHeaders = true;
        header1.push(principal, ...Array(realSous.length - 1).fill(""));
        header2.push(...realSous);
      } else {
        header1.push(principal);
        header2.push("");
      }
    }
  );

  aoa.push(header1);
  if (hasSubHeaders) {
    aoa.push(header2);
  }

  /* =======================
     3️⃣ DONNÉES
  ======================= */
  payload.data.forEach((row: any) => {

    /* 🟢 Sections (nouveau format : 2000, 2013…) */
    if (row.is_section) {
      aoa.push([row.indicateur]);
      return;
    }

    /* 🟢 Ligne principale */
    // 🔹 Calcul de l’indentation EXCEL selon le niveau
    const indent =
    payload.format === "nouveau" && typeof row.niveau === "number"
        ? "\u00A0\u00A0\u00A0\u00A0".repeat(row.niveau)
        : "";

    // 🔹 Ligne principale
    const line: any[] = [indent + row.indicateur];


    payload.colonnes_order.forEach((col: any) => {
      let v =
        row.valeurs?.[col.principal]?.[col.sous] ??
        row.valeurs?.[col.principal]?.[""] ??
        "NA";

      line.push(formatExcelValue(v));
    });

    aoa.push(line);

    /* 🟠 Ancien format : sous-indicateurs */
    if (payload.format === "ancien" && row.sous_indicateurs?.length) {
      row.sous_indicateurs.forEach((sous: any) => {
        const subLine: any[] = ["   " + sous.nom];

        payload.colonnes_order.forEach((col: any) => {
          let v =
            sous.valeurs?.[col.principal]?.[col.sous] ??
            sous.valeurs?.[col.principal]?.[""] ??
            "NA";

          subLine.push(formatExcelValue(v));
        });

        aoa.push(subLine);
      });
    }
  });

  /* =======================
     4️⃣ SOURCE
  ======================= */
  aoa.push([]);
  aoa.push([`Source : ${meta.source || ""}`]);

  return aoa;
}

function formatExcelValue(v: any): any {
  if (v === null || v === undefined || v === "") return "NA";

  if (typeof v === "string") {
    const s = v.trim();
    if (/^(NA|N\/D|NS)$/i.test(s)) return s;
    return s.replace(".", ","); // décimales FR
  }

  if (typeof v === "number") {
    return v.toString().replace(".", ",");
  }

  return v;
}
