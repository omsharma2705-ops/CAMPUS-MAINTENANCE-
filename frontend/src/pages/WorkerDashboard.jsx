import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import axios from 'axios';

const WorkerDashboard = () => {
  const { user, API_URL } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  // Resolve Proof Modal
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionFile, setResolutionFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [workerRemarks, setWorkerRemarks] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  useEffect(() => {
    fetchAssignedTasks();
  }, [activeFilter]);

  const fetchAssignedTasks = async () => {
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

  const handleStartWork = async (id) => {
    try {
      await axios.put(`${API_URL}/complaints/${id}/status`, { status: 'In Progress' });
      fetchAssignedTasks();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error starting work');
    }
  };

  const openResolveModal = (complaint) => {
    setResolveModal(complaint);
    setWorkerRemarks(complaint.workerRemarks || '');
    setResolutionFile(null);
    setFilePreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResolutionFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolveModal) return;

    if (!resolutionFile && !resolveModal.resolutionImageUrl) {
      return alert('Please attach a photo as proof of resolution.');
    }

    setSubmittingResolve(true);
    const formData = new FormData();
    formData.append('status', 'Resolved');
    formData.append('workerRemarks', workerRemarks);
    if (resolutionFile) {
      formData.append('resolutionImage', resolutionFile);
    }

    try {
      await axios.put(`${API_URL}/complaints/${resolveModal._id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResolveModal(null);
      fetchAssignedTasks();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error updating resolution');
    } finally {
      setSubmittingResolve(false);
    }
  };

  const assignedCount = complaints.filter(c => c.status === 'Assigned').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>👨‍🔧 Maintenance Technician Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Logged in as <strong>{user.name}</strong> • Specialization: {user.department || 'General Maintenance'}
          </p>
        </div>

        {/* Technician KPIs */}
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Assigned Queue</div>
            <div className="kpi-value" style={{ color: '#60a5fa' }}>{assignedCount}</div>
            <div className="kpi-desc">New tasks ready to accept</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
            <div className="kpi-title" style={{ color: '#a78bfa' }}>Work in Progress</div>
            <div className="kpi-value" style={{ color: '#a78bfa' }}>{inProgressCount}</div>
            <div className="kpi-desc">Currently working on</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="kpi-title" style={{ color: '#34d399' }}>Resolved Tasks</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{resolvedCount}</div>
            <div className="kpi-desc">Sent for admin verification</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Total Tasks</div>
            <div className="kpi-value">{complaints.length}</div>
            <div className="kpi-desc">Lifetime assigned tickets</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {['All', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`btn btn-sm ${activeFilter === tab ? 'btn-primary' : 'btn-outline'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading your task queue...
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Task Queue Clear</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              You currently have no maintenance tasks assigned under "{activeFilter}".
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {complaints.map((c) => (
              <div key={c._id} className="glass-panel" style={{ padding: '1.75rem' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{c.title}</h3>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      📁 <strong>{c.category}</strong> • 🏢 Location: <strong>{c.department}</strong> • 👤 Lodged by: {c.user?.name || 'Student'} ({c.user?.phone || 'No phone'})
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <p style={{ color: '#cbd5e1', fontSize: '0.925rem', lineHeight: '1.5', marginBottom: '1rem' }}>
                  {c.description}
                </p>

                {/* Location Badge */}
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-block', marginBottom: '1rem' }}>
                  📍 {c.location?.description || 'Campus Grounds'} (Coords: {c.location?.lat?.toFixed(3)}, {c.location?.lng?.toFixed(3)})
                </div>

                {/* Complaint Photos Comparison */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', margin: '1rem 0' }}>
                  {c.imageUrl && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '0.25rem' }}>Initial Reported Issue Photo:</div>
                      <a href={c.imageUrl} target="_blank" rel="noreferrer">
                        <img 
                          src={c.imageUrl} 
                          alt="Initial issue" 
                          style={{ width: '140px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} 
                        />
                      </a>
                    </div>
                  )}

                  {c.resolutionImageUrl && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: '0.25rem' }}>Your Resolution Proof Photo:</div>
                      <a href={c.resolutionImageUrl} target="_blank" rel="noreferrer">
                        <img 
                          src={c.resolutionImageUrl} 
                          alt="Resolution proof" 
                          style={{ width: '140px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.4)' }} 
                        />
                      </a>
                    </div>
                  )}
                </div>

                {/* Admin notes if any */}
                {c.adminRemarks && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#fde68a', marginBottom: '1rem' }}>
                    📢 <strong>Admin Directive:</strong> "{c.adminRemarks}"
                  </div>
                )}

                {/* Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  {c.status === 'Assigned' && (
                    <button 
                      onClick={() => handleStartWork(c._id)}
                      className="btn btn-primary"
                    >
                      ⚡ Start Work (In Progress)
                    </button>
                  )}

                  {c.status === 'In Progress' && (
                    <button 
                      onClick={() => openResolveModal(c)}
                      className="btn btn-success"
                    >
                      ✅ Upload Proof & Mark Resolved
                    </button>
                  )}

                  {c.status === 'Resolved' && (
                    <span style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      ⏳ Awaiting Super Admin Verification
                    </span>
                  )}

                  {c.status === 'Closed' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                      🔒 Ticket Closed & Verified
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Resolution Proof Upload Modal */}
        {resolveModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                📸 Complete Maintenance & Submit Proof
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                For: <strong>{resolveModal.title}</strong>
              </p>

              <form onSubmit={handleSubmitResolution}>
                <div className="form-group">
                  <label className="form-label">Proof Photo of Fixed / Repaired Issue *</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    required={!resolveModal.resolutionImageUrl}
                    onChange={handleFileChange}
                  />
                  {filePreview && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <img 
                        src={filePreview} 
                        alt="Resolution preview" 
                        style={{ maxHeight: '160px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} 
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Technician Remarks / Materials Used / Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g., Replaced brass water valve and sealed connector. Cleaned workspace."
                    required
                    value={workerRemarks}
                    onChange={(e) => setWorkerRemarks(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setResolveModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={submittingResolve}
                  >
                    {submittingResolve ? 'Uploading & Saving...' : 'Submit for Verification'}
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

export default WorkerDashboard;
