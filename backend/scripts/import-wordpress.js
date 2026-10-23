/* eslint-disable */
// Importiert den WordPress-Export (C:\git\bscv-wordpress-export) in Strapi.
// Aufruf (Strapi-Server vorher stoppen): node scripts/import-wordpress.js [exportDir] [uploadsDir]
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const EXPORT = process.argv[2] || 'C:/git/bscv-wordpress-export';
const UPLOADS = process.argv[3] || 'C:/git/bscv-wordpress/site/domains/bscv.de/public_html/wp-content/uploads';

// Ausrichter-Schreibweisen im WordPress-Export -> Vereinsname in Strapi
const ORGANISER_ALIASES = {
  'Pyraser SCC': 'Pyraser SCT',
  'SCC Devil Drivers': 'SCC Devil Drivers Niedernkirchen',
  'SCC Dingolfing-Landau': 'SCC Dingolfing-Landau "The Mustangs"',
  'SCC Dingolfing Mustangs': 'SCC Dingolfing-Landau "The Mustangs"',
  'SCC Dingolfing "Die Mustang‘s"': 'SCC Dingolfing-Landau "The Mustangs"',
};

const report = { skipped: [], missingFiles: [], created: {}, updated: {} };
const count = (bucket, type) => (report[bucket][type] = (report[bucket][type] || 0) + 1);

const readType = (type, onlyPublished = true) => {
  const dir = path.join(EXPORT, 'content', type);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
    .filter((e) => !onlyPublished || e.status === 'publish');
};

const cf = (entry, key) => {
  const v = entry.custom_fields && entry.custom_fields[`wpcf-${key}`];
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined;
};

const toDate = (ts) => (ts ? new Date(Number(ts) * 1000 + 12 * 3600 * 1000).toISOString().slice(0, 10) : undefined);

const decodeEntities = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

const htmlToMarkdown = (html, rewriteUrl = (u) => u) =>
  decodeEntities(
    (html || '')
      .replace(/\r/g, '')
      .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
        const label = text.replace(/<[^>]+>/g, '').trim();
        return label ? `[${label}](${rewriteUrl(href)})` : '';
      })
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n\n## $1\n\n')
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|ul|ol|table|tr)>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

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
  const docs = (uid) => app.documents(uid);
  const uploadService = app.plugin('upload').service('upload');

  // ---- Medien ---------------------------------------------------------------
  const mediaCache = new Map();
  const relUpload = (url) => {
    const m = url && url.match(/wp-content\/uploads\/(.+?)(?:[?#].*)?$/);
    return m ? decodeURIComponent(m[1]) : undefined;
  };

  async function uploadRel(rel) {
    if (mediaCache.has(rel)) return mediaCache.get(rel);
    const existing = await app.db.query('plugin::upload.file').findOne({ where: { caption: rel } });
    if (existing) {
      mediaCache.set(rel, existing);
      return existing;
    }
    const filepath = path.join(UPLOADS, rel);
    if (!fs.existsSync(filepath)) {
      report.missingFiles.push(rel);
      mediaCache.set(rel, null);
      return null;
    }
    const name = path.basename(rel);
    let file;
    try {
      [file] = await uploadService.upload({
        data: { fileInfo: { name, caption: rel } },
        files: {
          filepath,
          originalFilename: name,
          mimetype: mime.lookup(name) || 'application/octet-stream',
          size: fs.statSync(filepath).size,
        },
      });
    } catch (err) {
      // Windows: EBUSY beim Aufräumen der Temp-Dateien, Upload ist dann meist trotzdem fertig
      file = await app.db.query('plugin::upload.file').findOne({ where: { caption: rel } });
      if (!file) throw err;
    }
    mediaCache.set(rel, file);
    return file;
  }

  const mediaFromUrl = async (url) => {
    const rel = relUpload(url);
    return rel ? uploadRel(rel) : null;
  };

  // Links im Fließtext auf hochgeladene Dateien umschreiben
  async function prepareLinks(html) {
    const map = {};
    for (const [, href] of (html || '').matchAll(/href="([^"]*wp-content\/uploads\/[^"]*)"/gi)) {
      const file = await mediaFromUrl(href);
      if (file) map[href] = file.url;
    }
    return (u) => map[u] || u.replace(/^https?:\/\/(www\.)?bscv\.de/i, '');
  }

  // ---- Helfer ---------------------------------------------------------------
  async function upsert(uid, filters, rawData, label) {
    const data = Object.fromEntries(Object.entries(rawData).map(([k, v]) => [k, v === undefined ? null : v]));
    const existing = await docs(uid).findFirst({ filters });
    if (existing) {
      await docs(uid).update({ documentId: existing.documentId, data, status: 'published' });
      count('updated', label);
    } else {
      await docs(uid).create({ data, status: 'published' });
      count('created', label);
    }
  }

  const anschrift = (name, street, city, phone, mobile, email) => {
    const a = { name, phone, mobile, email, address: { street, city } };
    return Object.values(a).some((v) => (v && typeof v === 'object' ? v.street || v.city : v)) ? a : undefined;
  };

  const mediaId = (file) => (file ? file.id : undefined);

  // ---- Vereine --------------------------------------------------------------
  for (const e of readType('verein')) {
    const freigabe = cf(e, 'datenfreigabe') === '1';
    const year = cf(e, 'grundungsjahr');
    const logo = cf(e, 'logo') ? await mediaFromUrl(cf(e, 'logo')) : null;
    const data = {
      name: e.title,
      sortName: cf(e, 'sort-by'),
      website: cf(e, 'website-url'),
      founded: year ? `${year}-01-01` : undefined,
      logo: mediaId(logo),
    };
    if (freigabe) {
      data.president = anschrift(cf(e, '1v-name'), cf(e, '1v-strasse'), cf(e, '1v-ort'), cf(e, '1v-festnetz'), cf(e, '1v-mobil'), cf(e, '1v-email'));
    } else {
      report.skipped.push(`Verein "${e.title}": keine Datenfreigabe, Kontaktdaten nicht importiert`);
    }
    await upsert('api::verein.verein', { name: e.title }, data, 'verein');
  }

  // ---- Rennkalender ---------------------------------------------------------
  const clubIds = new Map((await docs('api::verein.verein').findMany({ fields: ['name'], limit: 1000 })).map((v) => [v.name, v.documentId]));
  const trackIds = new Map();
  for (const e of readType('veranstaltung')) {
    const organiser = cf(e, 'event-organiser');
    const clubId = organiser ? clubIds.get(ORGANISER_ALIASES[organiser] || organiser) : undefined;
    if (organiser && !clubId) report.skipped.push(`Veranstaltung "${e.title}": Ausrichter "${organiser}" keinem Verein zuordenbar`);
    const trackName = cf(e, 'event-location');
    let trackId = trackName ? trackIds.get(trackName) : undefined;
    if (trackName && !trackId) {
      let track = await docs('api::rennstrecke.rennstrecke').findFirst({ filters: { name: trackName } });
      if (!track) track = await docs('api::rennstrecke.rennstrecke').create({ data: { name: trackName }, status: 'published' });
      trackId = track.documentId;
      trackIds.set(trackName, trackId);
    }
    await upsert(
      'api::veranstaltung.veranstaltung',
      { title: e.title },
      { title: e.title, date: toDate(cf(e, 'event-date')), track: trackId ? { connect: [{ documentId: trackId }] } : undefined, organiser: clubId ? { connect: [{ documentId: clubId }] } : undefined },
      'veranstaltung'
    );
  }

  // ---- Punktewertung --------------------------------------------------------
  for (const e of readType('punktewertungen')) {
    const pdf = cf(e, 'pdf') ? await mediaFromUrl(cf(e, 'pdf')) : null;
    await upsert('api::punktewertung.punktewertung', { title: e.title }, { title: e.title, sorting: Number(cf(e, 'pw-sorting')) || 0, pdf: mediaId(pdf) }, 'punktewertung');
  }

  // ---- Galerie --------------------------------------------------------------
  for (const e of readType('album')) {
    const preview = cf(e, 'vorschaubild') ? await mediaFromUrl(cf(e, 'vorschaubild')) : null;
    const date = toDate(cf(e, 'album-datum'));
    // Veranstaltung nur verknüpfen, wenn das Datum eindeutig genau eine Veranstaltung trifft.
    // Sonst das Feld weglassen, damit upsert eine von Hand gesetzte Verknüpfung nicht auf null setzt.
    const events = date ? await docs('api::veranstaltung.veranstaltung').findMany({ filters: { date }, fields: ['documentId'] }) : [];
    const link = events.length === 1 ? { veranstaltung: { connect: [{ documentId: events[0].documentId }] } } : {};
    await upsert('api::album.album', { title: e.title }, { title: e.title, date, url: cf(e, 'album-url'), preview: mediaId(preview), ...link }, 'album');
  }

  // ---- Funktionäre ----------------------------------------------------------
  for (const e of readType('funktionar')) {
    // Das WordPress-Platzhalterbild nicht übernehmen, das Frontend zeigt dafür eine eigene Silhouette
    const foto = cf(e, 'fkt-foto');
    const photo = foto && !/placeholder/i.test(foto) ? await mediaFromUrl(foto) : null;
    await upsert('api::funktionaer.funktionaer', { name: e.title }, { name: e.title, club: cf(e, 'fkt-verein'), photo: mediaId(photo) }, 'funktionaer');
  }

  // ---- Vorstand -------------------------------------------------------------
  for (const e of readType('vorstand')) {
    const photo = cf(e, 'vsd-foto') ? await mediaFromUrl(cf(e, 'vsd-foto')) : null;
    const name = [cf(e, 'vsd-vorname'), cf(e, 'vsd-nachname')].filter(Boolean).join(' ');
    await upsert(
      'api::vorstand.vorstand',
      { role: e.title },
      {
        role: e.title,
        position: Number(cf(e, 'vsd-nummer')) || 0,
        contact: anschrift(name, cf(e, 'vsd-strasse'), cf(e, 'vsd-ort'), cf(e, 'vsd-telefon'), cf(e, 'vsd-mobil'), cf(e, 'vsd-email')),
        photo: mediaId(photo),
      },
      'vorstand'
    );
  }

  // ---- Seiten und Beiträge --------------------------------------------------
  const pageSlugs = ['impressum', 'datenschutz', 'kalender-abonnieren'];
  for (const e of readType('page').filter((p) => pageSlugs.includes(p.slug))) {
    const content = htmlToMarkdown(e.content_html, await prepareLinks(e.content_html));
    await upsert('api::seite.seite', { slug: e.slug }, { title: e.title, slug: e.slug, content }, 'seite');
  }
  for (const e of readType('post')) {
    const content = htmlToMarkdown(e.content_html, await prepareLinks(e.content_html));
    await upsert('api::post.post', { title: e.title }, { title: e.title, content }, 'post');
  }

  // ---- Startseite -----------------------------------------------------------
  const home = readType('page').find((p) => p.slug === 'home');
  if (home) {
    const text = htmlToMarkdown(home.content_html.replace(/<div class="linkto">[\s\S]*?<\/div>/i, ''));
    const existing = await docs('api::home.home').findFirst();
    const data = { title: home.title, content: text };
    if (existing) await docs('api::home.home').update({ documentId: existing.documentId, data, status: 'published' });
    else await docs('api::home.home').create({ data, status: 'published' });
    count('updated', 'home');
  }

  // ---- Dokumente, Einstellungen (aus dem bisherigen Frontend-Inhalt) -----
  const dokumente = [
    ['Ausschreibung 2026', 'Ausschreibung 2026 · DIN A4 (PDF)', '2026/03/Ausschreibung-2026-A4-03-2026.pdf'],
    ['Ausschreibung 2026', 'Ausschreibung 2026 · DIN A5 (PDF)', '2026/03/Ausschreibung-2026-A5-03-2026.pdf'],
    ['Ausschreibung 2026', 'Schiedsgerichtsordnung (PDF)', '2026/05/Schiedsgerichtsordnung.pdf'],
    ['Formulare', 'BSCV Fahrerlizenzantrag', '2024/05/Lizenzantrag-2024.pdf'],
    ['Formulare', 'Anhang 1: Ärztliche Bescheinigung', '2018/08/Lizenzantrag-Anhang-1.pdf'],
    ['Formulare', 'Anhang 2: Einwilligung der gesetzlichen Vertreter', '2018/08/Lizenzantrag-Anhang-2.pdf'],
    ['Formulare', 'Nennkarte zum Ausfüllen am PC', '2018/08/Nennkarte-PC.pdf'],
  ];
  for (const [i, [group, label, rel]] of dokumente.entries()) {
    const file = await uploadRel(rel);
    await upsert('api::dokument.dokument', { label }, { group, label, file: mediaId(file), position: i }, 'dokument');
  }

  const settings = await docs('api::einstellung.einstellung').findFirst();
  const settingsData = { founded: 1978, classCount: 10, mylapsUrl: 'https://speedhive.mylaps.com/Organizations/21183', officeEmail: 'office@example.org' };
  if (settings) await docs('api::einstellung.einstellung').update({ documentId: settings.documentId, data: settingsData });
  else await docs('api::einstellung.einstellung').create({ data: settingsData });
  count('updated', 'einstellung');

  // ---- Öffentliche Leserechte für neue Typen --------------------------------
  const role = await app.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  for (const api of ['veranstaltung', 'rennstrecke', 'punktewertung', 'album', 'funktionaer', 'vorstand', 'seite', 'dokument', 'einstellung']) {
    for (const action of ['find', 'findOne']) {
      const a = `api::${api}.${api}.${action}`;
      const has = await app.db.query('plugin::users-permissions.permission').findOne({ where: { action: a, role: role.id } });
      if (!has) await app.db.query('plugin::users-permissions.permission').create({ data: { action: a, role: role.id } });
    }
  }

  console.log(JSON.stringify(report, null, 2));
  await app.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
