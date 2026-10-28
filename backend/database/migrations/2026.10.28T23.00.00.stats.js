'use strict';

// Kennzahlen: Gründungsjahr und Klassenanzahl (Der BSCV) bzw. Gründungsjahr (Verein) werden zur wiederholbaren
// Komponente stat.stat im neuen Feld stats. Die Komponententabelle legt die Migration an (wie Strapi es täte), weil
// sie vor dem Abgleich des Schemas läuft. Die alten Spalten löscht Strapi danach selbst. Admin-Rollen mit
// Feldlisten bekommen stats.* statt der alten Felder.

const STAT_TABLE = 'components_stat_stats';
const COMPONENT_TYPE = 'stat.stat';
const FOUNDED = 'Gründungsjahr';
const OLD_FIELDS = ['foundedYear', 'classCount'];
const NEW_FIELDS = ['stats.label', 'stats.value', 'stats.icon'];

async function ensureStatTable(knex) {
  if (await knex.schema.hasTable(STAT_TABLE)) return;
  await knex.schema.createTable(STAT_TABLE, (t) => {
    t.increments('id');
    t.string('label', 255);
    t.string('value', 255);
    t.string('icon', 255);
  });
}

async function insertStat(knex, row) {
  const [r] = await knex(STAT_TABLE).insert(row).returning('id');
  return typeof r === 'object' ? r.id : r;
}

// Legt die Kennzahlen an und verknüpft sie mit dem Eintrag (cmps-Tabelle, Feld stats)
async function addStats(knex, cmpsTable, entityId, stats) {
  let order = 1;
  for (const stat of stats) {
    const cmpId = await insertStat(knex, stat);
    await knex(cmpsTable).insert({
      entity_id: entityId,
      cmp_id: cmpId,
      component_type: COMPONENT_TYPE,
      field: 'stats',
      order: order++,
    });
  }
}

async function hasStats(knex, cmpsTable, entityId) {
  const link = await knex(cmpsTable).where({ entity_id: entityId, field: 'stats' }).first();
  return Boolean(link);
}

const text = (value) => (value == null ? null : String(value));

async function migrateClubs(knex) {
  if (!(await knex.schema.hasTable('clubs')) || !(await knex.schema.hasColumn('clubs', 'founded_year'))) return;
  if (!(await knex.schema.hasTable('clubs_cmps'))) return;
  // Entwurf und veröffentlichte Fassung sind getrennte Zeilen, jede bekommt eigene Komponenten
  const rows = await knex('clubs').select('id', 'founded_year');
  for (const row of rows) {
    if (await hasStats(knex, 'clubs_cmps', row.id)) continue;
    await addStats(knex, 'clubs_cmps', row.id, [
      { label: FOUNDED, value: text(row.founded_year), icon: 'Flagge' },
      { label: 'Aktive Fahrer', value: null, icon: 'Auto' },
    ]);
  }
}

async function migrateAbout(knex) {
  if (!(await knex.schema.hasTable('abouts')) || !(await knex.schema.hasTable('abouts_cmps'))) return;
  const hasYear = await knex.schema.hasColumn('abouts', 'founded_year');
  const hasCount = await knex.schema.hasColumn('abouts', 'class_count');
  if (!hasYear && !hasCount) return;
  const rows = await knex('abouts').select('*');
  for (const row of rows) {
    if (await hasStats(knex, 'abouts_cmps', row.id)) continue;
    const stats = [];
    if (hasYear && row.founded_year != null) stats.push({ label: FOUNDED, value: text(row.founded_year), icon: 'Flagge' });
    if (hasCount && row.class_count != null) stats.push({ label: 'Klassen', value: text(row.class_count), icon: 'Klassen' });
    await addStats(knex, 'abouts_cmps', row.id, stats);
  }
}

async function updateAdminPermissions(knex) {
  if (!(await knex.schema.hasTable('admin_permissions'))) return;
  const list = await knex('admin_permissions')
    .whereIn('subject', ['api::club.club', 'api::about.about'])
    .select('id', 'properties');
  for (const { id, properties } of list) {
    const props = typeof properties === 'string' ? JSON.parse(properties || '{}') : properties || {};
    if (!Array.isArray(props.fields) || !props.fields.some((f) => OLD_FIELDS.includes(f))) continue;
    const fields = [...new Set([...props.fields.filter((f) => !OLD_FIELDS.includes(f)), ...NEW_FIELDS])];
    await knex('admin_permissions').where({ id }).update({ properties: JSON.stringify({ ...props, fields }) });
  }
}

async function up(knex) {
  await ensureStatTable(knex);
  await migrateClubs(knex);
  await migrateAbout(knex);
  await updateAdminPermissions(knex);
}

async function down() {}

module.exports = { up, down };
