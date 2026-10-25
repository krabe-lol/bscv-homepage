import { Navigate, Route, Routes } from "react-router-dom";

import MainNav from "./components/MainNav";
import Footer from "./components/Footer";
import ScrollManager from "./components/ScrollManager";
import Home from "./pages/Home";
import Races from "./pages/Races";
import Clubs from "./pages/Clubs";
import ClubDetails from "./pages/ClubDetails";
import TrackDetails from "./pages/TrackDetails";
import Standings from "./pages/Standings";
import ContentPage from "./pages/ContentPage";
import Contact from "./pages/Contact";
import Albums from "./pages/Albums";
import NotFound from "./pages/NotFound";
import Maintenance from "./pages/Maintenance";
import { usePreview } from "./lib/preview";
import { useApi } from "./lib/useApi";
import type { Einstellung } from "./lib/types";

function App() {
  const settings = useApi<Einstellung>("einstellung");
  const { preview, end } = usePreview();
  const maintenance = settings.data?.maintenanceMode === true;

  if (settings.data && maintenance && !preview) {
    return (
      <>
        <ScrollManager />
        <Maintenance settings={settings.data} />
      </>
    );
  }

  return (
    // Unsichtbar, bis klar ist, ob der Wartungsmodus an ist; die Seiten laden ihre Daten trotzdem schon parallel
    <div className={`min-h-screen overflow-x-hidden bg-ink text-paper ${settings.loaded ? "" : "invisible"}`}>
      {maintenance && (
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
        <Route path="/" element={<Home />} />
        <Route path="/renntermine" element={<Races />} />
        <Route path="/rennstrecken" element={<Navigate to="/renntermine#rennstrecken" replace />} />
        <Route path="/rennstrecken/:documentId" element={<TrackDetails />} />
        <Route path="/vereine" element={<Clubs />} />
        <Route path="/vereine/:documentId" element={<ClubDetails />} />
        <Route path="/punktewertung" element={<Standings />} />
        <Route path="/galerie" element={<Albums />} />
        <Route path="/kontakt" element={<Contact />} />
        <Route path="/kalender" element={<ContentPage slug="kalender-abonnieren" />} />
        <Route path="/impressum" element={<ContentPage slug="impressum" />} />
        <Route path="/datenschutz" element={<ContentPage slug="datenschutz" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
