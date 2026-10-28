import { useEffect, useState } from "react";
import axios from "axios";
import ClubCard from "../components/clubs/ClubCard";
import PageHeader from "../components/ui/PageHeader";
import Section from "../components/ui/Section";
import { API_URL } from "../lib/api";
import { useApi } from "../lib/useApi";
import type { Club, IntroPage } from "../lib/types";

// Nach sortName (sonst Name), deutsche Sortierung statt der Datenbank-Reihenfolge (Groß-/Kleinschreibung, Umlaute)
const bySortName = (a: Club, b: Club) => (a.sortName || a.name).localeCompare(b.sortName || b.name, "de");

const ClubsPage = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const page = useApi<IntroPage>("clubs-page").data;
  // {anzahl} im Strapi-Text wird durch die Zahl der Vereine ersetzt
  const intro = page?.intro?.replace(/\{anzahl\}/g, clubs.length ? String(clubs.length) : "").trim();

  useEffect(() => {
    axios
      .get(`${API_URL}/api/clubs?populate[0]=logo&populate[1]=vehiclePhoto&pagination[pageSize]=100`)
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

export default ClubsPage;
