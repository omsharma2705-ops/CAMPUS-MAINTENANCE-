import React, { useState, useContext } from 'react';
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

  // Campus Default Coordinates (Center)
  const [position, setPosition] = useState({ lat: 28.6139, lng: 77.2090 });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
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
      setError(err.response?.data?.msg || 'Error submitting complaint. Please try again.');
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
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>➕ Lodge Maintenance Complaint</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Report an issue across the university campus for immediate redressal
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

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <label className="form-label">Issue Title / Summary *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Water leaking from 2nd floor restroom pipe"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Category Grid Selection */}
              <div className="form-group">
                <label className="form-label">Select Issue Category *</label>
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
                        onClick={() => setFormData({ ...formData, category: cat.name })}
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
                    <option value="Low">🟢 Low (Can wait a few days)</option>
                    <option value="Medium">🟡 Medium (Normal standard issue)</option>
                    <option value="High">🟠 High (Impacting daily classes/hostel)</option>
                    <option value="Emergency">🚨 Emergency (Hazard / Immediate attention)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Campus Area / Department</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Hostel Block B, Room 304 or CS Lab 2"
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
                  placeholder="Provide any specific details (e.g. how long it's broken, exact bench/switch number)..."
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
                    Coords: {position.lat.toFixed(4)}, {position.lng.toFixed(4)} (Click to move pin)
                  </span>
                </div>
                <div style={{ height: '260px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
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
                  placeholder="e.g., Near water cooler next to Lab 4"
                  value={formData.locationDescription}
                  onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                />
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label className="form-label">📷 Attach Issue Photo (Optional but Recommended)</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ maxHeight: '160px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} 
                    />
                  </div>
                )}
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ padding: '0.85rem' }}>
                  {loading ? 'Submitting & Uploading Photo...' : '🚀 Submit Complaint for Redressal'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubmitComplaint;
