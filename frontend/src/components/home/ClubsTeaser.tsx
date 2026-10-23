import { ChevronsRight } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import Section from "../ui/Section";
import type { Verein } from "../../lib/types";
import Link from "../ui/Link";

const MAX_CHIPS = 26;

const ClubsTeaser = ({ clubs }: { clubs: Verein[] }) => {
  const rest = clubs.length - MAX_CHIPS;

  return (
    <Section id="vereine">
      <div className="flex flex-wrap items-stretch">
        <div className="flex min-w-0 grow basis-75 flex-col justify-between bg-brand px-5 py-7 sm:px-8 sm:py-9">
          <div>
            <div className="break-words text-5xl font-black sm:text-6xl leading-none tracking-tight">{clubs.length}</div>
            <div className="mt-3 text-2xl font-semibold leading-tight">
              Vereine in
              <br />
              Bayern
            </div>
          </div>
          <p className="mt-7 text-sm leading-relaxed text-on-brand">
            Jeder Verein richtet Rennen aus, stellt Funktionäre und Fahrer – und bestreitet die Saison nach einheitlichen
            Regeln.
          </p>
          <Link iconRight={ChevronsRight} to="/vereine" className="mt-6">alle Vereine ansehen</Link>
        </div>

        <div className="min-w-0 grow-1000 basis-105 border border-line px-5 py-6 sm:px-7 sm:py-8">
          <div className="flex flex-wrap gap-2">
            {clubs.slice(0, MAX_CHIPS).map((club) => (
              <RouterLink
                key={club.documentId}
                to={`/vereine/${club.documentId}`}
                className="border border-line-strong px-3 py-2 text-sm hover:border-accent"
              >
                {club.name}
              </RouterLink>
            ))}
            {rest > 0 && (
              <RouterLink to="/vereine" className="border border-transparent px-3 py-2 text-sm text-muted">
                + {rest} weitere
              </RouterLink>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default ClubsTeaser;
