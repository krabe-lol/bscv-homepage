import { Flag, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatDate, formatWeekdayShort } from "../../lib/format";
import { mediaUrl } from "../../lib/api";
import { raceTitle } from "../../lib/races";
import type { Race } from "../../lib/types";
import GalleryLinks from "./GalleryLinks";
import Link from "./Link";

interface RaceRowProps {
  race: Race;
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

// Vollständige Klassennamen, damit Tailwind sie findet
const GRID = {
  md: "py-4 lg:grid-cols-[150px_minmax(0,1fr)_minmax(0,190px)_minmax(0,240px)_110px]",
  lg: "py-5 lg:grid-cols-[170px_minmax(0,1fr)_minmax(0,190px)_minmax(0,240px)_110px_96px]",
};

const RaceRow = ({ race, variant = "default", size = "md", subtitle, action }: RaceRowProps) => {
  const highlight = variant === "highlight";
  const today = new Date().toISOString().slice(0, 10);
  const past = !highlight && race.date < today;
  const titleTone = highlight ? "text-on-brand" : past ? "text-body" : "text-paper";
  const metaTone = highlight ? "text-on-brand" : past ? "text-dim" : "text-muted";
  const { track, organiser } = race;
  const big = size === "lg";
  const photo = track?.photo;

  return (
    <div
      className={`grid grid-cols-1 items-center gap-x-6 gap-y-1 border-b border-line-soft px-4 transition-colors sm:grid-cols-[120px_minmax(0,1fr)] sm:px-6 ${GRID[size]} ${
        highlight ? "bg-brand" : "hover:bg-panel"
      }`}
    >
      <time dateTime={race.date} className={`whitespace-nowrap font-mono ${big ? "text-base" : "text-sm"} ${metaTone}`}>
        {formatWeekdayShort(race.date)}, {formatDate(race.date)}
      </time>

      <div className="flex min-w-0 items-center gap-3">
        <span
          title={subtitle ?? raceTitle(race)}
          className={`min-w-0 truncate font-semibold ${big ? "text-xl" : "text-base"} ${titleTone}`}
        >
          {raceTitle(race)}
        </span>
      </div>

      {/* Ab lg direkte Grid-Spalten, darunter eine umbrechende Zeile unter dem Titel */}
      <div className={`col-start-1 flex flex-wrap gap-x-5 gap-y-1 ${big ? "text-base" : "text-sm"} sm:col-start-2 lg:contents ${metaTone}`}>
        {track?.name ? (
          <MetaLink to={`/rennstrecken/${track.documentId}`} label={track.name} icon={MapPin} className={metaTone} />
        ) : (
          <div className="hidden lg:block" />
        )}
        {organiser?.name ? (
          <MetaLink to={`/vereine/${organiser.documentId}`} label={organiser.name} icon={Flag} className={metaTone} />
        ) : (
          <div className="hidden lg:block" />
        )}
        <div className="flex items-center gap-4 whitespace-nowrap">
          {past && <GalleryLinks albums={race.albums} />}
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

export default RaceRow;
