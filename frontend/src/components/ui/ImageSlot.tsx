interface ImageSlotProps {
  src?: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  placeholder: string;
  fit?: "cover" | "contain";
  /** Ohne Bild: Platzhaltertext oder Personen-Silhouette */
  fallback?: "text" | "person";
  className?: string;
}

const ImageSlot = ({ src, srcSet, sizes, alt, placeholder, fit = "cover", fallback = "text", className = "" }: ImageSlotProps) => {
  if (src) {
    return (
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
      />
    );
  }

  if (fallback === "person") {
    return (
      <div role="img" aria-label={alt} className={`flex h-full w-full items-center justify-center bg-ink ${className}`}>
        <svg viewBox="0 0 100 100" className="h-4/5 w-4/5" aria-hidden>
          <circle cx="50" cy="50" r="48" className="fill-panel" />
          <ellipse cx="50" cy="39" rx="13" ry="15" className="fill-dim/45" />
          <path d="M20.7 88 C22 72 34 62 50 62 C66 62 78 72 79.3 88 A48 48 0 0 1 20.7 88 Z" className="fill-dim/45" />
        </svg>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex h-full w-full items-center justify-center bg-panel p-3 text-center font-mono text-xs uppercase tracking-wider text-dim ${className}`}
    >
      {placeholder}
    </div>
  );
};

export default ImageSlot;
