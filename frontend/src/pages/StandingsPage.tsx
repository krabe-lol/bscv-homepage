import { ChevronsRight } from "lucide-react";
import StandingsTable from "../components/standings/StandingsTable";
import Breadcrumb from "../components/ui/Breadcrumb";
import Link from "../components/ui/Link";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import SectionHeader from "../components/ui/SectionHeader";
import { mediaUrl } from "../lib/api";
import { formatDate } from "../lib/format";
import { useApi } from "../lib/useApi";
import type { Standing, StandingsPageEntry } from "../lib/types";

const STANDINGS_PATH = "standings?sort[0]=seasonStart:desc&sort[1]=position&populate=pdf&pagination[pageSize]=200";

/** Wertungen aus Papierstau nach Saison gruppiert, neueste zuerst (Reihenfolge kommt sortiert aus der API). */
const groupBySeason = (standings: Standing[]) => {
  const seasons: { name: string; standings: Standing[] }[] = [];
  for (const standing of standings) {
    const name = standing.season ?? "";
    const season = seasons.find((s) => s.name === name);
    if (season) season.standings.push(standing);
    else seasons.push({ name, standings: [standing] });
  }
  return seasons;
};

// Von Hand gepflegte Wertung: nur ein Link zum PDF
const PdfRow = ({ standing }: { standing: Standing }) => (
  <a
    href={mediaUrl(standing.pdf?.url)}
    target="_blank"
    rel="noreferrer"
    className="grid grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto] items-center gap-x-6 gap-y-3 border-b border-line-soft px-4 py-5 hover:bg-panel max-sm:grid-cols-[minmax(0,1fr)_auto] sm:px-7"
  >
    <span className="text-lg font-semibold">{standing.title}</span>
    <span className="font-mono text-xs text-muted max-sm:hidden">{`Stand ${formatDate(standing.updatedAt)}`}</span>
    <span className="justify-self-end font-mono text-xs text-accent">PDF</span>
  </a>
);

const StandingsPage = () => {
  const standings = useApi<Standing[]>(STANDINGS_PATH).data ?? [];
  const page = useApi<StandingsPageEntry>("standings-page").data;

  const [current, ...archive] = groupBySeason(standings.filter((s) => s.table));
  const manual = standings
    .filter((s) => !s.table)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <Section spacing="page">
      <Breadcrumb items={[{ label: "Punktewertung" }]} className="mb-6 md:mb-8" />
      <PageHeader
        title="Punktewertung"
        intro={page?.intro ?? undefined}
      />
      {page?.mylapsUrl && (
        <div className="mt-6">
          <Link iconRight={ChevronsRight} href={page.mylapsUrl}>Live-Zeiten bei MyLaps</Link>
        </div>
      )}

      {current && (
        <>
          <SectionHeader title={current.name} size="sm" className="mt-11" />
          <div className="grid grid-cols-1">
            {current.standings.map((standing, i) => (
              <StandingsTable key={standing.documentId} standing={standing} open={i === 0} />
            ))}
          </div>
        </>
      )}

      {manual.length > 0 && (
        <>
          {current && <SectionHeader title="Weitere Wertungen" size="sm" className="mt-14" />}
          <div className={`grid grid-cols-1 ${current ? "" : "mt-11"}`}>
            {manual.map((standing) => (
              <PdfRow key={standing.documentId} standing={standing} />
            ))}
          </div>
        </>
      )}

      {archive.map((season) => (
        <div key={season.name}>
          <SectionHeader title={`Archiv ${season.name}`} size="sm" className="mt-14" />
          <div className="grid grid-cols-1">
            {season.standings.map((standing) => (
              <StandingsTable key={standing.documentId} standing={standing} />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
};

export default StandingsPage;
