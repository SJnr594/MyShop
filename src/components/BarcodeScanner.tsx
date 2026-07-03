import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, Keyboard } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  products: Product[];
  onClose?: () => void;
}

export default function BarcodeScanner({ onScan, products, onClose }: BarcodeScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const viewportId = 'barcode-scanner-viewport';

  // Load cameras on mount
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          setSelectedCameraId(devices[0].id);
          setHasCameraPermission(true);
        } else {
          setHasCameraPermission(false);
          setErrorMessage("No cameras found on this device.");
        }
      })
      .catch((err) => {
        console.error("Camera discovery error:", err);
        setHasCameraPermission(false);
        setErrorMessage("Camera permissions were denied or not accessible.");
      });

    return () => {
      stopCameraScanner();
    };
  }, []);

  const startCameraScanner = async (cameraId: string) => {
    if (!cameraId) return;
    stopCameraScanner();

    try {
      setErrorMessage(null);
      const html5QrCode = new Html5Qrcode(viewportId);
      qrCodeInstanceRef.current = html5QrCode;
      setIsScanning(true);

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: (width, height) => {
            // Rectangular scanning box optimized for linear barcodes
            const boxWidth = Math.min(width * 0.8, 400);
            const boxHeight = Math.min(height * 0.4, 150);
            return { width: boxWidth, height: boxHeight };
          },
          aspectRatio: 1.777778, // 16:9
        },
        (decodedText) => {
          // Success callback
          playBeep();
          onScan(decodedText.trim());
          if (onClose) {
            stopCameraScanner();
            onClose();
          }
        },
        (errorMessage) => {
          // Verbose error, can be ignored for normal scanning updates
        }
      );
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setErrorMessage("Could not start camera stream. Check if it's used by another app.");
      setIsScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
      try {
        await qrCodeInstanceRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    qrCodeInstanceRef.current = null;
    setIsScanning(false);
  };

  const toggleScanning = () => {
    if (isScanning) {
      stopCameraScanner();
    } else {
      startCameraScanner(selectedCameraId);
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch retail beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1); // Short 100ms duration
    } catch (e) {
      console.warn("Could not play beep sound:", e);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      playBeep();
      onScan(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const handleSimulatedScan = (barcode: string) => {
    playBeep();
    onScan(barcode);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-w-lg w-full mx-auto" id="barcode-scanner-container">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-blue-400 animate-pulse" />
          <h3 className="font-semibold text-sm tracking-wide uppercase">Barcode Checkout Center</h3>
        </div>
        {onClose && (
          <button 
            onClick={() => {
              stopCameraScanner();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
            id="close-scanner-button"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="p-5 space-y-5">
        {/* Active Camera Scan Window */}
        <div>
          <div className="relative bg-slate-950 rounded-lg overflow-hidden flex flex-col justify-center items-center aspect-video border border-slate-800">
            {/* Viewport element for html5-qrcode */}
            <div id={viewportId} className="w-full h-full object-cover"></div>

            {/* Scanning Overlay (only visible when camera isn't fully rendering or before starting) */}
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 bg-slate-950/90 text-slate-300">
                <Camera className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-sm font-medium">Camera Feed is Offline</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Place barcodes directly in front of the lens. Use the buttons below to active scanning.
                </p>
              </div>
            )}

            {isScanning && (
              <>
                {/* Horizontal scanner red laser line */}
                <div className="scanning-laser" />
                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                  LIVE CAMERA ACTIVE
                </div>
              </>
            )}
          </div>

          {/* Camera Controls */}
          {hasCameraPermission !== false && (
            <div className="mt-3 flex items-center space-x-2">
              <div className="flex-1">
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    if (isScanning) startCameraScanner(e.target.value);
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  disabled={cameras.length <= 1}
                  id="camera-select"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Camera ${cameras.indexOf(camera) + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={toggleScanning}
                className={`text-xs px-4 py-1.5 font-medium rounded-lg flex items-center space-x-1.5 transition-all ${
                  isScanning 
                    ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
                id="toggle-scanning-button"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Stop Camera' : 'Start Camera'}</span>
              </button>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-start space-x-2 border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Manual Barcode Input Section */}
        <div className="border-t border-slate-100 pt-4">
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <div className="relative flex-1">
              <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter or paste barcode number..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                id="manual-barcode-input"
              />
            </div>
            <button
              type="submit"
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-4 py-2 rounded-lg font-medium transition-all"
              id="submit-manual-barcode-button"
            >
              Add
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <span>💡 Hardware scanners: Just plug in, focus on the page, and scan. It adds instantly!</span>
          </p>
        </div>

        {/* Evaluation Simulator Panel */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <div className="flex items-center space-x-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-semibold text-slate-700">Quick-Scan Simulator</h4>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Since camera environments can be tricky, click any demo item below to simulate a high-speed laser scan:
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSimulatedScan(p.barcode)}
                className="text-left bg-white hover:bg-slate-100 active:bg-slate-200 p-2 rounded border border-slate-100 transition-all text-xs flex flex-col justify-between"
                title={`Scan ${p.name}`}
                type="button"
                id={`simulate-scan-${p.id}`}
              >
                <span className="font-medium text-slate-700 truncate w-full">{p.name}</span>
                <span className="text-[10px] font-mono text-slate-400 tracking-wider mt-0.5">{p.barcode}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
