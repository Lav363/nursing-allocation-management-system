import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Lock, Mail, User, ShieldAlert } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('nurse'); // Default role 'nurse'
  const [specialization, setSpecialization] = useState('General Medicine');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await register(name, email, password, role, role === 'nurse' ? specialization : '');
    setLoading(false);

    if (res.success) {
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/nurse-dashboard');
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <HeartPulse size={28} />
          </div>
          <h1 className="login-title">Create Account</h1>
          <p className="login-subtitle">Hospital Workforce Portal Registration</p>
        </div>

        {error && (
          <div className="badge rejected" style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <div className="role-toggle">
          <button
            type="button"
            className={`role-toggle-btn ${role === 'nurse' ? 'active' : ''}`}
            onClick={() => setRole('nurse')}
          >
            Nurse Profile
          </button>
          <button
            type="button"
            className={`role-toggle-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            Admin Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Dr./Nurse Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-control"
                placeholder="jane.doe@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          {role === 'nurse' && (
            <div className="form-group">
              <label className="form-label">Specialization</label>
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
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', height: '42px' }}
            disabled={loading}
          >
            {loading ? <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
