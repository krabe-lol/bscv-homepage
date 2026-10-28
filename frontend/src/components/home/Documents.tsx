import DownloadsOverview from "../downloads/DownloadsOverview";
import Collapsible from "../ui/Collapsible";
import Section from "../ui/Section";

const Documents = () => (
  <Section spacing="none" className="pt-8 md:pt-10">
    <Collapsible id="dokumente" title="Dokumente">
      <DownloadsOverview />
    </Collapsible>
  </Section>
);

export default Documents;
