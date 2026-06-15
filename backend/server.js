const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const nurseRoutes = require('./routes/nurses');
const wardRoutes = require('./routes/wards');
const shiftRoutes = require('./routes/shifts');
const allocationRoutes = require('./routes/allocations');
const leaveRoutes = require('./routes/leaves');

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/nurses', nurseRoutes);
app.use('/api/wards', wardRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/leaves', leaveRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'An internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
