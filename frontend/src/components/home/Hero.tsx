import { ChevronsRight } from "lucide-react";
import MediaPanel from "../ui/MediaPanel";
import Section from "../ui/Section";
import { formatDateLong } from "../../lib/format";
import { RACES_PATH, getNextRace } from "../../lib/races";
import { useApi } from "../../lib/useApi";
import { mediaUrl } from "../../lib/api";
import type { HomeContent, Race } from "../../lib/types";
import Link from "../ui/Link";

const Hero = ({ home, clubCount }: { home: HomeContent | null; clubCount: number }) => {
  const races = useApi<Race[]>(RACES_PATH).data ?? [];
  const nextRace = getNextRace(races);
  const lastYear = races[0] ? new Date(races[0].date).getFullYear() : null;
  const [titleFirst, ...titleWords] = (home?.title ?? "").split(" ");
  const titleRest = titleWords.join(" ");

  return (
    <Section spacing="none" gutter="nav" className="flex flex-wrap items-stretch">
      <MediaPanel
        src={mediaUrl(home?.image?.[0]?.url)}
        alt="Stock-Car-Rennen"
        placeholder="Rennfoto – Stock-Car im Dreck"
        overlay="ink-gradient"
        className="@container flex min-h-112 min-w-0 grow-1000 basis-95 flex-col justify-end sm:min-h-105"
      >
        <div className="pointer-events-none relative px-5 pb-6 pt-24 sm:px-10 sm:pb-10 lg:pt-10">
          <h1 className="mb-6 max-w-5xl text-balance break-words hyphens-auto font-display text-4xl sm:text-6xl md:text-8xl lg:text-[length:min(6rem,calc((100cqi-5rem)/6.4))] font-bold uppercase leading-none tracking-tight">
            {titleFirst}
            <br />
            {titleRest}
          </h1>
          <p className="max-w-xl whitespace-pre-line text-base leading-relaxed text-hero-text">{home?.content}</p>
        </div>
      </MediaPanel>

      <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:w-[calc((100svh-280px)/2)] lg:grid-cols-[minmax(0,1fr)] lg:grid-rows-[repeat(2,minmax(min-content,1fr))]">
        <div className="flex flex-col justify-end bg-brand px-5 py-7 lg:aspect-square lg:justify-self-stretch lg:self-stretch lg:px-8 lg:py-9">
          <div className="mb-7 text-3xl font-semibold lg:text-4xl leading-none">
            {clubCount || ""}
            <br />
            Vereine
          </div>
          <Link iconRight={ChevronsRight} to="/vereine">alle Vereine ansehen</Link>
        </div>

        <MediaPanel
          src={mediaUrl(nextRace?.track?.photo?.url ?? home?.image?.[1]?.url)}
          alt={nextRace?.track?.photo?.url ? `Rennstrecke ${nextRace.track.name}` : "Luftbild Rennstrecke"}
          placeholder="Luftbild Rennstrecke"
          overlay="navy"
          className="flex flex-col justify-end gap-2.5 px-5 py-7 lg:aspect-square lg:justify-self-stretch lg:self-stretch lg:px-8 lg:py-9"
        >
          <div className="pointer-events-none relative">
            <div className="mb-3.5 text-sm text-hero-label">Nächste Veranstaltung</div>
            {nextRace ? (
              <>
                <div className="text-3xl font-semibold leading-none lg:text-4xl">{formatDateLong(nextRace.date)}</div>
                {nextRace.track?.name && <div className="mt-5 text-2xl">in {nextRace.track.name}</div>}
              </>
            ) : (
              <div className="text-3xl font-semibold leading-none">
                {lastYear ? `Saison ${lastYear} beendet` : "Keine Termine"}
              </div>
            )}
          </div>
          <Link iconRight={ChevronsRight} to="/renntermine" className="relative">
            {nextRace ? "mehr Infos" : "alle Renntermine"}
          </Link>
        </MediaPanel>
      </div>
    </Section>
  );
};

export default Hero;
