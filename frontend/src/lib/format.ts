export const formatDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });

export const formatDate =(iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatWeekdayShort = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");

export const formatLength = (m: number) => `${m.toLocaleString("de-DE")} m`;
