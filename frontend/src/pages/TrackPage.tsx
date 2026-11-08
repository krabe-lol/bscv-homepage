import axios from "axios";
import { ChevronsRight, Flag, Info, MapPin, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb";
import GalleryLinks from "../components/ui/GalleryLinks";
import Link from "../components/ui/Link";
import MapEmbed from "../components/ui/MapEmbed";
import PageHeader from "../components/ui/PageHeader";
import Section, { GUTTER } from "../components/ui/Section";
import { API_URL, mediaUrl } from "../lib/api";
import { formatDate, formatLength } from "../lib/format";
import { EVENTS_PATH, getNextEvent, eventTitle } from "../lib/events";
import { useApi } from "../lib/useApi";
import type { Event, Track } from "../lib/types";

const POPULATE = "populate[0]=photo&populate[1]=address";

const Card = ({ title, icon: Icon, className = "", children }: { title: string; icon: LucideIcon; className?: string; children: ReactNode }) => (
  <section className={`bg-panel px-5 py-5 sm:px-7 sm:py-7 ${className}`}>
    <h2 className="mb-5 flex items-center gap-3 text-lg font-bold uppercase tracking-wide">
      <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
      {title}
    </h2>
    {children}
  </section>
);

const TrackPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const allEvents = useApi<Event[]>(EVENTS_PATH).data ?? [];
  const [result, setResult] = useState<{ id: string; track: Track | null } | null>(null);

  useEffect(() => {
    if (!documentId) return;
    axios
      .get(`${API_URL}/api/tracks/${documentId}?${POPULATE}`)
      .then((res) => setResult({ id: documentId, track: res.data.data }))
      .catch(() => setResult({ id: documentId, track: null }));
  }, [documentId]);

  const loaded = result !== null && result.id === documentId;
  const track = loaded ? result.track : null;

  if (loaded && !track) {
    return (
      <Section spacing="page">
        <Breadcrumb items={[{ label: "Rennstrecken", to: "/rennstrecken" }]} className="mb-6 md:mb-8" />
        <PageHeader title="Rennstrecke nicht gefunden" />
        <Link iconRight={ChevronsRight} to="/renntermine#rennstrecken">zurück zu den Rennstrecken</Link>
      </Section>
    );
  }

  if (!track) {
    return (
      <Section spacing="page" className="min-h-96 text-muted">
        <Breadcrumb items={[{ label: "Rennstrecken", to: "/rennstrecken" }]} className="mb-6 md:mb-8" />
        <div>Lädt …</div>
      </Section>
    );
  }

  // Dezimalwerte kommen aus Strapi teils als String
  const lat = track.latitude != null ? Number(track.latitude) : NaN;
  const lng = track.longitude != null ? Number(track.longitude) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const street = track.address?.street;
  const city = track.address?.city;
  const hasAddress = Boolean(street || city);
  const addressText = [street, city].filter(Boolean).join(", ");

  const trackEvents = allEvents
    .filter((r) => r.track?.documentId === track.documentId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const nextEvent = getNextEvent(trackEvents);

  // Alle kommenden Rennen plus das letzte vergangene
  const today = new Date().toISOString().slice(0, 10);
  const lastPastEvent = trackEvents.find((r) => r.date < today);
  const events = trackEvents.filter((r) => r.date >= today || r === lastPastEvent);
  const hasSidebar = hasAddress || hasCoords || Boolean(nextEvent);

  const destination = hasCoords ? `${lat},${lng}` : encodeURIComponent(addressText);

  return (
    <>
      <div className={`relative flex min-h-[40svh] items-end overflow-hidden bg-cover bg-center ${track.photo?.url ? "" : "bg-panel border-b border-line"}`}>
        {track.photo?.url && (
          <div className="absolute inset-0 opacity-20">
            <img src={mediaUrl(track.photo.url)} alt={`Foto der Strecke ${track.name}`} className="w-full h-full object-cover" />
          </div>
        )}
        <div className={`absolute inset-x-0 top-0 z-10 pt-10 md:pt-16 ${GUTTER}`}>
          <Breadcrumb items={[{ label: "Rennstrecken", to: "/rennstrecken" }, { label: track.name }]} />
        </div>
        <div className={`relative w-full pt-24 pb-8 ${GUTTER}`}>
          <h1 className="mb-4 break-words hyphens-auto font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl md:text-7xl">
            {track.name}
          </h1>
          {city && (
            <div className="flex items-center gap-2.5 text-lg">
              <MapPin className="h-5 w-5 text-accent" aria-hidden />
              {city}
            </div>
          )}
        </div>
      </div>

      <Section spacing="page">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,420px)] items-start gap-8 max-lg:grid-cols-1">
          <div className="flex flex-col gap-8">
            {/* Beschreibung */}
            {(track.description || track.lengthMeters) && (
              <Card title="Die Strecke" icon={Info}>
                {track.lengthMeters ? (
                  <div className={`flex items-center gap-3 text-base text-body ${track.description ? "mb-5" : ""}`}>
                    <span className="text-muted">Streckenlänge:</span>
                    <span className="font-semibold">{formatLength(track.lengthMeters)}</span>
                  </div>
                ) : null}
                {track.description && (
                  <p className="whitespace-pre-line text-base leading-relaxed text-body">{track.description}</p>
                )}
              </Card>
            )}

            {/* Rennen auf der Strecke */}
            {events.length > 0 && (
              <Card title="Renntermine auf dieser Strecke" icon={Flag}>
                <ul className="flex flex-col">
                  {events.map((r) => (
                    <li
                      key={r.documentId}
                      className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,200px)_auto] items-baseline gap-x-6 gap-y-1 border-t border-line-soft py-3 first:border-t-0 max-sm:grid-cols-1"
                    >
                      <span className="font-mono text-sm text-muted">{formatDate(r.date)}</span>
                      <span className="text-base text-body">{eventTitle(r)}</span>
                      {r.organizer ? (
                        <Link to={`/vereine/${r.organizer.documentId}`} tone="muted" className="justify-self-start">
                          {r.organizer.name}
                        </Link>
                      ) : (
                        <div />
                      )}
                      {r.date < today && <GalleryLinks albums={r.albums} />}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {hasSidebar && (
            <div className="flex flex-col gap-8">
              {/* Anfahrt */}
              {(hasAddress || hasCoords) && (
                <Card title="Anfahrt" icon={MapPin}>
                  {hasAddress && (
                    <div className="mb-5 text-base text-body">
                      {street}
                      {street && city && <br />}
                      {city}
                    </div>
                  )}
                  {hasCoords && (
                    <div className="mb-5">
                      <MapEmbed lat={lat} lng={lng} title={`Karte: ${track.name}`} />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <Link
                      href={`https://www.google.com/maps/dir/?api=1&destination=${destination}`}
                      iconRight={ChevronsRight}
                      external
                    >
                      Route planen
                    </Link>
                    {hasCoords && (
                      <Link
                        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
                        iconRight={ChevronsRight}
                        external
                      >
                        Größere Karte
                      </Link>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </Section>
    </>
  );
};

export default TrackPage;
