import { useEffect, useRef, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import SectionHeader from "./SectionHeader";

interface CollapsibleProps {
  id?: string;
  title: string;
  className?: string;
  children: ReactNode;
}

/** Eingeklappter Bereich mit Abschnittstitel und Plus-Symbol; Klick auf die Zeile klappt den Inhalt auf. */
const Collapsible = ({ id, title, className = "", children }: CollapsibleProps) => {
  const ref = useRef<HTMLDetailsElement>(null);
  const { hash } = useLocation();

  /** Deep-Link (z. B. /#funktionaere) öffnet den Bereich automatisch. */
  useEffect(() => {
    if (id && hash === `#${id}` && ref.current) ref.current.open = true;
  }, [id, hash]);

  return (
    <details ref={ref} id={id} className={`group ${className}`}>
      <summary className="group/summary cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <SectionHeader
          title={title}
          action={
            <Plus
              aria-hidden
              className="h-10 w-10 shrink-0 text-accent transition-transform group-open:rotate-45 group-hover/summary:text-accent-hover md:h-12 md:w-12"
            />
          }
        />
      </summary>
      <div className="pt-7 mb-20">{children}</div>
    </details>
  );
};

export default Collapsible;
