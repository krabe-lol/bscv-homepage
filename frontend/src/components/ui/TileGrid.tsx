import type { ReactNode } from "react";

type Cols = "fit-240" | "fit-260" | "fit-280" | "fit-300" | "fill-280" | "fill-300" | "2" | "3";

interface TileGridProps {
  cols: Cols;
  bordered?: boolean;
  soft?: boolean;
  className?: string;
  children: ReactNode;
}

const COLS: Record<Cols, string> = {
  "fit-240": "grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))]",
  "fit-260": "grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))]",
  "fit-280": "grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))]",
  "fit-300": "grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]",
  "fill-280": "grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))]",
  "fill-300": "grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))]",
  "2": "grid-cols-2 max-sm:grid-cols-1",
  "3": "grid-cols-3 max-sm:grid-cols-1",
};

const TileGrid = ({ cols, bordered = false, soft = false, className = "", children }: TileGridProps) => (
  <div
    className={`grid gap-px ${COLS[cols]} ${soft ? "bg-line-soft" : "bg-line"} ${
      bordered ? "border border-line" : ""
    } ${className}`}
  >
    {children}
  </div>
);

export default TileGrid;
