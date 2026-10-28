'use strict';

// Benennt Inhaltstypen und Komponenten technisch um (Anzeigenamen bleiben Deutsch), ohne Daten zu verlieren. Läuft
// nach rename-fields. Neben den Tabellen stehen die Namen als Werte in Strapis eigenen Tabellen: Medien-Zuordnungen,
// Komponenten-Zuordnungen, Rechte von Public/Authenticated und der Admin-Rollen. Fehlt etwas, wird es übersprungen.

// [alter Name, neuer Name, alte Tabelle, neue Tabelle]
const CONTENT_TYPES = [
  ['dokument', 'download', 'dokumente', 'downloads'],
  ['seite', 'page', 'seiten', 'pages'],
  ['veranstaltung', 'event', 'veranstaltungen', 'events'],
  ['verein', 'club', 'vereins', 'clubs'],
  ['rennstrecke', 'track', 'rennstrecken', 'tracks'],
  ['punktewertung', 'standing', 'punktewertungen', 'standings'],
  ['videograf', 'videographer', 'videografen', 'videographers'],
  ['funktionaer', 'functionary', 'funktionaere', 'functionaries'],
  ['funktion', 'official-role', 'funktionen', 'official_roles'],
  ['vorstand', 'board-member', 'vorstaende', 'board_members'],
  ['der-bscv', 'about', 'der_bscvs', 'abouts'],
  ['fusszeile', 'footer', 'fusszeilen', 'footers'],
  ['einstellung', 'maintenance', 'einstellungen', 'maintenances'],
  ['seite-kontakt', 'contact-page', 'seiten_kontakt', 'contact_pages'],
  ['seite-renntermine', 'events-page', 'seiten_renntermine', 'events_pages'],
  ['seite-vereine', 'clubs-page', 'seiten_vereine', 'clubs_pages'],
  ['seite-punktewertung', 'standings-page', 'seiten_punktewertung', 'standings_pages'],
  ['seite-galerie', 'gallery-page', 'seiten_galerie', 'gallery_pages'],
  ['seite-nicht-gefunden', 'not-found-page', 'seiten_nicht_gefunden', 'not_found_pages'],
  ['startseite-dokumente', 'section-documents', 'startseiten_dokumente', 'sections_documents'],
];

const COMPONENTS = [
  ['adresse.adresse', 'address.address', 'components_adresse_adresses', 'components_address_addresses'],
  ['anschrift.anschrift', 'contact.contact', 'components_anschrift_anschrifts', 'components_contact_contacts'],
  ['farbe.farbe', 'color.color', 'components_farbe_farbes', 'components_color_colors'],
  ['klassengruppe.klassengruppe', 'class-group.class-group', 'components_klassengruppe_klassengruppes', 'components_class_group_class_groups'],
];

// Verknüpfungstabellen (Namen nach rename-fields): ihre Spalten heißen nach den Typen
const LINK_TABLES = [
  ['albums_event_lnk', 'albums_event_lnk', { veranstaltung_id: 'event_id' }],
  ['veranstaltungen_track_lnk', 'events_track_lnk', { veranstaltung_id: 'event_id', rennstrecke_id: 'track_id' }],
  ['veranstaltungen_organizer_lnk', 'events_organizer_lnk', { veranstaltung_id: 'event_id', verein_id: 'club_id' }],
  [
    'funktionaere_official_role_lnk',
    'functionaries_official_role_lnk',
    { funktionaer_id: 'functionary_id', funktion_id: 'official_role_id', funktionaer_ord: 'functionary_ord' },
  ],
];

// Feld-Umbenennungen (auch die aus rename-fields), für die Feldlisten in den Rechten der Admin-Rollen
const FIELDS = {
  'api::album.album': { url: 'galleryUrl', veranstaltung: 'event' },
  'api::event.event': { organiser: 'organizer' },
  'api::download.download': { group: 'category', label: 'title' },
  'api::standing.standing': { sorting: 'position' },
  'api::functionary.functionary': { club: 'clubName', function: 'officialRole' },
  'api::official-role.official-role': { funktionaries: 'functionaries', officials: 'functionaries' },
  'api::club.club': { image: 'vehiclePhoto', mailing: 'mailingAddress', founded: 'foundedYear' },
  'api::about.about': { founded: 'foundedYear' },
  'api::maintenance.maintenance': {
    maintenanceMode: 'enabled',
    maintenanceTitle: 'title',
    maintenanceText: 'text',
    maintenanceEmail: 'email',
  },
};

const uid = (name) => `api::${name}.${name}`;
const UIDS = new Map([...CONTENT_TYPES.map(([from, to]) => [uid(from), uid(to)]), ...COMPONENTS.map(([from, to]) => [from, to])]);

const q = (knex, sql, bindings) => knex.raw(sql, bindings);
const isPg = (knex) => knex.client.dialect === 'postgresql';
const rows = (knex, result) => (isPg(knex) ? result.rows : result);

// Indizes und Fremdschlüssel tragen noch den alten Tabellennamen. Strapi legt sie beim Abgleich mit neuem Namen neu an.
async function dropIndexes(knex, table) {
  if (isPg(knex)) {
    const constraints = rows(knex, await q(knex, `SELECT conname FROM pg_constraint WHERE conrelid = ?::regclass AND contype IN ('f', 'u')`, [table]));
    for (const { conname } of constraints) await q(knex, 'ALTER TABLE ?? DROP CONSTRAINT ??', [table, conname]);
    const indexes = rows(
      knex,
      await q(knex, `SELECT indexname FROM pg_indexes WHERE tablename = ? AND schemaname = current_schema() AND indexname NOT LIKE '%_pkey'`, [table]),
    );
    for (const { indexname } of indexes) await q(knex, 'DROP INDEX IF EXISTS ??', [indexname]);
  } else {
    const indexes = await q(knex, `SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL`, [table]);
    for (const { name } of indexes) await q(knex, 'DROP INDEX IF EXISTS ??', [name]);
  }
}

async function renameTable(knex, from, to) {
  if (from === to || !(await knex.schema.hasTable(from)) || (await knex.schema.hasTable(to))) return;
  await q(knex, 'ALTER TABLE ?? RENAME TO ??', [from, to]);
  await dropIndexes(knex, to);
}

async function renameColumn(knex, table, from, to) {
  if (!(await knex.schema.hasTable(table))) return;
  if (!(await knex.schema.hasColumn(table, from)) || (await knex.schema.hasColumn(table, to))) return;
  await q(knex, 'ALTER TABLE ?? RENAME COLUMN ?? TO ??', [table, from, to]);
}

async function updateValues(knex, table, column, map) {
  if (!(await knex.schema.hasTable(table)) || !(await knex.schema.hasColumn(table, column))) return;
  for (const [from, to] of map) await knex(table).where(column, from).update({ [column]: to });
}

async function cmpsTables(knex) {
  const result = isPg(knex)
    ? await q(knex, `SELECT tablename AS name FROM pg_tables WHERE schemaname = current_schema() AND tablename LIKE '%\\_cmps'`)
    : await q(knex, `SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE '%\\_cmps' ESCAPE '\\'`);
  return rows(knex, result).map((r) => r.name);
}

// Rechte von Public und Authenticated: api::verein.verein.find → api::club.club.find
async function renameUserPermissions(knex) {
  if (!(await knex.schema.hasTable('up_permissions'))) return;
  for (const [from, to] of UIDS) {
    const list = await knex('up_permissions').where('action', 'like', `${from}.%`).select('id', 'action');
    for (const { id, action } of list) await knex('up_permissions').where({ id }).update({ action: to + action.slice(from.length) });
  }
}

// Rechte der Admin-Rollen: Typ und Feldliste
async function renameAdminPermissions(knex) {
  if (!(await knex.schema.hasTable('admin_permissions'))) return;
  await updateValues(knex, 'admin_permissions', 'subject', UIDS);
  for (const [subject, fields] of Object.entries(FIELDS)) {
    const list = await knex('admin_permissions').where({ subject }).select('id', 'properties');
    for (const { id, properties } of list) {
      const props = typeof properties === 'string' ? JSON.parse(properties || '{}') : properties || {};
      if (!Array.isArray(props.fields)) continue;
      const renamed = props.fields.map((path) => {
        const [head, ...rest] = path.split('.');
        return [fields[head] ?? head, ...rest].join('.');
      });
      if (renamed.join() === props.fields.join()) continue;
      await knex('admin_permissions').where({ id }).update({ properties: JSON.stringify({ ...props, fields: [...new Set(renamed)] }) });
    }
  }
}

async function up(knex) {
  for (const [, , from, to] of [...CONTENT_TYPES, ...COMPONENTS]) {
    await renameTable(knex, from, to);
    await renameTable(knex, `${from}_cmps`, `${to}_cmps`);
  }
  for (const [from, to, columns] of LINK_TABLES) {
    await renameTable(knex, from, to);
    for (const [col, newCol] of Object.entries(columns)) await renameColumn(knex, to, col, newCol);
  }

  await updateValues(knex, 'files_related_mph', 'related_type', UIDS);
  for (const table of await cmpsTables(knex)) await updateValues(knex, table, 'component_type', UIDS);
  await updateValues(knex, 'strapi_history_versions', 'content_type', UIDS);
  await updateValues(knex, 'strapi_release_actions', 'content_type', UIDS);
  await renameUserPermissions(knex);
  await renameAdminPermissions(knex);
}

async function down() {}

module.exports = { up, down };
