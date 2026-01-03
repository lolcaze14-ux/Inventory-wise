import React, { useRef, useEffect, useState } from 'react';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function QRScanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('initializing');
  const [stream, setStream] = useState(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setStatus('ready');
        
        // Start scanning
        scanIntervalRef.current = setInterval(scanQRCode, 500);
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

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use jsQR library to scan
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setStatus('detected');
          stopCamera();
          if (onScan) {
            setTimeout(() => onScan(code.data), 500);
          }
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
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
        </div>

        {status === 'detected' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-green-500 rounded-full p-8 animate-pulse">
              <CheckCircle className="w-20 h-20 text-white" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80">
            <Alert variant="destructive">
              <XCircle className="h-6 w-6" />
              <AlertDescription className="text-lg">
                Camera access denied. Please allow camera access and refresh.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {status === 'initializing' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <Camera className="w-20 h-20 text-white mx-auto mb-4 animate-pulse" />
            <p className="text-white text-2xl font-bold">Initializing camera...</p>
          </div>
        )}
      </div>
    </div>
  );
}