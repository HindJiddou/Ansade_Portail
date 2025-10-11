import { useEffect, useState } from "react";
import axios from "axios";

/* === Types simplifiés === */
type StructureResp = {
  colonnes_groupées: Record<string, string[]>;
  data: Array<
    | { indicateur: string; valeurs: Record<string, Record<string, string>> }
    | { indicateur: string; sous_indicateurs: Array<{ nom: string; valeurs: Record<string, Record<string, string>> }> }
  >;
  has_sous_indicateurs: boolean;
};

export default function TableauFiltreClient({ tableauId }: { tableauId: number }) {
  const [options, setOptions] = useState<{ lignes: string[]; colonnes: string[] }>({ lignes: [], colonnes: [] });
  const [selLignes, setSelLignes] = useState<string[]>([]);
  const [selCols, setSelCols] = useState<string[]>([]);
  const [result, setResult] = useState<StructureResp | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les options disponibles
  useEffect(() => {
    axios.get(`/api/tableaux/${tableauId}/filtres-options/`).then(r => {
      setOptions({
        lignes: r.data.lignes.sort((a: string,b: string)=>a.localeCompare(b,"fr")),
        colonnes: r.data.colonnes.sort((a: string,b: string)=>a.localeCompare(b,"fr")),
      });
    });
  }, [tableauId]);

  // Appliquer les filtres
  const apply = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`/api/tableaux/${tableauId}/filtrer-structure/`, {
        lignes: selLignes,
        colonnes: selCols,
      });
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-8">
      {/* Zone de sélection */}
      <div className="flex flex-col md:flex-row gap-3 items-start">
        <MultiSelect
          label="Lignes"
          options={options.lignes}
          value={selLignes}
          onChange={setSelLignes}
          placeholder="Choisir des lignes…"
        />
        <MultiSelect
          label="Colonnes"
          options={options.colonnes}
          value={selCols}
          onChange={setSelCols}
          placeholder="Choisir des colonnes…"
        />
        <button
          onClick={apply}
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700"
          disabled={loading}
        >
          {loading ? "Chargement…" : "Appliquer"}
        </button>
      </div>

      {/* Résultat affiché */}
      {result && <SimpleStructuredTable structure={result} />}
    </div>
  );
}

/* === MultiSelect simple === */
function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const toggle = (opt: string) =>
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);

  return (
    <div className="min-w-[260px]">
      <div className="text-sm text-slate-600 mb-1">{label}</div>
      <div className="max-h-44 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-2">
        {options.length === 0 && (
          <div className="text-slate-400 text-sm">{placeholder || "Aucune option"}</div>
        )}
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              className="accent-emerald-600"
              checked={value.includes(opt)}
              onChange={() => toggle(opt)}
            />
            <span className="text-sm text-slate-800">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* === Affichage du tableau structuré === */
function SimpleStructuredTable({ structure }: { structure: StructureResp }) {
  const columns = Object.keys(structure.colonnes_groupées);

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-emerald-50 text-slate-800">
            <th className="text-left px-3 py-2 border border-emerald-200">Indicateur</th>
            {columns.map((c) => (
              <th key={c} className="text-center px-3 py-2 border border-emerald-200">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {structure.data.map((row, i) => {
            const isGroup = (row as any).sous_indicateurs;
            if (!isGroup) {
              const r = row as { indicateur: string; valeurs: Record<string, Record<string, string>> };
              return (
                <tr key={i} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                  <td className="px-3 py-2 border border-slate-200">{r.indicateur}</td>
                  {columns.map((c) => (
                    <td key={c} className="text-center px-3 py-2 border border-slate-200">
                      {r.valeurs?.[c]?.[""] ?? ""}
                    </td>
                  ))}
                </tr>
              );
            }
            const g = row as {
              indicateur: string;
              sous_indicateurs: Array<{ nom: string; valeurs: Record<string, Record<string, string>> }>;
            };
            return g.sous_indicateurs.map((sous, k) => (
              <tr key={`${i}-${k}`} className={(i + k) % 2 ? "bg-slate-50/60" : "bg-white"}>
                <td className="px-3 py-2 border border-slate-200">
                  <span className="text-emerald-900 font-medium">{g.indicateur}</span>
                  <span className="text-slate-500"> — {sous.nom}</span>
                </td>
                {columns.map((c) => (
                  <td key={c} className="text-center px-3 py-2 border border-slate-200">
                    {sous.valeurs?.[c]?.[""] ?? ""}
                  </td>
                ))}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}
