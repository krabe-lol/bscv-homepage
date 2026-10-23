import ImageSlot from "../components/ui/ImageSlot";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import SectionHeader from "../components/ui/SectionHeader";
import { mediaUrl } from "../lib/api";
import { formatDate } from "../lib/format";
import { useSeitentexte } from "../lib/texts";
import { useApi } from "../lib/useApi";
import type { Album } from "../lib/types";

const Albums = () => {
  const albums = useApi<Album[]>("albums?sort=date:desc&populate=preview&pagination[pageSize]=200").data ?? [];
  const years = [...new Set(albums.map((a) => a.date?.slice(0, 4) ?? ""))];
  const texts = useSeitentexte();

  return (
    <Section spacing="page">
      <PageHeader
        title="Fotos & Videos"
        intro={texts?.albumsIntro ?? undefined}
      />

      {years.map((year) => (
        <div key={year}>
          <SectionHeader title={year || "Weitere"} size="sm" className="mt-16" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3 mt-8">
            {albums
              .filter((a) => (a.date?.slice(0, 4) ?? "") === year)
              .map((album) => (
                <a
                  key={album.documentId}
                  href={album.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="group block bg-panel"
                >
                  <div className="h-44 w-full overflow-hidden">
                    <ImageSlot src={mediaUrl(album.preview?.url)} alt={album.title} placeholder={album.title} />
                  </div>
                  <div className="p-4">
                    <div className="font-semibold group-hover:text-accent-hover">{album.title}</div>
                    {album.date && <div className="mt-1 font-mono text-xs text-muted">{formatDate(album.date)}</div>}
                  </div>
                </a>
              ))}
          </div>
        </div>
      ))}
    </Section>
  );
};

export default Albums;
