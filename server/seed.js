import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { queryAll, saveDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(__dirname, '..', 'seed');

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
    if (char === '"') { inQuotes = true; i++; continue; }
    if (char === ',') { currentRow.push(currentField); currentField = ''; i++; continue; }
    if (char === '\n' || (char === '\r' && text[i + 1] === '\n')) {
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.length > 1) rows.push(currentRow);
      currentRow = [];
      i += char === '\r' ? 2 : 1;
      continue;
    }
    currentField += char;
    i++;
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.length > 1) rows.push(currentRow);
  }
  return rows;
}

function csvToObjects(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (row[i] || '').trim(); });
    return obj;
  });
}

export async function seedIfEmpty(db) {
  const existing = queryAll('SELECT COUNT(*) as cnt FROM status_reports');
  if (existing[0]?.cnt > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }

  if (!fs.existsSync(path.join(seedDir, 'StatusReport_export.csv'))) {
    console.log('No seed files found, skipping seed.');
    return;
  }

  console.log('Seeding database from CSV exports...');

  // StatusReport
  const statusData = fs.readFileSync(path.join(seedDir, 'StatusReport_export.csv'), 'utf-8');
  const statusReports = csvToObjects(statusData);
  let c1 = 0;
  for (const r of statusReports) {
    if (r.is_hidden === 'true') continue;
    db.run(
      `INSERT INTO status_reports (status, description, reporter_type, created_date, expires_at, is_hidden, is_scheduled, scheduled_from, scheduled_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.status || 'green', r.description || null, r.reporter_type || 'user', r.created_date || new Date().toISOString(), r.expires_at || null, 0, r.is_scheduled === 'true' ? 1 : 0, r.scheduled_from || null, r.scheduled_until || null]
    );
    c1++;
  }

  // SystemReport (legacy)
  if (fs.existsSync(path.join(seedDir, 'SystemReport_export.csv'))) {
    const sysData = fs.readFileSync(path.join(seedDir, 'SystemReport_export.csv'), 'utf-8');
    const sysReports = csvToObjects(sysData);
    for (const r of sysReports) {
      db.run(
        `INSERT INTO status_reports (status, description, reporter_type, created_date, expires_at, is_hidden, is_scheduled, scheduled_from, scheduled_until)
         VALUES (?, ?, ?, ?, NULL, 0, 0, NULL, NULL)`,
        [r.report_type || 'green', r.description || null, r.reporter_ip === 'admin' ? 'admin' : 'user', r.created_date || new Date().toISOString()]
      );
      c1++;
    }
  }
  console.log(`  Seeded ${c1} status reports`);

  // Comments
  const commentData = fs.readFileSync(path.join(seedDir, 'ReportComment_export.csv'), 'utf-8');
  const comments = csvToObjects(commentData);
  let c2 = 0;
  for (const c of comments) {
    if (c.is_hidden === 'true') continue;
    db.run(
      `INSERT INTO report_comments (content, author_name, is_admin, is_hidden, created_date)
       VALUES (?, ?, ?, 0, ?)`,
      [c.content || '', c.author_name || 'אנונימי', c.is_admin === 'true' ? 1 : 0, c.created_date || new Date().toISOString()]
    );
    c2++;
  }
  console.log(`  Seeded ${c2} comments`);

  // System messages
  const msgData = fs.readFileSync(path.join(seedDir, 'SystemMessage_export.csv'), 'utf-8');
  const messages = csvToObjects(msgData);
  let c3 = 0;
  for (const m of messages) {
    db.run(
      `INSERT INTO system_messages (title, content, image_url, order_index, is_archived, created_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m.title || null, m.content || null, m.image_url || null, parseInt(m.order_index) || 0, m.is_archived === 'true' ? 1 : 0, m.created_date || new Date().toISOString()]
    );
    c3++;
  }
  console.log(`  Seeded ${c3} system messages`);

  saveDb();
  console.log('Seed complete!');
}
