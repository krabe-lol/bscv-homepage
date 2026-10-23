/* eslint-disable */
// Legt die Einzeltypen "Der BSCV" und "Seitentexte" mit den bisher im Frontend fest eingetragenen Texten an
// und gibt sie öffentlich frei. Bestehende Einträge werden nicht überschrieben.
// Aufruf (Strapi-Server vorher stoppen): node scripts/seed-texte.js
const { createStrapi, compileStrapi } = require('@strapi/strapi');

const DER_BSCV = {
  title: 'Der BSCV',
  intro:
    'Bis die bayerischen und deutschen Meister gekürt werden, ist es ein weiter und spannender Weg. Er beginnt mit 6 Wertungsläufen, die in Bayern verteilt ausgetragen werden. Im finalen Endlauf werden die Meister in den Klassen aus allen Fahrern der Saison ermittelt.',
  fascinationTitle: 'Faszination Stock-Car',
  fascination: [
    'Bei einem Stock-Car-Rennen geht es alles andere als langweilig zu. Verbeultes Blech und spektakuläre Crashs sind an der Tagesordnung – zum Sieg gelangt man nur mit Durchhaltevermögen, guten Technikern und einer Prise Glück.',
    'Deshalb legt der Verband großen Wert auf die Sicherheit jedes Fahrers: Der Innenraum wird bis auf das Nötigste befreit, Anhängerkupplung und Originaltank entfernt, die Fahrertür versteift und Sportsitze eingebaut. Statt Fensterscheiben kommen Gitter zum Einsatz. So ist ausreichender Schutz vor Unfall-, Splitter- und Feuergefahr gewährleistet.',
  ].join('\n\n'),
  classesTitle: 'Klassen',
  classGroups: [
    {
      title: 'Unverbaute Klassen',
      classes: ['Junior-Cup', 'bis 1300 ccm', 'bis 1800 ccm', 'über 1800 ccm', '---', 'Mannschaft bis 1300 ccm', 'Mannschaft bis 1800 ccm'].join('\n'),
    },
    {
      title: 'Verbaute Klassen',
      classes: [
        'verbaut bis 1800 ccm',
        'verbaut über 1800 ccm',
        'Damen',
        'Verbaut Spezial',
        'Crosslauf',
        'Superklasse Eigenbau',
        'Superklasse Karosserie',
        '---',
        'Mannschaft bis 1800 ccm',
        'Mannschaft über 1800 ccm',
      ].join('\n'),
    },
  ],
};

const SEITENTEXTE = {
  racesIntro: 'Sechs Wertungsläufe und ein Endlauf verteilt über ganz Bayern, in denen die Meister der Saison ermittelt werden.',
  clubsIntro:
    '{anzahl} Vereine bilden den BSCV. Sie richten die Wertungsläufe aus, stellen Funktionäre und melden ihre Fahrer für die bayerischen und deutschen Meisterschaften.',
  albumsIntro: 'Bilder von den Wertungsläufen und Endläufen.',
  standingsIntro: 'Die aktuellen Punktestände der Saison in allen Klassen',
  contactIntro:
    'Fragen zum Verband, unseren Rennen, oder zu Lizenz, Nennung oder Einstieg in den Sport? Die Geschäftsstelle und das Präsidium helfen gerne weiter.',
  notFoundIntro: 'Diese Seite gibt es nicht (mehr). Vielleicht hat sich die Adresse geändert – hier geht es weiter:',
  licenseTileTitle: 'Fragen zur Lizenz?',
  licenseTileText: 'Die Geschäftsstelle hilft bei Anträgen, Nennungen und Startpapieren.',
  licenseTileLink: 'Geschäftsstelle kontaktieren',
  officeTileTitle: 'Geschäftsstelle',
  officeTileText: 'Anträge, Nennungen und Startpapiere.',
  copyright: 'Bayerischer Stock-Car Verband e.V.',
};

async function main() {
  const app = await createStrapi(await compileStrapi()).load();
  const role = await app.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });

  // Eintrag anlegen, falls noch keiner existiert, und öffentlich lesbar machen
  const seed = async (uid, label, data) => {
    const existing = await app.documents(uid).findFirst();
    if (existing) console.log(`${label}: Eintrag existiert schon, nichts geändert.`);
    else {
      await app.documents(uid).create({ data, status: 'published' });
      console.log(`${label}: Eintrag angelegt und veröffentlicht.`);
    }

    const action = `${uid}.find`;
    const has = await app.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: role.id } });
    if (!has) {
      await app.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
      console.log(`${label}: öffentliches Leserecht gesetzt.`);
    }
  };

  await seed('api::der-bscv.der-bscv', 'Der BSCV', DER_BSCV);
  await seed('api::seitentext.seitentext', 'Seitentexte', SEITENTEXTE);

  await app.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
