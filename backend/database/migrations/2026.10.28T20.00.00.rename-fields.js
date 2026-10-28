'use strict';

// Benennt Felder um, ohne Daten zu verlieren. Strapi würde sonst die alte Spalte löschen und eine leere neue anlegen.
// Läuft einmal pro Datenbank vor dem Abgleich des Schemas. Fehlt eine Tabelle oder Spalte (frische Datenbank, schon
// umbenannt), wird sie übersprungen.

// [Tabelle, alte Spalte, neue Spalte]
const COLUMNS = [
  ['albums', 'url', 'gallery_url'],
  ['dokumente', 'label', 'title'],
  ['dokumente', 'group', 'category'],
  ['punktewertungen', 'sorting', 'position'],
  ['funktionaere', 'club', 'club_name'],
  ['der_bscvs', 'founded', 'founded_year'],
  ['einstellungen', 'maintenance_mode', 'enabled'],
  ['einstellungen', 'maintenance_title', 'title'],
  ['einstellungen', 'maintenance_text', 'text'],
  ['einstellungen', 'maintenance_email', 'email'],
];

// Verknüpfungstabellen von Relationen: [alter Name, neuer Name]
const LINK_TABLES = [
  ['albums_veranstaltung_lnk', 'albums_event_lnk'],
  ['veranstaltungen_organiser_lnk', 'veranstaltungen_organizer_lnk'],
  ['funktionaere_function_lnk', 'funktionaere_official_role_lnk'],
];

const q = (knex, sql, bindings) => knex.raw(sql, bindings);

async function renameColumn(knex, table, from, to) {
  if (!(await knex.schema.hasTable(table))) return;
  if (!(await knex.schema.hasColumn(table, from)) || (await knex.schema.hasColumn(table, to))) return;
  await q(knex, 'ALTER TABLE ?? RENAME COLUMN ?? TO ??', [table, from, to]);
}

async function renameTable(knex, from, to) {
  if (!(await knex.schema.hasTable(from)) || (await knex.schema.hasTable(to))) return;
  await q(knex, 'ALTER TABLE ?? RENAME TO ??', [from, to]);
  await dropIndexes(knex, to);
}

// Indizes und Fremdschlüssel tragen noch den alten Tabellennamen. Strapi legt sie beim Abgleich mit neuem Namen neu an.
async function dropIndexes(knex, table) {
  if (knex.client.dialect === 'postgresql') {
    const { rows } = await q(
      knex,
      `SELECT conname FROM pg_constraint WHERE conrelid = ?::regclass AND contype IN ('f', 'u')`,
      [table],
    );
    for (const { conname } of rows) await q(knex, 'ALTER TABLE ?? DROP CONSTRAINT ??', [table, conname]);
    const { rows: indexes } = await q(
      knex,
      `SELECT indexname FROM pg_indexes WHERE tablename = ? AND schemaname = current_schema() AND indexname NOT LIKE '%_pkey'`,
      [table],
    );
    for (const { indexname } of indexes) await q(knex, 'DROP INDEX IF EXISTS ??', [indexname]);
  } else {
    const indexes = await q(knex, `SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL`, [table]);
    for (const { name } of indexes) await q(knex, 'DROP INDEX IF EXISTS ??', [name]);
  }
}

// Vereine: Gründungsdatum wird zum Gründungsjahr (Zahl)
async function foundedYear(knex) {
  const table = 'vereins';
  if (!(await knex.schema.hasTable(table))) return;
  if (!(await knex.schema.hasColumn(table, 'founded')) || (await knex.schema.hasColumn(table, 'founded_year'))) return;
  await knex.schema.alterTable(table, (t) => t.integer('founded_year'));
  const year = knex.client.dialect === 'postgresql' ? 'EXTRACT(YEAR FROM founded)::int' : `CAST(strftime('%Y', founded) AS INTEGER)`;
  await q(knex, `UPDATE ?? SET founded_year = ${year} WHERE founded IS NOT NULL`, [table]);
  // Nicht über knex: Das baut die Tabelle in SQLite neu auf, und das Löschen der alten löscht per Kaskade alle Verknüpfungen
  await q(knex, 'ALTER TABLE ?? DROP COLUMN ??', [table, 'founded']);
}

// Medienfelder und Komponenten stehen in gemeinsamen Tabellen, der Feldname ist dort ein Wert
async function renameFieldValue(knex, table, from, to, type) {
  if (!(await knex.schema.hasTable(table))) return;
  const query = knex(table).where({ field: from });
  if (type) query.andWhere({ related_type: type });
  await query.update({ field: to });
}

async function up(knex) {
  for (const [table, from, to] of COLUMNS) await renameColumn(knex, table, from, to);
  for (const [from, to] of LINK_TABLES) await renameTable(knex, from, to);
  await foundedYear(knex);
  await renameFieldValue(knex, 'files_related_mph', 'image', 'vehiclePhoto', 'api::verein.verein');
  await renameFieldValue(knex, 'vereins_cmps', 'mailing', 'mailingAddress');
}

async function down() {}

module.exports = { up, down };
