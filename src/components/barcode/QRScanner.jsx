import React, { useState } from 'react';
import { Camera, CheckCircle, XCircle, Keyboard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function QRScanner({ onScan, onError }) {
  const [mode, setMode] = useState('camera'); // 'camera' or 'manual'
  const [manualInput, setManualInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  React.useEffect(() => {
    if (mode === 'camera') {
      loadCamera();
    }
    return () => {
      // Cleanup
    };
  }, [mode]);

  const loadCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Load html5-qrcode
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode@2.2.4/dist/html5-qrcode.min.js';
      
      script.onload = () => {
        setTimeout(() => {
          try {
            const Html5Qrcode = window.Html5Qrcode;
            
            if (!document.getElementById('qr-reader')) {
              setCameraError('Scanner element not found');
              return;
            }

            const html5QrCode = new Html5Qrcode('qr-reader', {
              formatsToSupport: ['QR_CODE'],
              verbose: false,
              experimentalFeatures: {
                useBarcoderWorker: true,
              },
              fps: 10,
              qrbox: { width: 250, height: 250 }
            });

            html5QrCode.start(
              { facingMode: 'environment' },
              { fps: 10, qrbox: 250 },
              (decodedText) => {
                console.log('QR detected:', decodedText);
                html5QrCode.stop();
                setCameraActive(false);
                if (onScan) onScan(decodedText);
              },
              (error) => {
                // Ignore scanning errors, keep trying
              }
            ).then(() => {
              setCameraActive(true);
            }).catch((err) => {
              console.error('Camera start error:', err);
              setCameraError('Could not start camera: ' + err.message);
            });
          } catch (err) {
            console.error('Scanner init error:', err);
            setCameraError('Scanner initialization failed');
          }
        }, 100);
      };

      script.onerror = () => {
        setCameraError('Failed to load scanner library');
      };

      document.head.appendChild(script);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(err.message);
      setCameraActive(false);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      if (onScan) onScan(manualInput.trim());
    }
  };

  if (mode === 'manual') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <Keyboard className="w-16 h-16 text-white mx-auto" />
            <h2 className="text-3xl font-bold text-white">Manual Entry</h2>
            <p className="text-lg text-white/70">Enter barcode code manually</p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter barcode or QR data"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              className="h-14 text-lg bg-white"
              autoFocus
            />

            <Button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              Submit Barcode
            </Button>

            <Button
              onClick={() => {
                setMode('camera');
                setManualInput('');
              }}
              variant="outline"
              className="w-full h-14 text-lg font-bold text-white border-white hover:bg-white/10"
            >
              Try Camera Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
        <h2 className="text-white text-2xl font-bold text-center">Scan QR Code</h2>
      </div>

      {/* Scanner */}
      <div className="flex-1 relative">
        {cameraActive && (
          <div id="qr-reader" className="w-full h-full"></div>
        )}

        {!cameraActive && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Camera className="w-20 h-20 text-white mx-auto animate-pulse" />
              <p className="text-2xl font-bold text-white">Initializing camera...</p>
              <p className="text-lg text-white/70">Please allow camera access</p>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md bg-white rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <h3 className="text-xl font-bold text-red-600">Camera Error</h3>
              </div>
              <p className="text-gray-700">{cameraError}</p>
              <Button
                onClick={() => setMode('manual')}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
              >
                Use Manual Entry Instead
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-6">
        <div className="text-center text-white space-y-2">
          <p className="text-xl">Position QR code within the frame</p>
          <button
            onClick={() => setMode('manual')}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Or enter manually
          </button>
        </div>
      </div>
    </div>
  );
}