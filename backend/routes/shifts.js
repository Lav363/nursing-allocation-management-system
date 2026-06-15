const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/shifts
// @desc    Get all shifts
// @access  Private (Admin or Nurse)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [shifts] = await db.query('SELECT * FROM shifts ORDER BY start_time ASC');
    res.json(shifts);
  } catch (error) {
    console.error('Fetch shifts error:', error);
    res.status(500).json({ message: 'Server error retrieving shifts.', error: error.message });
  }
});

// @route   POST /api/shifts
// @desc    Create a new shift
// @access  Private (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { shift_name, start_time, end_time } = req.body;

  if (!shift_name || !start_time || !end_time) {
    return res.status(400).json({ message: 'Shift name, start time, and end time are required.' });
  }

  try {
    // Check if shift name already exists
    const [existing] = await db.query('SELECT * FROM shifts WHERE shift_name = ?', [shift_name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A shift with this name already exists.' });
    }

    const [result] = await db.query(
      'INSERT INTO shifts (shift_name, start_time, end_time) VALUES (?, ?, ?)',
      [shift_name, start_time, end_time]
    );

    res.status(201).json({
      message: 'Shift created successfully.',
      shift: {
        id: result.insertId,
        shift_name,
        start_time,
        end_time
      }
    });
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ message: 'Server error creating shift.', error: error.message });
  }
});

// @route   PUT /api/shifts/:id
// @desc    Update a shift
// @access  Private (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const shiftId = req.params.id;
  const { shift_name, start_time, end_time } = req.body;

  if (!shift_name || !start_time || !end_time) {
    return res.status(400).json({ message: 'Shift name, start time, and end time are required.' });
  }

  try {
    // Check if shift exists
    const [shifts] = await db.query('SELECT * FROM shifts WHERE id = ?', [shiftId]);
    if (shifts.length === 0) {
      return res.status(404).json({ message: 'Shift not found.' });
    }

    // Check if shift name is taken by another shift
    const [existing] = await db.query('SELECT * FROM shifts WHERE shift_name = ? AND id != ?', [shift_name, shiftId]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A shift with this name already exists.' });
    }

    await db.query(
      'UPDATE shifts SET shift_name = ?, start_time = ?, end_time = ? WHERE id = ?',
      [shift_name, start_time, end_time, shiftId]
    );

    res.json({
      message: 'Shift updated successfully.',
      shift: {
        id: parseInt(shiftId),
        shift_name,
        start_time,
        end_time
      }
    });
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ message: 'Server error updating shift.', error: error.message });
  }
});

// @route   DELETE /api/shifts/:id
// @desc    Delete a shift
// @access  Private (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const shiftId = req.params.id;

  try {
    const [shifts] = await db.query('SELECT * FROM shifts WHERE id = ?', [shiftId]);
    if (shifts.length === 0) {
      return res.status(404).json({ message: 'Shift not found.' });
    }

    await db.query('DELETE FROM shifts WHERE id = ?', [shiftId]);
    res.json({ message: 'Shift deleted successfully.' });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ message: 'Server error deleting shift.', error: error.message });
  }
});

module.exports = router;
