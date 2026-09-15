import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SLATimer from '../components/SLATimer';
import axios from 'axios';

const WorkerDashboard = () => {
  const { user, API_URL } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  // Complete Resolution Proof Modal
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionFile, setResolutionFile] = useState(null);
  const [beforeFile, setBeforeFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [workerRemarks, setWorkerRemarks] = useState('');
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // Material Requisition Modal
  const [materialModal, setMaterialModal] = useState(null);
  const [storeItems, setStoreItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [reqQuantity, setReqQuantity] = useState(1);
  const [reqReason, setReqReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  useEffect(() => {
    fetchAssignedTasks();
    fetchStoreCatalog();
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

  const fetchStoreCatalog = async () => {
    try {
      const res = await axios.get(`${API_URL}/stores/inventory`);
      setStoreItems(res.data || []);
    } catch (err) {
      console.error(err);
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

  const openMaterialModal = (complaint) => {
    setMaterialModal(complaint);
    setSelectedItemId(storeItems.length > 0 ? storeItems[0]._id : '');
    setReqQuantity(1);
    setReqReason(`Required for repair on ${complaint.title}`);
  };

  const handleSubmitMaterialRequest = async (e) => {
    e.preventDefault();
    if (!materialModal) return;

    const chosenItem = storeItems.find(it => it._id === selectedItemId);
    if (!chosenItem) return alert('Please select a material item.');

    try {
      setSubmittingReq(true);
      await axios.post(`${API_URL}/complaints/${materialModal._id}/materials/request`, {
        items: [
          {
            item: chosenItem._id,
            itemName: chosenItem.name,
            quantity: Number(reqQuantity),
            unit: chosenItem.unit
          }
        ],
        reason: reqReason,
      });

      alert('Requisition sent to Stores! Stores manager will issue the item.');
      setMaterialModal(null);
      fetchAssignedTasks();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to submit requisition');
    } finally {
      setSubmittingReq(false);
    }
  };

  const openResolveModal = (complaint) => {
    setResolveModal(complaint);
    setWorkerRemarks(complaint.workerRemarks || '');
    setResolutionFile(null);
    setBeforeFile(null);
    setFilePreview(null);
    setBeforePreview(null);
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
    if (beforeFile) {
      formData.append('beforeImage', beforeFile);
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
  const inProgressCount = complaints.filter(c => ['In Progress', 'Awaiting Materials'].includes(c.status)).length;
  const completedCount = complaints.filter(c => ['Resolved', 'Completed', 'Closed'].includes(c.status)).length;

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>👨‍🔧 Tradesman Work Order Queue</h1>
            <span className="brand-badge" style={{ background: '#3b82f6' }}>
              Trade: {user.trade || user.department || 'Maintenance Specialist'}
            </span>
            {user.cardId && (
              <span className="brand-badge" style={{ background: 'rgba(255,255,255,0.1)' }}>
                🪪 {user.cardId}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Inspect task locations, monitor SLA timers, request spare parts, and submit proof of resolution
          </p>
        </div>

        {/* Status KPI Cards */}
        <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card" style={{ borderColor: assignedCount > 0 ? 'rgba(59, 130, 246, 0.4)' : 'var(--border)' }}>
            <div className="kpi-title">Assigned Work Orders</div>
            <div className="kpi-value" style={{ color: '#60a5fa' }}>{assignedCount}</div>
            <div className="kpi-desc">New tasks awaiting repair start</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: inProgressCount > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border)' }}>
            <div className="kpi-title">In Progress / Awaiting Parts</div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>{inProgressCount}</div>
            <div className="kpi-desc">Repairs currently underway</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Completed Work</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{completedCount}</div>
            <div className="kpi-desc">Resolved & manager-verified</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Assigned', 'In Progress', 'Awaiting Materials', 'Resolved', 'Completed'].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`btn btn-sm ${activeFilter === filter ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Work Order Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading assigned work orders...
          </div>
        ) : complaints.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No work orders found in this queue.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {complaints.map((c) => (
              <div 
                key={c._id}
                className="glass-panel"
                style={{ 
                  padding: '1.5rem',
                  borderLeft: `4px solid ${
                    c.priority === 'Urgent' ? '#ef4444' : 
                    c.priority === 'High' ? '#f97316' : 
                    c.priority === 'Medium' ? '#3b82f6' : '#10b981'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    {/* Header info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      {c.workOrder?.workOrderNumber && (
                        <span className="badge badge-p-high" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                          Work Order: {c.workOrder.workOrderNumber}
                        </span>
                      )}
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                        {c.complaintNumber || `CMP-${c._id.slice(-6)}`}
                      </span>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0.35rem 0' }}>
                      {c.title}
                    </h3>

                    {/* Structured Location */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#67e8f9', fontSize: '0.88rem', fontWeight: 600, marginTop: '0.35rem' }}>
                      <span>📍</span>
                      <span>{c.location?.building || c.department}</span>
                      <span>•</span>
                      <span>Floor: {c.location?.floor || 'Ground'}</span>
                      <span>•</span>
                      <span>Room / Lab: {c.location?.room || 'General'}</span>
                    </div>

                    {c.location?.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '0.15rem' }}>
                        Landmark: {c.location.description}
                      </div>
                    )}
                  </div>

                  {/* Live SLA Countdown Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                      SLA Target Window
                    </div>
                    <SLATimer workOrder={c.workOrder} status={c.status} />
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {c.description}
                </p>

                {/* Manager Instructions */}
                {(c.workOrder?.instructions || c.adminRemarks) && (
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem' }}>
                    <strong style={{ color: '#93c5fd' }}>📋 Manager Instructions:</strong> "{c.workOrder?.instructions || c.adminRemarks}"
                  </div>
                )}

                {/* Photos Comparison preview if available */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {(c.beforeImageUrl || c.imageUrl) && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '0.25rem' }}>Reported Defect:</div>
                      <img 
                        src={c.beforeImageUrl || c.imageUrl} 
                        alt="Defect" 
                        style={{ width: '110px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} 
                      />
                    </div>
                  )}

                  {c.resolutionImageUrl && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#34d399', marginBottom: '0.25rem' }}>Resolution Proof:</div>
                      <img 
                        src={c.resolutionImageUrl} 
                        alt="Resolution" 
                        style={{ width: '110px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid #10b981' }} 
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons for Tradesman */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                    Reported by {c.user?.name} {c.user?.phone && `• 📞 ${c.user.phone}`}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {c.status === 'Assigned' && (
                      <button 
                        type="button" 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleStartWork(c._id)}
                      >
                        ▶️ Start Work (In Progress)
                      </button>
                    )}

                    {['Assigned', 'In Progress', 'Awaiting Materials'].includes(c.status) && (
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline"
                        style={{ borderColor: '#f59e0b', color: '#fbbf24' }}
                        onClick={() => openMaterialModal(c)}
                      >
                        📦 Request Spare Parts from Stores
                      </button>
                    )}

                    {['In Progress', 'Awaiting Materials'].includes(c.status) && (
                      <button 
                        type="button" 
                        className="btn btn-sm btn-primary"
                        style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                        onClick={() => openResolveModal(c)}
                      >
                        ✅ Mark Work Completed & Upload Proof
                      </button>
                    )}

                    {c.status === 'Resolved' && (
                      <span style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 600 }}>
                        ✓ Work Marked Completed — Awaiting Manager Inspection
                      </span>
                    )}

                    {c.status === 'Completed' && (
                      <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                        ✓ Verified & Closed by Manager
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* MATERIAL REQUISITION MODAL */}
        {materialModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '480px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                📦 Request Spare Parts / Materials
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Requisition will reach the Stores Section for issuance. Work Order: <strong>{materialModal.workOrder?.workOrderNumber || materialModal.complaintNumber}</strong>
              </p>

              <form onSubmit={handleSubmitMaterialRequest}>
                <div className="form-group">
                  <label className="form-label">Select Required Material / Part *</label>
                  <select 
                    className="form-control"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    required
                  >
                    {storeItems.map(it => (
                      <option key={it._id} value={it._id}>
                        {it.name} ({it.category}) — Available: {it.quantity} {it.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Required Quantity *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="1" 
                    required 
                    value={reqQuantity}
                    onChange={(e) => setReqQuantity(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason / Technical Notes</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="e.g. Existing joint cracked due to high water pressure"
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setMaterialModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={submittingReq}
                  >
                    {submittingReq ? 'Sending Requisition...' : 'Send Request to Stores'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESOLUTION PROOF MODAL */}
        {resolveModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '540px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                ✅ Mark Work Completed & Submit Proof
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Upload an after-repair photo showing the resolved defect for manager verification.
              </p>

              <form onSubmit={handleSubmitResolution}>
                
                {/* Before Photo Optional Upload */}
                <div className="form-group">
                  <label className="form-label">Before Work Photo (Optional Inspection Photo)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="form-control"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setBeforeFile(file);
                        setBeforePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {beforePreview && (
                    <img 
                      src={beforePreview} 
                      alt="Before Preview" 
                      style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '4px', marginTop: '0.5rem' }} 
                    />
                  )}
                </div>

                {/* After Photo Proof Mandatory Upload */}
                <div className="form-group">
                  <label className="form-label">After Work Photo Proof * (Mandatory)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="form-control"
                    required={!resolveModal.resolutionImageUrl}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setResolutionFile(file);
                        setFilePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  {filePreview && (
                    <img 
                      src={filePreview} 
                      alt="After Preview" 
                      style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '4px', marginTop: '0.5rem', border: '2px solid #10b981' }} 
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Technician Remarks & Parts Replaced *</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="e.g. Replaced 16A modular switch, tightened neutral wire, tested load with multimeter (230V)."
                    required
                    value={workerRemarks}
                    onChange={(e) => setWorkerRemarks(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setResolveModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={submittingResolve}
                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                  >
                    {submittingResolve ? 'Uploading & Marking Completed...' : 'Submit Resolution for Verification'}
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
