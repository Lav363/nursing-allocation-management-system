const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'nursing_allocation',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on load
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Connection Pool initialized successfully.');
    connection.release();
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
  }
})();

module.exports = pool;
