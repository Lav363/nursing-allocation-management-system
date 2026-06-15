import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  DoorOpen, 
  CalendarDays, 
  CalendarCheck, 
  CalendarHeart,
  HeartPulse 
} from 'lucide-react';

const Sidebar = ({ collapsed }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <HeartPulse size={24} color="#3b82f6" style={{ minWidth: '24px' }} />
          <span className="sidebar-logo-text">NurseAssign Pro</span>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <ul className="sidebar-menu">
          {isAdmin ? (
            <>
              <li>
                <NavLink 
                  to="/admin-dashboard" 
                  className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={20} />
                  <span className="sidebar-menu-item-text">Dashboard</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/nurses" 
                  className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                  <Users size={20} />
                  <span className="sidebar-menu-item-text">Nurses</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/wards" 
                  className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                  <DoorOpen size={20} />
                  <span className="sidebar-menu-item-text">Wards</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/shifts" 
                  className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                  <CalendarDays size={20} />
                  <span className="sidebar-menu-item-text">Shifts</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/allocations" 
                  className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                  <CalendarCheck size={20} />
                  <span className="sidebar-menu-item-text">Allocations</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/leaves" 
                  className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                  <CalendarHeart size={20} />
                  <span className="sidebar-menu-item-text">Leave Requests</span>
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink 
                  to="/nurse-dashboard" 
                  className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                  <LayoutDashboard size={20} />
                  <span className="sidebar-menu-item-text">My Schedule</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/leaves" 
                  className={({ isActive }) => `sidebar-menu-item ${isActive ? 'active' : ''}`}
                >
                  <CalendarHeart size={20} />
                  <span className="sidebar-menu-item-text">Apply Leave</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-text">v1.0.0 © AffordMed</span>
      </div>
    </aside>
  );
};

export default Sidebar;
