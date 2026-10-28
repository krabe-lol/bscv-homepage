# BSCV-CMS: Inhaltstypen und Felder

Stand: 28.10.2026. Bei Änderungen an den Schemas in `backend/src` mit aktualisieren.

## So liest du die Tabellen

Jeder Inhaltstyp hat zwei Namen: den deutschen im Admin (cms.bscv.de) und den technischen in der Adresse der API. Jedes Feld hat ebenso eine deutsche Beschriftung im Admin und einen englischen Feldnamen im Code.

- **Beschriftung** = was die Redaktion im Admin sieht. Steht dort ein Strich (–), zeigt der Admin noch den englischen Feldnamen.
- **Feldname** = was im Code und in der API steht.
- Einheitlich benannt: `name` für Personen, Orte und Vereine, `title` für Inhalte und Dokumente, `position` für die Reihenfolge.
- Stand: lokaler Entwicklungsstand inkl. der noch nicht deployten Umbenennungen.

## Einzel-Einträge

Einzel-Einträge gibt es genau einmal, sie halten die Texte einer Seite oder eines Bereichs. Die Seiten-Einträge („… (Übersicht)“, Kontakt, 404, Dokumente, Fußzeile) liest die Website erst ab Schritt 2, bis dahin kommen die Texte noch aus Seitentexte.

### 404 - Seite nicht gefunden · `not-found-page`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Einleitung | `intro` | Langtext | Text unter „Seite nicht gefunden“ |

### Der BSCV (Sektion) · `about`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| – | `title` | Text | Überschrift der Sektion auf der Startseite |
| – | `intro` | Langtext | Einleitungstext, Absätze per Leerzeile |
| – | `fascinationTitle` | Text | Zwischenüberschrift über dem Faszinationstext |
| – | `fascination` | Langtext | Text zur Faszination Stock-Car |
| – | `classesTitle` | Text | Überschrift über den Klassen |
| – | `classGroups` | Komponente Klassengruppe (mehrere) | Kacheln mit den Klassen |
| Gründungsjahr | `foundedYear` | Zahl | wird nicht angezeigt |
| – | `classCount` | Zahl | wird nicht angezeigt |

### Dokumente (Sektion) · `section-documents`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Lizenz-Kachel: Titel | `licenseTileTitle` | Text | Überschrift der roten Kachel |
| Lizenz-Kachel: Text | `licenseTileText` | Langtext | Text der Kachel |
| Lizenz-Kachel: Linktext | `licenseTileLinkText` | Text | Text des Links |
| Lizenz-Kachel: Linkziel | `licenseTileLinkUrl` | Text | Ziel des Links, z. B. /kontakt oder https://…; leer = Seite Kontakt |

### Fotos & Videos (Übersicht) · `gallery-page`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Einleitung | `intro` | Langtext | Einleitung oben auf der Seite |

### Fußzeile · `footer`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Copyright | `copyright` | Text | steht hinter © und der Jahreszahl |

### Home · `home`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Titel | `title` | Text | große Überschrift im Startbild |
| Inhalt | `content` | Richtext | Text unter der Überschrift |
| Hintergrundbild | `image` | Medien (mehrere) | 1. Bild: Startbild, 2. Bild: Ersatz, wenn das nächste Rennen keine Strecke hat |

### Kontakt · `contact-page`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Einleitung | `intro` | Langtext | Einleitung oben auf der Seite |
| Kachel Geschäftsstelle: Titel | `officeTileTitle` | Text | Überschrift der roten Kachel |
| Kachel Geschäftsstelle: Text | `officeTileText` | Langtext | Text der Kachel |
| Kachel Geschäftsstelle: E-Mail | `officeEmail` | E-Mail | Mail-Link in der Kachel |

### Punktewertung (Übersicht) · `standings-page`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Einleitung | `intro` | Langtext | Einleitung oben auf der Seite |
| Link Live-Zeiten (MyLaps) | `mylapsUrl` | Text | Link „Live-Zeiten bei MyLaps“ |

### Renntermine & -strecken (Übersicht) · `events-page`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Einleitung | `intro` | Langtext | Einleitung oben auf der Seite |

### Seiteneinstellung · `maintenance`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Wartungsmodus | `enabled` | Ja/Nein | schaltet die ganze Website auf die Wartungsseite |
| Wartungsseite: Titel | `title` | Text | Überschrift, leer = „Gleich wieder da“ |
| Wartungsseite: Text | `text` | Langtext | Text der Wartungsseite |
| Wartungsseite: E-Mail | `email` | E-Mail | Mail-Link der Wartungsseite (ab Schritt 2) |

Dazu noch `founded`, `classCount`, `mylapsUrl` und `officeEmail` ohne Beschriftung, die mit Schritt 2 wegfallen.

### Vereine (Übersicht) · `clubs-page`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Einleitung | `intro` | Langtext | Einleitung oben, `{anzahl}` = Zahl der Vereine |

## Sammlungen

Sammlungen haben beliebig viele Einträge, z. B. einen pro Verein. Der technische Name ist zugleich die API-Adresse (`/api/clubs`).

### Album · `albums`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Titel | `title` | Text | Name des Albums in der Galerie |
| Datum der Veranstaltung | `date` | Datum | Sortierung, neueste zuerst |
| Link zum Album | `galleryUrl` | Text | Link zur externen Fotogalerie |
| Vorschaubild | `preview` | Medien | Bild der Galerie-Kachel |
| Verlinkte Veranstaltung | `event` | Relation → Veranstaltung | Galerie-Link beim Renntermin |

### Dokument · `downloads`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Gruppe | `category` | Text | Überschrift der Kachel |
| Titel | `title` | Text | Linktext des Dokuments |
| – | `file` | Medien | Datei zum Herunterladen |
| – | `position` | Zahl | Reihenfolge |

### Funktion · `official-roles`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Name | `name` | Text | Überschrift der Funktionärsgruppe |
| Listenposition | `position` | Zahl | Reihenfolge der Gruppen |
| Funktionäre | `functionaries` | Relation → Funktionär | Personen in dieser Gruppe |

### Funktionär · `functionaries`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Name | `name` | Text | Name auf der Personenkarte |
| Verein | `clubName` | Text | Verein unter dem Namen |
| Foto | `photo` | Medien | Foto auf der Karte |
| – | `officialRole` | Relation → Funktion | Funktion, zu der die Person gehört |

### Punktewertung · `standings`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Name | `title` | Text | Linktext der Wertung |
| Sortierung | `position` | Zahl | Reihenfolge |
| PDF-Datei | `pdf` | Medien | PDF zum Öffnen |

### Rennstrecke · `tracks`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Ort | `name` | Text | Name der Strecke |
| Adresse | `address` | Komponente Adresse | Adresse und Routenplanung |
| – | `latitude` | Kommazahl | Kartenposition (Breitengrad) |
| – | `longitude` | Kommazahl | Kartenposition (Längengrad) |
| Foto | `photo` | Medien | großes Bild oben auf der Streckenseite |
| Länge [m] | `lengthMeters` | Zahl | Streckenlänge |
| Beschreibung | `description` | Langtext | Text auf der Streckenseite |

### Seite · `pages`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| – | `title` | Text | Überschrift der Textseite |
| – | `slug` | Slug | Adresse der Seite (impressum, datenschutz, kalender-abonnieren) |
| – | `content` | Richtext | Inhalt der Seite |

### Veranstaltung · `events`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| – | `title` | Text | Name des Rennens |
| – | `date` | Datum | Termin, bestimmt das nächste Rennen |
| – | `track` | Relation → Rennstrecke | Strecke des Rennens |
| – | `organizer` | Relation → Verein | ausrichtender Verein |
| – | `albums` | Relation → Album | Galerie-Links bei vergangenen Rennen |

### Verein · `clubs`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Vereinsname | `name` | Text | Name in Liste und auf der Vereinsseite |
| Sortierungsname | `sortName` | Text | Sortierung der Vereinsliste |
| Gründungsjahr | `foundedYear` | Zahl | auf der Vereinsseite |
| Standort | `location` | Text | wird nicht angezeigt |
| Website | `website` | Text | Link zur Vereinswebsite |
| Vereinslogo | `logo` | Medien | Logo in Liste und auf der Vereinsseite |
| Über den Verein | `about` | Richtext | Vorstellungstext |
| Vorstand | `president` | Komponente Anschrift | Kontakt „1. Vorstand“ |
| Versandanschrift | `mailingAddress` | Komponente Anschrift | Kontakt „Versandanschrift“ |
| Fahrzeugfoto | `vehiclePhoto` | Medien | Foto in der Liste und oben auf der Vereinsseite |
| Fahrzeug | `vehicleGraphic` | Medien | Grafik Front/Seite bei den Vereinsfarben |
| – | `colors` | Komponente Farbe (mehrere) | Vereinsfarben als Farbfelder |

### Videograf · `videographers`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Name | `name` | Text | Name auf der Karte |
| Foto | `photo` | Medien | Foto auf der Karte |
| – | `description` | Langtext | Text auf der Karte |
| YouTube-Link | `youtube` | Text | Link zum Kanal |
| Instagram-Link | `instagram` | Text | Link zum Profil |
| Website-Link | `website` | Text | Link zur Website |
| Linktree-Link | `linktree` | Text | Link zu Linktree |
| Position | `position` | Zahl | Reihenfolge |

### Vorstand · `board-members`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| – | `role` | Text | Amt über dem Namen (z. B. Präsident) |
| – | `position` | Zahl | Reihenfolge im Präsidium |
| – | `contact` | Komponente Anschrift | Name und Kontaktdaten |
| – | `photo` | Medien | Foto im Präsidium |

## Komponenten

Komponenten sind Feldgruppen, die in mehreren Typen stecken, z. B. eine Anschrift beim Verein und beim Vorstand.

### Adresse · `address`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Straße, Hausnr. | `street` | Text | Straßenzeile |
| PLZ, Ort | `city` | Text | Ortszeile |

### Anschrift · `contact`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| Vorname Nachname | `name` | Text | Name der Kontaktperson |
| Adresse | `address` | Komponente Adresse | Postanschrift |
| Festnetz | `phone` | Text | „Tel:“ |
| Handy | `mobile` | Text | „Mobil:“ |
| E-Mail-Adresse | `email` | E-Mail | Mail-Link |

### Farbe · `color`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| – | `name` | Text | wird nicht angezeigt |
| – | `hex` | Text | Farbwert des Farbfelds (z. B. #C8102E) |

### Klassengruppe · `class-group`

| Beschriftung | Feldname | Typ | Zweck |
| --- | --- | --- | --- |
| – | `title` | Text | Titel der Klassen-Kachel |
| – | `classes` | Langtext | Klassen, eine pro Zeile |

## Was mit Schritt 2 wegfällt

Sobald die Texte live übertragen sind, stellt die Website um und diese Teile werden entfernt:

| Was | Wohin es gewandert ist |
| --- | --- |
| Seitentexte (ganzer Eintrag) | in die einzelnen Seiten-Einträge, Copyright in Fußzeile |
| Seiteneinstellung: `founded`, `classCount` | Der BSCV (Sektion) |
| Seiteneinstellung: `mylapsUrl` | Punktewertung (Übersicht) |
| Seiteneinstellung: `officeEmail` | Kontakt; Wartungsseite nutzt dann `email` |
| Post (ganzer Typ) | wird nicht genutzt, wird gelöscht |

Danach enthält die Seiteneinstellung nur noch die Wartung.
