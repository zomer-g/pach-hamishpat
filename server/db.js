import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'pach.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

export async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS status_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      status TEXT NOT NULL DEFAULT 'green',
      description TEXT,
      reporter_type TEXT DEFAULT 'user',
      created_date TEXT,
      expires_at TEXT,
      is_hidden INTEGER DEFAULT 0,
      is_scheduled INTEGER DEFAULT 0,
      scheduled_from TEXT,
      scheduled_until TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS report_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      author_name TEXT DEFAULT 'אנונימי',
      is_admin INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      created_date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS system_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT,
      image_url TEXT,
      order_index INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      created_date TEXT
    )
  `);

  saveDb();
  return db;
}

export function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Helper to run a query and get results as array of objects
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { lastInsertRowid: db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] };
}

export function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}
