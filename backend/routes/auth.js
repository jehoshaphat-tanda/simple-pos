const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { createSession, revokeSession, requireAuth } = require('../middleware/auth');

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({
        success: true,
        token: createSession(user.id),
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    }
  );
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', requireAuth, (req, res) => {
  revokeSession(req.sessionToken);
  res.json({ success: true });
});

module.exports = router;
