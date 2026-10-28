import Markdown from "../components/ui/Markdown";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import { useApi } from "../lib/useApi";
import type { Page } from "../lib/types";

/** Textseite aus Strapi (Content-Type "Seite"), über den Slug ausgewählt. */
const ContentPage = ({ slug }: { slug: string }) => {
  const { data } = useApi<Page[]>(`pages?filters[slug][$eq]=${slug}`);
  const page = data?.[0];

  return (
    <Section spacing="page">
      <PageHeader title={page?.title ?? ""} />
      <div className="mt-11">
        {data && !page ? <p className="text-muted">Seite nicht gefunden.</p> : <Markdown>{page?.content ?? ""}</Markdown>}
      </div>
    </Section>
  );
};

export default ContentPage;
