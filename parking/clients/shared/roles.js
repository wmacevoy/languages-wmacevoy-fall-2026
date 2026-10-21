// These decide which panels a client shows. They are presentation only: the server checks
// every request on its own.

export function isAdmin(user) {
  return Boolean(user && (user.is_root || user.role === 'admin'));
}

export function isSensor(user) {
  return Boolean(user && (user.is_root || user.role === 'sensor'));
}

// Root may report for any lot; a sensor only for the lot it is assigned to.
export function sensorLots(user, lots) {
  if (!isSensor(user)) return [];
  if (user.is_root) return lots;
  return lots.filter((lot) => lot.id === Number(user.lot_id));
}

export function roleKey(role, isRoot = false) {
  if (isRoot) return 'roleRoot';
  if (role === 'admin') return 'roleAdmin';
  if (role === 'sensor') return 'roleSensor';
  return 'roleNone';
}
