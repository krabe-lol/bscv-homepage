import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface LinkTileProps {
  to?: string;
  href?: string;
  title: string;
  meta?: string;
  icon?: ReactNode;
  badge: string;
}

const LinkTile = ({ to, href, title, meta, icon, badge }: LinkTileProps) => {
  const className = "flex items-center justify-between gap-5 bg-ink px-4 py-5 sm:px-6 sm:py-6 hover:bg-panel";
  const content = (
    <>
    <span className="flex items-center gap-3">
      {icon}
      <span>
        <span className="block break-words text-lg font-semibold">{title}</span>
        {meta && <span className="mt-1.5 block font-mono text-xs text-muted">{meta}</span>}
      </span>
    </span>
    <span className="font-mono text-xs tracking-wider text-accent">{badge}</span>
    </>
  );

  return to || !href ? (
    <Link to={to ?? "/"} className={className}>{content}</Link>
  ) : (
    <a href={href} className={className} target="_blank" rel="noreferrer">{content}</a>
  );
};

export default LinkTile;
