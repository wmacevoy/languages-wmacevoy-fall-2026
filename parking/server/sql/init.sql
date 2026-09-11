CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS lots (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL CHECK (capacity >= 0),
  occupancy INTEGER NOT NULL DEFAULT 0 CHECK (occupancy >= 0),
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (occupancy <= capacity)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'none' CHECK (role IN ('none', 'admin', 'sensor')),
  lot_id INTEGER REFERENCES lots(id) ON DELETE SET NULL,
  is_root BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (role != 'sensor' OR lot_id IS NOT NULL)
);

INSERT INTO lots (name, capacity, occupancy, is_open)
VALUES
  ('North Deck', 120, 36, TRUE),
  ('South Lot', 60, 60, TRUE),
  ('River Garage', 200, 140, TRUE),
  ('Overflow Gravel', 40, 0, FALSE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (username, password_hash, role, is_root)
VALUES ('root', crypt('rootpass', gen_salt('bf')), 'admin', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, role, lot_id)
VALUES (
  'sensor/north',
  crypt('sensorpass', gen_salt('bf')),
  'sensor',
  (SELECT id FROM lots WHERE name = 'North Deck')
)
ON CONFLICT (username) DO NOTHING;
