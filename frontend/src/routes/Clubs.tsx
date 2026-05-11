import axios from "axios";
import React, { useEffect, useState } from "react";

const Clubs = () => {
  const [allClubs, setClubs] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:1337/api/vereins?populate=*")
      .then(res => setClubs(res.data.data));
  }, []);

  return (
    <>
      <h1>Liste aller Vereine</h1>

      {allClubs.map((club) => (
        <div key={club.id}>
          {club.logo?.url && (
            <img
              src={`http://localhost:1337${club.logo.url}`}
              alt={`Logo von ${club.name}`}
              width={100}
            />
          )}
          <a>{club.name}</a>
        </div>
      ))}
    </>
  );
}

export default Clubs;