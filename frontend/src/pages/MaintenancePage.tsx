import { ChevronsRight } from "lucide-react";
import { Link as RouterLink, Route, Routes } from "react-router-dom";
import Link from "../components/ui/Link";
import Logo from "../components/ui/Logo";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import ContentPage from "./ContentPage";
import type { Maintenance } from "../lib/types";

const DEFAULT_TITLE = "Gleich wieder da";
const DEFAULT_TEXT = "Die Seite wird gerade überarbeitet und ist bald wieder erreichbar.";

const Notice = ({ maintenance }: { maintenance: Maintenance }) => (
  <Section spacing="page" className="min-h-[50svh]">
    <div className="mb-6 font-mono text-xs uppercase tracking-widest text-accent">Wartungsarbeiten</div>
    <PageHeader title={maintenance.title || DEFAULT_TITLE} intro={maintenance.text || DEFAULT_TEXT} />
    {maintenance.email && (
      <div className="mt-8">
        <Link iconRight={ChevronsRight} href={`mailto:${maintenance.email}`}>
          {maintenance.email}
        </Link>
      </div>
    )}
  </Section>
);

/** Ersetzt die ganze Seite, solange in Strapi der Wartungsmodus an ist; Impressum und Datenschutz bleiben erreichbar. */
const MaintenancePage = ({ maintenance }: { maintenance: Maintenance }) => (
  <div className="min-h-screen overflow-x-hidden bg-ink text-paper">
    <header className="px-4 py-5 sm:px-8 md:px-12 lg:px-30 lg:py-12">
      <RouterLink to="/" className="inline-block">
        <Logo size="md" />
      </RouterLink>
    </header>
    <Routes>
      <Route path="/impressum" element={<ContentPage slug="impressum" />} />
      <Route path="/datenschutz" element={<ContentPage slug="datenschutz" />} />
      <Route path="*" element={<Notice maintenance={maintenance} />} />
    </Routes>
    <footer className="px-4 sm:px-8 md:px-12 lg:px-30 mt-14 md:mt-24 flex flex-wrap gap-x-8 gap-y-3 border-t border-line py-11 text-sm text-muted">
      <RouterLink to="/impressum">Impressum</RouterLink>
      <RouterLink to="/datenschutz">Datenschutz</RouterLink>
    </footer>
  </div>
);

export default MaintenancePage;
