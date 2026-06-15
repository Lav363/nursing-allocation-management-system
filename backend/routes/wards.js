const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/wards
// @desc    Get all wards
// @access  Private (Admin or Nurse)
router.get('/', verifyToken, async (req, res) => {
  try {
    const [wards] = await db.query('SELECT * FROM wards ORDER BY ward_name ASC');
    res.json(wards);
  } catch (error) {
    console.error('Fetch wards error:', error);
    res.status(500).json({ message: 'Server error retrieving wards.', error: error.message });
  }
});

// @route   POST /api/wards
// @desc    Create a new ward
// @access  Private (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { ward_name, capacity } = req.body;

  if (!ward_name || capacity === undefined) {
    return res.status(400).json({ message: 'Ward name and capacity are required.' });
  }

  try {
    // Check if ward name already exists
    const [existing] = await db.query('SELECT * FROM wards WHERE ward_name = ?', [ward_name]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A ward with this name already exists.' });
    }

    const [result] = await db.query(
      'INSERT INTO wards (ward_name, capacity) VALUES (?, ?)',
      [ward_name, parseInt(capacity)]
    );

    res.status(201).json({
      message: 'Ward created successfully.',
      ward: {
        id: result.insertId,
        ward_name,
        capacity: parseInt(capacity)
      }
    });
  } catch (error) {
    console.error('Create ward error:', error);
    res.status(500).json({ message: 'Server error creating ward.', error: error.message });
  }
});

// @route   PUT /api/wards/:id
// @desc    Update a ward
// @access  Private (Admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  const wardId = req.params.id;
  const { ward_name, capacity } = req.body;

  if (!ward_name || capacity === undefined) {
    return res.status(400).json({ message: 'Ward name and capacity are required.' });
  }

  try {
    // Check if ward exists
    const [wards] = await db.query('SELECT * FROM wards WHERE id = ?', [wardId]);
    if (wards.length === 0) {
      return res.status(404).json({ message: 'Ward not found.' });
    }

    // Check if ward name is taken by another ward
    const [existing] = await db.query('SELECT * FROM wards WHERE ward_name = ? AND id != ?', [ward_name, wardId]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'A ward with this name already exists.' });
    }

    await db.query(
      'UPDATE wards SET ward_name = ?, capacity = ? WHERE id = ?',
      [ward_name, parseInt(capacity), wardId]
    );

    res.json({
      message: 'Ward updated successfully.',
      ward: {
        id: parseInt(wardId),
        ward_name,
        capacity: parseInt(capacity)
      }
    });
  } catch (error) {
    console.error('Update ward error:', error);
    res.status(500).json({ message: 'Server error updating ward.', error: error.message });
  }
});

// @route   DELETE /api/wards/:id
// @desc    Delete a ward
// @access  Private (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const wardId = req.params.id;

  try {
    const [wards] = await db.query('SELECT * FROM wards WHERE id = ?', [wardId]);
    if (wards.length === 0) {
      return res.status(404).json({ message: 'Ward not found.' });
    }

    await db.query('DELETE FROM wards WHERE id = ?', [wardId]);
    res.json({ message: 'Ward deleted successfully.' });
  } catch (error) {
    console.error('Delete ward error:', error);
    res.status(500).json({ message: 'Server error deleting ward.', error: error.message });
  }
});

module.exports = router;
