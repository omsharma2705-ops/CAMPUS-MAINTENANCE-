import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const AdminAnalytics = () => {
  const { API_URL } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, predictiveRes] = await Promise.all([
        axios.get(`${API_URL}/admin/analytics`),
        axios.get(`${API_URL}/admin/predictive`),
      ]);

      setData(analyticsRes.data);
      setPredictiveData(predictiveRes.data);
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
          Loading AI performance analytics & predictive maintenance suite...
        </div>
      </>
    );
  }

  const summary = data?.summary || {};
  const priorities = data?.priorities || {};
  const categories = data?.categories || [];
  const departments = data?.departments || [];
  const chronicIssues = predictiveData?.chronicIssues || [];
  const predictiveHotspots = predictiveData?.predictiveHotspots || [];

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>📈 Predictive Maintenance & BI Analytics</h1>
              <span className="brand-badge" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
                🔮 AI Forecast Active
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Campus Health Index, Equipment Failure Forecasting & Chronic Hotspot Diagnosis
            </p>
          </div>

          <Link to="/dashboard" className="btn btn-outline">
            ← Back to Command Center
          </Link>
        </div>

        {/* Top Summary Banner */}
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
            <div className="kpi-title" style={{ color: '#34d399' }}>Campus Health Index</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{predictiveData?.overallCampusHealthIndex || 92}%</div>
            <div className="kpi-desc">Overall facility reliability score</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <div className="kpi-title" style={{ color: '#fca5a5' }}>Chronic Hotspots</div>
            <div className="kpi-value" style={{ color: '#fca5a5' }}>{chronicIssues.length}</div>
            <div className="kpi-desc">Recurring issues (≥2 in 30 days)</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">AI Vision Adoption</div>
            <div className="kpi-value" style={{ color: '#67e8f9' }}>{summary.aiAdoptionRate || 85}%</div>
            <div className="kpi-desc">{summary.aiCategorizedCount || 0} tickets AI auto-classified</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Avg Satisfaction</div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>
              {summary.avgRating > 0 ? `${summary.avgRating} / 5.0` : '5.0 / 5.0'} ⭐
            </div>
            <div className="kpi-desc">From {summary.totalFeedbacks || 0} student ratings</div>
          </div>
        </div>

        {/* 🔮 AI PREDICTIVE MAINTENANCE & CHRONIC HOTSPOTS SECTION */}
        <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Predictive Hotspots Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔮</span> 30-Day Predictive Failure Forecast
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {predictiveHotspots.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No high-risk equipment failures forecasted currently.</p>
              ) : (
                predictiveHotspots.map((spot, idx) => (
                  <div key={idx} style={{ background: 'rgba(13, 19, 33, 0.85)', border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                        🏢 {spot.location}
                      </span>
                      <span className="badge" style={{ 
                        background: spot.status === 'High Risk' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: spot.status === 'High Risk' ? '#fca5a5' : '#fbbf24',
                        border: spot.status === 'High Risk' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(245,158,11,0.4)',
                      }}>
                        {spot.status} ({spot.riskScore}% Risk)
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#67e8f9', marginBottom: '0.35rem' }}>
                      🔧 Equipment: <strong>{spot.equipment}</strong> (Estimated failure in ~{spot.estimatedDaysToFailure} days)
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      💡 <em>AI Action: {spot.preventiveAction}</em>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chronic Recurring Hotspots Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔁</span> Chronic Recurring Hotspots (Root Cause Analysis)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {chronicIssues.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No chronic recurring issues detected on campus.</p>
              ) : (
                chronicIssues.map((issue) => (
                  <div key={issue.id} style={{ background: 'rgba(13, 19, 33, 0.85)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                        📍 {issue.department} — {issue.category}
                      </span>
                      <span className="badge badge-p-emergency" style={{ fontSize: '0.7rem' }}>
                        🔁 {issue.occurrenceCount}x in 30 Days
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#fde68a', marginBottom: '0.35rem' }}>
                      <strong>AI Root Cause Diagnosis:</strong> "{issue.rootCause}"
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>
                      🛠️ <strong>Recommended Structural Fix:</strong> {issue.recommendation}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Traditional Category & Severity Breakdowns */}
        <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
          
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
          </div>

        </div>

      </div>
    </>
  );
};

export default AdminAnalytics;
