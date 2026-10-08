const express = require('express');
const router = express.Router();

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

module.exports = (db, authenticateToken) => {

  // 1. Get summary of all customers with pending credit balances
  router.get('/customers', authenticateToken, (req, res) => {
    db.all(
      `SELECT customer_name, customer_phone, 
              SUM(balance_amount) as total_balance, 
              COUNT(id) as pending_bills_count 
       FROM bills 
       WHERE balance_amount > 0 
       GROUP BY customer_name, customer_phone 
       ORDER BY total_balance DESC`,
      [],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
      }
    );
  });

  // 2. Get all unpaid/partial credit bills for a specific customer
  router.get('/customer/:name', authenticateToken, (req, res) => {
    const customerName = req.params.name;
    db.all(
      `SELECT * FROM bills WHERE customer_name = ? AND balance_amount > 0 ORDER BY date DESC`,
      [customerName],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsed = rows.map(b => ({
          ...b,
          items: JSON.parse(b.items)
        }));
        res.json(parsed);
      }
    );
  });

  // 3. Directly create a Credit Bill (Paid amount = 0, full balance)
  router.post('/bill', authenticateToken, (req, res) => {
    const { customer_name, customer_phone, items, discount } = req.body;

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ error: 'Customer name is required for credit billing' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Bill has no items' });
    }

    let subtotal = 0;
    let total_cost = 0;
    items.forEach(item => {
      subtotal += item.selling_price * item.quantity;
      total_cost += item.cost_price * item.quantity;
    });

    const finalDiscount = discount || 0;
    const total = round2(Math.max(0, subtotal - finalDiscount));
    const paid_amount = 0; // Pure credit bill
    const balance_amount = total;
    const payment_status = 'credit';

    const billId = 'NF-CR-' + Math.floor(100000 + Math.random() * 900000);
    const date = new Date().toISOString();
    const worker_name = req.user.name;
    const finalName = customer_name.trim();
    const finalPhone = customer_phone || '';

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Deduct inventory stock
      for (let item of items) {
        db.run(`UPDATE products SET stock = stock - ? WHERE id = ?`, [item.quantity, item.id]);
      }

      db.run(
        `INSERT INTO bills (id, date, customer_name, customer_phone, worker_name, subtotal, discount, total, total_cost, items, paid_amount, balance_amount, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [billId, date, finalName, finalPhone, worker_name, subtotal, finalDiscount, total, total_cost, JSON.stringify(items), paid_amount, balance_amount, payment_status],
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }
          db.run('COMMIT');
          res.json({
            success: true,
            billId,
            date,
            customer_name: finalName,
            customer_phone: finalPhone,
            total,
            paid_amount,
            balance_amount,
            payment_status,
            worker_name
          });
        }
      );
    });
  });

  // 4. Record a payment towards a specific credit bill
  router.put('/pay/:id', authenticateToken, (req, res) => {
    const billId = req.params.id;
    const amountPaid = round2(Number(req.body.amount));

    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    db.get(`SELECT * FROM bills WHERE id = ?`, [billId], (err, bill) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!bill) return res.status(404).json({ error: 'Bill not found' });

      const currentBalance = bill.balance_amount ?? bill.total;
      if (amountPaid > currentBalance) {
        return res.status(400).json({ error: `Amount exceeds remaining balance (₹${currentBalance})` });
      }

      const newPaid = round2((bill.paid_amount ?? 0) + amountPaid);
      const newBalance = round2(bill.total - newPaid);
      const newStatus = newBalance === 0 ? 'paid' : 'partial';

      db.run(
        `UPDATE bills SET paid_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?`,
        [newPaid, newBalance, newStatus, billId],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            success: true,
            billId,
            paid_amount: newPaid,
            balance_amount: newBalance,
            payment_status: newStatus
          });
        }
      );
    });
  });

  return router;
};