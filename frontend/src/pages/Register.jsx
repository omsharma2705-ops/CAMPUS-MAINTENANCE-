import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cardId: '',
    role: 'student',
    trade: '',
    department: 'Computer Science & Engineering',
    phone: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const departments = [
    'Computer Science & Engineering',
    'Electronics & Comm Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Hostel Block A',
    'Hostel Block B',
    'Campus Central Library',
    'Admin & Faculty Block',
    'Sports Complex / Cafeteria',
    'Facilities Directorate'
  ];

  const trades = [
    'Electrician',
    'Plumber',
    'Carpenter',
    'IT Technician',
    'HVAC Technician',
    'Civil Mason / Painter',
    'Sanitation & Cleaning'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.msg);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏛️</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Join CampusFix</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            University I-Card Authentication & Maintenance Network
          </p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            border: '1px solid rgba(239, 68, 68, 0.4)', 
            color: '#fca5a5', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '1.5rem', 
            fontSize: '0.85rem' 
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Campus Email *</label>
              <input
                type="email"
                className="form-control"
                placeholder="e.g. rahul@campus.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">University I-Card No. *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CAMPUS-2024-4102"
                value={formData.cardId}
                onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Portal Role *</label>
              <select
                className="form-control"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">🎓 Student / Faculty Scholar</option>
                <option value="worker">👨‍🔧 Maintenance Tradesman</option>
                <option value="admin">👨‍💼 Facilities Manager / Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone (SMS Alerts)</label>
              <input
                type="tel"
                className="form-control"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {formData.role === 'worker' && (
            <div className="form-group">
              <label className="form-label">Trade Specialization *</label>
              <select
                className="form-control"
                value={formData.trade || trades[0]}
                onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
              >
                {trades.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Department / Campus Block</label>
            <select
              className="form-control"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-control"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '0.5rem' }}>
            {loading ? 'Creating University Account...' : 'Register with University I-Card'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
