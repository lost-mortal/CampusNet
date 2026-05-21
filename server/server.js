require('dotenv').config();
// Fix: Node.js v17+ changed DNS resolution order which breaks mongodb+srv:// on Windows
// Also force public DNS servers — bypasses ISP/carrier DNS that blocks SRV record queries
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { initSocket, getOnlineUserIds } = require('./socket');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
if (!process.env.ALLOWED_ORIGINS) {
  console.error('FATAL: ALLOWED_ORIGINS env var is not set. See server/.env.example.');
  process.exit(1);
}
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Allow all Vercel preview/deployment URLs for this project
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.send('CampusNet Server is Running');
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/applications'));
app.use('/api/clubs', require('./routes/clubs'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/students', require('./routes/students'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/notifications', require('./routes/notifications'));

// Online presence — returns array of userIds currently connected via socket
const requireAuth = require('./middleware/auth');
app.get('/api/users/online', requireAuth, (_req, res) => {
  res.json(getOnlineUserIds());
});

// Central error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

async function ensureAdminProfile() {
  const AdminProfile = require('./models/AdminProfile');
  const exists = await AdminProfile.findOne({ scope: 'campus' });
  if (!exists) {
    await AdminProfile.create({ scope: 'campus' }); // defaults: name="Campus Admin", others ""
    console.log('Seeded AdminProfile singleton');
  }
}

connectDB().then(async () => {
  await ensureAdminProfile();
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (HTTP + Socket.io)`);
    console.log(`- Local: http://localhost:${PORT}`);
  });
});
