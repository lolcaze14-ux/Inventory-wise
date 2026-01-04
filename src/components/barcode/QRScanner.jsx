import React, { useRef, useEffect, useState } from 'react';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function QRScanner({ onScan, onError }) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('initializing');
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    loadScanner();
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, []);

  const loadScanner = async () => {
    try {
      // Load html5-qrcode library
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/html5-qrcode';
      script.async = true;
      
      script.onload = () => {
        // Wait for DOM to be ready
        setTimeout(() => {
          initializeScanner();
        }, 500);
      };
      
      script.onerror = () => {
        console.error('Failed to load html5-qrcode library');
        setStatus('error');
        if (onError) onError(new Error('Failed to load scanner library'));
      };
      
      document.head.appendChild(script);
    } catch (err) {
      console.error('Error loading scanner:', err);
      setStatus('error');
    }
  };

  const initializeScanner = async () => {
    try {
      const Html5QrcodeScanner = window.Html5QrcodeScanner;
      
      if (!Html5QrcodeScanner) {
        throw new Error('Html5QrcodeScanner not found');
      }

      const scannerInstance = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
          facingMode: 'environment'
        },
        false
      );

      const onScanSuccess = (decodedText) => {
        console.log('QR Code detected:', decodedText);
        setStatus('detected');
        scannerInstance.clear();
        if (onScan) {
          setTimeout(() => onScan(decodedText), 500);
        }
      };

      const onScanFailure = (error) => {
        // Silent fail - it will keep trying
        console.log('Scan attempt:', error);
      };

      await scannerInstance.render(onScanSuccess, onScanFailure);
      setScanner(scannerInstance);
      setStatus('ready');
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setStatus('error');
      if (onError) onError(err);
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <div id="qr-reader" className={`w-full h-full ${status !== 'ready' ? 'hidden' : ''}`}></div>

      {/* Overlay instructions */}
      {status === 'ready' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="text-center text-white space-y-2">
            <p className="text-2xl font-bold">Scan QR Code</p>
            <p className="text-lg opacity-90">Position QR code within the frame</p>
          </div>
        </div>
      )}

      {status === 'detected' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-green-500 rounded-full p-8 animate-bounce">
            <CheckCircle className="w-20 h-20 text-white" />
          </div>
        </div>
      )}

      {status === 'initializing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <Camera className="w-20 h-20 text-white mx-auto mb-4 animate-pulse" />
            <p className="text-white text-2xl font-bold">Initializing camera...</p>
            <p className="text-white/70 text-lg mt-2">Please allow camera access</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-white rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
              <h3 className="text-lg font-bold text-red-600">Camera Error</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Unable to access camera. Please:
            </p>
            <ul className="text-gray-700 space-y-2 text-sm">
              <li>✓ Allow camera permissions</li>
              <li>✓ Refresh the page</li>
              <li>✓ Check if camera is in use by another app</li>
              <li>✓ Try a different browser</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}