import { Router } from 'express';

const router = Router();

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn('WARNING: ADMIN_PASSWORD not set. Admin login disabled.');
    return null;
  }
  return password;
}

function getAdminToken() {
  const password = getAdminPassword();
  if (!password) return null;
  return Buffer.from(password).toString('base64');
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    req.isAdmin = token === getAdminToken();
  } else {
    req.isAdmin = false;
  }
  next();
}

router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = getAdminPassword();

  if (!adminPassword) {
    return res.status(403).json({ error: 'Admin login not configured' });
  }

  if (password && password === adminPassword) {
    res.json({
      token: getAdminToken(),
      role: 'admin'
    });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.slice(7);
  if (token === getAdminToken()) {
    res.json({ role: 'admin' });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
