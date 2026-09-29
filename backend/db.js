const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'pos.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales table
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      amount_paid REAL NOT NULL,
      change REAL NOT NULL,
      sale_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Sale items table (items in each sale)
  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Insert default users
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const cashierPassword = bcrypt.hashSync('cashier123', 10);

  db.run(
    `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
    ['admin', adminPassword, 'admin'],
    function(err) {
      if (err) console.error('Error inserting admin:', err);
      else console.log('Admin user created/exists');
    }
  );

  db.run(
    `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
    ['cashier', cashierPassword, 'cashier'],
    function(err) {
      if (err) console.error('Error inserting cashier:', err);
      else console.log('Cashier user created/exists');
    }
  );

  // Insert sample products
  const sampleProducts = [
    ['Coca-Cola', 500, 20],
    ['Sprite', 500, 15],
    ['Fanta Orange', 500, 25],
    ['Water Bottle', 300, 50],
    ['Bread', 1000, 10]
  ];

  sampleProducts.forEach(([name, price, quantity]) => {
    db.run(
      `INSERT OR IGNORE INTO products (name, price, quantity) VALUES (?, ?, ?)`,
      [name, price, quantity],
      function(err) {
        if (err) console.error(`Error inserting product ${name}:`, err);
      }
    );
  });

  console.log('Database initialized successfully');
});

module.exports = db;
