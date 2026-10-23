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

function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-paper">
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
