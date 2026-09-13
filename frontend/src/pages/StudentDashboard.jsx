import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StatusStepper from '../components/StatusStepper';
import axios from 'axios';

const StudentDashboard = () => {
  const { user, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [activeFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/complaints?status=${activeFilter}`);
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (complaintId) => {
    try {
      await axios.post(`${API_URL}/complaints/${complaintId}/upvote`);
      fetchComplaints();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenFeedback = (complaint) => {
    setFeedbackModal(complaint);
    setFeedbackForm({
      rating: complaint.feedback?.rating || 5,
      comment: complaint.feedback?.comment || '',
    });
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackModal) return;

    setSubmittingFeedback(true);
    try {
      await axios.post(`${API_URL}/complaints/${feedbackModal._id}/feedback`, feedbackForm);
      setFeedbackModal(null);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error saving feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const total = complaints.length;
  const activeCount = complaints.filter(c => ['Pending', 'Assigned', 'In Progress'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Header Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Student & Staff Portal</h1>
              <span className="brand-badge" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                ✨ AI Enabled
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Welcome back, <strong>{user.name}</strong> • Department: {user.department || 'General'}
            </p>
          </div>
          <Link to="/submit" className="btn btn-primary">
            ➕ Lodge New Complaint
          </Link>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Total Raised</div>
            <div className="kpi-value">{total}</div>
            <div className="kpi-desc">Lifetime lodged complaints</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <div className="kpi-title" style={{ color: '#fbbf24' }}>In Redressal Queue</div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>{activeCount}</div>
            <div className="kpi-desc">Pending / Under repair</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="kpi-title" style={{ color: '#34d399' }}>Resolved & Closed</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{resolvedCount}</div>
            <div className="kpi-desc">Successfully fixed</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Resolution Rate</div>
            <div className="kpi-value">{total ? Math.round((resolvedCount / total) * 100) : 100}%</div>
            <div className="kpi-desc">Redressal performance</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {['All', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`btn btn-sm ${activeFilter === tab ? 'btn-primary' : 'btn-outline'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Complaint Feed */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading your complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No Complaints Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
              Everything in your department seems to be running smoothly!
            </p>
            <Link to="/submit" className="btn btn-primary">
              Lodge a Maintenance Issue
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {complaints.map((c) => {
              const hasUpvoted = c.upvotes?.includes(user?.id);
              return (
                <div key={c._id} className="glass-panel" style={{ padding: '1.75rem' }}>
                  
                  {/* Top Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{c.title}</h3>
                        <PriorityBadge priority={c.priority} />
                        {c.isAiCategorized && (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                            🤖 AI Classified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        📁 <strong>{c.category}</strong> • 🏢 {c.department} • 📅 Lodged on {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '0.925rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                    {c.description}
                  </p>

                  {/* Location & Upvotes Badge Bar */}
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>📍 {c.location?.description || 'Campus Area'}</span>
                      <span>(Lat: {c.location?.lat?.toFixed(3)}, Lng: {c.location?.lng?.toFixed(3)})</span>
                    </div>

                    <button
                      onClick={() => handleUpvote(c._id)}
                      className={`btn btn-sm ${hasUpvoted ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                      title="Upvote if this issue impacts you"
                    >
                      👍 {c.upvotes?.length || 1} {c.upvotes?.length === 1 ? 'Voice' : 'Voices'}
                    </button>
                  </div>

                  {/* Status Stepper Progress Timeline */}
                  <div style={{ padding: '0.5rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '0.5rem 0 1rem' }}>
                    <StatusStepper currentStatus={c.status} />
                  </div>

                  {/* Technician info if assigned */}
                  {c.assignedTo && (
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                      👨‍🔧 <strong>Assigned Technician:</strong> {c.assignedTo.name} ({c.assignedTo.department || 'Maintenance Staff'})
                      {c.workerRemarks && (
                        <div style={{ marginTop: '0.25rem', color: '#93c5fd' }}>
                          💬 <em>Technician Note: "{c.workerRemarks}"</em>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Photos Row */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {c.imageUrl && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '0.25rem' }}>📷 Issue Photo:</div>
                        <a href={c.imageUrl} target="_blank" rel="noreferrer">
                          <img 
                            src={c.imageUrl} 
                            alt="Initial complaint" 
                            style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} 
                          />
                        </a>
                      </div>
                    )}
                    {c.resolutionImageUrl && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: '0.25rem' }}>✅ Resolution Proof:</div>
                        <a href={c.resolutionImageUrl} target="_blank" rel="noreferrer">
                          <img 
                            src={c.resolutionImageUrl} 
                            alt="Resolution proof" 
                            style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.4)' }} 
                          />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Feedback Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    <div>
                      {c.feedback?.rating ? (
                        <div style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>⭐ Your Feedback: {c.feedback.rating}/5 Stars</span>
                          {c.feedback.comment && <span>— "{c.feedback.comment}"</span>}
                        </div>
                      ) : c.status === 'Closed' ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Issue verified and closed. How was the service?
                        </span>
                      ) : null}
                    </div>

                    {c.status === 'Closed' && (
                      <button 
                        onClick={() => handleOpenFeedback(c)}
                        className="btn btn-outline btn-sm"
                        style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                      >
                        {c.feedback?.rating ? '✏️ Update Feedback' : '⭐ Rate Resolution'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                ⭐ Rate Maintenance Redressal
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                For: <strong>{feedbackModal.title}</strong>
              </p>

              <form onSubmit={handleSubmitFeedback}>
                <div className="form-group">
                  <label className="form-label">Service Rating (1 to 5 Stars)</label>
                  <select
                    className="form-control"
                    value={feedbackForm.rating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ 5 Stars - Excellent & Fast</option>
                    <option value={4}>⭐⭐⭐⭐ 4 Stars - Good Resolution</option>
                    <option value={3}>⭐⭐⭐ 3 Stars - Average Service</option>
                    <option value={2}>⭐⭐ 2 Stars - Delayed / Subpar</option>
                    <option value={1}>⭐ 1 Star - Unsatisfied</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Feedback Remarks / Comments</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Share your thoughts on the technician's work..."
                    value={feedbackForm.comment}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setFeedbackModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submittingFeedback}
                  >
                    {submittingFeedback ? 'Saving...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default StudentDashboard;
