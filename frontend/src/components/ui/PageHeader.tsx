interface PageHeaderProps {
  title: string;
  intro?: string;
}

const PageHeader = ({ title, intro }: PageHeaderProps) => (
  <>
    <h1 className="mb-5 break-words hyphens-auto font-display text-4xl md:text-6xl font-bold uppercase leading-none tracking-tight">
      {title}
    </h1>
    {intro && <p className="max-w-2xl text-lg leading-relaxed text-body">{intro}</p>}
  </>
);

export default PageHeader;
