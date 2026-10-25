import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "./ui/Logo";

// Linkliste einmal definiert, Desktop- und Mobil-Variante mappen darüber
const LINKS = [
  { to: "/", label: "Der BSCV", end: true },
  { to: "/renntermine", label: "Renntermine & -strecken", also: "/rennstrecken" },
  { to: "/vereine", label: "Vereine" },
  { to: "/galerie", label: "Fotos & Videos" },
  { to: "/punktewertung", label: "Punktewertung" },
];

const MENU_ID = "mobile-menu";

const MainNav = () => {
  const { pathname } = useLocation();
  // Menü merkt sich die Route, auf der es geöffnet wurde, und ist nach einem Routenwechsel damit zu
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);

  // Menü schließen mit Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const active = (isActive: boolean, also?: string) => isActive || (also !== undefined && pathname.startsWith(also));

  return (
    <header className="relative z-40 flex items-center justify-between gap-x-8 px-4 py-5 sm:px-8 md:px-12 lg:flex-wrap lg:gap-y-5 lg:px-30 lg:py-12">
      <Link to="/" className="block">
        <Logo size="md" />
      </Link>

      <nav className="hidden flex-wrap gap-7 text-md font-medium lg:flex">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `border-b-2 border-accent pb-1.5 ${active(isActive, l.also) ? "text-accent-hover" : ""}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        aria-controls={MENU_ID}
        className="-mr-2 cursor-pointer p-2 lg:hidden"
      >
        {open ? <X className="h-7 w-7" aria-hidden /> : <Menu className="h-7 w-7" aria-hidden />}
      </button>

      {open && (
        <nav
          id={MENU_ID}
          aria-label="Hauptmenü"
          className="absolute inset-x-0 top-full flex flex-col border-y border-line bg-ink px-4 py-2 sm:px-8 md:px-12 lg:hidden"
        >
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex min-h-12 items-center border-b border-line-soft text-lg font-medium last:border-b-0 ${
                  active(isActive, l.also) ? "text-accent-hover" : ""
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
};

export default MainNav;
