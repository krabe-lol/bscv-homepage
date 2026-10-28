import TrackCard from "../components/tracks/TrackCard";
import PageHeader from "../components/ui/PageHeader";
import EventRow from "../components/ui/EventRow";
import Section from "../components/ui/Section";
import SectionHeader from "../components/ui/SectionHeader";
import { EVENTS_PATH, getNextEvent, groupBySeason } from "../lib/events";
import { useSeitentexte } from "../lib/texts";
import { useApi } from "../lib/useApi";
import type { Event, Track } from "../lib/types";

const TRACKS_PATH = "tracks?populate[0]=photo&populate[1]=address&pagination[pageSize]=100";

const EventsPage = () => {
  const today = new Date().toISOString().slice(0, 10);
  const events = useApi<Event[]>(EVENTS_PATH).data ?? [];
  const tracks = [...(useApi<Track[]>(TRACKS_PATH).data ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "de"),
  );
  const nextEvent = getNextEvent(events);
  const seasons = groupBySeason(events);
  const current = seasons.find((s) => s.events.some((r) => r.date >= today));
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
            action={<span className="font-mono text-xs text-muted">{current.events.length} Veranstaltungen</span>}
          />
          <div className="grid grid-cols-1">
            {current.events.map((event) => (
              <EventRow
                key={event.documentId}
                event={event}
                size="lg"
                variant={event.documentId === nextEvent?.documentId ? "highlight" : "default"}
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
            {season.events.map((event) => (
              <EventRow key={event.documentId} event={event} />
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
};

export default EventsPage;
