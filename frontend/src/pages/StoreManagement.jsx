import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const StoreManagement = () => {
  const { API_URL } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'requests', 'ledger'
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Modals
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockNotes, setRestockNotes] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'Electrical',
    sku: '',
    quantity: 20,
    unit: 'pcs',
    unitCost: 100,
    lowStockThreshold: 10,
    locationShelf: 'Bay A1',
  });

  const [issuingId, setIssuingId] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, [categoryFilter, searchQuery]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const [invRes, reqRes, ledgerRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/stores/inventory?category=${categoryFilter}&search=${searchQuery}`),
        axios.get(`${API_URL}/stores/requests`),
        axios.get(`${API_URL}/stores/ledger`),
        axios.get(`${API_URL}/stores/stats`),
      ]);

      setInventory(invRes.data);
      setRequests(reqRes.data);
      setLedger(ledgerRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Store data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueMaterials = async (requestId) => {
    if (!window.confirm('Confirm issuance of required materials? Stock will be decremented and recorded in the audit ledger.')) return;

    try {
      setIssuingId(requestId);
      await axios.post(`${API_URL}/stores/requests/${requestId}/issue`);
      alert('Materials successfully issued! Tradesman has been notified.');
      fetchStoreData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to issue materials');
    } finally {
      setIssuingId(null);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockModal) return;

    try {
      setSubmittingAction(true);
      await axios.post(`${API_URL}/stores/restock`, {
        itemId: restockModal._id,
        quantity: restockQty,
        notes: restockNotes || `Replenished stock of ${restockModal.name}`,
      });

      setRestockModal(null);
      setRestockQty(10);
      setRestockNotes('');
      fetchStoreData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error restocking item');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAddMaterialSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await axios.post(`${API_URL}/stores/inventory`, newMaterial);
      setAddModal(false);
      setNewMaterial({
        name: '',
        category: 'Electrical',
        sku: '',
        quantity: 20,
        unit: 'pcs',
        unitCost: 100,
        lowStockThreshold: 10,
        locationShelf: 'Bay A1',
      });
      fetchStoreData();
    } catch (err) {
      alert(err.response?.data?.msg || 'Error adding inventory item');
    } finally {
      setSubmittingAction(false);
    }
  };

  const categories = [
    'All', 'Electrical', 'Plumbing', 'Carpentry', 'HVAC', 'IT', 'Sanitaryware', 'Civil / Hardware', 'Cleanliness'
  ];

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>📦 Central Stores & Inventory Section</h1>
              <span className="brand-badge" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                Ledger Active
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Spare Parts Catalog, Requisition Approvals, Stock Issuance, and Audit Trail
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => setAddModal(true)}
            >
              ➕ Onboard New Material
            </button>
          </div>
        </div>

        {/* Top KPI Summary */}
        <div className="grid-cols-4" style={{ marginBottom: '1.75rem' }}>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Catalog Inventory</div>
            <div className="kpi-value" style={{ color: '#60a5fa' }}>{stats?.totalItems || inventory.length}</div>
            <div className="kpi-desc">Registered material SKUs</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Inventory Valuation</div>
            <div className="kpi-value" style={{ color: '#34d399' }}>₹{stats?.totalValuation?.toLocaleString() || 0}</div>
            <div className="kpi-desc">Total store asset value</div>
          </div>
          <div className="glass-panel kpi-card" style={{ borderColor: (stats?.lowStockCount > 0) ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)' }}>
            <div className="kpi-title" style={{ color: (stats?.lowStockCount > 0) ? '#fca5a5' : 'var(--text-muted)' }}>
              Low-Stock Alerts
            </div>
            <div className="kpi-value" style={{ color: (stats?.lowStockCount > 0) ? '#ef4444' : '#fff' }}>
              {stats?.lowStockCount || 0}
            </div>
            <div className="kpi-desc">Items at/below reorder threshold</div>
          </div>
          <div className="glass-panel kpi-card">
            <div className="kpi-title">Pending Requisitions</div>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>
              {requests.filter(r => r.status === 'Pending').length}
            </div>
            <div className="kpi-desc">Tradesmen waiting for materials</div>
          </div>
        </div>

        {/* Auto Reorder Alert Banner */}
        {stats?.lowStockItems?.length > 0 && (
          <div 
            style={{ 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))', 
              border: '1px solid rgba(239, 68, 68, 0.4)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '1.25rem', 
              marginBottom: '2rem' 
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🚨</span>
                <strong style={{ fontSize: '1.05rem', color: '#fca5a5' }}>
                  Auto-Reorder Stock Warning ({stats.lowStockItems.length} items critical)
                </strong>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                System trigger threshold reached
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {stats.lowStockItems.map(item => (
                <div 
                  key={item._id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#f87171' }}>
                      Current: <strong>{item.quantity} {item.unit}</strong> (Threshold: {item.lowStockThreshold})
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}
                    onClick={() => {
                      setRestockModal(item);
                      setRestockQty(20);
                    }}
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <button 
            type="button" 
            className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Store Inventory ({inventory.length})
          </button>
          <button 
            type="button" 
            className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none', position: 'relative' }}
            onClick={() => setActiveTab('requests')}
          >
            📋 Material Requisitions ({requests.filter(r => r.status === 'Pending').length} Pending)
          </button>
          <button 
            type="button" 
            className={`btn ${activeTab === 'ledger' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('ledger')}
          >
            📑 Transaction Audit Ledger
          </button>
        </div>

        {/* TAB 1: INVENTORY CATALOG */}
        {activeTab === 'inventory' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            
            {/* Filter Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    type="button" 
                    className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input 
                type="text" 
                className="form-control" 
                placeholder="Search by SKU or material name..." 
                style={{ width: '260px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Inventory Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>SKU</th>
                    <th style={{ padding: '0.75rem' }}>Material Name</th>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Location / Bay</th>
                    <th style={{ padding: '0.75rem' }}>Unit Cost</th>
                    <th style={{ padding: '0.75rem' }}>Current Stock</th>
                    <th style={{ padding: '0.75rem' }}>Threshold</th>
                    <th style={{ padding: '0.75rem' }}>Stock Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No inventory materials found.
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => {
                      const isLow = item.quantity <= item.lowStockThreshold;
                      const isOut = item.quantity === 0;

                      return (
                        <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                          <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#93c5fd' }}>
                            {item.sku}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: '#fff' }}>
                            {item.name}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>
                            {item.category}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-sub)' }}>
                            {item.locationShelf}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem' }}>
                            ₹{item.unitCost} / {item.unit}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, fontSize: '1rem', color: isOut ? '#ef4444' : (isLow ? '#f87171' : '#34d399') }}>
                            {item.quantity} {item.unit}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>
                            {item.lowStockThreshold} {item.unit}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem' }}>
                            {isOut ? (
                              <span className="badge" style={{ background: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="badge" style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)' }}>
                                ⚠️ Low Stock
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7' }}>
                                ✓ Normal
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline"
                              onClick={() => {
                                setRestockModal(item);
                                setRestockQty(15);
                              }}
                            >
                              📥 Receive Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 2: MATERIAL REQUISITIONS FROM TRADESMEN */}
        {activeTab === 'requests' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Tradesman Material Requisitions Queue
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {requests.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No material requisitions recorded.
                </div>
              ) : (
                requests.map((req) => (
                  <div 
                    key={req._id}
                    style={{
                      background: 'rgba(13, 19, 33, 0.85)',
                      border: `1px solid ${req.status === 'Pending' ? 'rgba(251, 191, 36, 0.4)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span className="badge badge-p-high" style={{ fontSize: '0.7rem' }}>
                            Work Order: {req.workOrderNumber || 'N/A'}
                          </span>
                          <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                            Complaint: {req.complaintNumber}
                          </span>
                          <span 
                            className="badge" 
                            style={{
                              background: req.status === 'Issued' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                              color: req.status === 'Issued' ? '#6ee7b7' : '#fbbf24',
                              fontWeight: 700,
                            }}
                          >
                            {req.status === 'Issued' ? '✓ Materials Issued' : '⏳ Awaiting Stores Issuance'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                          Requested by: <strong>{req.requestedBy?.name}</strong> ({req.requestedBy?.trade || 'Specialist'})
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                          Reason: "{req.reason}" • Requested: {new Date(req.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {req.status === 'Pending' && (
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary"
                          disabled={issuingId === req._id}
                          onClick={() => handleIssueMaterials(req._id)}
                          style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                        >
                          {issuingId === req._id ? 'Deducting & Issuing...' : '✓ Issue Materials'}
                        </button>
                      )}
                    </div>

                    {/* Items List */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Required Spare Parts / Items:
                      </div>
                      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {req.items.map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                            <span style={{ color: '#60a5fa' }}>•</span>
                            <strong style={{ color: '#fff' }}>{it.quantity} {it.unit}</strong>
                            <span style={{ color: 'var(--text-muted)' }}>{it.itemName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TRANSACTION AUDIT LEDGER */}
        {activeTab === 'ledger' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>
              Chronological Inventory Audit Ledger
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-sub)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem' }}>Timestamp</th>
                    <th style={{ padding: '0.75rem' }}>Type</th>
                    <th style={{ padding: '0.75rem' }}>Material Item</th>
                    <th style={{ padding: '0.75rem' }}>Qty Changed</th>
                    <th style={{ padding: '0.75rem' }}>Balance After</th>
                    <th style={{ padding: '0.75rem' }}>Ref / Work Order</th>
                    <th style={{ padding: '0.75rem' }}>Tradesman</th>
                    <th style={{ padding: '0.75rem' }}>Handled By</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No ledger transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledger.map((entry) => (
                      <tr key={entry._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.82rem' }}>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span 
                            className="badge" 
                            style={{
                              background: entry.type === 'Received' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                              color: entry.type === 'Received' ? '#6ee7b7' : '#fca5a5',
                              fontWeight: 700,
                            }}
                          >
                            {entry.type === 'Received' ? '📥 Received' : '📤 Issued'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>
                          {entry.itemName}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: entry.type === 'Received' ? '#34d399' : '#f87171' }}>
                          {entry.type === 'Received' ? `+${entry.quantity}` : `-${entry.quantity}`} {entry.unit}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: '#93c5fd' }}>
                          {entry.balanceAfter} {entry.unit}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                          {entry.workOrderNumber || entry.complaintNumber || 'DIRECT'}
                        </td>
                        <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                          {entry.tradesman?.name || 'Store Facility'}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-sub)' }}>
                          {entry.handledBy?.name || 'Admin'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RESTOCK MODAL */}
        {restockModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '440px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                📥 Receive Stock / Restock Material
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Item: <strong>{restockModal.name}</strong> ({restockModal.sku})
              </p>

              <form onSubmit={handleRestockSubmit}>
                <div className="form-group">
                  <label className="form-label">Quantity to Add ({restockModal.unit}) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="1" 
                    required 
                    value={restockQty} 
                    onChange={(e) => setRestockQty(Number(e.target.value))} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">PO / Delivery Reference / Note</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. PO-2026-9921 from Campus Supplier"
                    value={restockNotes} 
                    onChange={(e) => setRestockNotes(e.target.value)} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setRestockModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={submittingAction}
                  >
                    {submittingAction ? 'Updating Ledger...' : 'Confirm Stock Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ONBOARD NEW MATERIAL MODAL */}
        {addModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '520px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
                ➕ Onboard New Inventory Material
              </h3>

              <form onSubmit={handleAddMaterialSubmit}>
                <div className="form-group">
                  <label className="form-label">Material / Spare Part Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. 25mm PVC Elbow Fitting"
                    required
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                  />
                </div>

                <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select 
                      className="form-control"
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                    >
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU / Item Code *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. PLUMB-ELB-25"
                      required
                      value={newMaterial.sku}
                      onChange={(e) => setNewMaterial({ ...newMaterial, sku: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-cols-3" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={newMaterial.quantity}
                      onChange={(e) => setNewMaterial({ ...newMaterial, quantity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="pcs, m, kg"
                      value={newMaterial.unit}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit Cost (₹)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="0"
                      value={newMaterial.unitCost}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unitCost: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid-cols-2" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Low Stock Threshold</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      min="1"
                      value={newMaterial.lowStockThreshold}
                      onChange={(e) => setNewMaterial({ ...newMaterial, lowStockThreshold: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Storage Location / Bay</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Bay P3 Shelf 2"
                      value={newMaterial.locationShelf}
                      onChange={(e) => setNewMaterial({ ...newMaterial, locationShelf: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={submittingAction}
                  >
                    {submittingAction ? 'Adding...' : 'Save & Onboard Material'}
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

export default StoreManagement;
