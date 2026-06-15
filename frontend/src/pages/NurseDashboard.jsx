import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  BadgeHelp, 
  Stethoscope, 
  Save, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';

const NurseDashboard = () => {
  const { user, updateProfile } = useAuth();
  
  const [roster, setRoster] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [specialization, setSpecialization] = useState(user?.specialization || 'General Medicine');
  
  const [loading, setLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState({ success: false, text: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNurseData();
  }, []);

  const fetchNurseData = async () => {
    try {
      setLoading(true);
      // Fetch roster allocations
      const rosterRes = await api.get('/api/allocations/my');
      setRoster(rosterRes.data);

      // Fetch leave requests
      const leavesRes = await api.get('/api/leaves/my');
      setLeaves(leavesRes.data);

      setLoading(false);
    } catch (err) {
      console.error('Fetch nurse dashboard data failed:', err);
      setError('Failed to load portal roster details.');
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ success: false, text: '' });
    
    const res = await updateProfile(specialization);
    if (res.success) {
      setProfileMsg({ success: true, text: 'Your clinical specialization has been updated!' });
    } else {
      setProfileMsg({ success: false, text: res.message });
    }

    setTimeout(() => {
      setProfileMsg({ success: false, text: '' });
    }, 4000);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your roster schedule...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Welcome, Nurse {user?.name}</h1>
          <p>View your upcoming roster shifts and manage your clinic specialization profile.</p>
        </div>
        <span className={`badge ${user?.nurseStatus === 'active' ? 'approved' : 'rejected'}`}>
          Status: {user?.nurseStatus === 'active' ? 'Active Duty' : 'On Leave / Inactive'}
        </span>
      </div>

      {error && (
        <div className="badge rejected" style={{ display: 'block', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div className="allocation-layout">
        {/* Left Side: Profile Specialization details */}
        <div className="allocation-form-panel">
          <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            Staff Profile Config
          </h3>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="text"
                className="form-control"
                value={user?.email}
                disabled
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Contact admin to update email address.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Specialization</label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-control"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Intensive Care (ICU)">Intensive Care (ICU)</option>
                  <option value="Emergency Room (ER)">Emergency Room (ER)</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Oncology">Oncology</option>
                </select>
              </div>
            </div>

            {profileMsg.text && (
              <div 
                className={`badge ${profileMsg.success ? 'approved' : 'rejected'}`} 
                style={{ display: 'block', width: '100%', padding: '8px', textAlign: 'center', marginBottom: '16px' }}
              >
                {profileMsg.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Save size={16} />
              Save Specialization
            </button>
          </form>
        </div>

        {/* Right Side: Roster Schedule Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} color="var(--primary)" />
                My Roster Schedule
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {roster.length > 0 ? (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Ward / Location</th>
                        <th>Shift Type</th>
                        <th>Shift Timing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((alloc) => {
                        const dateStr = new Date(alloc.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'UTC'
                        });

                        return (
                          <tr key={alloc.id}>
                            <td style={{ fontWeight: 600 }}>{dateStr}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={14} color="var(--text-secondary)" />
                                {alloc.ward_name}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${
                                alloc.shift_name.includes('Morning') ? 'approved' : 
                                alloc.shift_name.includes('Evening') ? 'pending' : 'rejected'
                              }`}>
                                {alloc.shift_name}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={14} color="var(--text-secondary)" />
                                {alloc.start_time.slice(0, 5)} - {alloc.end_time.slice(0, 5)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <BadgeHelp size={32} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
                  <p>You have no scheduled shifts at this time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Leave History */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Leave Submissions History</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {leaves.length > 0 ? (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Created At</th>
                        <th>Leave Period</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((leave) => {
                        const createStr = new Date(leave.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });
                        const fromStr = new Date(leave.from_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'UTC'
                        });
                        const toStr = new Date(leave.to_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: 'UTC'
                        });

                        return (
                          <tr key={leave.id}>
                            <td>{createStr}</td>
                            <td style={{ fontWeight: 500 }}>{fromStr} to {toStr}</td>
                            <td>
                              <span className={`badge ${
                                leave.status === 'approved' ? 'approved' :
                                leave.status === 'rejected' ? 'rejected' : 'pending'
                              }`}>
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p>No leave requests found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
