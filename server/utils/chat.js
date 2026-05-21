const Connection = require('../models/Connection');

// Deterministic room ID — sorted IDs joined by '_'. Same room regardless of who initiates.
function roomIdFor(userIdA, userIdB) {
  return [String(userIdA), String(userIdB)].sort().join('_');
}

// Returns true iff users A and B have an accepted connection (either direction).
async function hasAcceptedConnection(userIdA, userIdB) {
  const conn = await Connection.findOne({
    status: 'accepted',
    $or: [
      { requester: userIdA, recipient: userIdB },
      { requester: userIdB, recipient: userIdA },
    ],
  }).lean();
  return !!conn;
}

module.exports = { roomIdFor, hasAcceptedConnection };
