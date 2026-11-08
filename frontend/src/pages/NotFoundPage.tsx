import { ChevronsRight } from "lucide-react";
import Breadcrumb from "../components/ui/Breadcrumb";
import Link from "../components/ui/Link";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import { useApi } from "../lib/useApi";
import type { IntroPage } from "../lib/types";

// Einstiegspunkte, wenn eine Adresse ins Leere führt
const LINKS = [
  { to: "/", label: "zur Startseite" },
  { to: "/renntermine", label: "Renntermine & Rennstrecken" },
  { to: "/vereine", label: "Vereine" },
  { to: "/kontakt", label: "Kontakt" },
];

const NotFoundPage = () => {
  const page = useApi<IntroPage>("not-found-page").data;

  return (
    <Section spacing="page" className="min-h-[50svh]">
      <Breadcrumb items={[{ label: "Seite nicht gefunden" }]} className="mb-6 md:mb-8" />
      <div className="mb-6 font-display text-7xl font-bold leading-none text-accent md:text-9xl">404</div>
      <PageHeader title="Seite nicht gefunden" intro={page?.intro ?? undefined} />
      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} iconRight={ChevronsRight}>
            {l.label}
          </Link>
        ))}
      </div>
    </Section>
  );
};

export default NotFoundPage;
