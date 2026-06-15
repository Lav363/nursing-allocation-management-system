import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

const NurseManagement = () => {
  const [nurses, setNurses] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNurses, setTotalNurses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNurseId, setSelectedNurseId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('General Medicine');
  const [status, setStatus] = useState('active');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Search debounce ref
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchNurses();
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [page]);

  const fetchNurses = async (searchVal = search) => {
    try {
      setLoading(true);
      const response = await api.get('/api/nurses', {
        params: {
          page,
          limit: 8,
          search: searchVal
        }
      });
      setNurses(response.data.nurses);
      setTotalPages(response.data.pagination.totalPages);
      setTotalNurses(response.data.pagination.total);
      setLoading(false);
    } catch (err) {
      console.error('Fetch nurses failed:', err);
      setError('Failed to fetch nurses records.');
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchNurses(value);
    }, 4500); // 450ms debounce
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedNurseId(null);
    setName('');
    setEmail('');
    setPassword('');
    setSpecialization('General Medicine');
    setStatus('active');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (nurse) => {
    setIsEditMode(true);
    setSelectedNurseId(nurse.id);
    setName(nurse.name);
    setEmail(nurse.email);
    setPassword(''); // leave blank for no password change
    setSpecialization(nurse.specialization);
    setStatus(nurse.status);
    setFormError('');
    setShowModal(true);
  };

  const handleSaveNurse = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const payload = {
      name,
      email,
      specialization,
      status
    };

    if (password) {
      payload.password = password;
    }

    try {
      if (isEditMode) {
        await api.put(`/api/nurses/${selectedNurseId}`, payload);
      } else {
        if (!password) {
          setFormError('Password is required for a new nurse account.');
          setFormLoading(false);
          return;
        }
        payload.password = password;
        await api.post('/api/nurses', payload);
      }
      
      setShowModal(false);
      fetchNurses();
    } catch (err) {
      console.error('Save nurse failed:', err);
      setFormError(err.response?.data?.message || 'Error occurred while saving nurse record.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteNurse = async (id) => {
    if (window.confirm('Are you sure you want to delete this nurse? This will delete their user account, profile and allocation history.')) {
      try {
        await api.delete(`/api/nurses/${id}`);
        fetchNurses();
      } catch (err) {
        console.error('Delete nurse failed:', err);
        alert(err.response?.data?.message || 'Error deleting nurse.');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Nurses Directory</h1>
          <p>Register, update clinical specialization and monitor active statuses.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          Register Nurse
        </button>
      </div>

      {error && (
        <div className="badge rejected" style={{ display: 'block', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-input-icon" />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by name, email, specialization..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Showing <b>{nurses.length}</b> of <b>{totalNurses}</b> registered staff
        </div>
      </div>

      {/* Roster Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Accessing nurses registry...</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Specialization</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nurses.length > 0 ? (
                    nurses.map((nurse) => (
                      <tr key={nurse.id}>
                        <td style={{ fontWeight: 600 }}>{nurse.name}</td>
                        <td>{nurse.email}</td>
                        <td>{nurse.specialization}</td>
                        <td>
                          <span className={`badge ${nurse.status === 'active' ? 'approved' : 'rejected'}`}>
                            {nurse.status}
                          </span>
                        </td>
                        <td>{new Date(nurse.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px' }}
                              onClick={() => handleOpenEditModal(nurse)}
                              title="Edit Nurse details"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid #fca5a5', color: '#ef4444' }}
                              onClick={() => handleDeleteNurse(nurse.id)}
                              title="Remove Nurse account"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No nurses found matching the search criteria.
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
          </div>
        </>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{isEditMode ? 'Modify Nurse Record' : 'Register New Nurse'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNurse}>
              <div className="modal-body">
                {formError && (
                  <div className="badge rejected" style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g., Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="E.g., sarah.j@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password {isEditMode && '(leave blank to keep current)'}</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!isEditMode}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Specialization</label>
                  <select
                    className="form-control"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Intensive Care (ICU)">Intensive Care (ICU)</option>
                    <option value="Emergency Room (ER)">Emergency Room (ER)</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Oncology">Oncology</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Service Status</label>
                  <select
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="active">Active Duty</option>
                    <option value="inactive">Inactive / On Leave</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NurseManagement;
