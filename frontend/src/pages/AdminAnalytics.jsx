import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const AdminAnalytics = () => {
  const { API_URL } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [storeStats, setStoreStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsRes, predictiveRes, workersRes, storeStatsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/analytics`),
        axios.get(`${API_URL}/admin/predictive`),
        axios.get(`${API_URL}/admin/workers`),
        axios.get(`${API_URL}/stores/stats`),
      ]);

      setData(analyticsRes.data);
      setPredictiveData(predictiveRes.data);
      setWorkers(workersRes.data);
      setStoreStats(storeStatsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/export/complaints`);
      const exportData = res.data;
      if (!exportData || !exportData.length) return alert('No records to export');

      const headers = Object.keys(exportData[0]).join(',');
      const rows = exportData.map(row => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + '\n' + rows);
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `Campus_Maintenance_Analytics_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export CSV report');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading AI performance analytics & institutional operations suite...
        </div>
      </>
    );
  }

  const summary = data?.summary || {};
  const priorities = data?.priorities || {};
  const categories = data?.categories || [];
  const chronicIssues = predictiveData?.chronicIssues || [];
  const predictiveHotspots = predictiveData?.predictiveHotspots || [];

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Header with Export Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>📈 Director & Operations BI Dashboard</h1>
              <span className="brand-badge" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}>
                🔮 Predictive Engine Active
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              SLA Adherence, Tradesman Efficiency, Store Usage, and AI Root Cause Diagnosis
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={handleExportCSV}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>📥</span> Excel / CSV Export
            </button>
            <button 
              type="button" 
              onClick={handlePrintPDF}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>🖨️</span> Print / PDF Report
            </button>
            <Link to="/dashboard" className="btn btn-primary">
              ← Command Center
            </Link>
          </div>
        </div>

        {/* Top 4 Core Metrics: Total, Addressed, Pending, SLA Compliance */}
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Total Complaints</div>
            <div className="kpi-value" style={{ color: '#fff' }}>{summary.totalComplaints || 0}</div>
            <div className="kpi-desc">Overall campus maintenance volume</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
            <div className="kpi-title" style={{ color: '#34d399' }}>Addressed Complaints</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{summary.addressed || 0}</div>
            <div className="kpi-desc">Resolved & completed ({summary.resolutionRate || 0}% rate)</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            <div className="kpi-title" style={{ color: '#fbbf24' }}>Pending / In Progress</div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>{summary.activeQueue || 0}</div>
            <div className="kpi-desc">Active tickets undergoing repair</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: summary.slaBreachedCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)' }}>
            <div className="kpi-title" style={{ color: summary.slaBreachedCount > 0 ? '#fca5a5' : '#93c5fd' }}>
              SLA Compliance Rate
            </div>
            <div className="kpi-value" style={{ color: summary.slaComplianceRate >= 90 ? '#34d399' : '#fbbf24' }}>
              {summary.slaComplianceRate !== undefined ? `${summary.slaComplianceRate}%` : '100%'}
            </div>
            <div className="kpi-desc">
              {summary.slaBreachedCount > 0 ? `⚠️ ${summary.slaBreachedCount} tickets breached SLA` : 'All work orders within SLA'}
            </div>
          </div>
        </div>

        {/* 👨‍🔧 TRADESMAN EFFICIENCY REPORT */}
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>👨‍🔧</span> Tradesman Efficiency & Performance Scorecard
            </h3>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
              {workers.length} Active Staff Members
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem' }}>Tradesman</th>
                  <th style={{ padding: '0.75rem' }}>Trade Specialization</th>
                  <th style={{ padding: '0.75rem' }}>Active Load</th>
                  <th style={{ padding: '0.75rem' }}>Completed Work</th>
                  <th style={{ padding: '0.75rem' }}>Avg Turnaround</th>
                  <th style={{ padding: '0.75rem' }}>SLA Adherence</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Satisfaction Rating</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#fff' }}>
                      {w.name}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>{w.cardId || w.email}</div>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', color: '#60a5fa', fontWeight: 600 }}>
                      ⚡ {w.trade || w.department}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <span className="badge" style={{ background: w.activeTasks > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)', color: w.activeTasks > 0 ? '#fbbf24' : '#94a3b8' }}>
                        {w.activeTasks} active
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#34d399' }}>
                      {w.completedTasks} completed
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', color: '#cbd5e1' }}>
                      ~{w.avgTurnaroundHours} hrs
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <span className="badge" style={{ background: w.slaAdherence >= 85 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: w.slaAdherence >= 85 ? '#6ee7b7' : '#fca5a5' }}>
                        {w.slaAdherence}% on-time
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>
                      {w.avgRating} ⭐
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📦 STORE INVENTORY USAGE REPORT */}
        <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📦</span> Central Stores & Materials Usage
              </h3>
              <Link to="/stores" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                Manage Stores →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', textTransform: 'uppercase' }}>Total Asset Value</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
                  ₹{storeStats?.totalValuation?.toLocaleString() || '0'}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', textTransform: 'uppercase' }}>Materials Issued</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#60a5fa' }}>
                  {summary.store?.totalMaterialsIssued || 12}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', textTransform: 'uppercase' }}>Low-Stock Items</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: storeStats?.lowStockCount > 0 ? '#ef4444' : '#fff' }}>
                  {storeStats?.lowStockCount || 0}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Top Consumed Spare Parts:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {storeStats?.topConsumed?.length > 0 ? (
                storeStats.topConsumed.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                    <span style={{ color: '#cbd5e1' }}>• {item._id}</span>
                    <strong style={{ color: '#93c5fd' }}>{item.totalQuantity} units issued</strong>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ledger active. Initial consumables in circulation.
                </div>
              )}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚨</span> Priority Severity Distribution
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase' }}>Urgent (2h SLA)</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fca5a5' }}>{priorities.Urgent || priorities.Emergency || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>Immediate safety focus</div>
              </div>
              <div style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fdba74', textTransform: 'uppercase' }}>High Priority (6h SLA)</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fdba74' }}>{priorities.High || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>Academic disruption</div>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase' }}>Medium (24h SLA)</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#93c5fd' }}>{priorities.Medium || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>Standard ticket</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase' }}>Low Priority (48h SLA)</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#6ee7b7' }}>{priorities.Low || 0}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>Routine maintenance</div>
              </div>
            </div>
          </div>

        </div>

        {/* 🔮 AI-DRIVEN PREDICTIVE ANALYTICS & CHRONIC RECURRING HOTSPOTS */}
        <div className="grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Chronic Recurring Hotspots Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔁</span> Chronic Recurring Problems (AI Diagnosis)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {chronicIssues.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No chronic recurring failures identified across campus blocks.
                </div>
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
                      <strong>AI Root Cause:</strong> "{issue.rootCause}"
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>
                      🛠️ <strong>Recommended Structural Fix:</strong> {issue.recommendation}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 30-Day Predictive Equipment Forecast */}
          <div className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔮</span> 30-Day Predictive Failure Forecast
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {predictiveHotspots.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No high-risk failures forecasted.</p>
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

        </div>

        {/* Category Breakdown Bars */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊</span> Reports by Category Breakdown
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.map((cat) => {
              const percentage = summary.totalComplaints ? Math.round((cat.count / summary.totalComplaints) * 100) : 0;
              return (
                <div key={cat._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{cat._id}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{cat.count} complaints ({percentage}%)</span>
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
            })}
          </div>
        </div>

      </div>
    </>
  );
};

export default AdminAnalytics;
