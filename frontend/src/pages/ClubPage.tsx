import axios from "axios";
import { Contact as ContactIcon, Globe, Info, MapPin, Package, Palette, type LucideIcon, ChevronsRight } from "lucide-react";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import ImageSlot from "../components/ui/ImageSlot";
import Link from "../components/ui/Link";
import PageHeader from "../components/ui/PageHeader";
import Section, { GUTTER } from "../components/ui/Section";
import StatList from "../components/ui/StatList";
import { API_URL, mediaUrl } from "../lib/api";
import { formatDate } from "../lib/format";
import { EVENTS_PATH, getNextEvent, eventTitle } from "../lib/events";
import { useApi } from "../lib/useApi";
import type { Contact, Event, Club } from "../lib/types";

const POPULATE = [
  "populate[logo]=true",
  "populate[vehiclePhoto]=true",
  "populate[vehicleGraphic]=true",
  "populate[colors]=true",
  "populate[stats]=true",
  "populate[president][populate][0]=address",
  "populate[mailingAddress][populate][0]=address",
].join("&");

const Card = ({ title, icon: Icon, className = "", children }: { title: string; icon: LucideIcon; className?: string; children: ReactNode }) => (
  <section className={`bg-panel px-5 py-5 sm:px-7 sm:py-7 ${className}`}>
    <h2 className="mb-5 flex items-center gap-3 text-lg font-bold uppercase tracking-wide">
      <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
      {title}
    </h2>
    {children}
  </section>
);

const ContactCard = ({ title, icon, contact }: { title: string; icon: LucideIcon; contact?: Contact | null }) => {
  if (!contact) return null;
  const { name, address, phone, mobile, email } = contact;
  return (
    <Card title={title} icon={icon}>
      <div className="flex flex-col gap-3 text-sm text-body">
        {name && <div className="font-semibold">{name}</div>}
        {(address?.street || address?.city) && (
          <div>
            {address?.street}
            <br />
            {address?.city}
          </div>
        )}
        {(phone || mobile) && (
          <div>
            {[phone, mobile].filter(Boolean).map((n) => (
              <Fragment key={n}>
                {n}
                <br />
              </Fragment>
            ))}
          </div>
        )}
        {email && (
          <Link href={`mailto:${email}`} tone="muted" size="inherit">
            {email}
          </Link>
        )}
      </div>
    </Card>
  );
};

const ClubPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const events = useApi<Event[]>(EVENTS_PATH).data ?? [];
  const [result, setResult] = useState<{ id: string; club: Club | null } | null>(null);

  useEffect(() => {
    if (!documentId) return;
    axios
      .get(`${API_URL}/api/clubs/${documentId}?${POPULATE}`)
      .then((res) => setResult({ id: documentId, club: res.data.data }))
      .catch(() => setResult({ id: documentId, club: null }));
  }, [documentId]);

  const loaded = result !== null && result.id === documentId;
  const club = loaded ? result.club : null;

  if (loaded && !club) {
    return (
      <Section spacing="page">
        <PageHeader title="Verein nicht gefunden" />
        <Link iconRight={ChevronsRight} to="/vereine">zurück zu den Vereinen</Link>
      </Section>
    );
  }

  if (!club) {
    return (
      <Section spacing="page" className="min-h-96 text-muted">
        Lädt …
      </Section>
    );
  }

  const homeEvent = getNextEvent(events.filter((r) => r.organizer?.documentId === club.documentId));
  const hasStats = !!club.stats?.some((s) => s.value?.trim());
  const hasSidebar = homeEvent || club.president || club.mailingAddress;

  return (
    <>
      <div className={`relative flex min-h-[50svh] items-end overflow-hidden bg-cover bg-center ${club.vehiclePhoto?.url ? "" : "bg-panel border-b border-line"}`}>
        {club.vehiclePhoto?.url && (
          <div className="absolute inset-0 opacity-40">
            <img src={mediaUrl(club.vehiclePhoto.url)} alt={`Bild von ${club.name}`} className="w-full h-full object-cover object-[25%_75%]" />
          </div>
        )}
        <div className={`relative flex w-full flex-col items-start gap-4 pt-24 pb-8 sm:flex-row sm:items-end sm:gap-8 ${GUTTER}`}>
          <div className={`flex h-24 w-24 shrink-0 sm:h-36 sm:w-36 items-center justify-center ${club.logo?.url ? "bg-paper p-3" : "border border-line-strong"}`}>
            <ImageSlot src={mediaUrl(club.logo?.url)} alt={`Logo von ${club.name}`} placeholder="Logo" fit="contain" />
          </div>
          <div className="min-w-0">
            <h1 className="mb-4 break-words hyphens-auto font-display text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl md:text-7xl">
              {club.name}
            </h1>
            {club.website && (
              <div className="flex items-center gap-2.5 break-all text-lg">
                <Globe className="h-5 w-5 text-accent" aria-hidden />
                <Link href={club.website} size="inherit" external className="no-underline">
                  {club.website.replace(/^https?:\/\//, "")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Section spacing="page">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(260px,300px)] items-start gap-8 max-lg:grid-cols-1">
          <div className="flex flex-col gap-8">

            {/* Über den Verein */}
            {(club.about || hasStats) && (
              <Card title="Über den Verein" icon={Info}>
                {club.about && <p className="mb-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-body">{club.about}</p>}
                <StatList stats={club.stats} />
              </Card>
            )}

            {/* Vereinsfarben & Fahrzeuggrafik */}
            {(club.vehicleGraphic?.url || (club.colors && club.colors.length > 0)) && (
              <Card title="Vereinsfarben" icon={Palette}>
                <div className="flex flex-wrap gap-x-20 gap-y-8">
                  {club.colors && club.colors.length > 0 && (
                    <ul className="flex flex-col">
                      {club.colors.map((c) => (
                        <li key={c.id} className="flex items-center h-20 w-20" style={{ backgroundColor: c.hex }} >
                        </li>
                      ))}
                    </ul>
                  )}
                  {club.vehicleGraphic?.url && (
                    <div>
                      <img
                        src={mediaUrl(club.vehicleGraphic.url)}
                        alt={`Vereinsfahrzeug von ${club.name}`}
                        className="max-h-30 max-w-full object-contain object-left"
                        style={{ filter: "drop-shadow(0 0 1px rgb(255 255 255 / 0.35))" }}
                      />
                      <div className="font-mono text-xs uppercase tracking-wider mt-4 text-muted">
                        <span className="w-9/20 inline-block">Front</span>
                        <span className="w-11/20 inline-block">Seite</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {hasSidebar && (
            <div className="flex flex-col gap-8">
              {/* Veranstaltungen */}
              {homeEvent && (
                <section className="bg-brand px-5 py-5 sm:px-7 sm:py-7">
                  <div className="mb-3 text-sm text-on-brand">Nächste Veranstaltung des Vereins</div>
                  <div className="mb-3 font-mono text-3xl font-semibold">{formatDate(homeEvent.date)}</div>
                  <div className={`text-lg ${homeEvent.track?.name ? "mb-2" : "mb-6"}`}>{eventTitle(homeEvent)}</div>
                  {homeEvent.track?.name && (
                    <div className="mb-6 flex items-center gap-1.5 text-sm text-on-brand">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                      {homeEvent.track?.name}
                    </div>
                  )}
                  <div className="text-right">
                    <Link iconRight={ChevronsRight} to="/renntermine">alle Renntermine</Link>
                  </div>
                </section>
              )}
              {/* Kontakt */}
              {club.president && (
                <ContactCard title="1. Vorstand" icon={ContactIcon} contact={club.president} />
              )}
              {club.mailingAddress && (
                <ContactCard title="Versandanschrift" icon={Package} contact={club.mailingAddress} />
              )}

              {/* Standort */}
              {/* {club.location && (
                <Card title="Standort" icon={MapPin}>
                  <div className="font-semibold">{club.location}</div>
                </Card>
              )} */}
            </div>
          )}
        </div>
      </Section>
    </>
  );
};

export default ClubPage;
