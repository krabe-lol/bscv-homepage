import { Link } from "react-router-dom";
import Logo from "./ui/Logo";
import { useApi } from "../lib/useApi";
import type { FooterEntry } from "../lib/types";

const Footer = () => {
  const footer = useApi<FooterEntry>("footer").data;

  return (
    <footer className="px-4 sm:px-8 md:px-12 lg:px-30 mt-14 md:mt-24 grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] items-start gap-x-12 gap-y-10 border-t border-line py-11">
      <Logo size="sm" />
      <div className="flex flex-wrap justify-between gap-10">
        <div className="flex flex-wrap gap-x-12 gap-y-10 sm:gap-x-20">
          <nav aria-label="Menü">
            <div className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
              Menü
            </div>
            <div className="flex flex-col items-start gap-2.5 text-sm">
              <Link to="/#bscv">Der BSCV</Link>
              <Link to="/renntermine">Renntermine</Link>
              <Link to="/renntermine#rennstrecken">Rennstrecken</Link>
              <Link to="/punktewertung">Punktewertung</Link>
              <Link to="/vereine">Vereine</Link>
              <Link to="/#funktionaere">Funktionäre</Link>
              <Link to="/galerie">Galerie</Link>
            </div>
          </nav>
          <nav aria-label="Rechtliches">
            <div className="mb-4 font-mono text-xs uppercase tracking-widest text-muted">
              Rechtliches
            </div>
            <div className="flex flex-col items-start gap-2.5 text-sm text-muted">
              <Link to="/kontakt">Kontakt</Link>
              <Link to="/impressum">Impressum</Link>
              <Link to="/datenschutz">Datenschutz</Link>
            </div>
          </nav>
        </div>
        {/* Jahr immer aktuell, Verbandsname aus Strapi */}
        {footer?.copyright && (
          <div className="font-mono text-xs tracking-wider text-dim">
            © {new Date().getFullYear()} {footer.copyright}
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
