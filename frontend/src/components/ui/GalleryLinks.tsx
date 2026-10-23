import { Images } from "lucide-react";
import type { Race } from "../../lib/types";
import Link from "./Link";

interface GalleryLinksProps {
  albums?: Race["albums"];
  className?: string;
}

// Links zu den Galerien einer Veranstaltung (externe Alben), einzeilig
const GalleryLinks = ({ albums, className = "" }: GalleryLinksProps) => {
  const list = (albums ?? []).filter((album) => album.url);
  if (list.length === 0) return null;

  return (
    <div className={`flex gap-x-4 whitespace-nowrap ${className}`}>
      {list.map((album, i) => (
        <span key={album.documentId} title={album.title}>
          <Link href={album.url ?? undefined} external iconLeft={Images}>
            {list.length === 1 ? "Fotos" : `Fotos ${i + 1}`}
          </Link>
        </span>
      ))}
    </div>
  );
};

export default GalleryLinks;
