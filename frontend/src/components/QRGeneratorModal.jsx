import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QRGeneratorModal = ({ isOpen, onClose }) => {
  const campusBuildings = [
    { name: 'Computer Science Department', lat: 28.6145, lng: 77.2085 },
    { name: 'Electronics & Comm Block', lat: 28.6140, lng: 77.2092 },
    { name: 'Mechanical Engineering Block', lat: 28.6135, lng: 77.2080 },
    { name: 'Civil Engineering Building', lat: 28.6150, lng: 77.2075 },
    { name: 'Hostel Block A (Boys)', lat: 28.6120, lng: 77.2100 },
    { name: 'Hostel Block B (Girls)', lat: 28.6115, lng: 77.2110 },
    { name: 'Campus Central Library', lat: 28.6142, lng: 77.2098 },
    { name: 'Lecture Hall Complex', lat: 28.6138, lng: 77.2089 },
    { name: 'Admin & Faculty Block', lat: 28.6130, lng: 77.2095 },
    { name: 'Sports Complex / Cafeteria', lat: 28.6125, lng: 77.2070 }
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

  const categories = [
    'General (All Issues)',
    'Electrical',
    'Water',
    'Sanitaryware',
    'Furniture',
    'Doors',
    'IT',
    'HVAC',
    'Cleanliness'
  ];

  const [building, setBuilding] = useState(campusBuildings[0].name);
  const [floor, setFloor] = useState('Ground Floor');
  const [room, setRoom] = useState('Room 101');
  const [category, setCategory] = useState('General (All Issues)');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchPrefix, setBatchPrefix] = useState('Room');
  const [batchStart, setBatchStart] = useState(101);
  const [batchEnd, setBatchEnd] = useState(106);
  const [batchQrs, setBatchQrs] = useState([]);
  const [generatingBatch, setGeneratingBatch] = useState(false);

  // Generate single QR code
  useEffect(() => {
    if (!isOpen) return;

    const matchedBldg = campusBuildings.find(b => b.name === building) || campusBuildings[0];
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    params.set('building', building);
    params.set('floor', floor);
    if (room.trim()) params.set('room', room.trim());
    if (category && category !== 'General (All Issues)') params.set('category', category);
    params.set('lat', matchedBldg.lat);
    params.set('lng', matchedBldg.lng);

    const fullUrl = `${baseUrl}/submit?${params.toString()}`;
    setTargetUrl(fullUrl);

    QRCode.toDataURL(fullUrl, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('QR code generation error:', err);
    });
  }, [building, floor, room, category, isOpen]);

  // Generate batch QRs
  const handleGenerateBatch = async () => {
    setGeneratingBatch(true);
    const results = [];
    const matchedBldg = campusBuildings.find(b => b.name === building) || campusBuildings[0];
    const baseUrl = window.location.origin;

    const start = parseInt(batchStart, 10) || 101;
    const end = Math.min(start + 20, parseInt(batchEnd, 10) || 106);

    for (let i = start; i <= end; i++) {
      const currentRoom = `${batchPrefix} ${i}`;
      const params = new URLSearchParams();
      params.set('building', building);
      params.set('floor', floor);
      params.set('room', currentRoom);
      if (category && category !== 'General (All Issues)') params.set('category', category);
      params.set('lat', matchedBldg.lat);
      params.set('lng', matchedBldg.lng);

      const fullUrl = `${baseUrl}/submit?${params.toString()}`;
      try {
        const dataUrl = await QRCode.toDataURL(fullUrl, {
          width: 240,
          margin: 1.5,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'M'
        });
        results.push({ room: currentRoom, qrUrl: dataUrl, targetUrl: fullUrl });
      } catch (e) {
        console.error(e);
      }
    }
    setBatchQrs(results);
    setGeneratingBatch(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSingle = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${building.replace(/\s+/g, '_')}_${room.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-sheet, #printable-qr-sheet * {
            visibility: visible;
          }
          #printable-qr-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 no-print">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">📍</span>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Campus Location QR Code Generator
                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30">Sticker Ready</span>
              </h3>
              <p className="text-xs text-slate-300">Generate printable door/room QR stickers for instant student maintenance reporting</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setBatchMode(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  !batchMode 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Single Room Sticker
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchMode(true);
                  if (batchQrs.length === 0) handleGenerateBatch();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  batchMode 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Batch Rooms (e.g. 101 - 106)
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Campus Building / Block</label>
              <select
                value={building}
                onChange={e => setBuilding(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                {campusBuildings.map(b => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Floor Level</label>
                <select
                  value={floor}
                  onChange={e => setFloor(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  {floors.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Default Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {!batchMode ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Room / Lab Identifier</label>
                <input
                  type="text"
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  placeholder="e.g. Room 204, Computer Lab 2, Washroom A"
                  className="w-full bg-slate-800/90 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-3">
                <div className="text-xs font-bold text-indigo-300">Batch Range Settings</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Prefix</label>
                    <input
                      type="text"
                      value={batchPrefix}
                      onChange={e => setBatchPrefix(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Start No.</label>
                    <input
                      type="number"
                      value={batchStart}
                      onChange={e => setBatchStart(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">End No.</label>
                    <input
                      type="number"
                      value={batchEnd}
                      onChange={e => setBatchEnd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-1.5"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateBatch}
                  disabled={generatingBatch}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  {generatingBatch ? 'Generating Batch...' : 'Generate Batch Sheet'}
                </button>
              </div>
            )}

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Decoded QR Destination URL:</span>
              <p className="text-[11px] text-blue-400 font-mono break-all line-clamp-2">{targetUrl}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg transition"
              >
                <span>🖨️</span> Print Sticker Sheet
              </button>
              {!batchMode && (
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
                >
                  <span>💾</span> PNG
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-6 flex flex-col items-center justify-center bg-slate-950/50 rounded-2xl border border-slate-800/80 p-5">
            <span className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
              {batchMode ? `Batch Preview (${batchQrs.length} Stickers)` : 'Door Sticker Physical Preview'}
            </span>

            {!batchMode ? (
              <div className="w-full max-w-xs bg-white text-slate-900 rounded-2xl shadow-2xl p-5 border-4 border-blue-600 flex flex-col items-center text-center">
                <div className="w-full border-b-2 border-slate-200 pb-2 mb-3">
                  <div className="text-[11px] uppercase tracking-widest font-extrabold text-blue-800">
                    🏛️ University Campus Facilities
                  </div>
                  <div className="text-[9px] font-semibold text-slate-500">Maintenance & Redressal Redirection</div>
                </div>

                <div className="bg-slate-100 rounded-lg py-1 px-3 mb-3 w-full border border-slate-200">
                  <div className="font-extrabold text-sm text-slate-900 leading-tight">{building}</div>
                  <div className="text-xs font-bold text-blue-600 mt-0.5">
                    {floor} • <span className="underline">{room || 'Room'}</span>
                  </div>
                </div>

                <div className="p-2 bg-white rounded-xl border-2 border-slate-900/10 shadow-inner mb-3">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Room QR Code" className="w-48 h-48 object-contain" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">Loading QR...</div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg p-2 text-xs font-bold leading-snug w-full">
                  📲 Scan with any Phone Camera to Lodge Maintenance Complaint for this room
                </div>

                <div className="mt-2 text-[9px] text-slate-400 font-mono">
                  Auto-coordinates & category pre-mapped
                </div>
              </div>
            ) : (
              <div className="w-full max-h-80 overflow-y-auto grid grid-cols-2 gap-3 p-2">
                {batchQrs.map((item, idx) => (
                  <div key={idx} className="bg-white text-slate-900 rounded-lg p-2 border-2 border-indigo-500 text-center text-xs shadow">
                    <div className="font-bold text-[10px] text-indigo-700 truncate">{building}</div>
                    <div className="font-extrabold text-xs text-slate-900">{item.room}</div>
                    <img src={item.qrUrl} alt={item.room} className="w-24 h-24 mx-auto object-contain my-1" />
                    <div className="text-[8px] text-slate-500">Scan to lodge</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div id="printable-qr-sheet" className="hidden">
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '20px', margin: 0 }}>CAMPUS FACILITIES & MAINTENANCE DIRECT SERVICE QR STICKERS</h1>
          <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Building: {building} | Floor: {floor}</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          pageBreakInside: 'avoid'
        }}>
          {(!batchMode ? [{ room: room, qrUrl: qrDataUrl }] : batchQrs).map((item, idx) => (
            <div key={idx} style={{
              border: '3px solid #1e3a8a',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              backgroundColor: '#fff',
              pageBreakInside: 'avoid'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e3a8a', letterSpacing: '1px' }}>
                🏛️ CAMPUS MAINTENANCE PORTAL
              </div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', margin: '6px 0 2px 0' }}>
                {building}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb', marginBottom: '8px' }}>
                {floor} • {item.room}
              </div>
              <img src={item.qrUrl} alt={item.room} style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }} />
              <div style={{
                marginTop: '10px',
                padding: '6px 10px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#1e3a8a'
              }}>
                📲 Scan with Phone Camera to Report Any Issue In This Room
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QRGeneratorModal;
