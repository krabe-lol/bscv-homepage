import { ChevronsRight } from "lucide-react";
import RaceRow from "../ui/RaceRow";
import Section from "../ui/Section";
import SectionHeader from "../ui/SectionHeader";
import { RACES_PATH, getNextRace, groupBySeason, isFinal } from "../../lib/races";
import { useApi } from "../../lib/useApi";
import type { Race } from "../../lib/types";
import Link from "../ui/Link";

const RacesPreview = () => {
  const races = useApi<Race[]>(RACES_PATH).data ?? [];
  const season = groupBySeason(races)[0];
  const nextRace = getNextRace(races);
  const preliminaries = season?.races.filter((r) => !isFinal(r)) ?? [];

  return (
    <Section id="renntermine">
      <SectionHeader
        title="Renntermine"
        action={
          season && (
            <div className="font-mono text-xs uppercase tracking-widest text-muted">
              Saison {season.year} · {preliminaries.length} Vorläufe + Endlauf
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 border-b border-line">
        {season?.races.map((race) => {
          const next = race.documentId === nextRace?.documentId;
          return (
            <RaceRow
              key={race.documentId}
              race={race}
              size="lg"
              variant={next ? "highlight" : "default"}
              subtitle={isFinal(race) ? "Hier werden die bayerischen und deutschen Meister gekürt" : undefined}
              action={next && <Link iconRight={ChevronsRight} to="/renntermine">Details</Link>}
            />
          );
        })}
      </div>

      <div className="flex gap-7 pt-6">
        <Link iconRight={ChevronsRight} to="/renntermine">alle Renntermine</Link>
        <Link iconRight={ChevronsRight} to="/renntermine" tone="muted">Archiv</Link>
      </div>
    </Section>
  );
};

export default RacesPreview;
