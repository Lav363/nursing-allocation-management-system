# 🏥 Nursing Allocation Management System

![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express.js](https://img.shields.io/badge/Express.js-Backend-black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)

A full-stack healthcare workforce management application designed to automate nurse scheduling, shift allocation, ward management, and leave tracking. The system improves operational efficiency by preventing scheduling conflicts and ensuring fair workload distribution among nursing staff.

---

## 🚀 Features

### Admin Module
- Secure Login Authentication
- Manage Nurses (Add, Edit, Delete)
- Manage Wards and Shift Schedules
- Assign Nurses to Wards and Shifts
- Approve or Reject Leave Requests
- Dashboard Analytics and Reports

### Nurse Module
- Secure Login
- View Assigned Shifts
- Apply for Leave
- Track Leave Status
- Update Profile Information

### Scheduling Features
- Prevents Duplicate Shift Allocation
- Checks Nurse Availability Before Assignment
- Leave-Aware Scheduling
- Allocation History Tracking
- Workload Balancing Logic

---

## 🛠 Tech Stack

### Frontend
- ReactJS
- Tailwind CSS
- Axios
- React Router DOM
- Chart.js

### Backend
- Node.js
- Express.js
- JWT Authentication

### Database
- MySQL

### Tools
- Git
- GitHub
- Postman

---

## 🏗 System Architecture

```text
Frontend (ReactJS)
        │
        ▼
REST API (Node.js + Express.js)
        │
        ▼
MySQL Database
```

---

## 📂 Project Structure

```text
nursing-allocation-management-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── server.js
│
├── database/
│   └── schema.sql
│
├── screenshots/
│
└── README.md
```

---

## 🔐 Authentication

- JWT-Based Authentication
- Role-Based Access Control
- Protected Routes
- Secure Password Storage

---

## 📊 Database Tables

- users
- nurses
- wards
- shifts
- allocations
- leave_requests

---

## 🔌 REST API Modules

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile

### Nurses
- GET /api/nurses
- POST /api/nurses
- PUT /api/nurses/:id
- DELETE /api/nurses/:id

### Wards
- GET /api/wards
- POST /api/wards

### Shifts
- GET /api/shifts
- POST /api/shifts

### Allocations
- GET /api/allocations
- POST /api/allocations

### Leave Requests
- GET /api/leaves
- POST /api/leaves
- PUT /api/leaves/:id

---

## 📸 Screenshots

### Login Page
(Add Screenshot)

### Admin Dashboard
(Add Screenshot)

### Nurse Dashboard
(Add Screenshot)

### Allocation Management
(Add Screenshot)

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Lav363/nursing-allocation-management-system.git
```

### Backend Setup

```bash
cd backend
npm install
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Database Setup

1. Create a MySQL database.
2. Import `schema.sql`.
3. Configure database credentials in `.env`.

---

## 🎯 Key Highlights

- Full Stack Web Application
- ReactJS Frontend
- Node.js & Express Backend
- MySQL Database Integration
- RESTful API Architecture
- JWT Authentication
- Role-Based Authorization
- Responsive Dashboard UI
- Hospital Workforce Management

---

## 🔮 Future Enhancements

- Automatic Nurse Allocation Algorithm
- Email Notifications
- Real-Time Alerts
- Advanced Analytics Dashboard
- Docker Deployment

---

## 👩‍💻 Developer

**Lavanya K**

- LinkedIn: https://linkedin.com/in/lavanya-k363
- GitHub: https://github.com/Lav363