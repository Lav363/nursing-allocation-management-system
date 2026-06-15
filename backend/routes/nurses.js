const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/nurses
// @desc    Get all nurses (with user details) with search & pagination
// @access  Private (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  try {
    let countQuery = 'SELECT COUNT(*) as total FROM nurses n JOIN users u ON n.user_id = u.id';
    let dataQuery = `
      SELECT n.id, n.user_id, u.name, u.email, n.specialization, n.status, n.created_at 
      FROM nurses n 
      JOIN users u ON n.user_id = u.id
    `;
    const params = [];
    const countParams = [];

    if (search) {
      const searchWildcard = `%${search}%`;
      countQuery += ' WHERE u.name LIKE ? OR u.email LIKE ? OR n.specialization LIKE ?';
      dataQuery += ' WHERE u.name LIKE ? OR u.email LIKE ? OR n.specialization LIKE ?';
      countParams.push(searchWildcard, searchWildcard, searchWildcard);
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    dataQuery += ' ORDER BY u.name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [totalResult] = await db.query(countQuery, countParams);
    const total = totalResult[0].total;

    const [nurses] = await db.query(dataQuery, params);

    res.json({
      nurses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch nurses error:', error);
    res.status(500).json({ message: 'Server error retrieving nurses.', error: error.message });
  }
});

// @route   POST /api/nurses
// @desc    Add a new nurse (creates user + nurse profile)
// @access  Private (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { name, email, password, specialization, status } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    // Check if user already exists
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insert into users
      const [userResult] = await conn.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'nurse']
      );
      const userId = userResult.insertId;

      // 2. Insert into nurses
      const [nurseResult] = await conn.query(
        'INSERT INTO nurses (user_id, specialization, status) VALUES (?, ?, ?)',
        [userId, specialization || 'General Medicine', status || 'active']
      );

      await conn.commit();

      res.status(201).json({
        message: 'Nurse created successfully.',
        nurse: {
          id: nurseResult.insertId,
          userId,
          name,
          email,
          specialization: specialization || 'General Medicine',
          status: status || 'active'
        }
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Create nurse error:', error);
    res.status(500).json({ message: 'Server error creating nurse.', error: error.message });
  }
});

// @route   PUT /api/nurses/:id
// @desc    Update nurse details (updates users + nurses table)
// @access  Private (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const nurseId = req.params.id;
  const { name, email, specialization, status, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  try {
    // Check if nurse exists
    const [nurses] = await db.query('SELECT * FROM nurses WHERE id = ?', [nurseId]);
    if (nurses.length === 0) {
      return res.status(404).json({ message: 'Nurse not found.' });
    }

    const userId = nurses[0].user_id;

    // Check if email is taken by another user
    const [existing] = await db.query('SELECT * FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email is already taken by another user.' });
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Update users table details
      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await conn.query(
          'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
          [name, email, hashedPassword, userId]
        );
      } else {
        await conn.query(
          'UPDATE users SET name = ?, email = ? WHERE id = ?',
          [name, email, userId]
        );
      }

      // Update nurses table details
      await conn.query(
        'UPDATE nurses SET specialization = ?, status = ? WHERE id = ?',
        [specialization || 'General Medicine', status || 'active', nurseId]
      );

      await conn.commit();

      res.json({
        message: 'Nurse updated successfully.',
        nurse: {
          id: parseInt(nurseId),
          userId,
          name,
          email,
          specialization,
          status
        }
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Update nurse error:', error);
    res.status(500).json({ message: 'Server error updating nurse.', error: error.message });
  }
});

// @route   DELETE /api/nurses/:id
// @desc    Delete a nurse (deletes user, which cascades to nurse)
// @access  Private (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const nurseId = req.params.id;

  try {
    // Get user_id of the nurse
    const [nurses] = await db.query('SELECT user_id FROM nurses WHERE id = ?', [nurseId]);
    if (nurses.length === 0) {
      return res.status(404).json({ message: 'Nurse not found.' });
    }

    const userId = nurses[0].user_id;

    // Delete user, which cascade deletes from nurses table
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'Nurse profile and user account deleted successfully.' });
  } catch (error) {
    console.error('Delete nurse error:', error);
    res.status(500).json({ message: 'Server error deleting nurse.', error: error.message });
  }
});

module.exports = router;
