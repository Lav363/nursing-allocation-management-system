import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Trash2, ShieldAlert, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

const AllocationPanel = () => {
  // Lists for dropdown selection
  const [activeNurses, setActiveNurses] = useState([]);
  const [wards, setWards] = useState([]);
  const [shifts, setShifts] = useState([]);
  
  // Roster listing state
  const [allocations, setAllocations] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10)); // Default today
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAllocations, setTotalAllocations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Manual Allocation Form Fields
  const [formNurseId, setFormNurseId] = useState('');
  const [formWardId, setFormWardId] = useState('');
  const [formShiftId, setFormShiftId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Auto Allocation Fields
  const [autoAllocDate, setAutoAllocDate] = useState(new Date().toISOString().slice(0, 10));
  const [autoAllocLoading, setAutoAllocLoading] = useState(false);
  const [autoAllocSuccess, setAutoAllocSuccess] = useState('');

  useEffect(() => {
    fetchFormData();
    fetchAllocations();
  }, [page, filterDate]);

  const fetchFormData = async () => {
    try {
      // Get all active nurses
      const nursesRes = await api.get('/api/nurses', { params: { limit: 100 } });
      const activeOnly = nursesRes.data.nurses.filter(n => n.status === 'active');
      setActiveNurses(activeOnly);

      // Get wards
      const wardsRes = await api.get('/api/wards');
      setWards(wardsRes.data);

      // Get shifts
      const shiftsRes = await api.get('/api/shifts');
      setShifts(shiftsRes.data);
    } catch (err) {
      console.error('Fetch form resources failed:', err);
    }
  };

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/allocations', {
        params: {
          page,
          limit: 8,
          date: filterDate
        }
      });
      setAllocations(response.data.allocations);
      setTotalPages(response.data.pagination.totalPages);
      setTotalAllocations(response.data.pagination.total);
      setLoading(false);
    } catch (err) {
      console.error('Fetch allocations failed:', err);
      setError('Failed to fetch allocations database.');
      setLoading(false);
    }
  };

  const handleManualAllocate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      const response = await api.post('/api/allocations', {
        nurse_id: formNurseId,
        ward_id: formWardId,
        shift_id: formShiftId,
        date: formDate
      });

      setFormSuccess(response.data.message);
      // Reset form selection but keep date
      setFormNurseId('');
      setFormWardId('');
      setFormShiftId('');

      // Refresh allocations list if on same date
      if (formDate === filterDate) {
        fetchAllocations();
      }

      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err) {
      console.error('Manual allocation failed:', err);
      setFormError(err.response?.data?.message || 'Error occurred while saving allocation.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAutoAllocate = async (e) => {
    e.preventDefault();
    setAutoAllocSuccess('');
    setFormError('');
    setAutoAllocLoading(true);

    try {
      const response = await api.post('/api/allocations/auto', {
        date: autoAllocDate
      });

      setAutoAllocSuccess(response.data.message);
      
      // Refresh list if date matches
      if (autoAllocDate === filterDate) {
        setPage(1);
        fetchAllocations();
      }

      setTimeout(() => setAutoAllocSuccess(''), 5000);
    } catch (err) {
      console.error('Auto allocation failed:', err);
      setFormError(err.response?.data?.message || 'Error running auto-allocation algorithm.');
    } finally {
      setAutoAllocLoading(false);
    }
  };

  const handleDeleteAllocation = async (id) => {
    if (window.confirm('Are you sure you want to remove this shift allocation record?')) {
      try {
        await api.delete(`/api/allocations/${id}`);
        fetchAllocations();
      } catch (err) {
        console.error('Delete allocation failed:', err);
        alert(err.response?.data?.message || 'Error removing allocation.');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Duty Allocations</h1>
          <p>Assign nurses to specific wards and shift slots manually, or trigger the auto-allocation algorithm.</p>
        </div>
      </div>

      <div className="allocation-layout">
        {/* Left Side Panels: Manual Allocation & Auto Allocation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Manual Allocation Panel */}
          <div className="allocation-form-panel">
            <h3 style={{ marginBottom: '16px', fontSize: '1.05rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Manual Allocation Form
            </h3>
            
            <form onSubmit={handleManualAllocate}>
              {formError && (
                <div className="badge rejected" style={{ display: 'flex', gap: '6px', width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', alignItems: 'center' }}>
                  <ShieldAlert size={14} style={{ minWidth: '14px' }} />
                  <span style={{ fontSize: '0.775rem' }}>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="badge approved" style={{ display: 'flex', gap: '6px', width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', alignItems: 'center' }}>
                  <CheckCircle2 size={14} style={{ minWidth: '14px' }} />
                  <span style={{ fontSize: '0.775rem' }}>{formSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nurse Staff</label>
                <select
                  className="form-control"
                  value={formNurseId}
                  onChange={(e) => setFormNurseId(e.target.value)}
                  required
                >
                  <option value="">Select available nurse...</option>
                  {activeNurses.map(nurse => (
                    <option key={nurse.id} value={nurse.id}>
                      {nurse.name} ({nurse.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Hospital Ward</label>
                <select
                  className="form-control"
                  value={formWardId}
                  onChange={(e) => setFormWardId(e.target.value)}
                  required
                >
                  <option value="">Select ward location...</option>
                  {wards.map(ward => (
                    <option key={ward.id} value={ward.id}>
                      {ward.ward_name} (Max: {ward.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Duty Shift Slot</label>
                <select
                  className="form-control"
                  value={formShiftId}
                  onChange={(e) => setFormShiftId(e.target.value)}
                  required
                >
                  <option value="">Select duty timing...</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shift_name} ({shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Allocation Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }} disabled={formLoading}>
                {formLoading ? 'Allocating...' : 'Assign Staff'}
              </button>
            </form>
          </div>

          {/* Auto Allocation Panel */}
          <div className="allocation-form-panel" style={{ border: '1px solid rgba(59, 130, 246, 0.25)' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              <Sparkles size={18} />
              Auto-Scheduler Engine
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
              Distribute work schedules automatically based on daily ward vacancies and workload history in the last 7 days.
            </p>

            <form onSubmit={handleAutoAllocate}>
              {autoAllocSuccess && (
                <div className="badge approved" style={{ display: 'flex', gap: '6px', width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', alignItems: 'center' }}>
                  <CheckCircle2 size={14} style={{ minWidth: '14px' }} />
                  <span style={{ fontSize: '0.775rem' }}>{autoAllocSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Target Roster Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={autoAllocDate}
                  onChange={(e) => setAutoAllocDate(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-success" 
                style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' }} 
                disabled={autoAllocLoading}
              >
                {autoAllocLoading ? (
                  'Running Optimizer...'
                ) : (
                  <>
                    <Sparkles size={16} />
                    Run Auto-Allocation
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Roster Listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Roster Filter bar */}
          <div className="card" style={{ padding: '16px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Filter size={16} color="var(--primary)" />
                Roster Filter Options
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '0.85rem' }}>View Date:</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '180px', padding: '6px 12px' }}
                  value={filterDate}
                  onChange={(e) => {
                    setFilterDate(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Allocations Table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                Shift Schedule Roster ({totalAllocations} Total Duties)
              </span>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Accessing allocations database...</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Nurse Staff</th>
                          <th>Specialization</th>
                          <th>Ward Location</th>
                          <th>Assigned Shift</th>
                          <th>Timings</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations.length > 0 ? (
                          allocations.map((alloc) => (
                            <tr key={alloc.id}>
                              <td style={{ fontWeight: 600 }}>{alloc.nurse_name}</td>
                              <td>{alloc.specialization}</td>
                              <td>{alloc.ward_name}</td>
                              <td>
                                <span className={`badge ${
                                  alloc.shift_name.includes('Morning') ? 'approved' : 
                                  alloc.shift_name.includes('Evening') ? 'pending' : 'rejected'
                                }`}>
                                  {alloc.shift_name}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {alloc.start_time.slice(0, 5)} - {alloc.end_time.slice(0, 5)}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid #fca5a5', color: '#ef4444' }}
                                  onClick={() => handleDeleteAllocation(alloc.id)}
                                  title="Remove Allocation"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                              No shift allocations registered for this date.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <span className="pagination-info">
                        Page <b>{page}</b> of <b>{totalPages}</b>
                      </span>
                      <div className="pagination-actions">
                        <button
                          className="pagination-btn"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        >
                          Previous
                        </button>
                        <button
                          className="pagination-btn"
                          disabled={page === totalPages}
                          onClick={() => setPage(page + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationPanel;
