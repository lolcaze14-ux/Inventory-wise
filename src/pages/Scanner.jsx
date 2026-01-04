import React, { useState } from 'react';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import QRScanner from '../components/barcode/QRScanner';

export default function Scanner() {
  const [isScanning, setIsScanning] = useState(true);

  const handleError = (error) => {
    console.error('Scanner error:', error);
  };

  const handleBack = () => {
    window.location.href = createPageUrl('Dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
        <Button
          onClick={handleBack}
          variant="ghost"
          className="text-white hover:bg-white/20 h-14 px-6 text-lg font-semibold"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Scanner */}
      <div className="flex-1 relative">
        {isScanning && (
          <QRScanner onError={handleError} />
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-6">
        <div className="text-center text-white space-y-2">
          <p className="text-2xl font-bold">Scan QR Code</p>
          <p className="text-lg opacity-90">Position QR code within the frame</p>
        </div>
      </div>
    </div>
  );
}