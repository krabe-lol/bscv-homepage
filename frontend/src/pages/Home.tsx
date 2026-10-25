import axios from "axios";
import { useEffect, useState } from "react";
import Hero from "../components/home/Hero";
import AboutBscv from "../components/home/AboutBscv";
import Gallery from "../components/home/Gallery";
import Presidium from "../components/home/Presidium";
import Funktionaere from "../components/home/Funktionaere";
import Dokumente from "../components/home/Dokumente";
import { API_URL } from "../lib/api";
import type { HomeContent, Verein } from "../lib/types";

const Home = () => {
  const [home, setHome] = useState<HomeContent | null>(null);
  const [clubs, setClubs] = useState<Verein[]>([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/home?populate=*`)
      .then((res) => setHome(res.data.data))
      .catch(() => setHome(null));

    axios
      .get(`${API_URL}/api/vereins?fields[0]=name&sort=name&pagination[pageSize]=100`)
      .then((res) => setClubs(res.data.data))
      .catch(() => setClubs([]));
  }, []);

  return (
    <>
      <Hero home={home} clubCount={clubs.length} />
      <AboutBscv />
      <Gallery />
      <Presidium />
      <Funktionaere />
      <Dokumente />
    </>
  );
};

export default Home;
