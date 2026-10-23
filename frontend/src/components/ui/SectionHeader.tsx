import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  size?: "lg" | "sm";
  action?: ReactNode;
  className?: string;
}

const SectionHeader = ({ title, size = "lg", action, className = "" }: SectionHeaderProps) => (
  <div
    className={`flex flex-wrap items-end justify-between border-b border-line ${
      size === "lg" ? "gap-4 pb-6 md:gap-8" : "gap-6 pb-5"
    } ${className}`}
  >
    <h2
      className={
        size === "lg"
          ? "m-0 break-words hyphens-auto font-display text-3xl md:text-5xl font-bold uppercase leading-none tracking-tight"
          : "text-2xl font-bold"
      }
    >
      {title}
    </h2>
    {action}
  </div>
);

export default SectionHeader;
