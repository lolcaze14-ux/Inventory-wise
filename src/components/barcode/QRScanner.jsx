import React, { useRef, useEffect, useState } from 'react';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function QRScanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('initializing');
  const [stream, setStream] = useState(null);
  const [jsQRReady, setJsQRReady] = useState(false);
  const scanIntervalRef = useRef(null);

  // Load jsQR library
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.min.js';
    script.onload = () => {
      setJsQRReady(true);
    };
    script.onerror = () => {
      console.error('Failed to load jsQR library');
      setStatus('error');
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (jsQRReady) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [jsQRReady]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setStatus('ready');
        
        // Start scanning after video is loaded
        videoRef.current.onloadedmetadata = () => {
          scanIntervalRef.current = setInterval(scanQRCode, 300);
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('error');
      if (onError) onError(err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || status !== 'ready') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    try {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Use jsQR library to scan
        if (window.jsQR) {
          const code = window.jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code && code.data) {
            console.log('QR Code detected:', code.data);
            setStatus('detected');
            stopCamera();
            if (onScan) {
              setTimeout(() => onScan(code.data), 500);
            }
          }
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Scanning overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-4 border-white rounded-lg">
          <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-blue-500 -mt-2 -ml-2 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-blue-500 -mt-2 -mr-2 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-blue-500 -mb-2 -ml-2 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-blue-500 -mb-2 -mr-2 rounded-br-lg"></div>

          {/* Scanning line animation */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse" 
               style={{ animation: 'slide 2s infinite' }}>
          </div>
        </div>

        {status === 'detected' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-green-500 rounded-full p-8 animate-bounce">
              <CheckCircle className="w-20 h-20 text-white" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="w-80 bg-white rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-bold text-red-600">Camera Error</h3>
              </div>
              <p className="text-gray-700">
                Please allow camera access and refresh the page. Make sure you're using HTTPS.
              </p>
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
      </div>

      <style>{`
        @keyframes slide {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}