import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Lock, Mail } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // Role toggle: admin or nurse
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
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
          <h1 className="login-title">NurseAssign Pro</h1>
          <p className="login-subtitle">Hospital Workforce Management Suite</p>
        </div>

        {sessionExpired && (
          <div className="badge pending" style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
            Session expired. Please log in again.
          </div>
        )}

        {error && (
          <div className="badge rejected" style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <div className="role-toggle">
          <button
            type="button"
            className={`role-toggle-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            Admin Panel
          </button>
          <button
            type="button"
            className={`role-toggle-btn ${role === 'nurse' ? 'active' : ''}`}
            onClick={() => setRole('nurse')}
          >
            Nurse Portal
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-control"
                placeholder="you@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

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
            {loading ? <div className="loading-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div> : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
