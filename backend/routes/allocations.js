const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Helper function to check if a date is within a leave range (inclusive)
async function isNurseOnLeave(nurseId, date) {
  const [leaves] = await db.query(
    `SELECT * FROM leave_requests 
     WHERE nurse_id = ? AND status = 'approved' 
     AND ? BETWEEN from_date AND to_date`,
    [nurseId, date]
  );
  return leaves.length > 0;
}

// @route   GET /api/allocations
// @desc    Get all allocations (with pagination and filters)
// @access  Private (Admin or Nurse)
router.get('/', verifyToken, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const dateFilter = req.query.date || ''; // YYYY-MM-DD

  try {
    let countQuery = 'SELECT COUNT(*) as total FROM allocations';
    let dataQuery = `
      SELECT a.id, a.nurse_id, a.ward_id, a.shift_id, a.date, 
             u.name as nurse_name, n.specialization,
             w.ward_name, w.capacity as ward_capacity,
             s.shift_name, s.start_time, s.end_time
      FROM allocations a
      JOIN nurses n ON a.nurse_id = n.id
      JOIN users u ON n.user_id = u.id
      JOIN wards w ON a.ward_id = w.id
      JOIN shifts s ON a.shift_id = s.id
    `;
    const params = [];
    const countParams = [];

    if (dateFilter) {
      countQuery += ' WHERE date = ?';
      dataQuery += ' WHERE a.date = ?';
      countParams.push(dateFilter);
      params.push(dateFilter);
    }

    dataQuery += ' ORDER BY a.date DESC, s.start_time ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [totalResult] = await db.query(countQuery, countParams);
    const total = totalResult[0].total;

    const [allocations] = await db.query(dataQuery, params);

    res.json({
      allocations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch allocations error:', error);
    res.status(500).json({ message: 'Server error retrieving allocations.', error: error.message });
  }
});

// @route   GET /api/allocations/my
// @desc    Get allocations for the logged in nurse
// @access  Private (Nurse only)
router.get('/my', verifyToken, async (req, res) => {
  if (req.user.role !== 'nurse' || !req.user.nurseId) {
    return res.status(403).json({ message: 'Only nurses can fetch their own roster.' });
  }

  try {
    const [myAllocations] = await db.query(
      `SELECT a.id, a.date, w.ward_name, s.shift_name, s.start_time, s.end_time
       FROM allocations a
       JOIN wards w ON a.ward_id = w.id
       JOIN shifts s ON a.shift_id = s.id
       WHERE a.nurse_id = ?
       ORDER BY a.date DESC, s.start_time ASC`,
      [req.user.nurseId]
    );
    res.json(myAllocations);
  } catch (error) {
    console.error('Fetch my allocations error:', error);
    res.status(500).json({ message: 'Server error retrieving your roster.', error: error.message });
  }
});

// @route   POST /api/allocations
// @desc    Create manual allocation (with validation logic)
// @access  Private (Admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  const { nurse_id, ward_id, shift_id, date } = req.body;

  if (!nurse_id || !ward_id || !shift_id || !date) {
    return res.status(400).json({ message: 'Nurse, ward, shift, and date are required.' });
  }

  try {
    // 1. Verify Nurse is Active
    const [nurses] = await db.query('SELECT status FROM nurses WHERE id = ?', [nurse_id]);
    if (nurses.length === 0) {
      return res.status(404).json({ message: 'Nurse not found.' });
    }
    if (nurses[0].status !== 'active') {
      return res.status(400).json({ message: 'Cannot allocate: Selected nurse is currently inactive.' });
    }

    // 2. Verify Nurse is not on Approved Leave
    const onLeave = await isNurseOnLeave(nurse_id, date);
    if (onLeave) {
      return res.status(400).json({ message: 'Cannot allocate: Selected nurse has an approved leave on this date.' });
    }

    // 3. Verify Nurse is not Double Booked
    const [existingBooking] = await db.query(
      'SELECT id FROM allocations WHERE nurse_id = ? AND date = ? AND shift_id = ?',
      [nurse_id, date, shift_id]
    );
    if (existingBooking.length > 0) {
      return res.status(400).json({ message: 'Cannot allocate: Nurse is already allocated to a shift on this date.' });
    }

    // 4. Verify Ward Capacity is not exceeded for that shift on that date
    const [ward] = await db.query('SELECT capacity FROM wards WHERE id = ?', [ward_id]);
    if (ward.length === 0) {
      return res.status(404).json({ message: 'Ward not found.' });
    }
    const capacity = ward[0].capacity;

    const [currentAllocations] = await db.query(
      'SELECT COUNT(*) as allocatedCount FROM allocations WHERE ward_id = ? AND date = ? AND shift_id = ?',
      [ward_id, date, shift_id]
    );
    const currentCount = currentAllocations[0].allocatedCount;

    if (currentCount >= capacity) {
      return res.status(400).json({ message: `Cannot allocate: Ward capacity (${capacity}) exceeded for this shift on this date.` });
    }

    // 5. Create Allocation
    const [result] = await db.query(
      'INSERT INTO allocations (nurse_id, ward_id, shift_id, date) VALUES (?, ?, ?, ?)',
      [nurse_id, ward_id, shift_id, date]
    );

    res.status(201).json({
      message: 'Nurse allocated successfully.',
      allocationId: result.insertId
    });
  } catch (error) {
    console.error('Allocation error:', error);
    res.status(500).json({ message: 'Server error during allocation.', error: error.message });
  }
});

// @route   DELETE /api/allocations/:id
// @desc    Delete allocation
// @access  Private (Admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  const allocationId = req.params.id;

  try {
    const [allocations] = await db.query('SELECT * FROM allocations WHERE id = ?', [allocationId]);
    if (allocations.length === 0) {
      return res.status(404).json({ message: 'Allocation not found.' });
    }

    await db.query('DELETE FROM allocations WHERE id = ?', [allocationId]);
    res.json({ message: 'Allocation removed successfully.' });
  } catch (error) {
    console.error('Delete allocation error:', error);
    res.status(500).json({ message: 'Server error removing allocation.', error: error.message });
  }
});

// @route   POST /api/allocations/auto
// @desc    Auto Allocation Algorithm (with Workload Balancing)
// @access  Private (Admin only)
router.post('/auto', verifyToken, isAdmin, async (req, res) => {
  const { date } = req.body; // YYYY-MM-DD

  if (!date) {
    return res.status(400).json({ message: 'Date is required for auto-allocation.' });
  }

  try {
    // 1. Get all active wards and shifts
    const [wards] = await db.query('SELECT id, ward_name, capacity FROM wards');
    const [shifts] = await db.query('SELECT id, shift_name FROM shifts');

    if (wards.length === 0 || shifts.length === 0) {
      return res.status(400).json({ message: 'Cannot auto-allocate. Ensure wards and shifts are configured.' });
    }

    // 2. Find existing allocations on this date to prevent duplicate bookings
    const [existingAllocations] = await db.query(
      'SELECT nurse_id, ward_id, shift_id FROM allocations WHERE date = ?',
      [date]
    );

    // Track which nurses are booked today
    const bookedNursesToday = new Set(existingAllocations.map(a => a.nurse_id));

    // Track ward-shift occupancy levels
    // Key: "wardId-shiftId", Value: current number of nurses allocated
    const occupancy = {};
    for (const alloc of existingAllocations) {
      const key = `${alloc.ward_id}-${alloc.shift_id}`;
      occupancy[key] = (occupancy[key] || 0) + 1;
    }

    // 3. Get all active nurses
    const [activeNurses] = await db.query(
      `SELECT n.id, u.name 
       FROM nurses n 
       JOIN users u ON n.user_id = u.id 
       WHERE n.status = 'active'`
    );

    if (activeNurses.length === 0) {
      return res.status(400).json({ message: 'No active nurses available for allocation.' });
    }

    // 4. Filter out nurses who are on approved leave today
    const [approvedLeaves] = await db.query(
      `SELECT nurse_id FROM leave_requests 
       WHERE status = 'approved' AND ? BETWEEN from_date AND to_date`,
      [date]
    );
    const leaveNursesToday = new Set(approvedLeaves.map(l => l.nurse_id));

    // Get list of eligible nurses who are not on leave and not already allocated today
    let eligibleNurses = activeNurses.filter(
      nurse => !leaveNursesToday.has(nurse.id) && !bookedNursesToday.has(nurse.id)
    );

    if (eligibleNurses.length === 0) {
      return res.json({
        message: 'No eligible nurses available for auto-allocation (all nurses are either on leave or already allocated today).',
        allocatedCount: 0,
        allocations: []
      });
    }

    // 5. Workload balancing: For each eligible nurse, find how many shifts they've worked in the last 7 days
    const [workloads] = await db.query(
      `SELECT nurse_id, COUNT(*) as shiftCount 
       FROM allocations 
       WHERE date BETWEEN DATE_SUB(?, INTERVAL 7 DAY) AND DATE_SUB(?, INTERVAL 1 DAY) 
       GROUP BY nurse_id`,
      [date, date]
    );

    const workloadMap = {};
    workloads.forEach(row => {
      workloadMap[row.nurse_id] = row.shiftCount;
    });

    // Populate missing workloads with 0
    eligibleNurses = eligibleNurses.map(nurse => ({
      ...nurse,
      workload: workloadMap[nurse.id] || 0
    }));

    // Sort eligible nurses by workload ascending (lowest workload first)
    eligibleNurses.sort((a, b) => a.workload - b.workload);

    // 6. Generate allocations for empty slots
    const newAllocations = [];
    
    // We iterate through each ward and shift, trying to allocate nurses up to a target
    // In our algorithm, we aim to ensure each ward-shift has at least 1 nurse assigned.
    // If we have extra nurses, we can add more up to the ward's capacity.
    for (const ward of wards) {
      for (const shift of shifts) {
        const key = `${ward.id}-${shift.id}`;
        const currentCount = occupancy[key] || 0;

        // If there's vacancy (current allocations < capacity, and we want to ensure at least 1 nurse)
        if (currentCount < 1 && eligibleNurses.length > 0) {
          // Take the nurse with the lowest workload
          const assignedNurse = eligibleNurses.shift();
          
          newAllocations.push({
            nurse_id: assignedNurse.id,
            nurse_name: assignedNurse.name,
            ward_id: ward.id,
            ward_name: ward.ward_name,
            shift_id: shift.id,
            shift_name: shift.shift_name,
            date: date
          });

          // Update occupancy
          occupancy[key] = currentCount + 1;
        }
      }
    }

    // 7. Batch insert new allocations into the database
    if (newAllocations.length > 0) {
      const insertValues = newAllocations.map(a => [a.nurse_id, a.ward_id, a.shift_id, a.date]);
      await db.query(
        'INSERT INTO allocations (nurse_id, ward_id, shift_id, date) VALUES ?',
        [insertValues]
      );
    }

    res.json({
      message: `Successfully auto-allocated ${newAllocations.length} shifts.`,
      allocatedCount: newAllocations.length,
      allocations: newAllocations
    });
  } catch (error) {
    console.error('Auto allocation error:', error);
    res.status(500).json({ message: 'Server error during auto-allocation.', error: error.message });
  }
});

// @route   GET /api/allocations/analytics
// @desc    Get dashboard analytics metrics
// @access  Private (Admin or Nurse)
router.get('/analytics', verifyToken, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // 1. Total Nurses
    const [totalNursesRes] = await db.query('SELECT COUNT(*) as count FROM nurses');
    const totalNurses = totalNursesRes[0].count;

    // 2. Active Wards
    const [totalWardsRes] = await db.query('SELECT COUNT(*) as count FROM wards');
    const totalWards = totalWardsRes[0].count;

    // 3. Pending leaves
    const [pendingLeavesRes] = await db.query("SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'");
    const pendingLeaves = pendingLeavesRes[0].count;

    // 4. Available Nurses Today
    // Active nurses - (nurses on approved leave today + nurses allocated today)
    const [activeNursesCountRes] = await db.query("SELECT COUNT(*) as count FROM nurses WHERE status = 'active'");
    const activeNursesCount = activeNursesCountRes[0].count;

    const [onLeaveTodayRes] = await db.query(
      `SELECT COUNT(DISTINCT nurse_id) as count FROM leave_requests 
       WHERE status = 'approved' AND ? BETWEEN from_date AND to_date`,
      [today]
    );
    const onLeaveToday = onLeaveTodayRes[0].count;

    const [allocatedTodayRes] = await db.query(
      `SELECT COUNT(DISTINCT nurse_id) as count FROM allocations WHERE date = ?`,
      [today]
    );
    const allocatedToday = allocatedTodayRes[0].count;

    const availableNursesToday = Math.max(0, activeNursesCount - (onLeaveToday + allocatedToday));

    // 5. Active Shifts Today
    const [activeShiftsRes] = await db.query('SELECT COUNT(DISTINCT shift_id) as count FROM allocations WHERE date = ?', [today]);
    const activeShiftsToday = activeShiftsRes[0].count;

    // 6. Chart: Nurse status (Active vs Inactive)
    const [nurseStatusChart] = await db.query(
      'SELECT status, COUNT(*) as count FROM nurses GROUP BY status'
    );

    // 7. Chart: Shift distribution
    const [shiftDistChart] = await db.query(
      `SELECT s.shift_name, COUNT(a.id) as count 
       FROM shifts s 
       LEFT JOIN allocations a ON s.id = a.shift_id 
       GROUP BY s.id`
    );

    // 8. Chart: Weekly Allocations trend (last 7 days)
    const [weeklyTrendChart] = await db.query(
      `SELECT date, COUNT(*) as count 
       FROM allocations 
       WHERE date BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
       GROUP BY date 
       ORDER BY date ASC`
    );

    res.json({
      metrics: {
        totalNurses,
        totalWards,
        pendingLeaves,
        availableNursesToday,
        activeShiftsToday
      },
      charts: {
        nurseStatus: nurseStatusChart,
        shiftDistribution: shiftDistChart,
        weeklyTrend: weeklyTrendChart
      }
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ message: 'Server error retrieving analytics.', error: error.message });
  }
});

module.exports = router;
