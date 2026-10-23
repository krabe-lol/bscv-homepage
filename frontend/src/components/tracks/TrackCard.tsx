import { Link } from "react-router-dom";
import { mediaSrcSet, mediaUrl } from "../../lib/api";
import { formatLength } from "../../lib/format";
import type { Rennstrecke } from "../../lib/types";
import ImageSlot from "../ui/ImageSlot";

/** Kachel: oben Streckenfoto, unten Name sowie Ort und Länge. */
const TrackCard = ({ track }: { track: Rennstrecke }) => {
  const meta = [track.address?.city, track.lengthMeters ? formatLength(track.lengthMeters) : null].filter(Boolean);

  return (
    <Link
      to={`/rennstrecken/${track.documentId}`}
      className="group relative flex aspect-10/8 flex-col overflow-hidden bg-panel"
    >
      <div className="h-7/10 w-full overflow-hidden">
        {track.photo?.url ? (
          <ImageSlot
            src={mediaUrl(track.photo.url)}
            srcSet={mediaSrcSet(track.photo)}
            sizes="(max-width: 640px) 100vw, 560px"
            alt={`Foto der Strecke ${track.name}`}
            placeholder="Streckenfoto"
            className="transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            role="img"
            aria-label={`Streckenfoto von ${track.name} fehlt`}
            className="flex h-full w-full items-center justify-center bg-line-soft font-mono text-xs uppercase tracking-wider text-dim"
          >
            Streckenfoto
          </div>
        )}
      </div>
      <div className="flex h-3/10 flex-col items-start gap-2 px-5 pt-6">
        <span className="text-lg font-semibold leading-tight group-hover:text-accent-hover">{track.name}</span>
        {meta.length > 0 && <span className="font-mono text-xs text-muted">{meta.join(" · ")}</span>}
      </div>
    </Link>
  );
};

export default TrackCard;
