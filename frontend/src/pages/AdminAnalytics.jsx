import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const AdminAnalytics = () => {
  const { API_URL } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/analytics`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading performance analytics & KPIs...
        </div>
      </>
    );
  }

  const summary = data?.summary || {};
  const priorities = data?.priorities || {};
  const categories = data?.categories || [];
  const departments = data?.departments || [];

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>📈 Campus Redressal Analytics & KPIs</h1>
              <span className="brand-badge" style={{ background: '#8b5cf6' }}>BI Metrics</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Real-time university maintenance efficiency, category volume, and satisfaction index
            </p>
          </div>

          <Link to="/dashboard" className="btn btn-outline">
            ← Back to Command Center
          </Link>
        </div>

        {/* Top Summary Banner */}
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Resolution Rate</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{summary.activeRate || 0}%</div>
            <div className="kpi-desc">Resolved vs Total Raised</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">User Satisfaction</div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>
              {summary.avgRating > 0 ? `${summary.avgRating} / 5.0` : '5.0 / 5.0'} ⭐
            </div>
            <div className="kpi-desc">From {summary.totalFeedbacks || 0} student ratings</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Maintenance Staff</div>
            <div className="kpi-value" style={{ color: '#60a5fa' }}>{summary.workerCount || 0}</div>
            <div className="kpi-desc">Active technicians onboarded</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Student / Staff Base</div>
            <div className="kpi-value" style={{ color: '#a78bfa' }}>{summary.studentCount || 0}</div>
            <div className="kpi-desc">Registered campus users</div>
          </div>
        </div>

        {/* Main Charts & Breakdowns Grid */}
        <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Category Distribution Chart */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📊</span> Issues by Category Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {categories.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No complaint category data yet.</p>
              ) : (
                categories.map((cat) => {
                  const percentage = summary.totalComplaints ? Math.round((cat.count / summary.totalComplaints) * 100) : 0;
                  return (
                    <div key={cat._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontWeight: 600 }}>{cat._id}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{cat.count} tickets ({percentage}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${percentage}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', 
                            borderRadius: 'var(--radius-full)' 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Priority Breakdown Chart */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚨</span> Priority Severity Distribution
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase' }}>Emergency</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fca5a5' }}>{priorities.Emergency || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>Needs immediate action</div>
              </div>
              <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fdba74', textTransform: 'uppercase' }}>High Priority</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fdba74' }}>{priorities.High || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>Elevated focus</div>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase' }}>Medium Priority</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#93c5fd' }}>{priorities.Medium || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>Standard ticket</div>
              </div>
              <div style={{ background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase' }}>Low Priority</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#cbd5e1' }}>{priorities.Low || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>Routine task</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ⚡ <strong>Super Admin Tip:</strong> Prioritize unassigned Emergency tickets to maintain campus safety SLAs.
            </div>
          </div>

        </div>

        {/* Department / Hostel Distribution */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏢</span> Complaints by Campus Location / Department
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {departments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No location breakdown recorded yet.</p>
            ) : (
              departments.map((d) => (
                <div key={d._id} style={{ background: 'rgba(13, 19, 33, 0.6)', border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                    {d._id || 'General Campus'}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>
                    {d.count} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>complaints</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default AdminAnalytics;
