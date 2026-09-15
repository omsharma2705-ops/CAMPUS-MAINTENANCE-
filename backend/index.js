require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const storeRoutes = require('./routes/storeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => res.json({ 
  status: 'Campus Redressal & Facilities Operations API Running Smoothly', 
  version: '3.0.0',
  endpoints: [
    '/api/auth',
    '/api/complaints',
    '/api/admin',
    '/api/stores',
    '/api/notifications'
  ]
}));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
