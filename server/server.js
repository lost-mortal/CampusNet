require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
    res.send('CampusNet Server is Running');
});

// Example API Route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`- Local: http://localhost:${PORT}`);
});
