import type { StrapiMedia } from "./types";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4081";

export const mediaUrl = (path?: string | null) => (path ? `${API_URL}${path}` : undefined);

/** srcset aus Original und den von Strapi erzeugten Formaten, damit der Browser nicht stark herunterskalieren muss. */
export const mediaSrcSet = (media?: StrapiMedia | null) => {
  if (!media) return undefined;
  const variants = [...Object.values(media.formats ?? {}), ...(media.width ? [{ url: media.url, width: media.width }] : [])];
  return variants.length ? variants.map((v) => `${API_URL}${v.url} ${v.width}w`).join(", ") : undefined;
};
