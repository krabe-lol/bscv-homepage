import { ChevronsRight } from "lucide-react";
import Link from "../ui/Link";
import LinkList from "../ui/LinkList";
import Tile from "../ui/Tile";
import TileGrid from "../ui/TileGrid";
import { mediaUrl } from "../../lib/api";
import { useSeitentexte } from "../../lib/texts";
import { useApi } from "../../lib/useApi";
import type { Download, Maintenance } from "../../lib/types";

/** Dokumentgruppen als Kacheln – auf der Dokumente-Seite und der Startseite. */
const DownloadsOverview = ({ className = "" }: { className?: string }) => {
  const documents = useApi<Download[]>("downloads?sort=position&populate=file&pagination[pageSize]=100").data ?? [];
  const maintenance = useApi<Maintenance>("maintenance").data;
  const texts = useSeitentexte();
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
        {texts && (
          <Tile tone="brand" title={texts.licenseTileTitle ?? undefined}>
            {texts.licenseTileText && <p className="mb-3.5 text-sm leading-relaxed text-on-brand">{texts.licenseTileText}</p>}
            {texts.licenseTileLink && (
              <Link iconRight={ChevronsRight} href={`mailto:${maintenance?.officeEmail ?? ""}`}>{texts.licenseTileLink}</Link>
            )}
          </Tile>
        )}
      </TileGrid>
    </div>
  );
};

export default DownloadsOverview;
