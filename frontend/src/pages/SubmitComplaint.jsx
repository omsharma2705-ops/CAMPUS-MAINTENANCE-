import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
};

const SubmitComplaint = () => {
  const { user, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();

  const categories = [
    { name: 'Electrical', icon: '💡', desc: 'Lighting, wiring, switchboards, power outlets' },
    { name: 'Water', icon: '🚰', desc: 'Plumbing, pipe burst, tap leakage, low pressure' },
    { name: 'Sanitaryware', icon: '🚽', desc: 'Washrooms, flushes, basins, cisterns' },
    { name: 'Furniture', icon: '🪑', desc: 'Desks, benches, chairs, podiums, cupboards' },
    { name: 'Doors', icon: '🚪', desc: 'Door locks, handles, hydraulic closers, windows' },
    { name: 'IT', icon: '🖥️', desc: 'Lab PCs, projectors, LAN ethernet, WiFi APs' },
    { name: 'HVAC', icon: '❄️', desc: 'AC cooling, ventilation, split units, ceiling fans' },
    { name: 'Civil / Structural', icon: '🏢', desc: 'Ceiling plaster, wall cracks, floor tiles, stairs' },
    { name: 'Cleanliness', icon: '🧹', desc: 'Garbage bins, hygiene, littering, campus grounds' },
    { name: 'Other', icon: '🔧', desc: 'General maintenance & miscellaneous repairs' }
  ];

  const campusBuildings = [
    'Computer Science Department',
    'Electronics & Comm Block',
    'Mechanical Engineering Block',
    'Civil Engineering Building',
    'Hostel Block A (Boys)',
    'Hostel Block B (Girls)',
    'Campus Central Library',
    'Lecture Hall Complex',
    'Admin & Faculty Block',
    'Sports Complex / Cafeteria'
  ];

  const floors = [
    'Basement',
    'Ground Floor',
    '1st Floor',
    '2nd Floor',
    '3rd Floor',
    '4th Floor',
    'Roof / Terrace'
  ];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: categories[0].name,
    priority: 'Medium',
    building: campusBuildings[0],
    floor: 'Ground Floor',
    room: '',
    locationDescription: ''
  });

  // AI NLP & Vision States
  const [aiResult, setAiResult] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [isAiApplied, setIsAiApplied] = useState(false);

  // Vision Specific State
  const [visionData, setVisionData] = useState(null);
  const [scanningVision, setScanningVision] = useState(false);
  
  // Duplicate Detection State
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [upvotingId, setUpvotingId] = useState(null);

  // Submission Result Modal
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  // Map & Media
  const [position, setPosition] = useState({ lat: 28.6139, lng: 77.2090 });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debounceTimer = useRef(null);

  // Trigger AI Text Analysis
  useEffect(() => {
    if (formData.title.trim().length >= 4 || formData.description.trim().length >= 10) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        runAiAnalysis();
      }, 500);
    }
  }, [formData.title, formData.description, formData.building]);

  const runAiAnalysis = async () => {
    try {
      setAnalyzingAi(true);
      const res = await axios.post(`${API_URL}/complaints/ai-analyze`, {
        title: formData.title,
        description: formData.description,
        department: formData.building,
        category: formData.category
      });

      setAiResult(res.data.aiClassification);
      setDuplicates(res.data.duplicateMatches || []);

      if (res.data.duplicateMatches?.length > 0 && res.data.duplicateMatches[0].similarity >= 60) {
        setShowDuplicateModal(true);
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  // AI Computer Vision Analysis on Photo Upload
  const handlePhotoUploadAndScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setScanningVision(true);

    const data = new FormData();
    data.append('image', file);
    data.append('customHint', formData.title);

    try {
      const res = await axios.post(`${API_URL}/complaints/ai-vision`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.visionResult) {
        setVisionData(res.data.visionResult);
        
        // Map detected category to our updated list
        let matchedCategory = res.data.visionResult.detectedCategory;
        if (matchedCategory.includes('Plumbing') || matchedCategory.includes('Water')) matchedCategory = 'Water';
        else if (matchedCategory.includes('Electrical')) matchedCategory = 'Electrical';
        else if (matchedCategory.includes('Furniture')) matchedCategory = 'Furniture';
        else if (matchedCategory.includes('Washroom') || matchedCategory.includes('Restroom')) matchedCategory = 'Sanitaryware';
        else if (matchedCategory.includes('AC')) matchedCategory = 'HVAC';
        else if (matchedCategory.includes('IT')) matchedCategory = 'IT';
        else if (matchedCategory.includes('Cleanliness')) matchedCategory = 'Cleanliness';
        else if (matchedCategory.includes('Structural')) matchedCategory = 'Civil / Structural';

        let mappedPriority = res.data.visionResult.suggestedPriority;
        if (mappedPriority === 'Emergency') mappedPriority = 'Urgent';

        setFormData(prev => ({
          ...prev,
          title: prev.title || res.data.visionResult.detectedDefect,
          category: matchedCategory,
          priority: mappedPriority,
          description: prev.description 
            ? `${prev.description}\n[AI Vision Insight]: ${res.data.visionResult.repairRecommendation}`
            : `Defect Detected: ${res.data.visionResult.detectedDefect}. ${res.data.visionResult.repairRecommendation}`,
        }));

        setIsAiApplied(true);
      }
    } catch (err) {
      console.error('Vision scan error:', err);
    } finally {
      setScanningVision(false);
    }
  };

  const applyAiSuggestions = () => {
    if (!aiResult) return;
    let mappedPriority = aiResult.priority;
    if (mappedPriority === 'Emergency') mappedPriority = 'Urgent';

    setFormData(prev => ({
      ...prev,
      category: aiResult.category,
      priority: mappedPriority
    }));
    setIsAiApplied(true);
  };

  const handleUpvoteExisting = async (duplicateComplaintId) => {
    try {
      setUpvotingId(duplicateComplaintId);
      await axios.post(`${API_URL}/complaints/${duplicateComplaintId}/upvote`);
      setShowDuplicateModal(false);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to upvote duplicate issue');
    } finally {
      setUpvotingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.description.trim()) {
      return setError('Description is mandatory. Please explain the issue.');
    }

    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title || `${formData.category} issue at ${formData.building}`);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('priority', formData.priority);
    data.append('building', formData.building);
    data.append('floor', formData.floor);
    data.append('room', formData.room || 'General Area');
    data.append('department', formData.building);
    data.append('lat', position.lat);
    data.append('lng', position.lng);
    data.append('locationDescription', formData.locationDescription);
    data.append('isAiCategorized', isAiApplied);
    data.append('aiConfidence', visionData?.confidence || aiResult?.confidence || 0);

    if (image) {
      data.append('image', image);
    }

    try {
      const res = await axios.post(`${API_URL}/complaints`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSubmittedComplaint(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error lodging complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>➕ Lodge Maintenance Complaint</h2>
                <span className="brand-badge" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
                  📸 AI Vision + SLA
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                University I-Card Registered: <strong>{user?.name}</strong> (🪪 {user?.cardId || 'Verified Scholar'})
              </p>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
              ← Back to Dashboard
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* AI Vision Scanner Box */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: '1.5rem', 
              marginBottom: '1.75rem', 
              border: '1px solid rgba(139, 92, 246, 0.4)',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08))'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>📸</span>
                  <strong style={{ fontSize: '1.05rem', color: '#c4b5fd' }}>AI Computer Vision Scanner</strong>
                  {scanningVision && (
                    <span style={{ fontSize: '0.75rem', color: '#67e8f9', animation: 'pulse 1.5s infinite' }}>
                      ⚡ Scanning defect signatures...
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Upload or snap a photo of the defect. AI Vision will automatically detect the defect, classify the category, and assign the priority.
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="btn btn-sm btn-primary" style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                    📷 {imagePreview ? 'Change Photo' : 'Upload Defect Photo'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handlePhotoUploadAndScan}
                    />
                  </label>
                  {imagePreview && (
                    <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                      ✓ Photo attached ({image?.name})
                    </span>
                  )}
                </div>
              </div>

              {imagePreview && (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={imagePreview} 
                    alt="Uploaded defect" 
                    style={{ width: '130px', height: '90px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid var(--primary)' }} 
                  />
                  {scanningVision && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(6,182,212,0.4)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'white', fontWeight: 700 }}>
                      Scanning...
                    </div>
                  )}
                </div>
              )}
            </div>

            {visionData && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>🎯</span> Defect Detected: {visionData.detectedDefect}
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                    {visionData.confidence}% Vision Confidence
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Main Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label className="form-label">Issue Summary / Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Water pipe rupture flooding corridor or Sparking power switch"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Category Grid */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Category * (Required)</label>
                  {isAiApplied && (
                    <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                      ✓ Auto-selected by AI
                    </span>
                  )}
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', 
                  gap: '0.65rem' 
                }}>
                  {categories.map((cat) => {
                    const isSelected = formData.category === cat.name;
                    return (
                      <div
                        key={cat.name}
                        onClick={() => {
                          setFormData({ ...formData, category: cat.name });
                          setIsAiApplied(false);
                        }}
                        style={{
                          background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(13, 19, 33, 0.6)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.75rem 0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                            {cat.name}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>{cat.desc.slice(0, 24)}...</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Structured Location (Building, Floor, Room) */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📍</span> Structured Campus Location *
                </div>
                
                <div className="grid-cols-3" style={{ gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Building / Campus Block *</label>
                    <select
                      className="form-control"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    >
                      {campusBuildings.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Floor *</label>
                    <select
                      className="form-control"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    >
                      {floors.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Room / Lab No. *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Lab 3 or Room 204"
                      required
                      value={formData.room}
                      onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Priority & SLA Selection */}
              <div className="form-group">
                <label className="form-label">Priority Level & SLA Turnaround *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[
                    { level: 'Urgent', label: '🚨 Urgent', sla: '2 Hours SLA', color: '#ef4444' },
                    { level: 'High', label: '🟠 High', sla: '6 Hours SLA', color: '#f97316' },
                    { level: 'Medium', label: '🟡 Medium', sla: '24 Hours SLA', color: '#3b82f6' },
                    { level: 'Low', label: '🟢 Low', sla: '48 Hours SLA', color: '#10b981' }
                  ].map(p => {
                    const isSelected = formData.priority === p.level;
                    return (
                      <div
                        key={p.level}
                        onClick={() => setFormData({ ...formData, priority: p.level })}
                        style={{
                          background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(13, 19, 33, 0.6)',
                          border: `1px solid ${isSelected ? p.color : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.65rem 0.5rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                          {p.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: isSelected ? p.color : 'var(--text-sub)', marginTop: '0.2rem', fontWeight: 600 }}>
                          {p.sla}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mandatory Description */}
              <div className="form-group">
                <label className="form-label">Mandatory Description *</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Provide precise details of the malfunction, danger level, or observable symptoms..."
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              {/* Map Pinpoint */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>📍 GPS Pinpoint on Campus Map</label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>
                    Coords: {position.lat.toFixed(4)}, {position.lng.toFixed(4)} (Click map to move pin)
                  </span>
                </div>
                <div style={{ height: '220px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <MapContainer center={[28.6139, 77.2090]} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nearby Landmark / Notes</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Next to East Stairwell, near water dispenser"
                  value={formData.locationDescription}
                  onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '0.85rem' }}>
                  {loading ? 'Registering & Generating Complaint No...' : '🚀 Submit Complaint for Redressal'}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* Duplicate Detection Modal */}
        {showDuplicateModal && duplicates.length > 0 && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '680px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.75rem' }}>🔍</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24' }}>
                  Similar Active Complaint Detected!
                </h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                An active issue matching this description is already registered. You can upvote it to avoid duplicates and boost priority.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {duplicates.map((dup) => (
                  <div 
                    key={dup.complaint._id} 
                    style={{ 
                      background: 'rgba(13, 19, 33, 0.9)', 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid rgba(251, 191, 36, 0.3)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{dup.complaint.title}</strong>
                      <span className="badge badge-p-high" style={{ fontSize: '0.7rem' }}>
                        {dup.similarity}% Similarity Match
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.35rem 0' }}>
                      {dup.complaint.description}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                        📍 {dup.complaint.location?.building || dup.complaint.department} • Status: {dup.complaint.status}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleUpvoteExisting(dup.complaint._id)}
                        disabled={upvotingId === dup.complaint._id}
                      >
                        👍 Upvote Active Issue
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowDuplicateModal(false)}
                >
                  Continue Submitting New Complaint
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal showing Unique Complaint ID */}
        {submittedComplaint && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '520px', textAlign: 'center', padding: '2.5rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
                Complaint Registered Successfully!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your maintenance ticket has been stored in the campus redressal system and routed to the Facilities Manager.
              </p>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textTransform: 'uppercase' }}>Unique Complaint Number</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60a5fa', margin: '0.25rem 0' }}>
                  {submittedComplaint.complaintNumber}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7' }}>
                    Status: Registered
                  </span>
                  <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                    Priority: {submittedComplaint.priority}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '1.75rem' }}>
                <span>✓ App Push Notified</span>
                <span>•</span>
                <span>✓ Email Confirmation Sent</span>
                <span>•</span>
                <span>✓ SMS Alert Dispatched</span>
              </div>

              <button 
                type="button" 
                className="btn btn-primary btn-block"
                onClick={() => navigate('/dashboard')}
              >
                Go to My Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default SubmitComplaint;
