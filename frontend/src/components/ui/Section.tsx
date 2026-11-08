import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  spacing?: "section" | "page" | "none";
  gutter?: "content" | "nav";
  className?: string;
  children: ReactNode;
}

/** Seitlicher Abstand der Inhaltsbereiche (auch in den Detail-Hero-Headern verwendet),
 *  120px auf Laptops, der breitere Rand erst ab 1920px */
export const GUTTER = "px-4 sm:px-8 md:px-12 lg:px-30 min-[120rem]:px-60";

/** "nav": gleiche Seitenränder wie das Hauptmenü (MainNav), ohne den breiteren Rand ab 1920px */
const GUTTERS = {
  content: GUTTER,
  nav: "px-4 sm:px-8 md:px-12 lg:px-30",
};

const SPACING = {
  section: "pt-16 md:pt-32",
  page: "pt-10 md:pt-16",
  none: "",
};

const Section = ({ id, spacing = "section", gutter = "content", className = "", children }: SectionProps) => (
  <section id={id} className={`${GUTTERS[gutter]} ${SPACING[spacing]} ${className}`}>
    {children}
  </section>
);

export default Section;
