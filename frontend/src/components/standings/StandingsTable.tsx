import { ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import { mediaUrl } from "../../lib/api";
import { formatDate, formatDayMonth } from "../../lib/format";
import type { Standing } from "../../lib/types";

interface StandingsTableProps {
  standing: Standing;
  /** Anfangs aufgeklappt (aktuelle Saison) */
  open?: boolean;
}

/** Saisonwertung einer Klasse aus Papierstau: Kopfzeile zum Aufklappen, darunter die Tabelle (auf schmalen Bildschirmen seitlich scrollbar). */
const StandingsTable = ({ standing, open = false }: StandingsTableProps) => {
  const [expanded, setExpanded] = useState(open);
  const tableId = useId();
  const table = standing.table;
  if (!table) return null;
  const title = standing.className ?? standing.title;

  return (
    <div className="border-b border-line-soft">
      <div className="flex items-center gap-x-6 px-4 hover:bg-panel sm:px-7">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={tableId}
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-5 text-left"
        >
          <ChevronRight
            aria-hidden
            className={`h-5 w-5 shrink-0 text-accent transition-transform ${expanded ? "rotate-90" : ""}`}
          />
          <span className="min-w-0 truncate text-lg font-semibold">{title}</span>
        </button>
        <span className="font-mono text-xs text-muted max-sm:hidden">{`Stand ${formatDate(standing.updatedAt)}`}</span>
        {standing.pdf?.url && (
          <a
            href={mediaUrl(standing.pdf.url)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-accent underline underline-offset-4"
          >
            PDF
          </a>
        )}
      </div>

      {expanded && (
        <div id={tableId} className="overflow-x-auto px-4 pb-8 sm:px-7">
          <table className="w-full min-w-max border-collapse text-sm">
            <caption className="sr-only">{`Punktewertung ${title}, ${standing.season ?? ""}`}</caption>
            <thead>
              <tr className="border-b border-line font-mono text-xs uppercase tracking-wide text-muted">
                <th scope="col" className="py-3 pr-4 text-right font-normal">Platz</th>
                <th scope="col" className="py-3 pr-6 text-left font-normal">Name</th>
                <th scope="col" className="py-3 pr-6 text-left font-normal">Verein</th>
                {table.events.map((event, i) => (
                  <th
                    key={event.id}
                    scope="col"
                    title={[formatDate(event.date), event.location].filter(Boolean).join(", ")}
                    className="px-2 py-3 text-right font-normal"
                  >
                    {`${i + 1}. Lauf`}
                    <span className="block normal-case text-dim">{formatDayMonth(event.date)}</span>
                  </th>
                ))}
                <th scope="col" className="py-3 pl-4 text-right font-normal">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-b border-line-soft">
                  <td className="py-3 pr-4 text-right font-mono">{row.place}</td>
                  <th scope="row" className="py-3 pr-6 text-left font-semibold">{`${row.firstName} ${row.lastName}`}</th>
                  <td className="py-3 pr-6 text-body">{row.club}</td>
                  {table.events.map((event) => {
                    const points = row.pointsPerEvent[event.id] ?? 0;
                    return (
                      <td key={event.id} className={`px-2 py-3 text-right font-mono ${points ? "" : "text-dim"}`}>
                        {points || "–"}
                      </td>
                    );
                  })}
                  <td className="py-3 pl-4 text-right font-mono font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StandingsTable;
