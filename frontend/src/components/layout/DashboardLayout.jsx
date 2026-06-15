import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="app-container">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className={`main-wrapper ${sidebarCollapsed ? 'expanded' : ''}`}>
        <Navbar toggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
