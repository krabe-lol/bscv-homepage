import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const ClubDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    axios
      .get(`http://localhost:1337/api/vereins/${id}?populate=*`)
      .then(res => setClub(res.data.data));
  }, [id]);

  if (!club) return <div>Lädt...</div>;

  return (
    <>
      {club.image?.url && (
        <img
          src={`http://localhost:1337${club.image.url}`}
          alt={`Foto von ${club.name}`}
          width={100}
        />
      )}

      <h1>{club.name}</h1>

      {club.logo?.url && (
        <img
          src={`http://localhost:1337${club.logo.url}`}
          alt={`Logo von ${club.name}`}
          width={100}
        />
      )}
    </>
  );
};

export default ClubDetails;