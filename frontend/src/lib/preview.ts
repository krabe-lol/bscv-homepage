import { useState } from "react";

const KEY = "bscv-vorschau";

const store = (on: boolean) => {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // z. B. privater Modus: Vorschau gilt dann nur bis zum Neuladen
  }
};

const initial = () => {
  const param = new URLSearchParams(window.location.search).get("vorschau");
  if (param !== null) {
    store(param !== "aus");
    return param !== "aus";
  }
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

/** Vorschau trotz Wartungsmodus: an mit ?vorschau, aus mit ?vorschau=aus; bleibt im Browser gespeichert. */
export const usePreview = () => {
  const [preview, setPreview] = useState(initial);

  const end = () => {
    store(false);
    setPreview(false);
  };

  return { preview, end };
};
