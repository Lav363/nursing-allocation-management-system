import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const WardManagement = () => {
  const [wards, setWards] = useState([]);
  const [occupancy, setOccupancy] = useState({}); // key: wardId, value: activeAllocationsCount
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWardId, setSelectedWardId] = useState(null);

  // Form Fields
  const [wardName, setWardName] = useState('');
  const [capacity, setCapacity] = useState(5);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchWardsAndOccupancy();
  }, []);

  const fetchWardsAndOccupancy = async () => {
    try {
      setLoading(true);
      const wardsRes = await api.get('/api/wards');
      const allocationsRes = await api.get('/api/allocations', {
        params: {
          date: new Date().toISOString().slice(0, 10),
          limit: 100 // fetch all today's allocations to determine occupancy
        }
      });

      // Calculate occupancy counts for today
      const counts = {};
      allocationsRes.data.allocations.forEach(alloc => {
        counts[alloc.ward_id] = (counts[alloc.ward_id] || 0) + 1;
      });

      setWards(wardsRes.data);
      setOccupancy(counts);
      setLoading(false);
    } catch (err) {
      console.error('Fetch wards failed:', err);
      setError('Failed to fetch hospital wards details.');
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedWardId(null);
    setWardName('');
    setCapacity(5);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (ward) => {
    setIsEditMode(true);
    setSelectedWardId(ward.id);
    setWardName(ward.ward_name);
    setCapacity(ward.capacity);
    setFormError('');
    setShowModal(true);
  };

  const handleSaveWard = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    const payload = {
      ward_name: wardName,
      capacity: parseInt(capacity)
    };

    try {
      if (isEditMode) {
        await api.put(`/api/wards/${selectedWardId}`, payload);
      } else {
        await api.post('/api/wards', payload);
      }
      setShowModal(false);
      fetchWardsAndOccupancy();
    } catch (err) {
      console.error('Save ward failed:', err);
      setFormError(err.response?.data?.message || 'Error occurred while saving ward details.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteWard = async (id) => {
    if (window.confirm('Are you sure you want to delete this ward? All shift allocations linked to this ward will be removed.')) {
      try {
        await api.delete(`/api/wards/${id}`);
        fetchWardsAndOccupancy();
      } catch (err) {
        console.error('Delete ward failed:', err);
        alert(err.response?.data?.message || 'Error deleting ward.');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Hospital Wards</h1>
          <p>Configure clinical wards and monitor real-time nurse staffing capacity ratios.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} />
          Create Ward
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
          <p>Accessing ward inventory...</p>
        </div>
      ) : (
        <div className="ward-grid">
          {wards.length > 0 ? (
            wards.map((ward) => {
              const currentOccupancy = occupancy[ward.id] || 0;
              const percent = Math.min(100, Math.round((currentOccupancy / ward.capacity) * 100));
              
              // Color class based on percentage
              let barColorClass = '';
              if (percent >= 90) barColorClass = 'danger';
              else if (percent >= 70) barColorClass = 'warning';

              return (
                <div className="ward-card" key={ward.id}>
                  <div className="ward-header">
                    <span className="ward-title">{ward.ward_name}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 8px', border: 'none' }}
                        onClick={() => handleOpenEditModal(ward)}
                        title="Edit Ward"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 8px', backgroundColor: 'transparent', border: 'none', color: '#ef4444' }}
                        onClick={() => handleDeleteWard(ward.id)}
                        title="Delete Ward"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="capacity-container">
                    <div className="capacity-label">
                      <span>Today's Staffing Load:</span>
                      <span>{currentOccupancy} / {ward.capacity} Nurses</span>
                    </div>
                    <div className="capacity-bar-bg">
                      <div 
                        className={`capacity-bar-fill ${barColorClass}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'block', textAlign: 'right' }}>
                      {percent}% Capacity Occupied
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              No hospital wards have been registered yet. Click "Create Ward" to add one.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{isEditMode ? 'Modify Ward Configuration' : 'Create New Ward'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveWard}>
              <div className="modal-body">
                {formError && (
                  <div className="badge rejected" style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Ward Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g., Intensive Care Unit (ICU) B"
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nurse Roster Capacity (Per Shift)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="100"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Maximum number of nurses that can be simultaneously assigned to this ward in any single shift.
                  </span>
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

export default WardManagement;
