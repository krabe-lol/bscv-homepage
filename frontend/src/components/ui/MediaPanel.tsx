import type { ReactNode } from "react";
import ImageSlot from "./ImageSlot";

interface MediaPanelProps {
  src?: string;
  alt: string;
  placeholder: string;
  overlay?: "ink-gradient" | "navy";
  className?: string;
  children?: ReactNode;
}

const OVERLAY = {
  "ink-gradient": "bg-linear-to-r from-overlay-ink-strong to-overlay-ink",
  navy: "bg-overlay-navy",
};

const MediaPanel = ({ src, alt, placeholder, overlay, className = "", children }: MediaPanelProps) => (
  <div className={`relative ${className}`}>
    <ImageSlot src={src} alt={alt} placeholder={placeholder} className="absolute inset-0" />
    {overlay && <div className={`pointer-events-none absolute inset-0 ${OVERLAY[overlay]}`} />}
    {children}
  </div>
);

export default MediaPanel;
