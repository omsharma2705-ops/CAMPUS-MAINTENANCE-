import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const QRScannerModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const qrRegionId = 'html5qr-code-full-region';
  const html5QrCodeRef = useRef(null);

  const handleScanSuccess = (decodedText) => {
    stopScanner();
    onClose();

    // Check if it's a URL
    try {
      if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
        const url = new URL(decodedText);
        // Extract query parameters
        navigate(`/submit${url.search}`);
        return;
      }
    } catch (e) {
      console.warn('Scanned text is not a valid URL, processing as query or raw room:', e);
    }

    // If it contains query string style text e.g. building=...
    if (decodedText.includes('building=') || decodedText.includes('room=')) {
      navigate(`/submit?${decodedText.replace(/^\?/, '')}`);
      return;
    }

    // Fallback: direct to submit with room parameter
    navigate(`/submit?room=${encodeURIComponent(decodedText)}`);
  };

  const startScanner = async () => {
    setError('');
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(qrRegionId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        handleScanSuccess,
        () => {} // silent frame error
      );
      setScanning(true);
    } catch (err) {
      console.error('Camera QR scanner failed to start:', err);
      setError('Camera access denied or not available. You can upload an image of the QR code or enter room info manually below.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setScanning(false);
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Delay slightly for DOM element to mount
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  // Handle uploading an image of a QR code
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode(qrRegionId);
      const decodedResult = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decodedResult);
    } catch (err) {
      setError('Could not detect a valid QR code in this image. Please ensure the QR code is clearly visible and well-lit.');
    }
  };

  // Manual submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onClose();
    navigate(`/submit?room=${encodeURIComponent(manualCode.trim())}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900/70 to-indigo-900/70 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">📷</span>
            <div>
              <h3 className="text-base font-bold text-white">Scan Room / Door QR</h3>
              <p className="text-xs text-slate-300">Point at campus sticker to auto-detect location</p>
            </div>
          </div>
          <button 
            onClick={() => { stopScanner(); onClose(); }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Scanner Viewport */}
          <div className="relative w-full aspect-square max-h-72 bg-black rounded-xl overflow-hidden border-2 border-slate-700 flex flex-col items-center justify-center">
            <div id={qrRegionId} className="w-full h-full"></div>

            {/* Target reticle styling overlay */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-400 rounded-2xl animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
              {error}
            </div>
          )}

          {/* Alternative: Image Upload */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
            <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition">
              <span>🖼️</span> Upload QR Photo
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>

            <button
              type="button"
              onClick={startScanner}
              className="py-2 px-3 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold rounded-xl border border-blue-500/40 transition"
            >
              🔄 Restart Camera
            </button>
          </div>

          {/* Manual Room input */}
          <form onSubmit={handleManualSubmit} className="pt-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Can't scan? Type Room / Lab identifier:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="e.g. Room 204 or Lab 3"
                className="flex-1 bg-slate-800/90 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Go
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
