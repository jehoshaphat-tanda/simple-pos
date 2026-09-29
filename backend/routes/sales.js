const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all sales
router.get('/', (req, res) => {
  db.all(
    `SELECT s.*, u.username FROM sales s 
     JOIN users u ON s.user_id = u.id 
     ORDER BY s.created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get sales for a specific date
router.get('/date/:date', (req, res) => {
  db.all(
    `SELECT s.*, u.username FROM sales s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.sale_date = ?
     ORDER BY s.created_at DESC`,
    [req.params.date],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get sale details with items
router.get('/details/:id', (req, res) => {
  db.get(
    `SELECT s.*, u.username FROM sales s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.id = ?`,
    [req.params.id],
    (err, sale) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      db.all(
        `SELECT si.*, p.name FROM sale_items si
         JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
        [req.params.id],
        (err, items) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ sale, items });
        }
      );
    }
  );
});

// Create a new sale
router.post('/', (req, res) => {
  const { user_id, items, total_amount, amount_paid } = req.body;

  if (!user_id || !items || !items.length || !total_amount || !amount_paid) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (amount_paid < total_amount) {
    return res.status(400).json({ error: 'Amount paid is less than total' });
  }

  const change = amount_paid - total_amount;

  // Start transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Insert sale
    db.run(
      `INSERT INTO sales (user_id, total_amount, amount_paid, change) VALUES (?, ?, ?, ?)`,
      [user_id, total_amount, amount_paid, change],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Database error' });
        }

        const saleId = this.lastID;
        let itemsProcessed = 0;

        // Insert sale items and update product quantities
        items.forEach((item) => {
          // Check if product exists and has enough stock
          db.get(
            `SELECT quantity FROM products WHERE id = ?`,
            [item.product_id],
            (err, product) => {
              if (err || !product) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Product not found' });
              }

              if (product.quantity < item.quantity) {
                db.run('ROLLBACK');
                return res.status(400).json({ error: `Insufficient stock for product ${item.product_id}` });
              }

              // Insert sale item
              db.run(
                `INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal) 
                 VALUES (?, ?, ?, ?, ?)`,
                [saleId, item.product_id, item.quantity, item.price, item.subtotal],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Database error' });
                  }

                  // Update product quantity
                  db.run(
                    `UPDATE products SET quantity = quantity - ? WHERE id = ?`,
                    [item.quantity, item.product_id],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Database error' });
                      }

                      itemsProcessed++;
                      if (itemsProcessed === items.length) {
                        // Commit transaction
                        db.run('COMMIT', (err) => {
                          if (err) {
                            return res.status(500).json({ error: 'Database error' });
                          }
                          res.status(201).json({
                            id: saleId,
                            total_amount,
                            amount_paid,
                            change
                          });
                        });
                      }
                    }
                  );
                }
              );
            }
          );
        });
      }
    );
  });
});

module.exports = router;
