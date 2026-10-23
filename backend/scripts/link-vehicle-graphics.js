/* eslint-disable */
// Verknüpft die Fahrzeuggrafiken aus der Mediathek (Ordner "fahrzeuge", /1) mit den Vereinen.
// Aufruf (Strapi-Server vorher stoppen): node scripts/link-vehicle-graphics.js [--force]
// Bereits gesetzte Grafiken werden nie überschrieben, außer mit --force.
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const FOLDER_PATH = '/1';

// Dateiname -> exakter Vereinsname
const MAPPING = {
  'CC Irfersdorf.webp': 'CC Irfersdorf',
  'CT Gaimersheim.webp': 'CT Gaimersheim',
  'CTS Mindelstetten.webp': 'CTS Mindelstetten / Hüttenhausen',
  'El Toreros.webp': 'El Toreros',
  'Lancer Motorsport.webp': 'Lancer Motorsport',
  'Löwen Team Passau.webp': 'Löwen Team Passau',
  'MS Jura Team Berching.webp': 'MS Jura Team',
  'MSC Black Mambas.webp': 'MSC Black Mambas',
  'MSC Ergolding.webp': 'MSC Ergolding',
  'MSC Fire Fox.webp': 'MSC Fire Fox',
  'MSC Ilmmünster.webp': 'MSC Ilmmünster',
  'MSC Maddogs.webp': 'MSC Maddogs',
  'MSC Outsiders.webp': 'MSC Outsiders Kuglstadt',
  'MSC Pit-Bullz.webp': 'MSC Pit-Bullz Künzing',
  'MSC Running Tigers.webp': 'MSC Running Tigers',
  'MSF Pauluszell.webp': 'MSF Pauluszell',
  'MSF Siegenburg.webp': 'MSF Siegenburg',
  'MST Gaimersheim.webp': 'MST Gaimersheim',
  'Pyraser SCT.webp': 'Pyraser SCT',
  'RG Altmühltal.webp': 'RG Altmühltal',
  'Red Stars Landshut.webp': 'Red Stars',
  'SCC Aldersbach.webp': 'SCC Aldersbach',
  'SCC Devil Drivers.webp': 'SCC Devil Drivers',
  'SCC Die Charlys.webp': 'SCC Die Charlys',
  'SCC Dingolfing.webp': 'SCC Dingolfing-Landau',
  'SCC Donau Racer.webp': 'SCC Donau Racer',
  'SCC Gergweis.webp': 'SCC Gergweis',
  'SCC Grünthal.webp': 'SCC Grünthal',
  'SCC Landshut.webp': 'SCC Landshut',
  'SCC Osterhofen.webp': 'SCC Osterhofen',
  'SCC Perusa.webp': 'SCC Perusa',
  'SCC Schwanstetten.webp': 'SCC Schwanstetten',
  'SCC Selzer Team.webp': 'Selzer Team',
  'SCC Solla.webp': 'SCC Solla',
  'SCF The Cats.webp': 'SCF The Cats',
  'SCT Banderra.webp': 'SCT Banderra',
  'SCT Bavarias.webp': 'SCT Bavarias Unterneukirchen',
  'SCT Geisenfeld.webp': 'SCT Geisenfeld',
  'SCT Moskitos.webp': 'SCT Moskitos',
  'SCT Thagls.webp': 'SCT Thagls',
  'SCT Vilstal.webp': 'SCT Vilstal',
  'SCT Zuchering.webp': 'SCT Zuchering',
  'SLR Ingolstadt.webp': 'SLR Ingolstadt',
};

async function main() {
  const force = process.argv.includes('--force');
  const app = await createStrapi(await compileStrapi()).load();
  const clubs = () => app.documents('api::verein.verein');

  const linked = [];
  const skipped = [];
  const missingFiles = [];
  const missingClubs = [];

  for (const [fileName, clubName] of Object.entries(MAPPING)) {
    const file = await app.db.query('plugin::upload.file').findOne({ where: { name: fileName, folderPath: FOLDER_PATH } });
    if (!file) {
      missingFiles.push(fileName);
      continue;
    }
    const club = await clubs().findFirst({ filters: { name: clubName }, populate: { vehicleGraphic: true } });
    if (!club) {
      missingClubs.push(`${clubName} (${fileName})`);
      continue;
    }
    if (club.vehicleGraphic && !force) {
      skipped.push(`${clubName} (${club.vehicleGraphic.name})`);
      continue;
    }
    await clubs().update({ documentId: club.documentId, data: { vehicleGraphic: file.id }, status: 'published' });
    linked.push(`${clubName} <- ${fileName}`);
  }

  const print = (title, list) => {
    console.log(`${title} (${list.length}):`);
    list.forEach((x) => console.log(`  - ${x}`));
  };
  print('Verknüpft', linked);
  print('Übersprungen (schon gesetzt)', skipped);
  print('Datei nicht gefunden', missingFiles);
  print('Verein nicht gefunden', missingClubs);

  const all = await clubs().findMany({ status: 'published', populate: { vehicleGraphic: true }, limit: 10000 });
  print('Vereine ohne Fahrzeuggrafik', all.filter((c) => !c.vehicleGraphic).map((c) => c.name));

  await app.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
