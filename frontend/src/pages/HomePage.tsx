import axios from "axios";
import { useEffect, useState } from "react";
import Hero from "../components/home/Hero";
import About from "../components/home/About";
import Gallery from "../components/home/Gallery";
import BoardMembers from "../components/home/BoardMembers";
import Functionaries from "../components/home/Functionaries";
import Documents from "../components/home/Documents";
import { API_URL } from "../lib/api";
import type { Home, Club } from "../lib/types";

const HomePage = () => {
  const [home, setHome] = useState<Home | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/home?populate=*`)
      .then((res) => setHome(res.data.data))
      .catch(() => setHome(null));

    axios
      .get(`${API_URL}/api/clubs?fields[0]=name&sort=name&pagination[pageSize]=100`)
      .then((res) => setClubs(res.data.data))
      .catch(() => setClubs([]));
  }, []);

  return (
    <>
      <Hero home={home} clubCount={clubs.length} />
      <About />
      <Gallery />
      <BoardMembers />
      <Functionaries />
      <Documents />
    </>
  );
};

export default HomePage;
