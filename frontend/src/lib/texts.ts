import type { Seitentexte } from "./types";
import { useApi } from "./useApi";

/** Seiten-Einleitungen und Kacheltexte aus dem Strapi-Einzeltyp "Seitentexte"; null, bis sie geladen sind. */
export const useSeitentexte = () => useApi<Seitentexte>("seitentext").data;
