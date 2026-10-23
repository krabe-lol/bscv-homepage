import DocumentsOverview from "../documents/DocumentsOverview";
import Collapsible from "../ui/Collapsible";
import Section from "../ui/Section";

const Dokumente = () => (
  <Section spacing="none" className="pt-8 md:pt-10">
    <Collapsible id="dokumente" title="Dokumente">
      <DocumentsOverview />
    </Collapsible>
  </Section>
);

export default Dokumente;
