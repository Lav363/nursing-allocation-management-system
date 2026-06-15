import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, LogOut, Activity } from 'lucide-react';

const Navbar = ({ toggleSidebar, sidebarCollapsed }) => {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="toggle-sidebar-btn" onClick={toggleSidebar} title="Toggle Sidebar">
          <Menu size={20} />
        </button>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Hospital Workforce Management Portal
        </span>
      </div>

      <div className="navbar-right">
        <div className="navbar-actions">
          <button className="navbar-btn" title="View Notifications">
            <Bell size={20} />
            <span className="badge-dot"></span>
          </button>
        </div>

        <div className="user-profile-dropdown" title="User Session Profile">
          <div className="user-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Loading...'}</span>
            <span className="user-role">{user?.role === 'admin' ? 'Administrator' : 'Nurse Staff'}</span>
          </div>
          <button 
            className="navbar-btn" 
            onClick={logout} 
            title="Sign Out" 
            style={{ marginLeft: '12px', color: 'var(--danger)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
