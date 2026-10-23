import ReactMarkdown, { type Components } from "react-markdown";
import { API_URL } from "../../lib/api";

const resolveHref = (href?: string) => (href?.startsWith("/uploads/") ? `${API_URL}${href}` : href);

const components: Components = {
  h2: ({ children }) => <h2 className="mb-4 mt-10 text-2xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-3 mt-8 text-xl font-bold">{children}</h3>,
  p: ({ children }) => <p className="mb-5 whitespace-pre-line text-base leading-relaxed text-body">{children}</p>,
  ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6 text-base leading-relaxed text-body">{children}</ul>,
  ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6 text-base leading-relaxed text-body">{children}</ol>,
  img: ({ src, alt }) => <img src={src} alt={alt} className="my-5 h-auto max-w-full" />,
  table: ({ children }) => (
    <div className="mb-5 overflow-x-auto">
      <table className="text-base text-body">{children}</table>
    </div>
  ),
  a: ({ href, children }) => {
    const external = /^https?:/.test(href ?? "") || href?.startsWith("/uploads/");
    return (
      <a
        href={resolveHref(href)}
        className="underline underline-offset-4 hover:text-accent-hover"
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
};

const Markdown = ({ children }: { children: string }) => (
  <div className="max-w-3xl break-words">
    <ReactMarkdown components={components}>{children}</ReactMarkdown>
  </div>
);

export default Markdown;
