import Link from "./Link";

interface LinkListProps {
  items: { label: string; to?: string; href?: string }[];
}

const LinkList = ({ items }: LinkListProps) => (
  <div className="flex flex-col gap-2.5">
    {items.map((item) => (
      <Link key={item.label} to={item.to} href={item.href} tone="muted">
        {item.label}
      </Link>
    ))}
  </div>
);

export default LinkList;
