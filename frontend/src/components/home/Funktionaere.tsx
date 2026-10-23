import Collapsible from "../ui/Collapsible";
import ImageSlot from "../ui/ImageSlot";
import Section from "../ui/Section";
import { mediaUrl } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { Funktionaer } from "../../lib/types";

const Funktionaere = () => {
  const officials = useApi<Funktionaer[]>("funktionaere?sort=name&populate=photo&pagination[pageSize]=100").data ?? [];

  return (
    <Section spacing="none" className="pt-8 md:pt-10">
      <Collapsible id="funktionaere" title="Funktionäre">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
          {officials.map((o) => (
            <div key={o.documentId} className="bg-panel p-3 sm:p-5">
              <div className="mb-3 h-36 w-full sm:mb-4 sm:h-52">
                <ImageSlot src={mediaUrl(o.photo?.url)} alt={o.name} placeholder={o.name} fallback="person" />
              </div>
              <div className="break-words text-base font-bold sm:text-lg">{o.name}</div>
              {o.club && <div className="mt-1 break-words text-sm text-muted">{o.club}</div>}
            </div>
          ))}
        </div>
      </Collapsible>
    </Section>
  );
};

export default Funktionaere;
