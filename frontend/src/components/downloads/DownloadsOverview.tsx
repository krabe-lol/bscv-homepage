import { ChevronsRight } from "lucide-react";
import Link from "../ui/Link";
import LinkList from "../ui/LinkList";
import Tile from "../ui/Tile";
import TileGrid from "../ui/TileGrid";
import { mediaUrl } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Download, SectionDocuments } from "../../lib/types";

/** Dokumentgruppen als Kacheln – auf der Dokumente-Seite und der Startseite. */
const DownloadsOverview = ({ className = "" }: { className?: string }) => {
  const documents = useApi<Download[]>("downloads?sort=position&populate=file&pagination[pageSize]=100").data ?? [];
  const section = useApi<SectionDocuments>("section-documents").data;
  // Ziele mit / bleiben in der Website, alles andere (https://, mailto:) ist ein normaler Link
  const target = section?.licenseTileLinkUrl?.trim() || "/kontakt";
  const linkProps = target.startsWith("/") ? { to: target } : { href: target };
  const groups = [...new Set(documents.map((d) => d.category))];

  return (
    <div className={className}>
      <TileGrid cols="fit-280" bordered>
        {groups.map((group) => (
          <Tile key={group} title={group}>
            <LinkList
              items={documents
                .filter((d) => d.category === group)
                .map((d) => ({ label: d.title, href: mediaUrl(d.file?.url) }))}
            />
          </Tile>
        ))}
        {section && (
          <Tile tone="brand" title={section.licenseTileTitle ?? undefined}>
            {section.licenseTileText && <p className="mb-3.5 text-sm leading-relaxed text-on-brand">{section.licenseTileText}</p>}
            {section.licenseTileLinkText && (
              <Link iconRight={ChevronsRight} {...linkProps}>{section.licenseTileLinkText}</Link>
            )}
          </Tile>
        )}
      </TileGrid>
    </div>
  );
};

export default DownloadsOverview;
