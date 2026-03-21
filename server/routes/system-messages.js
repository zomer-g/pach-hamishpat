import { Router } from 'express';
import { queryAll, runSql, queryOne } from '../db.js';
import { requireAdmin } from './auth.js';

const router = Router();

router.get('/', (req, res) => {
  const { is_archived, sort, limit } = req.query;

  let sql = 'SELECT * FROM system_messages WHERE 1=1';
  const params = [];

  if (is_archived !== undefined) {
    sql += ' AND is_archived = ?';
    params.push(is_archived === 'true' || is_archived === '1' ? 1 : 0);
  }

  if (sort) {
    const desc = sort.startsWith('-');
    const col = desc ? sort.slice(1) : sort;
    const allowed = ['created_date', 'id', 'order_index'];
    if (allowed.includes(col)) {
      sql += ` ORDER BY ${col} ${desc ? 'DESC' : 'ASC'}`;
    }
  } else {
    sql += ' ORDER BY order_index ASC';
  }

  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  const rows = queryAll(sql, params);
  const result = rows.map(r => ({
    ...r,
    is_archived: !!r.is_archived,
  }));
  res.json(result);
});

router.post('/', requireAdmin, (req, res) => {
  const { title, content, image_url, order_index } = req.body;

  const result = runSql(
    `INSERT INTO system_messages (title, content, image_url, order_index, is_archived, created_date)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [
      title || null,
      content || null,
      image_url || null,
      order_index ?? 0,
      new Date().toISOString()
    ]
  );

  const row = queryOne('SELECT * FROM system_messages WHERE id = ?', [result.lastInsertRowid]);
  res.json({ ...row, is_archived: !!row.is_archived });
});

router.patch('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const allowed = ['title', 'content', 'image_url', 'order_index', 'is_archived'];
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = ?`);
      if (key === 'is_archived') {
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
  runSql(`UPDATE system_messages SET ${setClauses.join(', ')} WHERE id = ?`, params);

  const row = queryOne('SELECT * FROM system_messages WHERE id = ?', [parseInt(id)]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, is_archived: !!row.is_archived });
});

export default router;
