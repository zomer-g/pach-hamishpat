import { Router } from 'express';

const router = Router();

function getAdminToken() {
  const password = process.env.ADMIN_PASSWORD || 'admin123';
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
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === adminPassword) {
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
