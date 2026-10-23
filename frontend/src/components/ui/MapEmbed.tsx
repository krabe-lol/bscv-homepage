import { useState } from "react";

interface MapEmbedProps {
  lat: number;
  lng: number;
  title: string;
}

/** Zwei-Klick-Lösung: Erst nach Klick wird OpenStreetMap geladen, die Entscheidung wird nicht gespeichert. */
const MapEmbed = ({ lat, lng, title }: MapEmbedProps) => {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    const bbox = [lng - 0.01, lat - 0.006, lng + 0.01, lat + 0.006].join(",");
    return (
      <iframe
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
        title={title}
        loading="lazy"
        className="h-56 w-full max-w-md border-0"
      />
    );
  }

  return (
    <div className="flex h-56 w-full max-w-md flex-col items-center justify-center gap-4 bg-ink px-4 text-center">
      <p className="max-w-md text-sm text-muted">Beim Laden der Karte werden Daten an OpenStreetMap übertragen.</p>
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className="cursor-pointer text-sm underline underline-offset-4 hover:text-accent-hover"
      >
        Karte laden
      </button>
    </div>
  );
};

export default MapEmbed;
