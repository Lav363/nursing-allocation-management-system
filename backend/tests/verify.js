// backend/tests/verify.js
// Automated verification script to test DB connection and core business logic rules

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hospital_nursing_jwt_secret_token_key_2026';

async function runTests() {
  console.log('======================================================');
  console.log('      Running Automated System Verifications...       ');
  console.log('======================================================\n');

  try {
    // Test 1: Database Connectivity
    console.log('Test 1: Connecting to MySQL database...');
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    if (rows[0].result === 2) {
      console.log('✔ Database connection established successfully.\n');
    } else {
      throw new Error('Database returned incorrect values.');
    }

    // Test 2: Check tables schema presence
    console.log('Test 2: Verifying database tables...');
    const requiredTables = ['users', 'nurses', 'wards', 'shifts', 'allocations', 'leave_requests'];
    const [tables] = await db.query('SHOW TABLES');
    const tableList = tables.map(t => Object.values(t)[0]);
    
    for (const table of requiredTables) {
      if (tableList.includes(table)) {
        console.log(`✔ Table "${table}" exists.`);
      } else {
        throw new Error(`Required table "${table}" is missing from database schema!`);
      }
    }
    console.log('');

    // Test 3: Authenticate Seed Admin
    console.log('Test 3: Testing JWT encryption & login...');
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', ['admin@hospital.com']);
    if (users.length === 0) {
      throw new Error('Seed admin account not found!');
    }
    
    const admin = users[0];
    const passwordMatch = await bcrypt.compare('admin123', admin.password);
    if (!passwordMatch) {
      throw new Error('Bcrypt password verification failed for seed admin.');
    }
    console.log('✔ Admin password verified using Bcrypt.');

    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.email === 'admin@hospital.com') {
      console.log('✔ JWT generated and verified successfully.\n');
    } else {
      throw new Error('JWT payload validation failed.');
    }

    // Test 4: Business Rule Validation: Double Booking Prevention
    console.log('Test 4: Testing double booking prevention rule...');
    // We already have Sarah Jenkins (nurse_id = 1) allocated to shift 1 on 2026-06-15.
    // Trying to insert another allocation for her on same date and same shift should throw error due to UNIQUE constraint.
    try {
      await db.query(
        'INSERT INTO allocations (nurse_id, ward_id, shift_id, date) VALUES (?, ?, ?, ?)',
        [1, 1, 1, '2026-06-15']
      );
      throw new Error('X Double booking validation failed: Duplicate shift was inserted!');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('✔ Double booking correctly blocked by Database unique key constraint.\n');
      } else {
        throw err;
      }
    }

    // Test 5: Leave Request overlapping block mock
    console.log('Test 5: Testing leave overlap check validation...');
    // Sarah Jenkins (nurse_id = 1) has an approved leave from 2026-06-18 to 2026-06-20.
    // Check if system correctly identifies overlaps.
    const [overlappingLeaves] = await db.query(
      `SELECT * FROM leave_requests 
       WHERE nurse_id = 1 AND status = 'approved' 
       AND ? BETWEEN from_date AND to_date`,
      ['2026-06-19']
    );
    if (overlappingLeaves.length > 0) {
      console.log('✔ Approved leave correctly identified on overlapping date 2026-06-19.\n');
    } else {
      throw new Error('Overlapping leave was not found!');
    }

    console.log('======================================================');
    console.log('      All System Verifications Passed Successfully!   ');
    console.log('======================================================');
    
  } catch (error) {
    console.error('\n✖ System Verification Failed!');
    console.error('Error Details:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
