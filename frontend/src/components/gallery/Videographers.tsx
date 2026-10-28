import { Camera, Globe, LinkIcon, SquarePlay } from "lucide-react";
import ImageSlot from "../ui/ImageSlot";
import Link from "../ui/Link";
import SectionHeader from "../ui/SectionHeader";
import { mediaUrl } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Videographer } from "../../lib/types";

// Kanäle der Leute, die bei den Veranstaltungen filmen (YouTube, Instagram, Website, Linktree)
const Videographers = () => {
  const videographers =
    useApi<Videographer[]>("videographers?sort[0]=position&sort[1]=name&populate=photo&pagination[pageSize]=100").data ?? [];

  if (videographers.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Videokanäle" size="sm" className="mt-16" />
      {/* Mindestbreite so gewählt, dass alle vier Links am Desktop in eine Zeile passen */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(420px,100%),1fr))] gap-3 mt-8">
        {videographers.map((p) => (
          <div key={p.documentId} className="bg-panel p-5 sm:p-6">
            <div className="flex items-start gap-5">
              <div className="h-24 w-24 shrink-0 overflow-hidden sm:h-28 sm:w-28">
                <ImageSlot src={mediaUrl(p.photo?.url)} alt={p.name} placeholder={p.name} fallback="person" />
              </div>
              <div className="min-w-0 break-words">
                <div className="text-lg font-bold sm:text-xl">{p.name}</div>
                {p.description && (
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{p.description}</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
              {p.youtube && (
                <Link href={p.youtube} external iconLeft={SquarePlay}>
                  YouTube
                </Link>
              )}
              {p.instagram && (
                <Link href={p.instagram} external iconLeft={Camera}>
                  Instagram
                </Link>
              )}
              {p.website && (
                <Link href={p.website} external iconLeft={Globe}>
                  Website
                </Link>
              )}
              {p.linktree && (
                <Link href={p.linktree} external iconLeft={LinkIcon}>
                  Linktree
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Videographers;
