import type { Event } from "./types";

const ALL = "pagination[pageSize]=200&sort=date:desc&populate[organizer][fields][0]=name&populate[track][fields][0]=name&populate[track][populate][photo][fields][0]=url&populate[albums][fields][0]=title&populate[albums][fields][1]=galleryUrl";
export const EVENTS_PATH = `events?${ALL}`;

export const eventTitle = (event: Event) => event.title.replace(" - ", " – ");
const eventYear =(event: Event) => Number(event.date.slice(0, 4));

/** Rennen nach Jahr gruppiert, neueste Saison zuerst. */
export const groupBySeason = (events: Event[]) => {
  const years = [...new Set(events.map(eventYear))].sort((a, b) => b - a);
  return years.map((year) => ({ year, events: events.filter((r) => eventYear(r) === year) }));
};

export const getNextEvent = (events: Event[], today = new Date()) => {
  const t = today.toISOString().slice(0, 10);
  return events.filter((r) => r.date >= t).sort((a, b) => a.date.localeCompare(b.date))[0];
};
