import { ChevronsRight } from "lucide-react";
import LinkList from "../ui/LinkList";
import Section from "../ui/Section";
import Tile from "../ui/Tile";
import TileGrid from "../ui/TileGrid";
import { mediaUrl } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Dokument, Einstellung } from "../../lib/types";
import Link from "../ui/Link";

const InfoTiles = () => {
  const documents = useApi<Dokument[]>("dokumente?sort=position&populate=file&pagination[pageSize]=100").data ?? [];
  const funktionaere = useApi<unknown[]>("funktionaere?fields[0]=name&pagination[pageSize]=1").total;
  const settings = useApi<Einstellung>("einstellung").data;
  const groups = [...new Set(documents.map((d) => d.group))];

  return (
    <Section>
      <TileGrid cols="fit-260" bordered>
        {groups.map((group) => (
          <Tile key={group} title={group}>
            <LinkList
              items={documents
                .filter((d) => d.group === group)
                .map((d) => ({ label: d.label, href: mediaUrl(d.file?.url), to: d.file ? undefined : "/#dokumente" }))}
            />
          </Tile>
        ))}
        <Tile title="Funktionäre">
          <p className="text-sm leading-relaxed text-muted">
            {funktionaere ?? ""} Sportkommissare, Revisoren, Rundenzählung und Transponder-Team sorgen an jedem Renntag für
            einen fairen Ablauf.
          </p>
        </Tile>
        <Tile tone="brand" title="Fahrer werden">
          <p className="mb-3.5 text-sm leading-relaxed text-on-brand">
            Verein finden, Lizenz beantragen, erste Nennung abgeben. Wir helfen Dir gerne beim Einstieg!
          </p>
          <Link iconRight={ChevronsRight} href={`mailto:${settings?.officeEmail ?? ""}`}>Kontakt aufnehmen</Link>
        </Tile>
      </TileGrid>
    </Section>
  );
};

export default InfoTiles;
