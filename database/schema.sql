-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS nursing_allocation;
USE nursing_allocation;

-- Drop tables if they exist (order is important due to foreign key constraints)
DROP TABLE IF EXISTS allocations;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS nurses;
DROP TABLE IF EXISTS shifts;
DROP TABLE IF EXISTS wards;
DROP TABLE IF EXISTS users;

-- 1. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'nurse') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Wards Table
CREATE TABLE wards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ward_name VARCHAR(255) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Nurses Table
CREATE TABLE nurses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialization VARCHAR(255) DEFAULT 'General Medicine',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Shifts Table
CREATE TABLE shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shift_name VARCHAR(255) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Leave Requests Table
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nurse_id INT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nurse_id) REFERENCES nurses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Allocations Table
CREATE TABLE allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nurse_id INT NOT NULL,
    ward_id INT NOT NULL,
    shift_id INT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nurse_id) REFERENCES nurses(id) ON DELETE CASCADE,
    FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    -- Core validation rule: Prevent double booking of nurses in same shift on same day
    UNIQUE KEY unique_nurse_shift_date (nurse_id, shift_id, date)
) ENGINE=InnoDB;

-- =========================================================================
-- SEED DATA
-- =========================================================================

-- Insert default admin (Password is bcrypt of 'admin123')
INSERT INTO users (id, name, email, password, role) VALUES 
(1, 'System Administrator', 'admin@hospital.com', '$2a$10$Utbbs81J/WbqwCFwwEo61uHRRnCh8dcF1uKMvaHh3SLBPMRROefqK', 'admin');

-- Insert nurses users (Password is bcrypt of 'nurse123')
INSERT INTO users (id, name, email, password, role) VALUES
(2, 'Sarah Jenkins', 'sarah.j@hospital.com', '$2a$10$ba4vWHkU.wU/QQAeCWerQu/TQSiHdywgbTI4AHxUsm7xqHxJdHHJy', 'nurse'),
(3, 'Michael Chang', 'michael.c@hospital.com', '$2a$10$ba4vWHkU.wU/QQAeCWerQu/TQSiHdywgbTI4AHxUsm7xqHxJdHHJy', 'nurse'),
(4, 'Emily Rodriguez', 'emily.r@hospital.com', '$2a$10$ba4vWHkU.wU/QQAeCWerQu/TQSiHdywgbTI4AHxUsm7xqHxJdHHJy', 'nurse'),
(5, 'David Kim', 'david.k@hospital.com', '$2a$10$ba4vWHkU.wU/QQAeCWerQu/TQSiHdywgbTI4AHxUsm7xqHxJdHHJy', 'nurse'),
(6, 'Jessica Taylor', 'jessica.t@hospital.com', '$2a$10$ba4vWHkU.wU/QQAeCWerQu/TQSiHdywgbTI4AHxUsm7xqHxJdHHJy', 'nurse'),
(7, 'James Wilson', 'james.w@hospital.com', '$2a$10$ba4vWHkU.wU/QQAeCWerQu/TQSiHdywgbTI4AHxUsm7xqHxJdHHJy', 'nurse');


-- Insert Nurses profile data
INSERT INTO nurses (id, user_id, specialization, status) VALUES
(1, 2, 'Pediatrics', 'active'),
(2, 3, 'Intensive Care (ICU)', 'active'),
(3, 4, 'Emergency Room (ER)', 'active'),
(4, 5, 'Cardiology', 'active'),
(5, 6, 'General Medicine', 'active'),
(6, 7, 'Oncology', 'inactive'); -- Testing inactive status

-- Insert Wards
INSERT INTO wards (id, ward_name, capacity) VALUES
(1, 'General Medicine Ward A', 15),
(2, 'Pediatric Care Unit', 10),
(3, 'Intensive Care Unit (ICU)', 6),
(4, 'Emergency Department', 12),
(5, 'Cardiology Ward B', 8);

-- Insert Standard Shifts
INSERT INTO shifts (id, shift_name, start_time, end_time) VALUES
(1, 'Morning Shift', '07:00:00', '15:00:00'),
(2, 'Evening Shift', '15:00:00', '23:00:00'),
(3, 'Night Shift', '23:00:00', '07:00:00');

-- Insert some Leave Requests (using dates around 2026-06-15)
INSERT INTO leave_requests (id, nurse_id, from_date, to_date, status) VALUES
(1, 1, '2026-06-18', '2026-06-20', 'approved'),
(2, 2, '2026-06-15', '2026-06-16', 'pending'),
(3, 3, '2026-06-22', '2026-06-25', 'pending'),
(4, 4, '2026-06-10', '2026-06-12', 'approved');

-- Insert Sample Allocations
INSERT INTO allocations (id, nurse_id, ward_id, shift_id, date) VALUES
(1, 1, 2, 1, '2026-06-15'),
(2, 2, 3, 2, '2026-06-15'),
(3, 3, 4, 3, '2026-06-15'),
(4, 4, 5, 1, '2026-06-16'),
(5, 5, 1, 2, '2026-06-16');
