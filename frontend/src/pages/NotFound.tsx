import { ChevronsRight } from "lucide-react";
import Link from "../components/ui/Link";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import { useSeitentexte } from "../lib/texts";

// Einstiegspunkte, wenn eine Adresse ins Leere führt
const LINKS = [
  { to: "/", label: "zur Startseite" },
  { to: "/renntermine", label: "Renntermine & Rennstrecken" },
  { to: "/vereine", label: "Vereine" },
  { to: "/kontakt", label: "Kontakt" },
];

const NotFound = () => {
  const texts = useSeitentexte();

  return (
    <Section spacing="page" className="min-h-[50svh]">
      <div className="mb-6 font-display text-7xl font-bold leading-none text-accent md:text-9xl">404</div>
      <PageHeader title="Seite nicht gefunden" intro={texts?.notFoundIntro ?? undefined} />
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

export default NotFound;
