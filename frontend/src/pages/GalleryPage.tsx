import Videographers from "../components/gallery/Videographers";
import Breadcrumb from "../components/ui/Breadcrumb";
import ImageSlot from "../components/ui/ImageSlot";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import SectionHeader from "../components/ui/SectionHeader";
import { mediaUrl } from "../lib/api";
import { formatDate } from "../lib/format";
import { useApi } from "../lib/useApi";
import type { Album, IntroPage } from "../lib/types";

const GalleryPage = () => {
  const albums = useApi<Album[]>("albums?sort=date:desc&populate=preview&pagination[pageSize]=200").data ?? [];
  const years = [...new Set(albums.map((a) => a.date?.slice(0, 4) ?? ""))];
  const page = useApi<IntroPage>("gallery-page").data;

  return (
    <Section spacing="page">
      <Breadcrumb items={[{ label: "Fotos & Videos" }]} className="mb-6 md:mb-8" />
      <PageHeader
        title="Fotos & Videos"
        intro={page?.intro ?? undefined}
      />

      <Videographers />

      {years.map((year) => (
        <div key={year}>
          <SectionHeader title={year || "Weitere"} size="sm" className="mt-16" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] gap-3 mt-8">
            {albums
              .filter((a) => (a.date?.slice(0, 4) ?? "") === year)
              .map((album) => (
                <a
                  key={album.documentId}
                  href={album.galleryUrl ?? undefined}
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

export default GalleryPage;
