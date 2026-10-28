import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Kennzahl mit Icon, z. B. Gründungsjahr; Hintergrund per className, je nachdem worauf sie steht
const Stat = ({ icon: Icon, value, label, className = "bg-ink" }: { icon: LucideIcon; value: ReactNode; label: string; className?: string }) => (
  <div className={`flex items-center gap-3 px-5 py-3 ${className}`}>
    <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
    <div>
      <div className="text-lg font-semibold leading-tight">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  </div>
);

export default Stat;
