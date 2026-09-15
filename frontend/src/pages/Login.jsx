import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const { login, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Support email or I-Card login
    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.msg);
    }
  };

  // 1-Click University SSO / OAuth2 simulation
  const handleUniversitySSO = async (role = 'student') => {
    try {
      setSsoLoading(true);
      setError('');
      const res = await axios.post(`${API_URL}/auth/sso`, {
        provider: 'University SAML/OAuth2 SSO',
        role,
        email: role === 'admin' ? 'admin@campus.edu' : (role === 'worker' ? 'worker@campus.edu' : 'student@campus.edu')
      });

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'SSO Authentication Failed');
    } finally {
      setSsoLoading(false);
    }
  };

  // Demo shortcut login helper
  const fillDemo = (roleKey, rolePass) => {
    setIdentifier(roleKey);
    setPassword(rolePass);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff' }}>CampusFix Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            University Maintenance Complaint & Facilities Management
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid rgba(239, 68, 68, 0.4)', 
            color: '#fca5a5', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '1.25rem', 
            fontSize: '0.85rem' 
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* University SSO / OAuth2 Quick Button */}
        <button
          type="button"
          onClick={() => handleUniversitySSO('student')}
          disabled={ssoLoading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: 'var(--radius-sm)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            transition: 'all 0.2s',
          }}
        >
          <span>🌐</span>
          <span>{ssoLoading ? 'Connecting to University SSO...' : 'Sign In with University SSO / OAuth2'}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textTransform: 'uppercase' }}>OR Standard Auth</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Campus Email or University I-Card</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>🪪 I-Card Supported</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. student@campus.edu or CAMPUS-STU-2024-4102"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Authenticating...' : 'Sign In to Campus Portal'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Need an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Register with University I-Card
          </Link>
        </div>

        {/* Demo Fast Logins with I-Card & Roles */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', textAlign: 'center', marginBottom: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Demo Auto-Fill Credentials:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-outline btn-sm" 
              style={{ fontSize: '0.72rem', textAlign: 'left', padding: '0.4rem 0.6rem' }}
              onClick={() => fillDemo('CAMPUS-ADM-001', 'admin123')}
            >
              👨‍💼 <strong>Admin / Manager</strong>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>CAMPUS-ADM-001</div>
            </button>
            <button 
              type="button" 
              className="btn btn-outline btn-sm" 
              style={{ fontSize: '0.72rem', textAlign: 'left', padding: '0.4rem 0.6rem' }}
              onClick={() => fillDemo('CAMPUS-EMP-101', 'worker123')}
            >
              ⚡ <strong>Electrician</strong>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>CAMPUS-EMP-101</div>
            </button>
            <button 
              type="button" 
              className="btn btn-outline btn-sm" 
              style={{ fontSize: '0.72rem', textAlign: 'left', padding: '0.4rem 0.6rem' }}
              onClick={() => fillDemo('CAMPUS-EMP-102', 'worker123')}
            >
              🚰 <strong>Plumber</strong>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>CAMPUS-EMP-102</div>
            </button>
            <button 
              type="button" 
              className="btn btn-outline btn-sm" 
              style={{ fontSize: '0.72rem', textAlign: 'left', padding: '0.4rem 0.6rem' }}
              onClick={() => fillDemo('CAMPUS-STU-2024-4102', 'student123')}
            >
              🎓 <strong>Student Scholar</strong>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>CAMPUS-STU-2024-4102</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
