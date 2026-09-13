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
    { name: 'Water Leakage / Plumbing', icon: '🚰' },
    { name: 'Electrical / Lighting', icon: '💡' },
    { name: 'Broken Furniture (Bench/Desk)', icon: '🪑' },
    { name: 'Washroom / Restroom Issue', icon: '🚽' },
    { name: 'Garbage / Cleanliness', icon: '🧹' },
    { name: 'AC / Fan Issue', icon: '❄️' },
    { name: 'IT / Lab Equipment', icon: '🖥️' },
    { name: 'Building / Structural Damage', icon: '🏢' },
    { name: 'Other', icon: '🔧' }
  ];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: categories[0].name,
    priority: 'Medium',
    department: user?.department || 'Hostel Block A',
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
  }, [formData.title, formData.description, formData.department]);

  const runAiAnalysis = async () => {
    try {
      setAnalyzingAi(true);
      const res = await axios.post(`${API_URL}/complaints/ai-analyze`, {
        title: formData.title,
        description: formData.description,
        department: formData.department,
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
    data.append('customHint', file.name);

    try {
      const res = await axios.post(`${API_URL}/complaints/ai-vision`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const v = res.data.visionResult;
      setVisionData(v);

      // Auto-Populate Form Fields with High-Confidence Vision Detection
      setFormData(prev => ({
        ...prev,
        title: prev.title || v.suggestedTitle,
        description: prev.description || v.suggestedDescription,
        category: v.category,
        priority: v.priority,
      }));
      setIsAiApplied(true);
    } catch (err) {
      console.error('Vision scanning error:', err);
    } finally {
      setScanningVision(false);
    }
  };

  const applyAiSuggestions = () => {
    if (!aiResult) return;
    setFormData(prev => ({
      ...prev,
      category: aiResult.category,
      priority: aiResult.priority
    }));
    setIsAiApplied(true);
  };

  const handleUpvoteExisting = async (complaintId) => {
    try {
      setUpvotingId(complaintId);
      await axios.post(`${API_URL}/complaints/${complaintId}/upvote`);
      alert('🎉 You have upvoted this existing complaint! Your vote has elevated its priority for the maintenance team.');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error upvoting');
    } finally {
      setUpvotingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('priority', formData.priority);
    data.append('department', formData.department);
    data.append('locationDescription', formData.locationDescription);
    data.append('lat', position.lat);
    data.append('lng', position.lng);
    data.append('isAiCategorized', isAiApplied || (aiResult?.confidence >= 70) || (visionData?.confidence >= 80));
    data.append('aiConfidence', visionData?.confidence || aiResult?.confidence || 0);

    if (image) {
      data.append('image', image);
    }

    try {
      await axios.post(`${API_URL}/complaints`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || 'Error submitting complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>➕ Lodge Maintenance Complaint</h2>
                <span className="brand-badge" style={{ background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }}>
                  📸 AI Vision + NLP
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Snap or upload a photo for instant AI damage detection & auto-fill
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

          {/* AI Computer Vision Live Analysis Box */}
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
                      ⚡ Scanning visual features & defect signatures...
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Upload or snap a photo of the defect. AI Vision will automatically identify the problem, severity, and populate your ticket.
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="btn btn-sm btn-primary" style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
                    📷 {imagePreview ? 'Change / Rescan Photo' : 'Upload & Scan Photo'}
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

            {/* Vision Detection Result Card */}
            {visionData && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>🎯</span> Defect Detected: {visionData.detectedDefect}
                  </div>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                    {visionData.confidence}% Vision Confidence
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {visionData.visualTags?.map(tag => (
                    <span key={tag} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI NLP Text Assistant (if typed manually) */}
          {aiResult && !visionData && (
            <div 
              className="glass-panel" 
              style={{ 
                padding: '1.25rem 1.5rem', 
                marginBottom: '1.5rem', 
                border: '1px solid rgba(6, 182, 212, 0.4)',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.08))'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>🤖</span>
                    <strong style={{ color: '#67e8f9', fontSize: '0.95rem' }}>Text Analysis Insights</strong>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(6, 182, 212, 0.2)', color: '#a5f3fc', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                      {aiResult.confidence}% Match
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                    {aiResult.reasoning}
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={applyAiSuggestions}
                  className="btn btn-sm"
                  style={{ background: isAiApplied ? 'var(--success)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', fontWeight: 700 }}
                >
                  {isAiApplied ? '✓ AI Settings Applied' : '✨ Apply Suggestions'}
                </button>
              </div>
            </div>
          )}

          {/* Main Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label className="form-label">Issue Title / Summary *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Broken water tap leaking on 3rd floor hostel"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Category Grid */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Select Issue Category *</label>
                  {isAiApplied && (
                    <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                      ✓ Auto-selected by AI
                    </span>
                  )}
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
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
                          background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(13, 19, 33, 0.6)',
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
                        <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                          {cat.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Low">🟢 Low (Routine / Non-urgent)</option>
                    <option value="Medium">🟡 Medium (Normal standard issue)</option>
                    <option value="High">🟠 High (Impacting classes or living)</option>
                    <option value="Emergency">🚨 Emergency (Safety hazard / Fire / Spark / Flood)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Campus Area / Department</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Hostel Block A, CS Lab 3, Central Library"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description *</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Detailed description of the issue..."
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              {/* Map Locator */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>📍 Pinpoint Location on Campus Map</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                    Coords: {position.lat.toFixed(4)}, {position.lng.toFixed(4)} (Click map to move pin)
                  </span>
                </div>
                <div style={{ height: '250px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <MapContainer center={[28.6139, 77.2090]} zoom={14} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Specific Landmark / Room Details</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Next to water purifier, Wing 2"
                  value={formData.locationDescription}
                  onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '0.85rem' }}>
                  {loading ? 'Submitting & Indexing...' : '🚀 Submit Complaint for Redressal'}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* AI Duplicate Detection Warning Modal */}
        {showDuplicateModal && duplicates.length > 0 && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.75rem' }}>🔍</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fbbf24' }}>
                  Similar Active Complaint Detected!
                </h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                Our AI noticed an active issue matching your description. You can <strong>upvote the existing ticket</strong> to boost its priority instead of creating a duplicate ticket.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {duplicates.map((dup) => (
                  <div 
                    key={dup.complaint._id} 
                    style={{ 
                      background: 'rgba(13, 19, 33, 0.9)', 
                      border: '1px solid rgba(245, 158, 11, 0.4)', 
                      padding: '1.1rem', 
                      borderRadius: 'var(--radius-sm)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                        {dup.complaint.title}
                      </h4>
                      <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                        {dup.similarity}% AI Match
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.6rem' }}>
                      {dup.complaint.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div>
                        🏢 {dup.complaint.department} • 👤 By {dup.complaint.user?.name || 'Student'} • Status: <strong>{dup.complaint.status}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpvoteExisting(dup.complaint._id)}
                        disabled={upvotingId === dup.complaint._id}
                        className="btn btn-sm btn-primary"
                        style={{ padding: '0.4rem 0.85rem' }}
                      >
                        👍 Upvote This Ticket (+1 Vote)
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                  Is this a completely different issue?
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowDuplicateModal(false)}
                >
                  Proceed with New Ticket Anyway →
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default SubmitComplaint;
