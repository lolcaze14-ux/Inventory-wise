import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';

export default function QRScanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const animationFrameRef = useRef(null);
  const lastDetectionRef = useRef(0);
  const detectedCodesRef = useRef(new Set());

  useEffect(() => {
    initializeScanner();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const initializeScanner = async () => {
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.onload = () => {
        console.log('jsQR loaded successfully');
        startCamera();
      };
      script.onerror = () => {
        console.error('Failed to load jsQR');
        setError('Failed to load scanner library');
        setStatus('error');
      };
      document.head.appendChild(script);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStatus('scanning');
          scanFrame();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please allow camera permissions.');
      setStatus('error');
      if (onError) onError(err);
    }
  };

  const validateQRCode = async (qrData) => {
    try {
      // Query database to check if QR code exists
      const { data, error } = await supabase
        .from('products')
        .select('id, name, barcode')
        .eq('barcode', qrData)
        .single();

      if (error || !data) {
        return { valid: false, error: 'QR code not registered' };
      }

      return { valid: true, product: data };
    } catch (err) {
      console.error('Database validation error:', err);
      return { valid: false, error: 'Validation error' };
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || status !== 'scanning') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    try {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code && code.data) {
            const now = Date.now();
            if (now - lastDetectionRef.current > 500 && !detectedCodesRef.current.has(code.data)) {
              console.log('QR Code detected:', code.data);
              detectedCodesRef.current.add(code.data);
              lastDetectionRef.current = now;
              
              // Validate QR code in database
              validateQRCode(code.data).then(result => {
                if (result.valid) {
                  stopCamera();
                  setStatus('detected');
                  
                  // Redirect to transaction page with productId
                  setTimeout(() => {
                    const transactionUrl = createPageUrl('Transaction') + `?productId=${result.product.id}`;
                    window.location.href = transactionUrl;
                  }, 1000);
                } else {
                  // Invalid QR code - show error and continue scanning
                  setError('Invalid QR Code: ' + result.error);
                  setStatus('invalid');
                  
                  // Reset after 2 seconds to allow re-scanning
                  setTimeout(() => {
                    setError(null);
                    setStatus('scanning');
                    detectedCodesRef.current.delete(code.data);
                  }, 2000);
                }
              });
              return;
            }
          }
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Scanning Grid Overlay */}
      {status === 'scanning' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 border-2 border-white rounded-lg"></div>
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400"></div>

            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-b from-green-400 to-transparent"
              style={{
                animation: 'scanLine 2s linear infinite',
                top: '0%'
              }}
            ></div>

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-6 h-6 border-2 border-white rounded-full opacity-50"></div>
            </div>
          </div>

          <style>{`
            @keyframes scanLine {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* Loading State */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-white border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-white text-xl font-semibold">Initializing Camera</p>
            <p className="text-white/60">Please allow camera access</p>
          </div>
        </div>
      )}

      {/* Invalid QR Code State */}
      {status === 'invalid' && (
        <div className="absolute inset-0 bg-red-600/90 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-24 h-24 text-white mx-auto" />
            <p className="text-white text-2xl font-bold">Invalid QR Code</p>
            <p className="text-white/80">{error}</p>
            <p className="text-white text-sm mt-4">Scanning will resume...</p>
          </div>
        </div>
      )}

      {/* Detected State */}
      {status === 'detected' && (
        <div className="absolute inset-0 bg-green-600/90 flex items-center justify-center">
          <div className="text-center space-y-4">
            <svg
              className="w-24 h-24 text-white mx-auto animate-bounce"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-white text-2xl font-bold">QR Code Detected!</p>
            <p className="text-white/80">Redirecting...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="absolute inset-0 bg-red-600/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-bold text-red-600">Camera Error</h3>
            </div>
            <p className="text-gray-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Bottom Info */}
      {status === 'scanning' && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
          <p className="text-white text-lg font-semibold">Position QR Code in Frame</p>
          <p className="text-white/60 text-sm mt-1">Keep steady for automatic scanning</p>
        </div>
      )}

      {/* Top Bar */}
      {status === 'scanning' && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between z-10">
          <h2 className="text-white text-xl font-bold">QR Scanner</h2>
          <button 
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}