import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
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

  // Assign Modal
  const [assignModal, setAssignModal] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

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

  const openAssignModal = (complaint) => {
    setAssignModal(complaint);
    setSelectedWorker(complaint.assignedTo?._id || (workers.length > 0 ? workers[0]._id : ''));
    setSelectedPriority(complaint.priority || 'Medium');
    setAdminRemarks(complaint.adminRemarks || '');
  };

  const handleSaveAssign = async (e) => {
    e.preventDefault();
    if (!selectedWorker) return alert('Please select a technician.');

    setSubmittingAssign(true);
    try {
      await axios.put(`${API_URL}/complaints/${assignModal._id}/assign`, {
        workerId: selectedWorker,
        priority: selectedPriority,
        adminRemarks,
      });
      setAssignModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to assign complaint');
    } finally {
      setSubmittingAssign(false);
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
      alert(err.response?.data?.msg || 'Failed to verify');
    } finally {
      setSubmittingVerify(false);
    }
  };

  const summary = analytics?.summary || {};

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Command Center Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>👨‍💼 Super Admin Command Center</h1>
              <span className="brand-badge" style={{ background: '#ef4444' }}>Full Access</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Campus Maintenance Oversight, Staff Allocations & Redressal Monitoring
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/admin/staff" className="btn btn-outline">
              👨‍🔧 Manage Staff ({workers.length})
            </Link>
            <Link to="/admin/analytics" className="btn btn-primary">
              📈 Detailed Analytics
            </Link>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Total Complaints</div>
            <div className="kpi-value">{summary.totalComplaints || 0}</div>
            <div className="kpi-desc">Across all campus zones</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <div className="kpi-title" style={{ color: '#fbbf24' }}>Pending Assignment</div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>{summary.pending || 0}</div>
            <div className="kpi-desc">Needs worker allocation</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
            <div className="kpi-title" style={{ color: '#a78bfa' }}>Active Maintenance</div>
            <div className="kpi-value" style={{ color: '#a78bfa' }}>{(summary.assigned || 0) + (summary.inProgress || 0)}</div>
            <div className="kpi-desc">Assigned & in-progress</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="kpi-title" style={{ color: '#34d399' }}>Verified & Closed</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{summary.closed || 0}</div>
            <div className="kpi-desc">⭐ Avg Satisfaction: {summary.avgRating || 5.0}/5.0</div>
          </div>
        </div>

        {/* Multi-Filter Search Bar */}
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">🔍 Search Keywords</label>
              <input
                type="text"
                className="form-control"
                placeholder="Title, description, hostel..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status Filter</label>
              <select
                className="form-control"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">⏳ Pending</option>
                <option value="Assigned">👷 Assigned</option>
                <option value="In Progress">⚡ In Progress</option>
                <option value="Resolved">✅ Resolved (Needs Verify)</option>
                <option value="Closed">🔒 Closed</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Priority Filter</label>
              <select
                className="form-control"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="All">All Priorities</option>
                <option value="Emergency">🚨 Emergency</option>
                <option value="High">🟠 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              >
                <option value="All">All Categories</option>
                <option value="Water Leakage / Plumbing">🚰 Plumbing</option>
                <option value="Electrical / Lighting">💡 Electrical</option>
                <option value="Broken Furniture (Bench/Desk)">🪑 Furniture</option>
                <option value="Washroom / Restroom Issue">🚽 Restroom</option>
                <option value="Garbage / Cleanliness">🧹 Cleanliness</option>
                <option value="AC / Fan Issue">❄️ AC / Fan</option>
                <option value="IT / Lab Equipment">🖥️ IT Equipment</option>
                <option value="Building / Structural Damage">🏢 Structural</option>
              </select>
            </div>

          </div>
        </div>

        {/* Complaints Master Data Table */}
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              All Campus Complaints ({complaints.length})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
              Real-time synchronization
            </span>
          </div>

          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ticket / Title</th>
                  <th>Department & Location</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Technician</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No complaints match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c._id}>
                      <td style={{ maxWidth: '240px' }}>
                        <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>{c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                          Lodged by: {c.user?.name || 'Student'} • {new Date(c.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{c.department}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>📍 {c.location?.description || 'Campus'}</div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{c.category}</span>
                      </td>

                      <td>
                        <PriorityBadge priority={c.priority} />
                      </td>

                      <td>
                        <StatusBadge status={c.status} />
                      </td>

                      <td>
                        {c.assignedTo ? (
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#93c5fd' }}>
                              👨‍🔧 {c.assignedTo.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                              {c.assignedTo.department || 'Staff'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#fbbf24', fontSize: '0.8rem', fontStyle: 'italic' }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => openAssignModal(c)}
                            className="btn btn-outline btn-sm"
                            title="Assign or Change Technician"
                          >
                            👨‍🔧 {c.assignedTo ? 'Reassign' : 'Assign'}
                          </button>

                          {c.status === 'Resolved' && (
                            <button
                              onClick={() => openVerifyModal(c)}
                              className="btn btn-success btn-sm"
                              title="Verify resolution proof & close"
                            >
                              🔍 Verify Proof
                            </button>
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

        {/* Worker Assignment Modal */}
        {assignModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                👨‍🔧 Assign Technician & Set Priority
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                For Issue: <strong>{assignModal.title}</strong> ({assignModal.category})
              </p>

              <form onSubmit={handleSaveAssign}>
                <div className="form-group">
                  <label className="form-label">Select Maintenance Technician *</label>
                  <select
                    className="form-control"
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    required
                  >
                    <option value="">-- Choose a Technician --</option>
                    {workers.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} — {w.department} ({w.activeTasks} active tasks)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Set Priority Level</label>
                  <select
                    className="form-control"
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🟠 High</option>
                    <option value="Emergency">🚨 Emergency</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Admin Instructions / Directives for Staff</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g., Please carry spare 25mm PVC pipe fittings. Urgent fix."
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setAssignModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submittingAssign}
                  >
                    {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Side-by-Side Resolution Verification Modal */}
        {verifyModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '750px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                🔍 Verify Redressal Proof & Close Ticket
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Issue: <strong>{verifyModal.title}</strong>
              </p>

              {/* Side by Side Image Comparison */}
              <div className="grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    📷 1. Initial Issue Photo
                  </div>
                  {verifyModal.imageUrl ? (
                    <a href={verifyModal.imageUrl} target="_blank" rel="noreferrer">
                      <img 
                        src={verifyModal.imageUrl} 
                        alt="Initial" 
                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                      />
                    </a>
                  ) : (
                    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontSize: '0.85rem' }}>
                      No initial photo attached
                    </div>
                  )}
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
                    ✅ 2. Technician's Resolution Proof
                  </div>
                  {verifyModal.resolutionImageUrl ? (
                    <a href={verifyModal.resolutionImageUrl} target="_blank" rel="noreferrer">
                      <img 
                        src={verifyModal.resolutionImageUrl} 
                        alt="Proof" 
                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                      />
                    </a>
                  ) : (
                    <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontSize: '0.85rem' }}>
                      No resolution photo uploaded
                    </div>
                  )}
                </div>
              </div>

              {verifyModal.workerRemarks && (
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  👨‍🔧 <strong>Technician Note:</strong> "{verifyModal.workerRemarks}"
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Admin Verification Remarks</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Repair verified. Water pipe leak fully rectified."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setVerifyModal(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  disabled={submittingVerify}
                  onClick={() => handleVerifyResolution(false)}
                >
                  ❌ Reject (Send Back to Work)
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  disabled={submittingVerify}
                  onClick={() => handleVerifyResolution(true)}
                >
                  {submittingVerify ? 'Processing...' : '✅ Approve & Close Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default AdminDashboard;
