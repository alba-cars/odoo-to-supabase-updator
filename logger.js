const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'logs.db');
const RETENTION_DAYS = 3;

let db = null;
let SQL = null;

async function initDB() {
  if (db) return db;

  const initSqlJs = require('sql.js');
  SQL = await initSqlJs();

  // Load existing DB from disk if it exists
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS request_logs (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT    NOT NULL DEFAULT (datetime('now')),
      method    TEXT    NOT NULL,
      path      TEXT    NOT NULL,
      status    INTEGER,
      duration_ms INTEGER,
      body      TEXT,
      error     TEXT
    )
  `);

  persist();
  return db;
}

function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function pruneOldLogs() {
  if (!db) return;
  db.run(
    `DELETE FROM request_logs WHERE timestamp < datetime('now', '-${RETENTION_DAYS} days')`
  );
  persist();
}

async function log({ method, path: reqPath, status, duration_ms, body, error }) {
  const database = await initDB();
  database.run(
    `INSERT INTO request_logs (method, path, status, duration_ms, body, error)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      method,
      reqPath,
      status ?? null,
      duration_ms ?? null,
      body ? JSON.stringify(body) : null,
      error ?? null,
    ]
  );
  persist();

  // Prune on every 50th write to avoid doing it on every request
  const [{ values }] = database.exec('SELECT COUNT(*) FROM request_logs');
  if (values[0][0] % 50 === 0) pruneOldLogs();
}

async function getLogs({ limit = 100, since } = {}) {
  const database = await initDB();
  pruneOldLogs();

  let query = 'SELECT * FROM request_logs';
  const params = [];

  if (since) {
    query += ' WHERE timestamp >= ?';
    params.push(since);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  const result = database.exec(query, params);
  if (!result.length) return [];

  const { columns, values } = result[0];
  return values.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

module.exports = { log, getLogs, initDB };
