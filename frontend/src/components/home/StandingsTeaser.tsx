import { ChevronsRight } from "lucide-react";
import LinkTile from "../ui/LinkTile";
import Section from "../ui/Section";
import SectionHeader from "../ui/SectionHeader";
import TileGrid from "../ui/TileGrid";
import { mediaUrl } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { useApi } from "../../lib/useApi";
import type { Einstellung, Punktewertung } from "../../lib/types";
import Link from "../ui/Link";

const StandingsTeaser = () => {
  const standings = useApi<Punktewertung[]>("punktewertungen?sort=sorting&populate=pdf&pagination[pageSize]=8").data ?? [];
  const settings = useApi<Einstellung>("einstellung").data;

  return (
    <Section>
      <SectionHeader
        title="Punktewertung"
        action={settings?.mylapsUrl && <Link iconRight={ChevronsRight} href={settings.mylapsUrl}>Live-Zeiten bei MyLaps</Link>}
      />
      <TileGrid cols="fill-300">
        {standings.map((row) => (
          <LinkTile
            key={row.documentId}
            to={row.pdf ? undefined : "/punktewertung"}
            href={mediaUrl(row.pdf?.url)}
            title={row.title}
            meta={`Stand ${formatDate(row.updatedAt)}`}
            badge="PDF"
          />
        ))}
      </TileGrid>
    </Section>
  );
};

export default StandingsTeaser;
