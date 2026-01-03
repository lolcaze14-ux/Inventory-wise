import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRGenerator({ value, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }).catch(error => {
      console.error('Error generating QR code:', error);
    });
  }, [value, size]);

  if (!value) {
    return (
      <div className="text-center p-8 bg-gray-100 rounded-lg">
        <p className="text-gray-500 text-lg">No QR code value provided</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-4 bg-white rounded-lg">
      <canvas ref={canvasRef} />
    </div>
  );
}