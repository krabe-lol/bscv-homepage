import type { ReactNode } from "react";

interface SectionProps {
  id?: string;
  spacing?: "section" | "page" | "none";
  className?: string;
  children: ReactNode;
}

/** Seitlicher Abstand der Inhaltsbereiche (auch in den Detail-Hero-Headern verwendet) */
export const GUTTER = "px-4 sm:px-8 md:px-12 lg:px-30 xl:px-60";

const SPACING = {
  section: "pt-16 md:pt-32",
  page: "pt-10 md:pt-16",
  none: "",
};

const Section = ({ id, spacing = "section", className = "", children }: SectionProps) => (
  <section id={id} className={`${GUTTER} ${SPACING[spacing]} ${className}`}>
    {children}
  </section>
);

export default Section;
