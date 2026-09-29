const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/', (req, res) => {
  db.all(
    'SELECT id, username, role, created_at FROM users ORDER BY username',
    [],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users);
    }
  );
});

router.post('/', (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const role = req.body.role;

  if (!username || username.length > 32 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return res.status(400).json({
      error: 'Username must be 1-32 characters and contain only letters, numbers, dots, underscores, or hyphens'
    });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (role !== 'admin' && role !== 'cashier') {
    return res.status(400).json({ error: 'Role must be admin or cashier' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hashedPassword, role],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(409).json({ error: 'That username is already in use' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({
        id: this.lastID,
        username,
        role,
        created_at: new Date().toISOString()
      });
    }
  );
});

router.delete('/:id', (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  db.get('SELECT id, role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deleteUser = () => {
      db.run('DELETE FROM users WHERE id = ?', [userId], function(deleteErr) {
        if (deleteErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true });
      });
    };

    db.get('SELECT COUNT(*) AS sale_count FROM sales WHERE user_id = ?', [userId], (salesErr, row) => {
      if (salesErr) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row.sale_count > 0) {
        return res.status(409).json({ error: 'This account has sales history and cannot be deleted' });
      }

      if (user.role !== 'admin') {
        return deleteUser();
      }

      db.get("SELECT COUNT(*) AS admin_count FROM users WHERE role = 'admin'", [], (adminErr, admins) => {
        if (adminErr) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (admins.admin_count <= 1) {
          return res.status(409).json({ error: 'The last admin account cannot be deleted' });
        }
        deleteUser();
      });
    });
  });
});

module.exports = router;
