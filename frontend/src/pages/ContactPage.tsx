import { ChevronsRight } from "lucide-react";
import { BoardMemberGrid } from "../components/home/BoardMembers";
import Link from "../components/ui/Link";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import SectionHeader from "../components/ui/SectionHeader";
import Tile from "../components/ui/Tile";
import TileGrid from "../components/ui/TileGrid";
import { useApi } from "../lib/useApi";
import type { ContactPageEntry } from "../lib/types";

const ContactPage = () => {
  const page = useApi<ContactPageEntry>("contact-page").data;

  return (
    <Section spacing="page">
      <PageHeader
        title="Kontakt"
        intro={page?.intro ?? undefined}
      />

      <TileGrid cols="fit-280" bordered className="mt-11">
        <Tile tone="brand" title={page?.officeTileTitle ?? undefined}>
          {page?.officeTileText && <p className="mb-3.5 text-sm leading-relaxed text-on-brand">{page.officeTileText}</p>}
          {page?.officeEmail && <Link iconRight={ChevronsRight} href={`mailto:${page.officeEmail}`}>{page.officeEmail}</Link>}
        </Tile>
      </TileGrid>

      <SectionHeader title="Präsidium" size="sm" className="mt-16" />
      <BoardMemberGrid />
    </Section>
  );
};

export default ContactPage;
