import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="brand-logo">
          <span style={{ fontSize: '1.5rem' }}>🏛️</span>
          <span>CampusFix</span>
          <span className="brand-badge">{user.role}</span>
        </Link>

        <div className="nav-links">
          <Link 
            to="/dashboard" 
            className={`nav-btn ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>

          {user.role === 'student' && (
            <Link 
              to="/submit" 
              className={`nav-btn ${location.pathname === '/submit' ? 'active' : ''}`}
            >
              ➕ Raise Complaint
            </Link>
          )}

          {user.role === 'admin' && (
            <>
              <Link 
                to="/admin/staff" 
                className={`nav-btn ${location.pathname === '/admin/staff' ? 'active' : ''}`}
              >
                👨‍🔧 Maintenance Staff
              </Link>
              <Link 
                to="/admin/analytics" 
                className={`nav-btn ${location.pathname === '/admin/analytics' ? 'active' : ''}`}
              >
                📈 Analytics & KPIs
              </Link>
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{user.department || user.role}</div>
            </div>
            <button onClick={handleLogout} className="btn btn-outline btn-sm" title="Logout">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
