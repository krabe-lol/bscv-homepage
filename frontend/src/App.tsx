import { Navigate, Route, Routes } from "react-router-dom";

import MainNav from "./components/MainNav";
import Footer from "./components/Footer";
import ScrollManager from "./components/ScrollManager";
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import ClubsPage from "./pages/ClubsPage";
import ClubPage from "./pages/ClubPage";
import TrackPage from "./pages/TrackPage";
import StandingsPage from "./pages/StandingsPage";
import ContentPage from "./pages/ContentPage";
import ContactPage from "./pages/ContactPage";
import GalleryPage from "./pages/GalleryPage";
import NotFoundPage from "./pages/NotFoundPage";
import MaintenancePage from "./pages/MaintenancePage";
import { usePreview } from "./lib/preview";
import { useApi } from "./lib/useApi";
import type { Maintenance } from "./lib/types";

function App() {
  const maintenance = useApi<Maintenance>("maintenance");
  const { preview, end } = usePreview();
  const maintenanceOn = maintenance.data?.enabled === true;

  if (maintenance.data && maintenanceOn && !preview) {
    return (
      <>
        <ScrollManager />
        <MaintenancePage maintenance={maintenance.data} />
      </>
    );
  }

  return (
    // Unsichtbar, bis klar ist, ob der Wartungsmodus an ist; die Seiten laden ihre Daten trotzdem schon parallel
    <div className={`min-h-screen overflow-x-hidden bg-ink text-paper ${maintenance.loaded ? "" : "invisible"}`}>
      {maintenanceOn && (
        <div className="bg-brand px-4 py-2.5 text-center text-sm text-on-brand">
          Wartungsmodus ist an, Besucher sehen nur die Wartungsseite.{" "}
          <button type="button" onClick={end} className="cursor-pointer underline underline-offset-4">
            Vorschau beenden
          </button>
        </div>
      )}
      <ScrollManager />
      <MainNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/renntermine" element={<EventsPage />} />
        <Route path="/rennstrecken" element={<Navigate to="/renntermine#rennstrecken" replace />} />
        <Route path="/rennstrecken/:documentId" element={<TrackPage />} />
        <Route path="/vereine" element={<ClubsPage />} />
        <Route path="/vereine/:documentId" element={<ClubPage />} />
        <Route path="/punktewertung" element={<StandingsPage />} />
        <Route path="/galerie" element={<GalleryPage />} />
        <Route path="/kontakt" element={<ContactPage />} />
        <Route path="/kalender" element={<ContentPage slug="kalender-abonnieren" />} />
        <Route path="/impressum" element={<ContentPage slug="impressum" />} />
        <Route path="/datenschutz" element={<ContentPage slug="datenschutz" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
