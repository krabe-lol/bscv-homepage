/* eslint-disable */
// Verknüpft bestehende Alben anhand des Datums mit der passenden Veranstaltung.
// Aufruf (Strapi-Server vorher stoppen): node scripts/link-albums.js
const { createStrapi, compileStrapi } = require('@strapi/strapi');

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  const docs = (uid) => app.documents(uid);

  const albums = await docs('api::album.album').findMany({
    status: 'published',
    populate: { veranstaltung: true },
    limit: 10000,
  });

  let linked = 0;
  const noMatch = [];
  const ambiguous = [];

  for (const album of albums) {
    // Bestehende Verknüpfungen nie überschreiben
    if (album.veranstaltung || !album.date) continue;

    const events = await docs('api::veranstaltung.veranstaltung').findMany({
      filters: { date: album.date },
      fields: ['documentId'],
    });

    if (events.length === 0) noMatch.push(`${album.title} (${album.date})`);
    else if (events.length > 1) ambiguous.push(`${album.title} (${album.date})`);
    else {
      await docs('api::album.album').update({
        documentId: album.documentId,
        data: { veranstaltung: { connect: [{ documentId: events[0].documentId }] } },
        status: 'published',
      });
      linked++;
    }
  }

  console.log(`Verknüpft: ${linked}`);
  console.log(`Kein Treffer (${noMatch.length}):`);
  noMatch.forEach((a) => console.log(`  - ${a}`));
  console.log(`Mehrdeutig (${ambiguous.length}):`);
  ambiguous.forEach((a) => console.log(`  - ${a}`));

  await app.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
