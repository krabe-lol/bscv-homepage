import { useEffect, useState } from "react";
import axios from "axios";
import ClubCard from "../components/clubs/ClubCard";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import { API_URL } from "../lib/api";
import { useSeitentexte } from "../lib/texts";
import type { Verein } from "../lib/types";

// Nach sortName (sonst Name), deutsche Sortierung statt der Datenbank-Reihenfolge (Groß-/Kleinschreibung, Umlaute)
const bySortName = (a: Verein, b: Verein) => (a.sortName || a.name).localeCompare(b.sortName || b.name, "de");

const Clubs = () => {
  const [clubs, setClubs] = useState<Verein[]>([]);
  const texts = useSeitentexte();
  // {anzahl} im Strapi-Text wird durch die Zahl der Vereine ersetzt
  const intro = texts?.clubsIntro?.replace(/\{anzahl\}/g, clubs.length ? String(clubs.length) : "").trim();

  useEffect(() => {
    axios
      .get(`${API_URL}/api/vereins?populate[0]=logo&populate[1]=image&pagination[pageSize]=100`)
      .then((res) => setClubs(res.data.data.sort(bySortName)))
      .catch(() => setClubs([]));
  }, []);

  return (
    <Section spacing="page">
      <PageHeader
        title="Vereine"
        intro={intro}
      />
      <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-6 sm:mt-12 sm:gap-8">
        {clubs.map((club) => (
          <ClubCard key={club.documentId} club={club} />
        ))}
      </div>
    </Section>
  );
};

export default Clubs;
