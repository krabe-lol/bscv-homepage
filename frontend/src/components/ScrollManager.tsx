import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollManager = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const scroll = () => document.getElementById(hash.slice(1))?.scrollIntoView();
    const frame = requestAnimationFrame(scroll);

    // Inhalte darüber laden nach und verschieben das Ziel: kurz nachjustieren, bis der Nutzer selbst scrollt
    const observer = new ResizeObserver(scroll);
    observer.observe(document.body);
    const stop = () => observer.disconnect();
    const timeout = setTimeout(stop, 2000);
    const events = ["wheel", "touchstart", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, stop, { once: true }));

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      stop();
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [pathname, hash]);

  return null;
};

export default ScrollManager;
