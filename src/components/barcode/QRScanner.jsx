import React, { useRef, useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';

export default function QRScanner() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const loadQRLibrary = () => {
    return new Promise((resolve, reject) => {
      if (window.jsQR) {
        resolve(window.jsQR);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.async = true;

      script.onload = () => {
        if (window.jsQR) {
          resolve(window.jsQR);
        } else {
          reject(new Error('jsQR failed to initialize'));
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load jsQR library'));
      };

      document.head.appendChild(script);
    });
  };

  const validateQRCode = async (qrData) => {
    try {
      console.log('Validating QR code:', qrData);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, barcode')
        .eq('barcode', qrData)
        .single();

      if (error || !data) {
        console.log('Product not found');
        return { valid: false, error: 'Product not found in database' };
      }

      console.log('Product found:', data.name);
      return { valid: true, product: data };
    } catch (err) {
      console.error('Validation error:', err);
      return { valid: false, error: 'Database error' };
    }
  };

  const scanImage = async (imageSrc) => {
    try {
      setStatus('scanning');
      setError(null);

      // Load jsQR library
      const jsQR = await loadQRLibrary();

      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          console.log('QR Code detected:', code.data);
          
          const result = await validateQRCode(code.data);
          
          if (result.valid) {
            setStatus('success');
            setTimeout(() => {
              const transactionUrl = createPageUrl('Transaction') + `?productId=${result.product.id}`;
              window.location.href = transactionUrl;
            }, 1500);
          } else {
            setError(result.error);
            setStatus('idle');
          }
        } else {
          setError('No QR code found in image. Try a clearer photo.');
          setStatus('idle');
        }
      };

      img.onerror = () => {
        setError('Failed to load image');
        setStatus('idle');
      };

      img.src = imageSrc;
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message);
      setStatus('idle');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result;
      setPreview(imageSrc);
      scanImage(imageSrc);
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setPreview(null);
    setError(null);
    setStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto pt-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">QR Scanner</h1>
          <button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Upload Area */}
        {!preview && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition"
          >
            <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900">Upload QR Code</p>
            <p className="text-gray-600 mt-2">Click to select a photo or take a picture</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              capture="environment"
            />
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border-2 border-gray-300">
              <img src={preview} alt="Preview" className="w-full" />
            </div>

            {/* Scanning State */}
            {status === 'scanning' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-blue-200 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-blue-900 font-semibold">Scanning...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-900 font-semibold">Error</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Try Another Photo
                </button>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto animate-bounce" />
                <p className="text-green-900 font-semibold text-lg">QR Code Found!</p>
                <p className="text-green-700 text-sm">Redirecting...</p>
              </div>
            )}

            {/* Cancel Button */}
            {status !== 'success' && (
              <button
                onClick={handleCancel}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 rounded-lg transition"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900 mb-2">Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Take a clear photo of the QR code</li>
            <li>Make sure lighting is good</li>
            <li>QR code should fill most of the frame</li>
          </ul>
        </div>
      </div>
    </div>
  );
}