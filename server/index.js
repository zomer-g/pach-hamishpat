import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { getDb } from './db.js';
import { optionalAuth } from './routes/auth.js';
import authRouter from './routes/auth.js';
import statusReportsRouter from './routes/status-reports.js';
import commentsRouter from './routes/comments.js';
import systemMessagesRouter from './routes/system-messages.js';
import uploadRouter from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
  app.use(cors());
}
app.use(express.json({ limit: '1mb' }));
app.use(optionalAuth);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/status-reports', statusReportsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/system-messages', systemMessagesRouter);
app.use('/api/upload', uploadRouter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// In production, serve the built frontend
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Initialize DB then start server
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
