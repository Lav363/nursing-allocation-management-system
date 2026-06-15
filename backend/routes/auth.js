const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'hospital_nursing_jwt_secret_token_key_2026';

// @route   POST /api/auth/register
// @desc    Register a new user (admin or nurse)
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, specialization } = req.body;

  // Basic validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please enter all required fields.' });
  }

  if (role !== 'admin' && role !== 'nurse') {
    return res.status(400).json({ message: 'Invalid role. Must be admin or nurse.' });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get connection from pool to perform transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Insert user
      const [userResult] = await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
      );

      const userId = userResult.insertId;
      let nurseId = null;

      // If user is a nurse, create nurse profile
      if (role === 'nurse') {
        const spec = specialization || 'General Medicine';
        const [nurseResult] = await conn.query(
          'INSERT INTO nurses (user_id, specialization, status) VALUES (?, ?, ?)',
          [userId, spec, 'active']
        );
        nurseId = nurseResult.insertId;
      }

      await conn.commit();

      // Generate JWT Token
      const token = jwt.sign(
        { id: userId, name, email, role, nurseId },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: { id: userId, name, email, role, nurseId }
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter both email and password.' });
  }

  try {
    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Get nurse details if role is nurse
    let nurseId = null;
    let nurseStatus = null;
    let specialization = null;

    if (user.role === 'nurse') {
      const [nurses] = await db.query('SELECT * FROM nurses WHERE user_id = ?', [user.id]);
      if (nurses.length > 0) {
        nurseId = nurses[0].id;
        nurseStatus = nurses[0].status;
        specialization = nurses[0].specialization;
      }
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, nurseId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        nurseId,
        nurseStatus,
        specialization
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = users[0];

    if (user.role === 'nurse') {
      const [nurses] = await db.query('SELECT id, specialization, status FROM nurses WHERE user_id = ?', [user.id]);
      if (nurses.length > 0) {
        user.nurseId = nurses[0].id;
        user.specialization = nurses[0].specialization;
        user.status = nurses[0].status;
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile.', error: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update nurse profile specialization
// @access  Private (Nurse only)
router.put('/profile', verifyToken, async (req, res) => {
  const { specialization } = req.body;

  if (req.user.role !== 'nurse') {
    return res.status(403).json({ message: 'Only nurses can update their nurse profile.' });
  }

  if (!specialization) {
    return res.status(400).json({ message: 'Specialization field is required.' });
  }

  try {
    await db.query('UPDATE nurses SET specialization = ? WHERE user_id = ?', [specialization, req.user.id]);
    res.json({ message: 'Profile updated successfully.', specialization });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile.', error: error.message });
  }
});

module.exports = router;
