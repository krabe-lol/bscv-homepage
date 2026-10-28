import { ChevronsRight } from "lucide-react";
import Link from "../components/ui/Link";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import { mediaUrl } from "../lib/api";
import { formatDate } from "../lib/format";
import { useSeitentexte } from "../lib/texts";
import { useApi } from "../lib/useApi";
import type { Maintenance, Standing } from "../lib/types";

const StandingsPage = () => {
  const standings = useApi<Standing[]>("standings?sort=position&populate=pdf&pagination[pageSize]=100").data ?? [];
  const maintenance = useApi<Maintenance>("maintenance").data;
  const texts = useSeitentexte();

  return (
    <Section spacing="page">
      <PageHeader
        title="Punktewertung"
        intro={texts?.standingsIntro ?? undefined}
      />
      {maintenance?.mylapsUrl && (
        <div className="mt-6">
          <Link iconRight={ChevronsRight} href={maintenance.mylapsUrl}>Live-Zeiten bei MyLaps</Link>
        </div>
      )}
      <div className="mt-11 grid grid-cols-1">
        {standings.map((row) => (
          <a
            key={row.documentId}
            href={mediaUrl(row.pdf?.url)}
            target="_blank"
            rel="noreferrer"
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,160px)_auto] items-center gap-x-6 gap-y-3 border-b border-line-soft px-4 py-5 hover:bg-panel max-sm:grid-cols-[minmax(0,1fr)_auto] sm:px-7"
          >
            <span className="text-lg font-semibold">{row.title}</span>
            <span className="font-mono text-xs text-muted max-sm:hidden">
              {`Stand ${formatDate(row.updatedAt)}`}
            </span>
            <span className="justify-self-end font-mono text-xs text-accent">PDF</span>
          </a>
        ))}
      </div>
    </Section>
  );
};

export default StandingsPage;
