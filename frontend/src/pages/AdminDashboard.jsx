import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SLATimer from '../components/SLATimer';
import axios from 'axios';

const AdminDashboard = () => {
  const { user, API_URL } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filters, setFilters] = useState({
    status: 'All',
    category: 'All',
    priority: 'All',
    search: '',
  });

  // Work Order / Assign Modal
  const [workOrderModal, setWorkOrderModal] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [workOrderInstructions, setWorkOrderInstructions] = useState('');
  const [submittingWorkOrder, setSubmittingWorkOrder] = useState(false);

  // Verification Modal
  const [verifyModal, setVerifyModal] = useState(null);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        status: filters.status,
        category: filters.category,
        priority: filters.priority,
        search: filters.search,
      }).toString();

      const [complaintsRes, workersRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/complaints?${query}`),
        axios.get(`${API_URL}/admin/workers`),
        axios.get(`${API_URL}/admin/analytics`),
      ]);

      setComplaints(complaintsRes.data);
      setWorkers(workersRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openWorkOrderModal = (complaint) => {
    setWorkOrderModal(complaint);
    setSelectedWorker(complaint.assignedTo?._id || (workers.length > 0 ? workers[0]._id : ''));
    setSelectedPriority(complaint.priority || 'Medium');
    setWorkOrderInstructions(complaint.workOrder?.instructions || complaint.adminRemarks || '');
  };

  const handleSaveWorkOrder = async (e) => {
    e.preventDefault();
    if (!selectedWorker) return alert('Please select an assigned tradesman.');

    setSubmittingWorkOrder(true);
    try {
      await axios.post(`${API_URL}/complaints/${workOrderModal._id}/work-order`, {
        workerId: selectedWorker,
        priority: selectedPriority,
        instructions: workOrderInstructions,
      });
      setWorkOrderModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to create work order');
    } finally {
      setSubmittingWorkOrder(false);
    }
  };

  const openVerifyModal = (complaint) => {
    setVerifyModal(complaint);
    setVerifyRemarks(complaint.adminRemarks || '');
  };

  const handleVerifyResolution = async (isApproved) => {
    setSubmittingVerify(true);
    try {
      await axios.put(`${API_URL}/complaints/${verifyModal._id}/verify`, {
        isApproved,
        adminRemarks: verifyRemarks,
      });
      setVerifyModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to verify resolution');
    } finally {
      setSubmittingVerify(false);
    }
  };

  // Export Complaints to CSV / Excel
  const handleExportCSV = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/export/complaints`);
      const data = res.data;
      if (!data || !data.length) return alert('No complaint records to export.');

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + '\n' + rows);
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('href', csvContent);
      downloadLink.setAttribute('download', `Campus_Maintenance_Report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      alert('Failed to export CSV report');
    }
  };

  // Print PDF Audit Report
  const handlePrintReport = () => {
    window.print();
  };

  const summary = analytics?.summary || {};

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Command Center Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>👨‍💼 Maintenance Operations & Command Center</h1>
              <span className="brand-badge" style={{ background: '#ef4444' }}>Directorate Access</span>
              <span className="brand-badge" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                SLA Engine Active
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Work Order Routing, Tradesman Allocation, SLA Tracking, and Resolution Verification
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={handleExportCSV}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>📥</span> Export Excel / CSV
            </button>
            <button 
              type="button" 
              onClick={handlePrintReport}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>🖨️</span> Print / PDF Report
            </button>
            <Link to="/stores" className="btn btn-primary">
              📦 Stores & Materials
            </Link>
          </div>
        </div>

        {/* Top KPI Summary Cards */}
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Total Complaints</div>
            <div className="kpi-value">{summary.totalComplaints || complaints.length}</div>
            <div className="kpi-desc">Registered across all campus blocks</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Pending / Registered Queue</div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>
              {summary.registered || complaints.filter(c => c.status === 'Registered').length}
            </div>
            <div className="kpi-desc">Awaiting manager review & work order</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Addressed / Completed</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>
              {summary.addressed || complaints.filter(c => ['Completed', 'Closed', 'Resolved'].includes(c.status)).length}
            </div>
            <div className="kpi-desc">Verified resolutions ({summary.resolutionRate || 0}% rate)</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: summary.slaBreachedCount > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)' }}>
            <div className="kpi-title" style={{ color: summary.slaBreachedCount > 0 ? '#fca5a5' : '#6ee7b7' }}>
              SLA Compliance
            </div>
            <div className="kpi-value" style={{ color: summary.slaComplianceRate >= 90 ? '#34d399' : '#fbbf24' }}>
              {summary.slaComplianceRate !== undefined ? `${summary.slaComplianceRate}%` : '100%'}
            </div>
            <div className="kpi-desc">
              {summary.slaBreachedCount > 0 ? `⚠️ ${summary.slaBreachedCount} tickets breached target SLA` : 'All work orders within SLA target'}
            </div>
          </div>
        </div>

        {/* Master Table Filter Controls */}
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
              <select 
                className="form-control" 
                style={{ width: 'auto', minWidth: '150px' }}
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="All">All Statuses</option>
                <option value="Registered">Registered (New)</option>
                <option value="Assigned">Assigned (WO Issued)</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Materials">Awaiting Materials</option>
                <option value="Resolved">Resolved (Pending Verify)</option>
                <option value="Completed">Completed & Closed</option>
              </select>

              <select 
                className="form-control" 
                style={{ width: 'auto', minWidth: '150px' }}
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">🚨 Urgent (2h SLA)</option>
                <option value="High">🟠 High (6h SLA)</option>
                <option value="Medium">🟡 Medium (24h SLA)</option>
                <option value="Low">🟢 Low (48h SLA)</option>
              </select>

              <select 
                className="form-control" 
                style={{ width: 'auto', minWidth: '160px' }}
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="All">All Categories</option>
                <option value="Electrical">⚡ Electrical</option>
                <option value="Water">🚰 Water / Plumbing</option>
                <option value="Sanitaryware">🚽 Sanitaryware</option>
                <option value="Furniture">🪑 Furniture</option>
                <option value="Doors">🚪 Doors</option>
                <option value="IT">🖥️ IT</option>
                <option value="HVAC">❄️ HVAC</option>
                <option value="Civil / Structural">🏢 Civil / Structural</option>
                <option value="Cleanliness">🧹 Cleanliness</option>
                <option value="Other">🔧 Other</option>
              </select>
            </div>

            <div style={{ minWidth: '260px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search CMP#, title, location, room..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Master Complaints Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem' }}>Complaint #</th>
                  <th style={{ padding: '0.75rem' }}>Issue & Category</th>
                  <th style={{ padding: '0.75rem' }}>Location (Block & Room)</th>
                  <th style={{ padding: '0.75rem' }}>Priority & SLA</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Assigned Tradesman</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No complaints matching criteria.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      
                      {/* Complaint ID & Lodger */}
                      <td style={{ padding: '1rem 0.75rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#60a5fa', fontSize: '0.85rem' }}>
                          {c.complaintNumber || `CMP-${c._id.slice(-6)}`}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginTop: '0.2rem' }}>
                          {c.user?.name}
                        </div>
                        {c.user?.cardId && (
                          <div style={{ fontSize: '0.65rem', color: '#93c5fd' }}>
                            🪪 {c.user.cardId}
                          </div>
                        )}
                      </td>

                      {/* Title & Category */}
                      <td style={{ padding: '1rem 0.75rem', verticalAlign: 'top', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{c.category}</span>
                          {c.isAiCategorized && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(6, 182, 212, 0.2)', color: '#67e8f9', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
                              AI {c.aiConfidence}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location Details */}
                      <td style={{ padding: '1rem 0.75rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: '#fff' }}>
                          🏢 {c.location?.building || c.department}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '0.15rem' }}>
                          {c.location?.floor} • {c.location?.room}
                        </div>
                        {c.location?.description && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Near: {c.location.description}
                          </div>
                        )}
                      </td>

                      {/* Priority & Live SLA */}
                      <td style={{ padding: '1rem 0.75rem', verticalAlign: 'top' }}>
                        <div style={{ marginBottom: '0.35rem' }}>
                          <PriorityBadge priority={c.priority} />
                        </div>
                        <SLATimer workOrder={c.workOrder} status={c.status} />
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 0.75rem', verticalAlign: 'top' }}>
                        <StatusBadge status={c.status} />
                        {c.feedback?.rating && (
                          <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.35rem' }}>
                            {c.feedback.rating} ⭐ Rating
                          </div>
                        )}
                      </td>

                      {/* Assigned Tradesman */}
                      <td style={{ padding: '1rem 0.75rem', verticalAlign: 'top' }}>
                        {c.assignedTo ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>
                              {c.assignedTo.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                              ⚡ {c.assignedTo.trade || c.assignedTo.department}
                            </div>
                            {c.workOrder?.workOrderNumber && (
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)', marginTop: '0.15rem' }}>
                                WO: {c.workOrder.workOrderNumber}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#f87171', fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 0.75rem', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                          {['Registered', 'Pending', 'Assigned'].includes(c.status) && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-primary"
                              onClick={() => openWorkOrderModal(c)}
                            >
                              {c.assignedTo ? 'Modify Work Order' : '📝 Create Work Order'}
                            </button>
                          )}

                          {c.status === 'Resolved' && (
                            <button 
                              type="button" 
                              className="btn btn-sm btn-primary"
                              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                              onClick={() => openVerifyModal(c)}
                            >
                              🔍 Verify & Complete
                            </button>
                          )}

                          {c.status === 'Completed' && (
                            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                              ✓ Verified & Closed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* REVIEW & CREATE WORK ORDER MODAL */}
        {workOrderModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  📝 Issue Maintenance Work Order
                </h3>
                <span className="badge badge-p-emergency">
                  Complaint #{workOrderModal.complaintNumber}
                </span>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                  {workOrderModal.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0' }}>
                  {workOrderModal.description}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#93c5fd' }}>
                  📍 {workOrderModal.location?.building} • Floor: {workOrderModal.location?.floor} • Room: {workOrderModal.location?.room}
                </div>
              </div>

              <form onSubmit={handleSaveWorkOrder}>
                
                {/* Tradesman Specialization Selector */}
                <div className="form-group">
                  <label className="form-label">Assign Qualified Tradesman *</label>
                  <select
                    className="form-control"
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    required
                  >
                    <option value="">Select Tradesman...</option>
                    {workers.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} — Trade: {w.trade || w.department} ({w.activeTasks} active tasks)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority & SLA Timer Selection */}
                <div className="form-group">
                  <label className="form-label">SLA Turnaround Priority *</label>
                  <select
                    className="form-control"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                  >
                    <option value="Urgent">🚨 Urgent (2 Hours Target SLA)</option>
                    <option value="High">🟠 High (6 Hours Target SLA)</option>
                    <option value="Medium">🟡 Medium (24 Hours Target SLA)</option>
                    <option value="Low">🟢 Low (48 Hours Target SLA)</option>
                  </select>
                </div>

                {/* Specific Manager Instructions */}
                <div className="form-group">
                  <label className="form-label">Manager Repair Instructions / Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g. Inspect main riser valve before cutting pipes. Wear protective gear."
                    value={workOrderInstructions}
                    onChange={(e) => setWorkOrderInstructions(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => setWorkOrderModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submittingWorkOrder}
                  >
                    {submittingWorkOrder ? 'Issuing Work Order...' : '🚀 Issue Work Order & Start SLA Timer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SIDE-BY-SIDE VERIFY RESOLUTION MODAL */}
        {verifyModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '780px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  🔍 Side-by-Side Resolution Verification
                </h3>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>
                  Work Order #{verifyModal.workOrder?.workOrderNumber || 'N/A'}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Inspect before & after repair photos. Approving will mark the ticket as Completed and dispatch notification to complainant.
              </p>

              {/* Side by Side Photos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                
                {/* Before Photo */}
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    📸 1. Initial Reported Defect Photo
                  </div>
                  {verifyModal.beforeImageUrl || verifyModal.imageUrl ? (
                    <img 
                      src={verifyModal.beforeImageUrl || verifyModal.imageUrl} 
                      alt="Before Repair" 
                      style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '4px' }} 
                    />
                  ) : (
                    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', background: 'rgba(255,255,255,0.02)' }}>
                      No initial photo uploaded
                    </div>
                  )}
                </div>

                {/* After Photo */}
                <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    ✅ 2. Tradesman Resolution Proof Photo
                  </div>
                  {verifyModal.resolutionImageUrl ? (
                    <img 
                      src={verifyModal.resolutionImageUrl} 
                      alt="After Resolution" 
                      style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '4px' }} 
                    />
                  ) : (
                    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', background: 'rgba(255,255,255,0.02)' }}>
                      No completion photo provided
                    </div>
                  )}
                </div>

              </div>

              {/* Technician Remarks */}
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>
                  Tradesman Resolution Remarks:
                </div>
                <div style={{ fontSize: '0.85rem', color: '#fff', marginTop: '0.2rem' }}>
                  "{verifyModal.workerRemarks || 'Work completed as instructed.'}"
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Manager Quality Remarks (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Inspected on site. Good quality repair."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setVerifyModal(null)}
                >
                  Cancel
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    style={{ borderColor: '#ef4444', color: '#f87171' }}
                    disabled={submittingVerify}
                    onClick={() => handleVerifyResolution(false)}
                  >
                    ❌ Reject & Request Rework
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                    disabled={submittingVerify}
                    onClick={() => handleVerifyResolution(true)}
                  >
                    {submittingVerify ? 'Marking Completed...' : '✅ Approve & Mark Completed'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default AdminDashboard;
