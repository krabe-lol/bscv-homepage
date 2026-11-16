import { FileText, Flag, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatDate, formatWeekdayShort } from "../../lib/format";
import { mediaUrl } from "../../lib/api";
import { eventTitle } from "../../lib/events";
import type { Event } from "../../lib/types";
import GalleryLinks from "./GalleryLinks";
import Link from "./Link";

interface EventRowProps {
  event: Event;
  variant?: "highlight" | "default";
  size?: "lg" | "md";
  subtitle?: string;
  action?: ReactNode;
}

// Einzeilige Linkzelle mit Icon, bei Platzmangel wird gekürzt (voller Text als Tooltip)
const MetaLink = ({ to, label, icon: Icon, className }: { to: string; label: string; icon: LucideIcon; className: string }) => (
  <div title={label} className="flex min-w-0 items-center gap-1.5">
    <Icon className="h-[1em] w-[1em] shrink-0" aria-hidden />
    <Link to={to} size="inherit" className={`block min-w-0 truncate ${className}`}>
      {label}
    </Link>
  </div>
);

// Wie MetaLink, aber ohne Ziel (Ort oder Veranstalter ohne eigene Seite)
const MetaText = ({ label, icon: Icon }: { label: string; icon: LucideIcon }) => (
  <div title={label} className="flex min-w-0 items-center gap-1.5">
    <Icon className="h-[1em] w-[1em] shrink-0" aria-hidden />
    <span className="block min-w-0 truncate">{label}</span>
  </div>
);

// Dokumente der Veranstaltung (z. B. Ausschreibung), Name ohne Endung
const DocumentLinks = ({ documents }: { documents: Event["documents"] }) => {
  const list = documents ?? [];
  if (list.length === 0) return null;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {list.map((doc) => {
        const label = doc.name.replace(/\.[a-z0-9]{1,5}$/i, "");
        return (
          <span key={doc.id} title={label} className="min-w-0 truncate">
            <Link href={mediaUrl(doc.url)} external iconLeft={FileText}>
              {label}
            </Link>
          </span>
        );
      })}
    </div>
  );
};

// Vollständige Klassennamen, damit Tailwind sie findet
const GRID = {
  md: "py-4 lg:grid-cols-[150px_minmax(0,1fr)_minmax(0,190px)_minmax(0,240px)_110px]",
  lg: "py-5 lg:grid-cols-[170px_minmax(0,1fr)_minmax(0,190px)_minmax(0,240px)_110px_96px]",
};

const EventRow = ({ event, variant = "default", size = "md", subtitle, action }: EventRowProps) => {
  const highlight = variant === "highlight";
  const today = new Date().toISOString().slice(0, 10);
  const past = !highlight && event.date < today;
  const titleTone = highlight ? "text-on-brand" : past ? "text-body" : "text-paper";
  const metaTone = highlight ? "text-on-brand" : past ? "text-dim" : "text-muted";
  const { track, organizer, organizerName, location } = event;
  const big = size === "lg";
  const photo = track?.photo;

  return (
    <div
      className={`grid grid-cols-1 items-center gap-x-6 gap-y-1 border-b border-line-soft px-4 transition-colors sm:grid-cols-[120px_minmax(0,1fr)] sm:px-6 ${GRID[size]} ${
        highlight ? "bg-brand" : "hover:bg-panel"
      }`}
    >
      <div className={`font-mono ${metaTone}`}>
        <time dateTime={event.date} className={`whitespace-nowrap ${big ? "text-base" : "text-sm"}`}>
          {formatWeekdayShort(event.date)}, {formatDate(event.date)}
        </time>
        {!past && event.entryDeadline && (
          <div className="whitespace-nowrap text-xs">Nennschluss {formatDate(event.entryDeadline)}</div>
        )}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <span
          title={subtitle ?? eventTitle(event)}
          className={`min-w-0 truncate font-semibold ${big ? "text-xl" : "text-base"} ${titleTone}`}
        >
          {eventTitle(event)}
        </span>
        {event.seasonFinal && (
          <span className={`shrink-0 border px-1.5 py-0.5 font-mono text-xs uppercase ${highlight ? "border-on-brand text-on-brand" : "border-accent text-accent"}`}>
            Endlauf
          </span>
        )}
      </div>

      {/* Ab lg direkte Grid-Spalten, darunter eine umbrechende Zeile unter dem Titel */}
      <div className={`col-start-1 flex flex-wrap gap-x-5 gap-y-1 ${big ? "text-base" : "text-sm"} sm:col-start-2 lg:contents ${metaTone}`}>
        {track?.name ? (
          <MetaLink to={`/rennstrecken/${track.documentId}`} label={track.name} icon={MapPin} className={metaTone} />
        ) : location ? (
          <MetaText label={location} icon={MapPin} />
        ) : (
          <div className="hidden lg:block" />
        )}
        {organizer?.name ? (
          <MetaLink to={`/vereine/${organizer.documentId}`} label={organizer.name} icon={Flag} className={metaTone} />
        ) : organizerName ? (
          <MetaText label={organizerName} icon={Flag} />
        ) : (
          <div className="hidden lg:block" />
        )}
        <div className="flex min-w-0 items-center gap-4 whitespace-nowrap">
          {past ? <GalleryLinks albums={event.albums} /> : <DocumentLinks documents={event.documents} />}
          {action}
        </div>
        {big &&
          (photo?.url ? (
            <img
              src={mediaUrl(photo.url)}
              alt={`Rennstrecke ${track?.name}`}
              loading="lazy"
              className="hidden h-16 w-24 object-cover lg:block"
            />
          ) : (
            <div className="hidden lg:block" />
          ))}
      </div>
    </div>
  );
};

export default EventRow;
