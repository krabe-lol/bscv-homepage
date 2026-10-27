// Startskript für den Server (Hetzner konsoleH: „Skript-Pfad“); startet den Build aus dist/ im Produktionsmodus.
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const path = require('path');
const { createStrapi } = require('@strapi/strapi');

createStrapi({ appDir: __dirname, distDir: path.join(__dirname, 'dist') }).start();
