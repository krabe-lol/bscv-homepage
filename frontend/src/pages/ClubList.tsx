import React from "react";
import { ClubType } from "./Club";

interface ClubListProps {
  clubs: ClubType[];
  onClubSelect: (clubId: number | string) => void;
}

const ClubList = ({ clubs, onClubSelect }: ClubListProps) => {
  return (
    <section>
      <h2>All Clubs</h2>
      <ul className="club-list">
        {clubs.map((club) => (
          <li key={club.id} className="club-list-item">
            <a
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onClubSelect(club.id);
              }}
            >
              {club.name}
            </a>
            <p>{club.about}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ClubList;
