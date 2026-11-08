import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface Crumb {
  label: string;
  /** Ohne `to` ist der Eintrag die aktuelle Seite (kein Link) */
  to?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  className?: string;
}

/** Brotkrumen über dem Seitentitel. "Startseite" steht immer vorn, Einträge ohne Text (z. B. beim Laden) entfallen. */
const Breadcrumb = ({ items, className = "" }: BreadcrumbProps) => {
  const crumbs: Crumb[] = [{ label: "Startseite", to: "/" }, ...items.filter((c) => c.label)];

  return (
    <nav aria-label="Brotkrumennavigation" className={`font-mono text-xs uppercase tracking-wider text-muted ${className}`}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((c, i) => (
          <li key={`${i}-${c.label}`} className="flex min-w-0 items-center gap-2">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-dim" aria-hidden />}
            {c.to ? (
              // Hover hell statt rot: der Wechsel Grau → Rot lässt die kleine Schrift scheinbar springen
              <Link to={c.to} className="decoration-accent underline-offset-4 hover:text-paper hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="break-words text-paper">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
