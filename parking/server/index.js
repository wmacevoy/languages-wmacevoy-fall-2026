const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
const jwtExpiry = '8h';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET not set. Using an insecure default for demo purposes.');
}

const lotSelectFields = `
  id,
  name,
  capacity,
  occupancy,
  is_open,
  updated_at,
  CASE WHEN is_open THEN capacity - occupancy ELSE 0 END AS available
`;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const getUserFromRequest = (req) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  try {
    return jwt.verify(token, jwtSecret);
  } catch (err) {
    return null;
  }
};

const requireAdmin = (req, res, next) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!user.is_root && user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  req.user = user;
  next();
};

const requireSensorForLot = (req, res, next) => {
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (user.is_root) {
    req.user = user;
    return next();
  }

  if (user.role !== 'sensor') {
    return res.status(403).json({ error: 'Sensor access required' });
  }

  const lotId = Number(req.params.id);
  if (!Number.isInteger(lotId)) {
    return res.status(400).json({ error: 'Invalid lot id' });
  }

  if (Number(user.lot_id) !== lotId) {
    return res.status(403).json({ error: 'Sensor not assigned to this lot' });
  }

  req.user = user;
  next();
};

const parseLotId = (req, res, next) => {
  const lotId = Number(req.params.id);
  if (!Number.isInteger(lotId)) {
    return res.status(400).json({ error: 'Invalid lot id' });
  }
  req.lotId = lotId;
  next();
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, username, role, lot_id, is_root
       FROM users
       WHERE username = $1
         AND password_hash = crypt($2, password_hash)`,
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        lot_id: user.lot_id,
        is_root: user.is_root,
      },
      jwtSecret,
      { expiresIn: jwtExpiry }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('POST /api/login failed', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/me', (req, res) => {
  const user = getUserFromRequest(req);
  res.json({ user: user || null });
});

app.get('/api/lots', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${lotSelectFields} FROM lots ORDER BY id`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/lots failed', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/lots/:id', parseLotId, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${lotSelectFields} FROM lots WHERE id = $1`,
      [req.lotId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/lots/:id failed', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/lots/:id/open', parseLotId, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE lots
       SET is_open = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING ${lotSelectFields}`,
      [req.lotId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/lots/:id/open failed', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/lots/:id/close', parseLotId, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE lots
       SET is_open = FALSE, updated_at = NOW()
       WHERE id = $1
       RETURNING ${lotSelectFields}`,
      [req.lotId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lot not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /api/lots/:id/close failed', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post(
  '/api/lots/:id/occupancy',
  parseLotId,
  requireSensorForLot,
  async (req, res) => {
    const occupancy = Number(req.body.occupancy);

    if (!Number.isInteger(occupancy) || occupancy < 0) {
      return res.status(400).json({ error: 'Invalid occupancy' });
    }

    try {
      const { rows: lotRows } = await pool.query(
        'SELECT capacity FROM lots WHERE id = $1',
        [req.lotId]
      );

      if (lotRows.length === 0) {
        return res.status(404).json({ error: 'Lot not found' });
      }

      const capacity = lotRows[0].capacity;
      if (occupancy > capacity) {
        return res.status(400).json({
          error: `Occupancy cannot exceed capacity (${capacity})`,
        });
      }

      const { rows } = await pool.query(
        `UPDATE lots
         SET occupancy = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING ${lotSelectFields}`,
        [req.lotId, occupancy]
      );

      res.json(rows[0]);
    } catch (err) {
      console.error('POST /api/lots/:id/occupancy failed', err);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT users.id, users.username, users.role, users.lot_id, users.is_root,
              lots.name AS lot_name
       FROM users
       LEFT JOIN lots ON users.lot_id = lots.id
       ORDER BY users.id`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/users failed', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/users', requireAdmin, async (req, res) => {
  const { username, password, role, lot_id: lotId } = req.body || {};
  const allowedRoles = new Set(['none', 'admin', 'sensor']);
  const safeRole = role || 'none';

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (!allowedRoles.has(safeRole)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const sensorLotId = safeRole === 'sensor' ? Number(lotId) : null;
  if (safeRole === 'sensor' && !Number.isInteger(sensorLotId)) {
    return res.status(400).json({ error: 'Sensor users require a lot' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (username, password_hash, role, lot_id)
       VALUES ($1, crypt($2, gen_salt('bf')), $3, $4)
       RETURNING id, username, role, lot_id, is_root`,
      [username, password, safeRole, sensorLotId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('POST /api/users failed', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, username, is_root FROM users WHERE id = $1',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (rows[0].is_root) {
      return res.status(403).json({ error: 'Cannot delete root user' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ id: rows[0].id, username: rows[0].username });
  } catch (err) {
    console.error('DELETE /api/users/:id failed', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(port, () => {
  console.log(`Parking occupancy app listening on port ${port}`);
});
