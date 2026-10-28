import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  size?: "lg" | "sm";
  /** Überschriftenebene, z. B. h3 für Untergruppen in einem eingeklappten Bereich */
  as?: "h2" | "h3";
  action?: ReactNode;
  className?: string;
}

const SectionHeader = ({ title, size = "lg", as: Heading = "h2", action, className = "" }: SectionHeaderProps) => (
  <div
    className={`flex flex-wrap items-end justify-between border-b border-line ${
      size === "lg" ? "gap-4 pb-6 md:gap-8" : "gap-6 pb-5"
    } ${className}`}
  >
    <Heading
      className={
        size === "lg"
          ? "m-0 break-words hyphens-auto font-display text-3xl md:text-5xl font-bold uppercase leading-none tracking-tight"
          : "text-2xl font-bold"
      }
    >
      {title}
    </Heading>
    {action}
  </div>
);

export default SectionHeader;
