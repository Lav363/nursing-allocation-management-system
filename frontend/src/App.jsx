import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import NurseDashboard from './pages/NurseDashboard';
import NurseManagement from './pages/NurseManagement';
import WardManagement from './pages/WardManagement';
import ShiftManagement from './pages/ShiftManagement';
import AllocationPanel from './pages/AllocationPanel';
import LeaveRequests from './pages/LeaveRequests';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private Shell Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Fallback routing */}
            <Route index element={<Navigate to="/login" replace />} />
            
            {/* Admin-only Routes */}
            <Route 
              path="admin-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="nurses" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <NurseManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="wards" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <WardManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="shifts" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ShiftManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="allocations" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AllocationPanel />
                </ProtectedRoute>
              } 
            />

            {/* Nurse-only Routes */}
            <Route 
              path="nurse-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['nurse']}>
                  <NurseDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Shared Routes */}
            <Route 
              path="leaves" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'nurse']}>
                  <LeaveRequests />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
