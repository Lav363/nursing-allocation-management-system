import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, X, Clock } from 'lucide-react';

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState(null);

  // Form Fields
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('15:00');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/shifts');
      setShifts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Fetch shifts failed:', err);
      setError('Failed to fetch hospital shifts inventory.');
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedShiftId(null);
    setShiftName('');
    setStartTime('07:00');
    setEndTime('15:00');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (shift) => {
    setIsEditMode(true);
    setSelectedShiftId(shift.id);
    setShiftName(shift.shift_name);
    // Slice "HH:MM:SS" into "HH:MM" for HTML input
    setStartTime(shift.start_time.slice(0, 5));
    setEndTime(shift.end_time.slice(0, 5));
    setFormError('');
    setShowModal(true);
  };

  const handleSaveShift = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    // Ensure format is HH:MM:SS
    const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const formattedEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    const payload = {
      shift_name: shiftName,
      start_time: formattedStartTime,
      end_time: formattedEndTime
    };

    try {
      if (isEditMode) {
        await api.put(`/api/shifts/${selectedShiftId}`, payload);
      } else {
        await api.post('/api/shifts', payload);
      }
      setShowModal(false);
      fetchShifts();
    } catch (err) {
      console.error('Save shift failed:', err);
      setFormError(err.response?.data?.message || 'Error occurred while saving shift schedule.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteShift = async (id) => {
    if (window.confirm('Are you sure you want to delete this shift? All allocations tied to this shift will be removed.')) {
      try {
        await api.delete(`/api/shifts/${id}`);
        fetchShifts();
      } catch (err) {
        console.error('Delete shift failed:', err);
        alert(err.response?.data?.message || 'Error deleting shift.');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Workplace Shifts</h1>
          <p>Define custom morning, evening or night duty slots and timing boundaries.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          Create Shift
        </button>
      </div>

      {error && (
        <div className="badge rejected" style={{ display: 'block', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Accessing shift configurations...</p>
        </div>
      ) : (
        <div className="timeline">
          {shifts.length > 0 ? (
            shifts.map((shift) => (
              <div className="timeline-item" key={shift.id}>
                <div className="timeline-time">
                  <span className="timeline-time-label">Shift Duration</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={16} />
                    {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                  </span>
                </div>
                <div className="timeline-details">
                  <div>
                    <h3 className="timeline-name">{shift.shift_name}</h3>
                    <p className="timeline-range">
                      Scheduled time bounds for active hospital ward service.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleOpenEditModal(shift)}
                      title="Edit Shift details"
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ backgroundColor: 'transparent', border: '1px solid #fca5a5', color: '#ef4444' }}
                      onClick={() => handleDeleteShift(shift.id)}
                      title="Remove Shift configuration"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              No shifts registered. Click "Create Shift" to define duty time slots.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{isEditMode ? 'Modify Shift Configuration' : 'Define Shift Slot'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveShift}>
              <div className="modal-body">
                {formError && (
                  <div className="badge rejected" style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Shift Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g., Morning Shift"
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
