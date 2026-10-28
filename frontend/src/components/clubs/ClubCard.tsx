import { Link } from "react-router-dom";
import { mediaSrcSet, mediaUrl } from "../../lib/api";
import type { Club } from "../../lib/types";
import ImageSlot from "../ui/ImageSlot";

/** Kachel: oben Fahrzeugfoto, unten Vereinsname, das Logo sitzt gerahmt auf der Trennlinie. */
const ClubCard = ({ club }: { club: Club }) => (
  <Link
    to={`/vereine/${club.documentId}`}
    className="group relative flex aspect-10/8 flex-col overflow-hidden bg-panel"
  >
    <div className="h-1/2 w-full overflow-hidden">
      {club.vehiclePhoto?.url ? (
        <ImageSlot
          src={mediaUrl(club.vehiclePhoto.url)}
          srcSet={mediaSrcSet(club.vehiclePhoto)}
          sizes="(max-width: 640px) 100vw, 400px"
          alt={`Fahrzeug von ${club.name}`}
          placeholder="Fahrzeugfoto"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          role="img"
          aria-label={`Fahrzeugfoto von ${club.name} fehlt`}
          className="flex h-full w-full items-center justify-center bg-line-soft font-mono text-xs uppercase tracking-wider text-dim"
        >
          Fahrzeugfoto
        </div>
      )}
    </div>
    <div className="flex h-1/2 items-start px-5 pt-12">
      <span className="text-lg font-semibold leading-tight group-hover:text-accent-hover">{club.name}</span>
    </div>
    {club.logo?.url && (
      <div className="absolute left-5 top-1/2 flex h-18 w-18 -translate-y-1/2 items-center justify-center border border-line-strong bg-paper p-1.5">
        <img src={mediaUrl(club.logo.url)} alt={`Logo von ${club.name}`} className="h-full w-full object-contain" />
      </div>
    )}
  </Link>
);

export default ClubCard;
