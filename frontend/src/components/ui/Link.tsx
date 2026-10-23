import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

interface LinkProps {
  to?: string;
  href?: string;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  tone?: "default" | "muted";
  size?: "sm" | "inherit";
  external?: boolean;
  className?: string;
  children: ReactNode;
}

const Link = ({
  to,
  href,
  iconLeft: IconLeft,
  iconRight: IconRight,
  tone = "default",
  size = "sm",
  external = false,
  className = "",
  children,
}: LinkProps) => {
  const hasIcon = IconLeft || IconRight;
  const classes = `underline underline-offset-4 ${hasIcon ? "inline-flex items-center gap-1.5" : ""} ${
    size === "sm" ? "text-sm" : ""
  } ${tone === "muted" ? "text-muted" : ""} ${className}`;
  const content = (
    <>
      {IconLeft && <IconLeft className="h-[1em] w-[1em] shrink-0" aria-hidden />}
      {children}
      {IconRight && <IconRight className="h-[1em] w-[1em] shrink-0" aria-hidden />}
    </>
  );

  if (to) {
    return (
      <RouterLink to={to} className={classes}>
        {content}
      </RouterLink>
    );
  }

  return (
    <a href={href} className={classes} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
      {content}
    </a>
  );
};

export default Link;
