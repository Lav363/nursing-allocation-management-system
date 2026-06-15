const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/leaves
// @desc    Get all leave requests (for admin) with pagination
// @access  Private (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [totalResult] = await db.query('SELECT COUNT(*) as total FROM leave_requests');
    const total = totalResult[0].total;

    const [leaves] = await db.query(
      `SELECT lr.id, lr.nurse_id, lr.from_date, lr.to_date, lr.status, lr.created_at,
              u.name as nurse_name, n.specialization
       FROM leave_requests lr
       JOIN nurses n ON lr.nurse_id = n.id
       JOIN users u ON n.user_id = u.id
       ORDER BY lr.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      leaves,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch leaves error:', error);
    res.status(500).json({ message: 'Server error retrieving leave requests.', error: error.message });
  }
});

// @route   GET /api/leaves/my
// @desc    Get leave requests of current nurse
// @access  Private (Nurse only)
router.get('/my', verifyToken, async (req, res) => {
  if (req.user.role !== 'nurse' || !req.user.nurseId) {
    return res.status(403).json({ message: 'Only nurses can fetch their leave requests.' });
  }

  try {
    const [myLeaves] = await db.query(
      `SELECT id, from_date, to_date, status, created_at 
       FROM leave_requests 
       WHERE nurse_id = ? 
       ORDER BY created_at DESC`,
      [req.user.nurseId]
    );
    res.json(myLeaves);
  } catch (error) {
    console.error('Fetch my leaves error:', error);
    res.status(500).json({ message: 'Server error retrieving your leaves.', error: error.message });
  }
});

// @route   POST /api/leaves
// @desc    Apply for leave (Nurse only)
// @access  Private (Nurse only)
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'nurse' || !req.user.nurseId) {
    return res.status(403).json({ message: 'Only nurses can apply for leaves.' });
  }

  const { from_date, to_date } = req.body;

  if (!from_date || !to_date) {
    return res.status(400).json({ message: 'From date and To date are required.' });
  }

  if (new Date(from_date) > new Date(to_date)) {
    return res.status(400).json({ message: 'From date cannot be after To date.' });
  }

  try {
    // Check if there is an overlapping leave request
    const [existingOverlaps] = await db.query(
      `SELECT * FROM leave_requests 
       WHERE nurse_id = ? AND status != 'rejected'
       AND (
         (from_date BETWEEN ? AND ?) OR 
         (to_date BETWEEN ? AND ?) OR 
         (? BETWEEN from_date AND to_date)
       )`,
      [req.user.nurseId, from_date, to_date, from_date, to_date, from_date]
    );

    if (existingOverlaps.length > 0) {
      return res.status(400).json({ message: 'You already have an active leave request overlapping this period.' });
    }

    const [result] = await db.query(
      'INSERT INTO leave_requests (nurse_id, from_date, to_date, status) VALUES (?, ?, ?, ?)',
      [req.user.nurseId, from_date, to_date, 'pending']
    );

    res.status(201).json({
      message: 'Leave request submitted successfully.',
      leaveId: result.insertId
    });
  } catch (error) {
    console.error('Submit leave error:', error);
    res.status(500).json({ message: 'Server error applying for leave.', error: error.message });
  }
});

// @route   PUT /api/leaves/:id
// @desc    Approve or Reject leave request (deletes allocations if approved)
// @access  Private (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const leaveId = req.params.id;
  const { status } = req.body; // 'approved' or 'rejected'

  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'." });
  }

  try {
    // Check if leave exists
    const [leaves] = await db.query('SELECT * FROM leave_requests WHERE id = ?', [leaveId]);
    if (leaves.length === 0) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    const leave = leaves[0];

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Update status
      await conn.query('UPDATE leave_requests SET status = ? WHERE id = ?', [status, leaveId]);

      // If approved, delete any existing allocations for this nurse during the leave period
      if (status === 'approved') {
        await conn.query(
          `DELETE FROM allocations 
           WHERE nurse_id = ? AND date BETWEEN ? AND ?`,
          [leave.nurse_id, leave.from_date, leave.to_date]
        );
      }

      await conn.commit();
      res.json({ message: `Leave request has been ${status}.` });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({ message: 'Server error updating leave status.', error: error.message });
  }
});

module.exports = router;
