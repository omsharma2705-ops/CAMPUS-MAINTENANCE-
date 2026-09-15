import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const NotificationCenter = () => {
  const { API_URL } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'email', 'sms'
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // Silently catch
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Registration': return '📝';
      case 'Assignment': return '👨‍🔧';
      case 'Material': return '📦';
      case 'Completion': return '✅';
      case 'SLA Alert': return '🚨';
      default: return '🔔';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          position: 'relative',
          transition: 'all 0.2s',
        }}
        title="Notifications & Dispatched Messages"
      >
        <span style={{ fontSize: '1.15rem' }}>🔔</span>
        {unreadCount > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0f172a',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="glass-panel" 
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '360px',
            maxHeight: '480px',
            zIndex: 1000,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '0.85rem 1rem', 
            borderBottom: '1px solid var(--border)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.85)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>Notification Center</span>
              <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                Multi-Channel
              </span>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
            <button 
              type="button" 
              onClick={() => setActiveTab('all')}
              style={{
                padding: '0.5rem',
                fontSize: '0.72rem',
                fontWeight: activeTab === 'all' ? 700 : 500,
                color: activeTab === 'all' ? 'var(--primary)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'all' ? '2px solid var(--primary)' : 'none',
                cursor: 'pointer'
              }}
            >
              All In-App
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('email')}
              style={{
                padding: '0.5rem',
                fontSize: '0.72rem',
                fontWeight: activeTab === 'email' ? 700 : 500,
                color: activeTab === 'email' ? '#60a5fa' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'email' ? '2px solid #60a5fa' : 'none',
                cursor: 'pointer'
              }}
            >
              📧 Email Log
            </button>
            <button 
              type="button" 
              onClick={() => setActiveTab('sms')}
              style={{
                padding: '0.5rem',
                fontSize: '0.72rem',
                fontWeight: activeTab === 'sms' ? 700 : 500,
                color: activeTab === 'sms' ? '#34d399' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'sms' ? '2px solid #34d399' : 'none',
                cursor: 'pointer'
              }}
            >
              📱 SMS Log
            </button>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '380px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No notifications received yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: notif.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1rem' }}>{getTypeIcon(notif.type)}</span>
                      <strong style={{ fontSize: '0.82rem', color: notif.isRead ? '#cbd5e1' : '#fff' }}>
                        {notif.title}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.4rem 0', lineHeight: 1.35 }}>
                    {notif.message}
                  </p>

                  {/* Channel specific delivery audit details */}
                  {activeTab === 'email' && (
                    <div style={{ fontSize: '0.68rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      📧 SMTP: {notif.emailDeliveryStatus || 'Sent to University Email'}
                    </div>
                  )}

                  {activeTab === 'sms' && (
                    <div style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      📱 SMS: {notif.smsDeliveryStatus || 'Delivered to Registered Mobile'}
                    </div>
                  )}

                  {activeTab === 'all' && (
                    <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.3rem' }}>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-sub)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                        ✓ App Push
                      </span>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                        ✓ Email Sent
                      </span>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                        ✓ SMS Dispatched
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '0.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-sub)' }}>
            Real-time University Alert & Redressal Dispatcher
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
