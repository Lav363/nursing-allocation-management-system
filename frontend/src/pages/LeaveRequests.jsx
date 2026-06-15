import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Check, X, ShieldAlert, CheckCircle2, History } from 'lucide-react';

const LeaveRequests = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // State for Admin View
  const [leaves, setLeaves] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeaves, setTotalLeaves] = useState(0);

  // State for Nurse View
  const [myLeaves, setMyLeaves] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // General States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, [page]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const response = await api.get('/api/leaves', {
          params: { page, limit: 8 }
        });
        setLeaves(response.data.leaves);
        setTotalPages(response.data.pagination.totalPages);
        setTotalLeaves(response.data.pagination.total);
      } else {
        const response = await api.get('/api/leaves/my');
        setMyLeaves(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Fetch leaves failed:', err);
      setError('Failed to load leave records data.');
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setActionLoading(true);

    if (new Date(fromDate) > new Date(toDate)) {
      setActionError('From date cannot be after To date.');
      setActionLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/leaves', {
        from_date: fromDate,
        to_date: toDate
      });

      setActionSuccess(response.data.message);
      setFromDate('');
      setToDate('');
      fetchLeaves();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Apply leave failed:', err);
      setActionError(err.response?.data?.message || 'Error occurred while submitting leave request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (window.confirm(`Are you sure you want to ${status} this leave request?` + 
      (status === 'approved' ? ' Overlapping scheduled shifts for this nurse will be removed automatically.' : ''))) {
      try {
        await api.put(`/api/leaves/${id}`, { status });
        fetchLeaves();
      } catch (err) {
        console.error('Update status failed:', err);
        alert(err.response?.data?.message || 'Error updating status.');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Leave Submissions</h1>
          <p>
            {isAdmin 
              ? 'Review, approve, and reject clinical leave applications for hospital nurses.' 
              : 'Submit new vacation intervals and review status history records.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="badge rejected" style={{ display: 'block', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Admin View Panel */}
      {isAdmin && (
        <>
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Accessing leave database...</p>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Pending & Past Leaves ({totalLeaves} Requests)</span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Nurse Name</th>
                        <th>Specialization</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Status</th>
                        <th>Submitted At</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.length > 0 ? (
                        leaves.map((leave) => {
                          const fromStr = new Date(leave.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
                          const toStr = new Date(leave.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
                          const createdStr = new Date(leave.created_at).toLocaleDateString();

                          return (
                            <tr key={leave.id}>
                              <td style={{ fontWeight: 600 }}>{leave.nurse_name}</td>
                              <td>{leave.specialization}</td>
                              <td>{fromStr}</td>
                              <td>{toStr}</td>
                              <td>
                                <span className={`badge ${
                                  leave.status === 'approved' ? 'approved' :
                                  leave.status === 'rejected' ? 'rejected' : 'pending'
                                }`}>
                                  {leave.status}
                                </span>
                              </td>
                              <td>{createdStr}</td>
                              <td style={{ textAlign: 'right' }}>
                                {leave.status === 'pending' ? (
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button
                                      className="btn btn-success"
                                      style={{ padding: '6px 10px' }}
                                      onClick={() => handleUpdateStatus(leave.id, 'approved')}
                                      title="Approve leave"
                                    >
                                      <Check size={14} />
                                      Approve
                                    </button>
                                    <button
                                      className="btn btn-danger"
                                      style={{ padding: '6px 10px' }}
                                      onClick={() => handleUpdateStatus(leave.id, 'rejected')}
                                      title="Reject leave"
                                    >
                                      <X size={14} />
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '10px' }}>Processed</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                            No leave requests found in the system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
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
              </div>
            </div>
          )}
        </>
      )}

      {/* Nurse View Panel */}
      {!isAdmin && (
        <div className="allocation-layout">
          {/* Apply Leave Form */}
          <div className="allocation-form-panel">
            <h3 style={{ marginBottom: '20px', fontSize: '1.05rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Request Leave Interval
            </h3>
            
            <form onSubmit={handleApplyLeave}>
              {actionError && (
                <div className="badge rejected" style={{ display: 'flex', gap: '6px', width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', alignItems: 'center' }}>
                  <ShieldAlert size={14} style={{ minWidth: '14px' }} />
                  <span style={{ fontSize: '0.775rem' }}>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="badge approved" style={{ display: 'flex', gap: '6px', width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', alignItems: 'center' }}>
                  <CheckCircle2 size={14} style={{ minWidth: '14px' }} />
                  <span style={{ fontSize: '0.775rem' }}>{actionSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Start Leave Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Leave Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={actionLoading}>
                {actionLoading ? 'Submitting...' : 'Apply Leave'}
              </button>
            </form>
          </div>

          {/* Leave Submission History */}
          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--primary)" />
                My Leaves History
              </span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading records history...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date Requested</th>
                        <th>Leave Start Date</th>
                        <th>Leave End Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLeaves.length > 0 ? (
                        myLeaves.map((leave) => {
                          const createdStr = new Date(leave.created_at).toLocaleDateString();
                          const fromStr = new Date(leave.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
                          const toStr = new Date(leave.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

                          return (
                            <tr key={leave.id}>
                              <td>{createdStr}</td>
                              <td style={{ fontWeight: 500 }}>{fromStr}</td>
                              <td style={{ fontWeight: 500 }}>{toStr}</td>
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
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                            No leaves applied yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;
