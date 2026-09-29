const express = require('express');
const router = express.Router();
const db = require('../db');

// Get today's dashboard stats
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // Get today's total sales and count
  db.get(
    `SELECT 
      COALESCE(COUNT(*), 0) as sale_count,
      COALESCE(SUM(total_amount), 0) as total_sales
     FROM sales WHERE sale_date = ?`,
    [today],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Get current stock
      db.all(
        `SELECT id, name, quantity FROM products ORDER BY name`,
        [],
        (err, products) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            date: today,
            sale_count: stats.sale_count || 0,
            total_sales: stats.total_sales || 0,
            products: products || []
          });
        }
      );
    }
  );
});

// Get all time stats
router.get('/stats', (req, res) => {
  db.get(
    `SELECT 
      COUNT(*) as total_sales,
      SUM(total_amount) as total_revenue,
      COUNT(DISTINCT user_id) as total_users
     FROM sales`,
    [],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      db.get(
        `SELECT SUM(quantity) as total_stock FROM products`,
        [],
        (err, stock) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            total_sales: stats.total_sales || 0,
            total_revenue: stats.total_revenue || 0,
            total_users: stats.total_users || 0,
            total_stock: stock.total_stock || 0
          });
        }
      );
    }
  );
});

module.exports = router;
