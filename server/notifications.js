import { notices } from '../src/live/rules.js';
import { createBus } from './lib/bus.js';
import { PROFILES } from './lib/catalog.js';
import { openDb } from './lib/db.js';

// Notifications: turns every order change into messages for the customer, the store and the
// courier (same rules as the web app). Each note has a deterministic id, so an event delivered
// twice is stored once. Notes carry a message key and values, not text: each reader's app shows
// them in its own language and time zone. The latest 200 per region are kept as retained state.

const db = openDb('notifications', `
  CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, region TEXT NOT NULL, data TEXT NOT NULL, at TEXT NOT NULL);
`);
const bus = createBus('notifications');

const publish = (region) =>
  bus.publish(
    `nf/${region}/notifications`,
    db.prepare('SELECT data FROM notes WHERE region = ? ORDER BY at DESC LIMIT 200').all(region).map((row) => JSON.parse(row.data)),
    { retain: true }
  );

bus.on('nf/+/events', async ({ previous, order }, topic) => {
  const region = topic.split('/')[1];
  const insert = db.prepare('INSERT OR IGNORE INTO notes VALUES (?, ?, ?, ?)');
  let added = 0;
  for (const note of notices(previous, order)) added += insert.run(note.id, region, JSON.stringify(note), note.at).changes;
  if (added) await publish(region);
});

await bus.start();
for (const country of Object.keys(PROFILES)) await publish(country.toLowerCase());
console.log('[notifications] ready');
