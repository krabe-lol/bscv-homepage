'use strict';

// Der BSCV: Einleitung, Faszination-Überschrift und Faszination-Text werden ein Freitext (Markdown) im neuen Feld
// content. Die alten Spalten löscht Strapi danach beim Abgleich des Schemas. Admin-Rollen mit Feldlisten (Editor,
// Author) bekommen content statt der alten Felder, sonst könnten sie den Freitext nicht bearbeiten, und dazu die
// zuletzt hinzugekommenen Kennzahlen (Strapi gibt neue Felder nur dem Super Admin frei).

const TABLE = 'abouts';
const OLD_FIELDS = ['intro', 'fascinationTitle', 'fascination'];
const ADDED_FIELDS = ['foundedYear', 'classCount'];

async function mergeText(knex) {
  if (!(await knex.schema.hasTable(TABLE)) || !(await knex.schema.hasColumn(TABLE, 'intro'))) return;
  if (await knex.schema.hasColumn(TABLE, 'content')) return;
  await knex.schema.alterTable(TABLE, (t) => t.text('content'));
  const rows = await knex(TABLE).select('id', 'intro', 'fascination_title', 'fascination');
  for (const row of rows) {
    const parts = [row.intro, row.fascination_title && `## ${row.fascination_title}`, row.fascination]
      .map((part) => part?.trim())
      .filter(Boolean);
    await knex(TABLE).where({ id: row.id }).update({ content: parts.length ? parts.join('\n\n') : null });
  }
}

async function updateAdminPermissions(knex) {
  if (!(await knex.schema.hasTable('admin_permissions'))) return;
  const list = await knex('admin_permissions').where({ subject: 'api::about.about' }).select('id', 'properties');
  for (const { id, properties } of list) {
    const props = typeof properties === 'string' ? JSON.parse(properties || '{}') : properties || {};
    if (!Array.isArray(props.fields) || !props.fields.some((f) => OLD_FIELDS.includes(f))) continue;
    const fields = [...new Set([...props.fields.map((f) => (OLD_FIELDS.includes(f) ? 'content' : f)), ...ADDED_FIELDS])];
    await knex('admin_permissions').where({ id }).update({ properties: JSON.stringify({ ...props, fields }) });
  }
}

async function up(knex) {
  await mergeText(knex);
  await updateAdminPermissions(knex);
}

async function down() {}

module.exports = { up, down };
