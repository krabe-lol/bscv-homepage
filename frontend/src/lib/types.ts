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

export interface Contact {
  name?: string | null;
  address?: Address | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
}

export interface Club {
  id: number;
  documentId: string;
  name: string;
  logo?: StrapiMedia | null;
  vehiclePhoto?: StrapiMedia | null;
  about?: string | null;
  website?: string | null;
  foundedYear?: number | null;
  sortName?: string | null;
  president?: Contact | null;
  vehicleGraphic?: StrapiMedia | null;
  colors?: { id: number; name?: string | null; hex: string }[] | null;
  location?: string | null;
  mailingAddress?: Contact | null;
}

export interface Home {
  title: string;
  content: string;
  image?: StrapiMedia[] | null;
}

export interface About {
  title?: string | null;
  intro?: string | null;
  fascinationTitle?: string | null;
  fascination?: string | null;
  classesTitle?: string | null;
  classGroups?: { id: number; title?: string | null; classes?: string | null }[] | null;
}

export interface Track {
  documentId: string;
  name: string;
  address?: Address | null;
  latitude?: number | null;
  longitude?: number | null;
  photo?: StrapiMedia | null;
  lengthMeters?: number | null;
  description?: string | null;
}

export interface Event {
  documentId: string;
  title: string;
  date: string;
  track?: Pick<Track, "documentId" | "name" | "photo"> | null;
  organizer?: Pick<Club, "documentId" | "name"> | null;
  albums?: Pick<Album, "documentId" | "title" | "galleryUrl">[] | null;
}

export interface Standing {
  documentId: string;
  title: string;
  position?: number | null;
  updatedAt: string;
  pdf?: StrapiMedia | null;
}

export interface BoardMember {
  documentId: string;
  role: string;
  position?: number | null;
  contact?: Contact | null;
  photo?: StrapiMedia | null;
}

export interface Functionary {
  documentId: string;
  name: string;
  clubName?: string | null;
  photo?: StrapiMedia | null;
}

export interface OfficialRole {
  documentId: string;
  name: string;
  functionaries?: Pick<Functionary, "documentId">[] | null;
}

export interface Album {
  documentId: string;
  title: string;
  date?: string | null;
  galleryUrl?: string | null;
  preview?: StrapiMedia | null;
}

export interface Videographer {
  documentId: string;
  name: string;
  photo?: StrapiMedia | null;
  description?: string | null;
  youtube?: string | null;
  instagram?: string | null;
  website?: string | null;
  linktree?: string | null;
}

export interface Page {
  documentId: string;
  title: string;
  slug: string;
  content?: string | null;
}

export interface Download {
  documentId: string;
  category: string;
  title: string;
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

export interface Maintenance {
  founded?: number | null;
  classCount?: number | null;
  mylapsUrl?: string | null;
  officeEmail?: string | null;
  enabled?: boolean | null;
  title?: string | null;
  text?: string | null;
}
