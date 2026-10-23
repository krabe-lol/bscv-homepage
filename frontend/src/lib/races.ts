import type { Race } from "./types";

const ALL = "pagination[pageSize]=200&sort=date:desc&populate[organiser][fields][0]=name&populate[track][fields][0]=name&populate[track][populate][photo][fields][0]=url&populate[albums][fields][0]=title&populate[albums][fields][1]=url";
export const RACES_PATH = `veranstaltungen?${ALL}`;

export const raceTitle = (race: Race) => race.title.replace(" - ", " – ");
export const isFinal = (race: Race) => /endlauf/i.test(race.title);
export const raceYear = (race: Race) => Number(race.date.slice(0, 4));

/** Rennen nach Jahr gruppiert, neueste Saison zuerst. */
export const groupBySeason = (races: Race[]) => {
  const years = [...new Set(races.map(raceYear))].sort((a, b) => b - a);
  return years.map((year) => ({ year, races: races.filter((r) => raceYear(r) === year) }));
};

export const getNextRace = (races: Race[], today = new Date()) => {
  const t = today.toISOString().slice(0, 10);
  return races.filter((r) => r.date >= t).sort((a, b) => a.date.localeCompare(b.date))[0];
};
