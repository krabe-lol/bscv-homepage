export interface StrapiMediaFormat {
  url: string;
  width: number;
}

export interface StrapiMedia {
  url: string;
  alternativeText: string | null;
  width?: number | null;
  formats?: Record<string, StrapiMediaFormat> | null;
}

export interface Address {
  street?: string | null;
  city?: string | null;
}

export interface Anschrift {
  name?: string | null;
  address?: Address | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
}

export interface Verein {
  id: number;
  documentId: string;
  name: string;
  logo?: StrapiMedia | null;
  image?: StrapiMedia | null;
  about?: string | null;
  website?: string | null;
  founded?: string | null;
  sortName?: string | null;
  president?: Anschrift | null;
  vehicleGraphic?: StrapiMedia | null;
  colors?: { id: number; name?: string | null; hex: string }[] | null;
  location?: string | null;
  mailing?: Anschrift | null;
}

export interface HomeContent {
  title: string;
  content: string;
  image?: StrapiMedia[] | null;
}

export interface DerBscv {
  title?: string | null;
  intro?: string | null;
  fascinationTitle?: string | null;
  fascination?: string | null;
  classesTitle?: string | null;
  classGroups?: { id: number; title?: string | null; classes?: string | null }[] | null;
}

export interface Rennstrecke {
  documentId: string;
  name: string;
  address?: Address | null;
  latitude?: number | null;
  longitude?: number | null;
  photo?: StrapiMedia | null;
  lengthMeters?: number | null;
  description?: string | null;
}

export interface Race {
  documentId: string;
  title: string;
  date: string;
  track?: Pick<Rennstrecke, "documentId" | "name" | "photo"> | null;
  organiser?: Pick<Verein, "documentId" | "name"> | null;
  albums?: Pick<Album, "documentId" | "title" | "url">[] | null;
}

export interface Punktewertung {
  documentId: string;
  title: string;
  sorting?: number | null;
  updatedAt: string;
  pdf?: StrapiMedia | null;
}

export interface Vorstand {
  documentId: string;
  role: string;
  position?: number | null;
  contact?: Anschrift | null;
  photo?: StrapiMedia | null;
}

export interface Funktionaer {
  documentId: string;
  name: string;
  club?: string | null;
  photo?: StrapiMedia | null;
}

export interface Funktion {
  documentId: string;
  name: string;
  funktionaries?: Pick<Funktionaer, "documentId">[] | null;
}

export interface Album {
  documentId: string;
  title: string;
  date?: string | null;
  url?: string | null;
  preview?: StrapiMedia | null;
}

export interface Videograf {
  documentId: string;
  name: string;
  photo?: StrapiMedia | null;
  description?: string | null;
  youtube?: string | null;
  instagram?: string | null;
  website?: string | null;
  linktree?: string | null;
}

export interface Seite {
  documentId: string;
  title: string;
  slug: string;
  content?: string | null;
}

export interface Dokument {
  documentId: string;
  group: string;
  label: string;
  file?: StrapiMedia | null;
}

export interface Seitentexte {
  racesIntro?: string | null;
  clubsIntro?: string | null;
  albumsIntro?: string | null;
  standingsIntro?: string | null;
  contactIntro?: string | null;
  notFoundIntro?: string | null;
  licenseTileTitle?: string | null;
  licenseTileText?: string | null;
  licenseTileLink?: string | null;
  officeTileTitle?: string | null;
  officeTileText?: string | null;
  copyright?: string | null;
}

export interface Einstellung {
  founded?: number | null;
  classCount?: number | null;
  mylapsUrl?: string | null;
  officeEmail?: string | null;
  maintenanceMode?: boolean | null;
  maintenanceText?: string | null;
}
