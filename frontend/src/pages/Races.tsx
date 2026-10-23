import TrackCard from "../components/tracks/TrackCard";
import PageHeader from "../components/ui/PageHeader";
import RaceRow from "../components/ui/RaceRow";
import Section from "../components/ui/Section";
import SectionHeader from "../components/ui/SectionHeader";
import { RACES_PATH, getNextRace, groupBySeason } from "../lib/races";
import { useSeitentexte } from "../lib/texts";
import { useApi } from "../lib/useApi";
import type { Race, Rennstrecke } from "../lib/types";

const TRACKS_PATH = "rennstrecken?populate[0]=photo&populate[1]=address&pagination[pageSize]=100";

const Races = () => {
  const today = new Date().toISOString().slice(0, 10);
  const races = useApi<Race[]>(RACES_PATH).data ?? [];
  const tracks = [...(useApi<Rennstrecke[]>(TRACKS_PATH).data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );
  const nextRace = getNextRace(races);
  const seasons = groupBySeason(races);
  const current = seasons.find((s) => s.races.some((r) => r.date >= today));
  const archive = seasons.filter((s) => s !== current);
  const texts = useSeitentexte();

  return (
    <Section spacing="page">
      <PageHeader
        title="Renntermine & Rennstrecken"
        intro={texts?.racesIntro ?? undefined}
      />

      {current && (
        <>
          <SectionHeader
            title={`Saison ${current.year}`}
            size="sm"
            className="mt-11"
            action={<span className="font-mono text-xs text-muted">{current.races.length} Veranstaltungen</span>}
          />
          <div className="grid grid-cols-1">
            {current.races.map((race) => (
              <RaceRow
                key={race.documentId}
                race={race}
                size="lg"
                variant={race.documentId === nextRace?.documentId ? "highlight" : "default"}
              />
            ))}
          </div>
        </>
      )}

      <div id="rennstrecken">
        <SectionHeader title="Rennstrecken" size="sm" className="mt-14" />
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-8">
          {tracks.map((track) => (
            <TrackCard key={track.documentId} track={track} />
          ))}
        </div>
      </div>

      {archive.map((season) => (
        <div key={season.year}>
          <SectionHeader title={`Archiv ${season.year}`} size="sm" className="mt-14" />
          <div className="grid grid-cols-1">
            {season.races.map((race) => (
              <RaceRow key={race.documentId} race={race} />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
};

export default Races;
