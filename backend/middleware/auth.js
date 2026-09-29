const crypto = require('crypto');
const db = require('../db');

const sessions = new Map();

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, userId);
  return token;
}

function revokeSession(token) {
  sessions.delete(token);
}

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';
  const userId = sessions.get(token);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  db.get(
    'SELECT id, username, role FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        revokeSession(token);
        return res.status(401).json({ error: 'Authentication required' });
      }

      req.user = user;
      req.sessionToken = token;
      next();
    }
  );
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

module.exports = { createSession, revokeSession, requireAuth, requireAdmin };
