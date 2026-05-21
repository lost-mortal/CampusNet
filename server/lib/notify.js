const Notification = require('../models/Notification');

// Fire-and-forget notification creator. Never throws — failure here must not
// break the calling action. Always invoke from inside a try/catch in the caller.
async function notify(recipientId, message, type = 'generic') {
  try {
    if (!recipientId || !message) return;
    await Notification.create({ recipient: recipientId, message, type });
  } catch (_err) {
    // silent
  }
}

module.exports = { notify };
