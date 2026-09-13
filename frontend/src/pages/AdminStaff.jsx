import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const AdminStaff = () => {
  const { API_URL } = useContext(AuthContext);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Worker Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Electrical Maintenance',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const specializations = [
    'Electrical Maintenance',
    'Plumbing & Water Supply',
    'Carpentry & Furniture',
    'HVAC / AC & Cooling Systems',
    'Housekeeping & Sanitation',
    'IT & Lab Systems Support',
    'Civil & Structural Repair',
    'General Campus Maintenance'
  ];

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/admin/workers`);
      setWorkers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await axios.post(`${API_URL}/admin/workers`, formData);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        department: 'Electrical Maintenance',
        phone: '',
      });
      fetchWorkers();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create technician account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>👨‍🔧 Maintenance Staff Directory</h1>
              <span className="brand-badge">Team Ops</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Manage university technicians, trade specializations & live workloads
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/dashboard" className="btn btn-outline">
              ← Back to Command Center
            </Link>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              ➕ Onboard New Technician
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading staff directory...
          </div>
        ) : (
          <div className="grid-cols-4" style={{ gap: '1.5rem' }}>
            {workers.map((w) => (
              <div key={w._id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                      👨‍🔧
                    </div>
                    <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>
                      {w.isActive ? 'Active Staff' : 'Inactive'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                    {w.name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#60a5fa', fontWeight: 600, marginBottom: '0.5rem' }}>
                    🔧 {w.department}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    ✉️ {w.email}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    📞 {w.phone || 'No phone added'}
                  </div>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#93c5fd' }}>{w.activeTasks}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', textTransform: 'uppercase' }}>Active Tasks</div>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>{w.completedTasks}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', textTransform: 'uppercase' }}>Resolved</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Worker Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                ➕ Register Maintenance Technician
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Creates a new staff account with dashboard access to accept and resolve campus tickets
              </p>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleCreateWorker}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ramesh Kumar (Electrician)"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. ramesh.electrician@campus.edu"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Trade / Specialization *</label>
                    <select
                      className="form-control"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      {specializations.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+91 98765 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Account Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Temporary login password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Registering...' : 'Register Technician'}
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

export default AdminStaff;
