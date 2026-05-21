const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const { roomIdFor, hasAcceptedConnection } = require('./utils/chat');

// In-memory presence map: socketId → userId
// Using socketId as key so multiple tabs / dual sockets (chat + presence) are handled correctly.
// A userId is "online" if at least one of their sockets is in this map.
const onlineMap = new Map();

function getOnlineUserIds() {
  return [...new Set(onlineMap.values())];
}

function initSocket(httpServer) {
  // ALLOWED_ORIGINS is validated at server.js startup; safe to read directly here.
  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        if (origin.endsWith('.vercel.app')) return cb(null, true);
        cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });

  // JWT handshake auth — reject unauthenticated sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('No token'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(payload._id);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Track presence
    onlineMap.set(socket.id, socket.userId);
    socket.on('disconnect', () => { onlineMap.delete(socket.id); });

    // join_room — verify accepted connection, join, emit last 50 messages as history
    socket.on('join_room', async ({ otherUserId }, ack) => {
      try {
        if (!otherUserId || otherUserId === socket.userId) {
          return ack?.({ error: 'Invalid target user' });
        }
        const allowed = await hasAcceptedConnection(socket.userId, otherUserId);
        if (!allowed) {
          return ack?.({ error: 'You need to connect first' });
        }
        const roomId = roomIdFor(socket.userId, otherUserId);
        socket.join(roomId);

        const history = await Message.find({ roomId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        history.reverse();

        socket.emit('history', { roomId, messages: history });
        ack?.({ ok: true, roomId });
      } catch (err) {
        console.error('join_room failed:', err);
        ack?.({ error: 'Failed to join room' });
      }
    });

    // leave_room
    socket.on('leave_room', ({ roomId }) => {
      if (roomId) socket.leave(roomId);
    });

    // send_message — save and broadcast to everyone in the room
    socket.on('send_message', async ({ to, body, clientId }, ack) => {
      try {
        const trimmed = (body || '').trim();
        if (!to || !trimmed) return ack?.({ error: 'Empty message' });
        if (to === socket.userId) return ack?.({ error: 'Cannot message yourself' });

        const allowed = await hasAcceptedConnection(socket.userId, to);
        if (!allowed) return ack?.({ error: 'You need to connect first' });

        const roomId = roomIdFor(socket.userId, to);
        const msg = await Message.create({
          roomId,
          sender: socket.userId,
          receiver: to,
          body: trimmed,
        });

        const payload = {
          _id: msg._id,
          roomId,
          sender: String(msg.sender),
          receiver: String(msg.receiver),
          body: msg.body,
          createdAt: msg.createdAt,
          clientId,
        };
        io.to(roomId).emit('new_message', payload);
        ack?.({ ok: true, message: payload });
      } catch (err) {
        console.error('send_message failed:', err);
        ack?.({ error: 'Failed to send message' });
      }
    });
  });

  return io;
}

module.exports = { initSocket, getOnlineUserIds };
