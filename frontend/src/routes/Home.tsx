import axios from "axios";
import React, { useEffect, useState } from "react";

const Home = () => {
  const [home, setHome] = useState<any>(null);

  useEffect(() => {
    axios.get("http://localhost:1337/api/home").then((res) => setHome(res.data.data));
  }, []);

  return (
    <>
      <section>
        <h1>{home?.title}</h1>
        <p>{home?.content}</p>
      </section>
    </>
  );
}

export default Home;