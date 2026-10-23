import { ChevronsRight } from "lucide-react";
import { PresidiumGrid } from "../components/home/Presidium";
import Link from "../components/ui/Link";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import SectionHeader from "../components/ui/SectionHeader";
import Tile from "../components/ui/Tile";
import TileGrid from "../components/ui/TileGrid";
import { useSeitentexte } from "../lib/texts";
import { useApi } from "../lib/useApi";
import type { Einstellung } from "../lib/types";

const Contact = () => {
  const settings = useApi<Einstellung>("einstellung").data;
  const texts = useSeitentexte();

  return (
    <Section spacing="page">
      <PageHeader
        title="Kontakt"
        intro={texts?.contactIntro ?? undefined}
      />

      <TileGrid cols="fit-280" bordered className="mt-11">
        <Tile tone="brand" title={texts?.officeTileTitle ?? undefined}>
          {texts?.officeTileText && <p className="mb-3.5 text-sm leading-relaxed text-on-brand">{texts.officeTileText}</p>}
          {settings?.officeEmail && <Link iconRight={ChevronsRight} href={`mailto:${settings.officeEmail}`}>{settings.officeEmail}</Link>}
        </Tile>
      </TileGrid>

      <SectionHeader title="Präsidium" size="sm" className="mt-16" />
      <PresidiumGrid />
    </Section>
  );
};

export default Contact;
