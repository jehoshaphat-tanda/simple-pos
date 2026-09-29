const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all products
router.get('/', (req, res) => {
  db.all(`SELECT * FROM products ORDER BY name`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get single product
router.get('/:id', (req, res) => {
  db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(row);
  });
});

// Add product
router.post('/', (req, res) => {
  const { name, price, quantity } = req.body;

  if (!name || price === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'Name, price and quantity required' });
  }

  db.run(
    `INSERT INTO products (name, price, quantity) VALUES (?, ?, ?)`,
    [name, price, quantity],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        price,
        quantity,
        created_at: new Date().toISOString()
      });
    }
  );
});

// Edit product
router.put('/:id', (req, res) => {
  const { name, price, quantity } = req.body;

  if (!name || price === undefined || quantity === undefined) {
    return res.status(400).json({ error: 'Name, price and quantity required' });
  }

  db.run(
    `UPDATE products SET name = ?, price = ?, quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, price, quantity, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;
