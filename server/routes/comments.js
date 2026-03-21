import { Router } from 'express';
import { queryAll, runSql, queryOne } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { is_hidden, sort, limit } = req.query;

  let sql = 'SELECT * FROM report_comments WHERE 1=1';
  const params = [];

  if (is_hidden !== undefined) {
    sql += ' AND is_hidden = ?';
    params.push(is_hidden === 'true' || is_hidden === '1' ? 1 : 0);
  }

  if (sort) {
    const desc = sort.startsWith('-');
    const col = desc ? sort.slice(1) : sort;
    const allowed = ['created_date', 'id'];
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
    is_admin: !!r.is_admin,
  }));
  res.json(result);
});

router.post('/', (req, res) => {
  const { content, author_name, is_admin, is_hidden } = req.body;

  const result = runSql(
    `INSERT INTO report_comments (content, author_name, is_admin, is_hidden, created_date)
     VALUES (?, ?, ?, ?, ?)`,
    [
      content,
      author_name || 'אנונימי',
      is_admin ? 1 : 0,
      is_hidden ? 1 : 0,
      new Date().toISOString()
    ]
  );

  const row = queryOne('SELECT * FROM report_comments WHERE id = ?', [result.lastInsertRowid]);
  res.json({ ...row, is_hidden: !!row.is_hidden, is_admin: !!row.is_admin });
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const allowed = ['content', 'author_name', 'is_admin', 'is_hidden'];
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = ?`);
      if (key === 'is_hidden' || key === 'is_admin') {
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
  runSql(`UPDATE report_comments SET ${setClauses.join(', ')} WHERE id = ?`, params);

  const row = queryOne('SELECT * FROM report_comments WHERE id = ?', [parseInt(id)]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, is_hidden: !!row.is_hidden, is_admin: !!row.is_admin });
});

export default router;
