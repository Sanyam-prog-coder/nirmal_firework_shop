const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = 'nirmal_fireworks_secret_key_2026';
const PORT = process.env.PORT || 5000;

// Initialize SQLite Database
const db = new sqlite3.Database('./nirmal_fireworks.db', (err) => {
  if (err) console.error('Error opening database', err.message);
  else console.log('Connected to SQLite database.');
});

// Create Tables & Seed Admin
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('admin', 'worker'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    cost_price REAL,
    selling_price REAL,
    stock INTEGER,
    image_url TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bills (
    id TEXT PRIMARY KEY,
    date TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    worker_name TEXT,
    subtotal REAL,
    discount REAL,
    total REAL,
    total_cost REAL,
    items TEXT,
    status TEXT DEFAULT 'Completed'
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS discount_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_data TEXT,
    worker_name TEXT,
    requested_discount REAL,
    status TEXT DEFAULT 'Pending',
    created_at TEXT
  )`);

  // Seed default Admin
  const adminEmail = 'admin@nirmalfireworks.com';
  db.get(`SELECT * FROM users WHERE email = ?`, [adminEmail], async (err, row) => {
    if (!row) {
      const hashedPass = await bcrypt.hash('Nirmal@2026', 10);
      db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        ['Nirmal Admin', adminEmail, hashedPass, 'admin']
      );
      console.log('Default Admin seeded: admin@nirmalfireworks.com / Nirmal@2026');
    }
  });
});

// Middleware for JWT verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});

// Get Workers (Admin only)
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  db.all(`SELECT id, name, email, role FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create Worker (Admin only)
app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { name, email, password, role } = req.body;
  try {
    const hashedPass = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
      [name, email, hashedPass, role || 'worker'],
      function(err) {
        if (err) return res.status(400).json({ error: 'Email already exists or invalid data' });
        res.json({ id: this.lastID, name, email, role: role || 'worker' });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete Worker (Admin only)
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  // Only admin can remove workers
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const userId = req.params.id;

  // Delete only workers, never an admin
  db.run(
    `DELETE FROM users WHERE id = ? AND role = 'worker'`,
    [userId],
    function(err) {
      if (err) {
        return res.status(500).json({
          error: err.message
        });
      }

      // Worker doesn't exist
      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Worker not found'
        });
      }

      res.json({
        success: true,
        message: 'Worker removed successfully',
        id: userId
      });
    }
  );
});

// --- PRODUCT ROUTES ---
app.get('/api/products', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM products`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/products', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { name, category, cost_price, selling_price, stock, image_url } = req.body;
  db.run(`INSERT INTO products (name, category, cost_price, selling_price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, category, cost_price, selling_price, stock, image_url],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, category, cost_price, selling_price, stock, image_url });
    }
  );
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { name, category, cost_price, selling_price, stock, image_url } = req.body;
  db.run(`UPDATE products SET name = ?, category = ?, cost_price = ?, selling_price = ?, stock = ?, image_url = ? WHERE id = ?`,
    [name, category, cost_price, selling_price, stock, image_url, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- BILLING & POS ROUTES ---
app.get('/api/bills', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM bills ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const parsed = rows.map(b => ({ ...b, items: JSON.parse(b.items) }));
    res.json(parsed);
  });
});

app.post('/api/bills', authenticateToken, (req, res) => {
  const { customer_name, customer_phone, items, discount } = req.body;
  
  // Calculate totals and total cost
  let subtotal = 0;
  let total_cost = 0;
  items.forEach(item => {
    subtotal += item.selling_price * item.quantity;
    total_cost += item.cost_price * item.quantity;
  });

  const finalDiscount = discount || 0;
  const total = Math.max(0, subtotal - finalDiscount);
  const billId = 'NF-' + Math.floor(100000 + Math.random() * 900000);
  const date = new Date().toISOString();
  const worker_name = req.user.name;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Deduct stock
    for (let item of items) {
      db.run(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity, item.id]);
    }

    db.run(`INSERT INTO bills (id, date, customer_name, customer_phone, worker_name, subtotal, discount, total, total_cost, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [billId, date, customer_name || 'Walk-in Customer', customer_phone || '', worker_name, subtotal, finalDiscount, total, total_cost, JSON.stringify(items)],
      (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        db.run('COMMIT');
        res.json({ billId, date, subtotal, discount: finalDiscount, total, worker_name, items });
      }
    );
  });
});

// Delete Bill (Admin & Authorized users)
app.delete('/api/bills/:id', authenticateToken, (req, res) => {
  const billId = req.params.id;

  // First fetch the bill to retrieve items and restore product stock
  db.get(`SELECT items FROM bills WHERE id = ?`, [billId], (err, bill) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    let items = [];
    try {
      items = JSON.parse(bill.items);
    } catch (e) {
      console.error('Error parsing bill items:', e);
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Restore product stock levels
      for (let item of items) {
        db.run(`UPDATE products SET stock = stock + ? WHERE id = ?`, [item.quantity, item.id]);
      }

      // Delete the bill record
      db.run(`DELETE FROM bills WHERE id = ?`, [billId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        db.run('COMMIT');
        res.json({ success: true, message: 'Bill deleted and inventory restored.' });
      });
    });
  });
});

// TEMPORARY: Remove duplicate admin account
app.delete('/api/admin/remove-duplicate', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  db.run(
    `DELETE FROM users WHERE email = ? AND role = 'admin'`,
    ['admin@nirmalfireworks.com'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Duplicate admin not found' });
      }

      res.json({
        success: true,
        message: 'Duplicate admin removed successfully'
      });
    }
  );
});

// --- ANALYTICS & REPORTS (Admin Only) ---
app.get('/api/analytics', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

  db.all(`SELECT items FROM bills`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const productSalesMap = {};
    rows.forEach(row => {
      const items = JSON.parse(row.items);
      items.forEach(item => {
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { name: item.name, category: item.category || 'General', unitsSold: 0, revenue: 0 };
        }
        productSalesMap[item.name].unitsSold += item.quantity;
        productSalesMap[item.name].revenue += item.selling_price * item.quantity;
      });
    });

    const restockingForecast = Object.values(productSalesMap).sort((a, b) => b.unitsSold - a.unitsSold);
    res.json({ restockingForecast });
  });
});

app.listen(PORT, () => {
  console.log(`Nirmal Firework Shop backend running on port ${PORT}`);
});