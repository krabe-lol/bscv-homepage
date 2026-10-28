import Markdown from "../ui/Markdown";
import Section from "../ui/Section";
import StatList from "../ui/StatList";
import Tile from "../ui/Tile";
import TileGrid from "../ui/TileGrid";
import { useApi } from "../../lib/useApi";
import type { About as AboutData } from "../../lib/types";

// Klassen stehen in Strapi je in einer Zeile
const lines = (text?: string | null) => (text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);

const About = () => {
  const about = useApi<AboutData>("about?populate[classGroups]=true&populate[stats]=true").data;

  return (
  <Section id="bscv">
    {about && (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 md:gap-16">
      <div>
        <h2 className="mb-7 break-words hyphens-auto font-display text-3xl md:text-5xl font-bold uppercase leading-none tracking-tight">
          {about.title}
        </h2>
        <StatList stats={about.stats} className="bg-panel" wrapperClassName="mb-6" />
        {about.content && <Markdown>{about.content}</Markdown>}
      </div>

      <div id="klassen">
        <div className="font-mono text-xs uppercase tracking-widest border-b border-line pb-4 text-muted">{about.classesTitle}</div>
        <TileGrid cols="2">
          {(about.classGroups ?? []).map((g) => (
            <Tile key={g.id} tone="panel" title={g.title ?? ""} titleSize="lg">
              <ul className="text-sm leading-relaxed text-muted">
                {lines(g.classes).map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
            </Tile>
          ))}
        </TileGrid>
      </div>
    </div>
    )}
  </Section>
  );
};

export default About;
