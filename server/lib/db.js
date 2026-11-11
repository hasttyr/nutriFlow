import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// SQLite (built into Node): one file per service and per region, so each country's personal data
// stays in its own region's storage. WAL lets a replica read and write the same file safely.
export const DATA_DIR = resolve(process.env.DATA_DIR ?? 'server/data');

export const openDb = (name, schema) => {
  const file = resolve(DATA_DIR, `${name}.db`);
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  db.exec(schema);
  return db;
};

// ACID transaction: BEGIN IMMEDIATE takes the write lock first, so two processes (a region and
// its replica) can never interleave a read-modify-write of the same order. Rolls back on error.
export const transaction = (db, work) => {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
};
