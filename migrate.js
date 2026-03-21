import { getDb, saveDb, runSql } from './server/db.js';
import fs from 'fs';
import path from 'path';

// Simple CSV parser that handles quoted fields with commas and newlines
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
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // End of quoted field
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

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (char === ',') {
      currentRow.push(currentField);
      currentField = '';
      i++;
      continue;
    }

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

  // Last row
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
    headers.forEach((h, i) => {
      obj[h.trim()] = (row[i] || '').trim();
    });
    return obj;
  });
}

async function migrate() {
  const db = await getDb();

  // Clear existing data
  db.run('DELETE FROM status_reports');
  db.run('DELETE FROM report_comments');
  db.run('DELETE FROM system_messages');

  const downloadsDir = 'C:/Users/zomer/Downloads';

  // 1. Import StatusReport_export.csv
  console.log('Importing StatusReport...');
  const statusData = fs.readFileSync(path.join(downloadsDir, 'StatusReport_export.csv'), 'utf-8');
  const statusReports = csvToObjects(statusData);
  let statusCount = 0;
  for (const r of statusReports) {
    if (r.is_hidden === 'true') continue; // skip hidden
    db.run(
      `INSERT INTO status_reports (status, description, reporter_type, created_date, expires_at, is_hidden, is_scheduled, scheduled_from, scheduled_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        r.status || 'green',
        r.description || null,
        r.reporter_type || 'user',
        r.created_date || new Date().toISOString(),
        r.expires_at || null,
        r.is_hidden === 'true' ? 1 : 0,
        r.is_scheduled === 'true' ? 1 : 0,
        r.scheduled_from || null,
        r.scheduled_until || null
      ]
    );
    statusCount++;
  }
  console.log(`  Imported ${statusCount} status reports`);

  // 2. Import SystemReport_export.csv (older reports with different column names)
  console.log('Importing SystemReport (legacy)...');
  const sysReportData = fs.readFileSync(path.join(downloadsDir, 'SystemReport_export.csv'), 'utf-8');
  const sysReports = csvToObjects(sysReportData);
  let legacyCount = 0;
  for (const r of sysReports) {
    db.run(
      `INSERT INTO status_reports (status, description, reporter_type, created_date, expires_at, is_hidden, is_scheduled, scheduled_from, scheduled_until)
       VALUES (?, ?, ?, ?, ?, 0, 0, NULL, NULL)`,
      [
        r.report_type || 'green',
        r.description || null,
        r.reporter_ip === 'admin' ? 'admin' : 'user',
        r.created_date || new Date().toISOString(),
        null
      ]
    );
    legacyCount++;
  }
  console.log(`  Imported ${legacyCount} legacy reports`);

  // 3. Import ReportComment_export.csv
  console.log('Importing ReportComment...');
  const commentData = fs.readFileSync(path.join(downloadsDir, 'ReportComment_export.csv'), 'utf-8');
  const comments = csvToObjects(commentData);
  let commentCount = 0;
  for (const c of comments) {
    if (c.is_hidden === 'true') continue;
    db.run(
      `INSERT INTO report_comments (content, author_name, is_admin, is_hidden, created_date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        c.content || '',
        c.author_name || 'אנונימי',
        c.is_admin === 'true' ? 1 : 0,
        c.is_hidden === 'true' ? 1 : 0,
        c.created_date || new Date().toISOString()
      ]
    );
    commentCount++;
  }
  console.log(`  Imported ${commentCount} comments`);

  // 4. Import SystemMessage_export.csv
  console.log('Importing SystemMessage...');
  const msgData = fs.readFileSync(path.join(downloadsDir, 'SystemMessage_export.csv'), 'utf-8');
  const messages = csvToObjects(msgData);
  let msgCount = 0;
  for (const m of messages) {
    db.run(
      `INSERT INTO system_messages (title, content, image_url, order_index, is_archived, created_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        m.title || null,
        m.content || null,
        m.image_url || null,
        parseInt(m.order_index) || 0,
        m.is_archived === 'true' ? 1 : 0,
        m.created_date || new Date().toISOString()
      ]
    );
    msgCount++;
  }
  console.log(`  Imported ${msgCount} system messages`);

  saveDb();
  console.log('\nMigration complete! Database saved.');

  // Print summary
  const srCount = db.exec('SELECT COUNT(*) FROM status_reports')[0].values[0][0];
  const rcCount = db.exec('SELECT COUNT(*) FROM report_comments')[0].values[0][0];
  const smCount = db.exec('SELECT COUNT(*) FROM system_messages')[0].values[0][0];
  console.log(`\nDatabase summary:`);
  console.log(`  Status reports: ${srCount}`);
  console.log(`  Comments: ${rcCount}`);
  console.log(`  System messages: ${smCount}`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
