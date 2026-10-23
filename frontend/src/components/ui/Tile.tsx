import type { ReactNode } from "react";

interface TileProps {
  tone?: "ink" | "panel" | "brand";
  title?: string;
  titleSize?: "lg" | "xl";
  className?: string;
  children?: ReactNode;
}

const TONE = {
  ink: "bg-ink",
  panel: "bg-panel",
  brand: "bg-brand",
};

const Tile = ({ tone = "ink", title, titleSize = "xl", className = "", children }: TileProps) => (
  <div className={`px-5 py-6 sm:px-7 sm:py-8 ${TONE[tone]} ${className}`}>
    {title && <h3 className={`mb-3.5 font-bold ${titleSize === "xl" ? "text-xl" : "text-lg"}`}>{title}</h3>}
    {children}
  </div>
);

export default Tile;
