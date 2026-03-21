import { Router } from 'express';
import { queryAll, runSql, queryOne } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { is_hidden, status, sort, limit } = req.query;

  let sql = 'SELECT * FROM status_reports WHERE 1=1';
  const params = [];

  if (is_hidden !== undefined) {
    sql += ' AND is_hidden = ?';
    params.push(is_hidden === 'true' || is_hidden === '1' ? 1 : 0);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (sort) {
    const desc = sort.startsWith('-');
    const col = desc ? sort.slice(1) : sort;
    const allowed = ['created_date', 'id', 'status'];
    if (allowed.includes(col)) {
      sql += ` ORDER BY ${col} ${desc ? 'DESC' : 'ASC'}`;
    }
  } else {
    sql += ' ORDER BY created_date DESC';
  }

  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  const rows = queryAll(sql, params);
  const result = rows.map(r => ({
    ...r,
    is_hidden: !!r.is_hidden,
    is_scheduled: !!r.is_scheduled,
  }));
  res.json(result);
});

router.post('/', (req, res) => {
  const { status, description, reporter_type, expires_at, is_hidden, is_scheduled, scheduled_from, scheduled_until } = req.body;

  const result = runSql(
    `INSERT INTO status_reports (status, description, reporter_type, created_date, expires_at, is_hidden, is_scheduled, scheduled_from, scheduled_until)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      status || 'green',
      description || null,
      reporter_type || 'user',
      new Date().toISOString(),
      expires_at || null,
      is_hidden ? 1 : 0,
      is_scheduled ? 1 : 0,
      scheduled_from || null,
      scheduled_until || null
    ]
  );

  const row = queryOne('SELECT * FROM status_reports WHERE id = ?', [result.lastInsertRowid]);
  res.json({ ...row, is_hidden: !!row.is_hidden, is_scheduled: !!row.is_scheduled });
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const allowed = ['status', 'description', 'reporter_type', 'expires_at', 'is_hidden', 'is_scheduled', 'scheduled_from', 'scheduled_until'];
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = ?`);
      if (key === 'is_hidden' || key === 'is_scheduled') {
        params.push(value ? 1 : 0);
      } else {
        params.push(value);
      }
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  params.push(parseInt(id));
  runSql(`UPDATE status_reports SET ${setClauses.join(', ')} WHERE id = ?`, params);

  const row = queryOne('SELECT * FROM status_reports WHERE id = ?', [parseInt(id)]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, is_hidden: !!row.is_hidden, is_scheduled: !!row.is_scheduled });
});

export default router;
