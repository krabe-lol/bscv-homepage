/* eslint-disable */
// Ergänzt die Rennstrecken um Adresse, Koordinaten, Beschreibung und Foto.
// Quelle für Texte und Fotos: https://cci-irfersdorf.de/rennstrecken/
// Koordinaten: Aldersbach aus Google Maps, die übrigen aus OpenStreetMap.
// Aufruf: node scripts/import-rennstrecken.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const PHOTO_BASE = 'https://cci-irfersdorf.de/wp-content/uploads/2023/09/';

// Schlüssel = Name der Rennstrecke in Strapi
const TRACKS = {
  Irfersdorf: {
    address: { street: 'Irfersdorf', city: '92339 Beilngries' },
    latitude: 48.986733,
    longitude: 11.472137,
    photo: 'Irfersdorf_800x600.jpg',
    description:
      'Der Jura-Ring liegt auf dem vereinseigenen Gelände nahe Irfersdorf bei Beilngries und ist seit 1988 fest angelegt. Das ganze Gelände ist begrünt, von den teils erhöhten Zuschauerplätzen hat man einen sehr guten Blick über die Strecke.',
  },
  Weinmannshof: {
    address: { street: 'Weinmannshof', city: '91166 Georgensgmünd' },
    latitude: 49.237184,
    longitude: 11.028816,
    photo: 'Pyras_800x600.jpg',
    description:
      'Die Pyraser Rennbahn hat einen unterschiedlichen, aber gut befahrbaren Belag: Der Großteil der Strecke ist roter Sandboden, in der Kurve vor Start und Ziel wurde Beton eingebaut.',
  },
  Solla: {
    address: { street: 'Solla / Loh', city: '94169 Thurmansbang' },
    latitude: 48.802841,
    longitude: 13.317091,
    photo: 'Solla_800x600.jpg',
    description:
      'Die Bahn bei Grafenau wurde 1978 angelegt. Der SCC Solla richtet hier jedes Jahr den ersten Lauf der Süd-Gruppe aus. Bekannt ist die Strecke auch durch das jährliche Motorradtreffen „Elefantentreffen“.\nSie liegt im Bayerischen Wald in einem Tal und ist von allen Seiten bestens einzusehen.',
  },
  Aldersbach: {
    address: { street: 'Schwarzholz 2', city: '94501 Aldersbach' },
    latitude: 48.5871684,
    longitude: 13.0525481,
    photo: 'Aldersbach_800x600.jpg',
    description:
      'Für viele Fahrer ist sie die beliebteste Bahn: Die fast kreisrunde Strecke im Besitz des SCC Aldersbach hat einen festgewalzten Kiesbelag und hohe Wälle. Vom Hang über der Bahn haben die Zuschauer die komplette Strecke im Blick.',
  },
  Exing: {
    address: { street: 'Exing', city: '94428 Eichendorf' },
    latitude: 48.64837,
    longitude: 12.771435,
    photo: 'Dingolfing_800x600.jpg',
    description:
      'Die Rennstrecke in Exing liegt in einem ehemaligen Kieswerk. Sie hat einen festen Kiesbelag und hohe Wälle, von denen die Zuschauer eine tolle Sicht auf die Bahn haben.',
  },
  Holzhamm: {
    address: { street: 'Holzhamm 12', city: '84332 Hebertsfelden' },
    latitude: 48.470307,
    longitude: 12.824868,
    photo: 'DevilDrivers_800x600.jpg',
    description:
      'Die Strecke der Devil Drivers ist sehr breit angelegt. Besonders ist der Höhenunterschied mit einer Bergauf- und einer Bergab-Kurve, der regelmäßig für Action und Überschläge sorgt. Durch die leichte Hanglage haben die Zuschauer einen guten Blick.\nAnfahrt über die B20 Richtung Straubing – Eggenfelden, kurz vor Eggenfelden links Richtung Holzhamm.',
  },
};

// Windows: sharp hält Temp-Dateien noch offen (EBUSY), das ist unkritisch
process.on('unhandledRejection', (err) => {
  if (err && err.code === 'EBUSY') return;
  console.error(err);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  if (err && err.code === 'EBUSY') return;
  console.error(err);
  process.exit(1);
});

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  const tracks = app.documents('api::rennstrecke.rennstrecke');
  const uploadService = app.plugin('upload').service('upload');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rennstrecken-'));

  async function uploadPhoto(name) {
    const url = PHOTO_BASE + name;
    const existing = await app.db.query('plugin::upload.file').findOne({ where: { caption: url } });
    if (existing) return existing;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const filepath = path.join(tmpDir, name);
    fs.writeFileSync(filepath, Buffer.from(await res.arrayBuffer()));

    try {
      const [file] = await uploadService.upload({
        data: { fileInfo: { name, caption: url } },
        files: { filepath, originalFilename: name, mimetype: 'image/jpeg', size: fs.statSync(filepath).size },
      });
      return file;
    } catch (err) {
      // Windows: EBUSY beim Aufräumen der Temp-Dateien, Upload ist dann meist trotzdem fertig
      const file = await app.db.query('plugin::upload.file').findOne({ where: { caption: url } });
      if (!file) throw err;
      return file;
    }
  }

  for (const [name, { photo, ...data }] of Object.entries(TRACKS)) {
    const track = await tracks.findFirst({ filters: { name } });
    if (!track) {
      console.log(`Rennstrecke "${name}" nicht gefunden, übersprungen`);
      continue;
    }
    const file = await uploadPhoto(photo);
    await tracks.update({ documentId: track.documentId, data: { ...data, photo: file.id }, status: 'published' });
    console.log(`Rennstrecke "${name}" aktualisiert`);
  }

  await app.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
