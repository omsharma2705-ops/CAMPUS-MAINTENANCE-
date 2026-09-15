import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import QRScannerModal from './QRScannerModal';
import QRGeneratorModal from './QRGeneratorModal';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showQrGenerator, setShowQrGenerator] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile menu on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        {/* Brand Logo */}
        <Link to="/dashboard" className="brand-logo">
          <span style={{ fontSize: '1.4rem' }}>🏛️</span>
          <span>CampusFix</span>
          <span className="brand-badge">{user.role}</span>
        </Link>

        {/* Mobile Right Controls: Notification + Hamburger */}
        <div className="mobile-nav-actions mobile-only">
          <NotificationCenter />
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <div className="nav-links desktop-only">
          <Link 
            to="/dashboard" 
            className={`nav-btn ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>

          {user.role === 'student' && (
            <>
              <Link 
                to="/submit" 
                className={`nav-btn ${location.pathname === '/submit' ? 'active' : ''}`}
              >
                ➕ Raise Complaint
              </Link>
              <button
                type="button"
                onClick={() => setShowQrScanner(true)}
                className="nav-btn"
                style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', color: '#93c5fd' }}
                title="Scan Room QR Code"
              >
                📷 Scan Room QR
              </button>
            </>
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
              <button
                type="button"
                onClick={() => setShowQrGenerator(true)}
                className="nav-btn"
                style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', color: '#c7d2fe' }}
                title="Generate Room QR Code Stickers"
              >
                📍 Room QR Stickers
              </button>
            </>
          )}

          {/* Notification Center */}
          <NotificationCenter />

          {/* User Profile & Logout */}
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

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-menu mobile-only">
          {/* User Profile Badge Card */}
          <div className="mobile-user-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="mobile-user-avatar">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{user.department || user.role}</span>
                  {user.cardId && <span>• 🪪 {user.cardId}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links List */}
          <div className="mobile-links-list">
            <Link 
              to="/dashboard" 
              className={`mobile-nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              <span>📊</span> Dashboard
            </Link>

            {user.role === 'student' && (
              <>
                <Link 
                  to="/submit" 
                  className={`mobile-nav-link ${location.pathname === '/submit' ? 'active' : ''}`}
                >
                  <span>➕</span> Raise Complaint
                </Link>
                <button
                  type="button"
                  onClick={() => { setShowQrScanner(true); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  <span>📷</span> Scan Room QR
                </button>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <Link 
                  to="/stores" 
                  className={`mobile-nav-link ${location.pathname === '/stores' ? 'active' : ''}`}
                >
                  <span>📦</span> Stores & Inventory
                </Link>
                <Link 
                  to="/admin/staff" 
                  className={`mobile-nav-link ${location.pathname === '/admin/staff' ? 'active' : ''}`}
                >
                  <span>👨‍🔧</span> Maintenance Staff
                </Link>
                <Link 
                  to="/admin/analytics" 
                  className={`mobile-nav-link ${location.pathname === '/admin/analytics' ? 'active' : ''}`}
                >
                  <span>📈</span> Analytics & Reports
                </Link>
                <button
                  type="button"
                  onClick={() => { setShowQrGenerator(true); setMobileMenuOpen(false); }}
                  className="mobile-nav-link"
                >
                  <span>📍</span> Room QR Stickers
                </button>
              </>
            )}

            <button 
              onClick={handleLogout} 
              className="mobile-nav-link mobile-logout-btn"
            >
              <span>🚪</span> Logout Account
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <QRScannerModal 
        isOpen={showQrScanner} 
        onClose={() => setShowQrScanner(false)} 
      />
      <QRGeneratorModal 
        isOpen={showQrGenerator} 
        onClose={() => setShowQrGenerator(false)} 
      />
    </nav>
  );
};

export default Navbar;
