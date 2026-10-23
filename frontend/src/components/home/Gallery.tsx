import { ChevronsRight } from "lucide-react";
import ImageSlot from "../ui/ImageSlot";
import Section from "../ui/Section";
import SectionHeader from "../ui/SectionHeader";
import Link from "../ui/Link";
import { mediaUrl } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Album } from "../../lib/types";

const layout = ["col-span-2 row-span-2", "", "", "col-span-2"];

const Gallery = () => {
  const albums = useApi<Album[]>("albums?sort=date:desc&populate=preview&pagination[pageSize]=4").data ?? [];

  return (
    <Section id="galerie">
      <SectionHeader title="Fotos & Videos" className="mb-7" action={<Link iconRight={ChevronsRight} to="/galerie">zur Galerie</Link>} />
      <div className="grid auto-rows-[minmax(160px,220px)] grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {albums.map((album, i) => (
          <a
            key={album.documentId}
            href={album.url ?? undefined}
            target="_blank"
            rel="noreferrer"
            className={`relative ${layout[i] ?? ""}`}
          >
            <ImageSlot
              src={mediaUrl(album.preview?.url)}
              alt={album.title}
              placeholder={album.title}
              className="absolute inset-0"
            />
          </a>
        ))}
      </div>
    </Section>
  );
};

export default Gallery;
