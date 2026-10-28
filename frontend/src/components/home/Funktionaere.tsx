import Collapsible from "../ui/Collapsible";
import ImageSlot from "../ui/ImageSlot";
import Section from "../ui/Section";
import SectionHeader from "../ui/SectionHeader";
import { mediaUrl } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Funktion, Funktionaer } from "../../lib/types";

const OfficialCard = ({ o }: { o: Funktionaer }) => (
  <div className="bg-panel p-3 sm:p-5">
    <div className="mb-3 h-36 w-full sm:mb-4 sm:h-52">
      <ImageSlot src={mediaUrl(o.photo?.url)} alt={o.name} placeholder={o.name} fallback="person" />
    </div>
    <div className="break-words text-base font-bold sm:text-lg">{o.name}</div>
    {o.club && <div className="mt-1 break-words text-sm text-muted">{o.club}</div>}
  </div>
);

const OfficialGrid = ({ list, className = "" }: { list: Funktionaer[]; className?: string }) => (
  <div className={`grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] ${className}`}>
    {list.map((o) => <OfficialCard key={o.documentId} o={o} />)}
  </div>
);

const Funktionaere = () => {
  const officials = useApi<Funktionaer[]>("funktionaere?sort=name&populate=photo&pagination[pageSize]=100").data ?? [];
  // Fehlt die Leseberechtigung für „funktionen“ (403), bleibt die Liste leer und alles wird wie bisher ungruppiert gezeigt
  const functions = useApi<Funktion[]>("funktionen?sort[0]=position&sort[1]=name&populate[funktionaries][fields][0]=documentId&pagination[pageSize]=100").data ?? [];

  // Nach Funktion gruppieren (Reihenfolge von „position“, Namenssortierung der Funktionäre bleibt)
  const groups = functions
    .map((f) => {
      const ids = new Set((f.funktionaries ?? []).map((x) => x.documentId));
      return { id: f.documentId, title: f.name, list: officials.filter((o) => ids.has(o.documentId)) };
    })
    .filter((g) => g.list.length > 0);
  const grouped = new Set(groups.flatMap((g) => g.list.map((o) => o.documentId)));
  const rest = officials.filter((o) => !grouped.has(o.documentId));
  if (groups.length > 0 && rest.length > 0) groups.push({ id: "weitere", title: "Weitere", list: rest });

  return (
    <Section spacing="none" className="pt-8 md:pt-10">
      <Collapsible id="funktionaere" title="Funktionäre">
        {groups.length === 0 ? (
          <OfficialGrid list={officials} />
        ) : (
          // Untergruppen wie die Jahre bei den Alben
          <div className="flex flex-col gap-16">
            {groups.map((g) => (
              <div key={g.id}>
                <SectionHeader title={g.title} size="sm" as="h3" />
                <OfficialGrid list={g.list} className="mt-8" />
              </div>
            ))}
          </div>
        )}
      </Collapsible>
    </Section>
  );
};

export default Funktionaere;
