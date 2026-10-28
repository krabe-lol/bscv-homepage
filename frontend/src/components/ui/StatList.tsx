import {
  Award,
  CalendarDays,
  Camera,
  Car,
  Clock,
  Cog,
  Crown,
  Euro,
  Flag,
  FlagTriangleRight,
  Flame,
  Fuel,
  Gauge,
  GraduationCap,
  Handshake,
  Hash,
  Heart,
  House,
  Info,
  Layers,
  Map,
  MapPin,
  Medal,
  Megaphone,
  Percent,
  RotateCw,
  Route,
  Ruler,
  Star,
  Target,
  Tent,
  ThumbsUp,
  Ticket,
  Timer,
  Trophy,
  Truck,
  User,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Stat from "./Stat";
import type { StatEntry } from "../../lib/types";

// Werte der Auswahl "icon" in Strapi (Kennzahl) auf Icons abbilden; unbekannt = Stern
const ICONS: Record<string, LucideIcon> = {
  Ausbildung: GraduationCap,
  Auszeichnung: Award,
  Auto: Car,
  Blitz: Zap,
  Daumen: ThumbsUp,
  Euro: Euro,
  Flagge: Flag,
  Flamme: Flame,
  Foto: Camera,
  Handschlag: Handshake,
  Haus: House,
  Herz: Heart,
  Info: Info,
  Kalender: CalendarDays,
  Karte: Map,
  Klassen: Layers,
  Krone: Crown,
  Lineal: Ruler,
  LKW: Truck,
  Medaille: Medal,
  Megafon: Megaphone,
  Nummer: Hash,
  Ort: MapPin,
  Person: User,
  Personen: Users,
  Pokal: Trophy,
  Prozent: Percent,
  Runden: RotateCw,
  Stern: Star,
  Stoppuhr: Timer,
  Strecke: Route,
  Tacho: Gauge,
  Ticket: Ticket,
  Treibstoff: Fuel,
  Uhr: Clock,
  Werkzeug: Wrench,
  Wimpel: FlagTriangleRight,
  Zahnrad: Cog,
  Zelt: Tent,
  Ziel: Target,
};

// Kennzahlen ohne Wert werden nicht angezeigt
const visible = (stats?: StatEntry[] | null) => (stats ?? []).filter((s) => s.value?.trim());

// Kennzahlen als Reihe; className = Hintergrund der einzelnen Kennzahl, wrapperClassName = z. B. Abstand
const StatList = ({ stats, className, wrapperClassName = "" }: { stats?: StatEntry[] | null; className?: string; wrapperClassName?: string }) => {
  const items = visible(stats);
  if (items.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-3 ${wrapperClassName}`}>
      {items.map((s) => (
        <Stat key={s.id} icon={ICONS[s.icon ?? ""] ?? Star} value={s.value} label={s.label} className={className} />
      ))}
    </div>
  );
};

export default StatList;
