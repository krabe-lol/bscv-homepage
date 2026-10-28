import ImageSlot from "../ui/ImageSlot";
import Section from "../ui/Section";
import Collapsible from "../ui/Collapsible";
import { mediaUrl } from "../../lib/api";
import { useApi } from "../../lib/useApi";
import type { BoardMember } from "../../lib/types";
import Link from "../ui/Link";

// Personenkarten des Präsidiums, auch auf der Kontaktseite verwendet
export const BoardMemberGrid = () => {
  const people = useApi<BoardMember[]>("board-members?sort=position&populate[photo]=true&populate[contact][populate][0]=address").data ?? [];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
      {people.map((person) => {
        const name = person.contact?.name ?? person.role;
        return (
          <div key={person.documentId} className="break-words bg-panel p-3 sm:p-6">
            <div className="h-44 w-full sm:h-90">
              <ImageSlot src={mediaUrl(person.photo?.url)} alt={name} placeholder={name} fallback="person" />
            </div>
            <div className="font-mono text-xs uppercase tracking-wider mb-2 mt-4 text-accent sm:mt-5">{person.role}</div>
            <div className="text-base font-bold sm:text-xl">{person.contact?.name}</div>
            {person.contact?.email && (
              <Link href={`mailto:${person.contact.email}`} tone="muted" className="mt-2 inline-block">
                {person.contact.email}
              </Link>
            )}
            {(person.contact?.address?.street || person.contact?.address?.city) && (
              <div className="mt-3 text-sm leading-relaxed text-muted">
                {person.contact.address.street && <div>{person.contact.address.street}</div>}
                {person.contact.address.city && <div>{person.contact.address.city}</div>}
              </div>
            )}
            {(person.contact?.phone || person.contact?.mobile) && (
              <div className="mt-3 text-sm leading-relaxed text-muted">
                {person.contact.phone && <div>Tel: {person.contact.phone}</div>}
                {person.contact.mobile && <div>Mobil: {person.contact.mobile}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const BoardMembers = () => (
  <Section>
    <Collapsible id="praesidium" title="Präsidium">
      <BoardMemberGrid />
    </Collapsible>
  </Section>
);

export default BoardMembers;
