import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import StatusStepper from '../components/StatusStepper';
import SLATimer from '../components/SLATimer';
import QRScannerModal from '../components/QRScannerModal';
import axios from 'axios';

const StudentDashboard = () => {
  const { user, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showQrScanner, setShowQrScanner] = useState(false);

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
  const activeCount = complaints.filter(c => ['Registered', 'Pending', 'Assigned', 'In Progress', 'Awaiting Materials'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Completed', 'Closed'].includes(c.status)).length;

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Header Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Student & Staff Portal</h1>
              {user.cardId && (
                <span className="brand-badge" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                  🪪 I-Card: {user.cardId}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Welcome, <strong>{user.name}</strong> • Department: {user.department || 'Campus Scholar'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={() => setShowQrScanner(true)}
              className="btn btn-outline"
              style={{ borderColor: 'rgba(59, 130, 246, 0.4)', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>📷</span> Scan Room QR
            </button>
            <Link to="/submit" className="btn btn-primary">
              ➕ Lodge New Complaint
            </Link>
          </div>
        </div>

        {/* QR Scanner Modal */}
        <QRScannerModal 
          isOpen={showQrScanner} 
          onClose={() => setShowQrScanner(false)} 
        />

        {/* Stats Summary Cards */}
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Total Lodged</div>
            <div className="kpi-value">{total}</div>
            <div className="kpi-desc">Lifetime registered complaints</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <div className="kpi-title" style={{ color: '#fbbf24' }}>In Redressal Queue</div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>{activeCount}</div>
            <div className="kpi-desc">Registered / Work in progress</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="kpi-title" style={{ color: '#34d399' }}>Resolved & Completed</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{resolvedCount}</div>
            <div className="kpi-desc">Verified resolutions</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Resolution Rate</div>
            <div className="kpi-value">{total ? Math.round((resolvedCount / total) * 100) : 100}%</div>
            <div className="kpi-desc">Redressal fulfillment</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {['All', 'Registered', 'Assigned', 'In Progress', 'Resolved', 'Completed'].map((tab) => (
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
            Loading your maintenance complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No Complaints Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
              No active or historical tickets matching this filter.
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
                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontWeight: 800 }}>
                          {c.complaintNumber || `CMP-${c._id.slice(-6)}`}
                        </span>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{c.title}</h3>
                        <PriorityBadge priority={c.priority} />
                        <SLATimer workOrder={c.workOrder} status={c.status} />
                      </div>
                      
                      {/* Structured Location */}
                      <div style={{ fontSize: '0.82rem', color: '#67e8f9', fontWeight: 600 }}>
                        📍 {c.location?.building || c.department} • Floor: {c.location?.floor || 'Ground'} • Room: {c.location?.room || 'General'}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                          (Category: {c.category} • Lodged: {new Date(c.createdAt).toLocaleDateString()})
                        </span>
                      </div>
                    </div>

                    <StatusBadge status={c.status} />
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '0.925rem', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                    {c.description}
                  </p>

                  {/* Visual Status Stepper */}
                  <div style={{ marginBottom: '1.5rem', padding: '0.5rem 0' }}>
                    <StatusStepper currentStatus={c.status} />
                  </div>

                  {/* Assigned Tradesman details */}
                  {c.assignedTo && (
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Tradesman:</span>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                          👨‍🔧 {c.assignedTo.name} ({c.assignedTo.trade || c.assignedTo.department})
                        </div>
                      </div>
                      {c.workOrder?.workOrderNumber && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                          Work Order #{c.workOrder.workOrderNumber} (Target SLA: {c.workOrder.slaHours}h)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Photos (Reported vs Resolution) */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {c.imageUrl && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '0.2rem' }}>Defect Photo:</div>
                        <img 
                          src={c.imageUrl} 
                          alt="Reported Defect" 
                          style={{ width: '110px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} 
                        />
                      </div>
                    )}

                    {c.resolutionImageUrl && (
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#34d399', marginBottom: '0.2rem' }}>Resolution Proof Photo:</div>
                        <img 
                          src={c.resolutionImageUrl} 
                          alt="Resolution Proof" 
                          style={{ width: '110px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid #10b981' }} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Existing Feedback View */}
                  {c.feedback?.rating && (
                    <div style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.25)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                        <span>⭐ Your Review:</span>
                        <span>{'★'.repeat(c.feedback.rating)}{'☆'.repeat(5 - c.feedback.rating)} ({c.feedback.rating}/5)</span>
                      </div>
                      {c.feedback.comment && (
                        <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.25rem', fontStyle: 'italic' }}>
                          "{c.feedback.comment}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        onClick={() => handleUpvote(c._id)}
                        className={`btn btn-sm ${hasUpvoted ? 'btn-primary' : 'btn-outline'}`}
                      >
                        👍 Upvote ({c.upvotes?.length || 1})
                      </button>
                    </div>

                    {['Resolved', 'Completed', 'Closed'].includes(c.status) && (
                      <button 
                        type="button" 
                        className="btn btn-sm"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontWeight: 700 }}
                        onClick={() => handleOpenFeedback(c)}
                      >
                        ⭐ {c.feedback?.rating ? 'Update Rating & Feedback' : 'Rate Resolution (1-5 ⭐)'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* FEEDBACK & RATING MODAL */}
        {feedbackModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '440px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                ⭐ Rate Maintenance Service
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Complaint #{feedbackModal.complaintNumber}: <strong>{feedbackModal.title}</strong>
              </p>

              <form onSubmit={handleSubmitFeedback}>
                <div className="form-group">
                  <label className="form-label">Service Rating (Stars) *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '1rem 0' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '2.2rem',
                          cursor: 'pointer',
                          color: star <= feedbackForm.rating ? '#fbbf24' : '#475569',
                          transition: 'transform 0.1s',
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>
                    {feedbackForm.rating === 5 ? 'Excellent 🌟' :
                     feedbackForm.rating === 4 ? 'Very Good 👍' :
                     feedbackForm.rating === 3 ? 'Satisfactory 👌' :
                     feedbackForm.rating === 2 ? 'Needs Improvement ⚠️' : 'Poor ❌'}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Feedback & Comments</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Describe tradesman punctuality, repair quality, or clean-up..."
                    value={feedbackForm.comment}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
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
                    {submittingFeedback ? 'Submitting...' : 'Submit Rating'}
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
