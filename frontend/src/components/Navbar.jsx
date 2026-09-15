import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

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
                to="/stores" 
                className={`nav-btn ${location.pathname === '/stores' ? 'active' : ''}`}
              >
                📦 Stores & Inventory
              </Link>
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
                📈 Analytics & Reports
              </Link>
            </>
          )}

          {/* Notification Center */}
          <NotificationCenter />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                <span>{user.name}</span>
                {user.cardId && (
                  <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                    🪪 {user.cardId}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                {user.trade ? `⚡ ${user.trade}` : (user.department || user.role)}
              </div>
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
