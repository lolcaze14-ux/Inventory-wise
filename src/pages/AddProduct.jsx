import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl, generateBarcode } from '@/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import QRGenerator from '../components/barcode/QRGenerator';

export default function AddProduct() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [qrData, setQrData] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [minThreshold, setMinThreshold] = useState('5');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const generateQR = () => {
    setQrData(generateBarcode());
  };

  const createProductMutation = useMutation({
    mutationFn: (productData) => base44.entities.Product.create(productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      window.location.href = createPageUrl('Dashboard');
    },
    onError: (err) => {
      setError('Failed to create product: ' + err.message);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required');
      return;
    }

    if (!qrData) {
      setError('Please generate a QR code');
      return;
    }

    const productData = {
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      barcode_data: qrData,
      barcode_type: 'QR',
      current_stock: parseInt(initialStock) || 0,
      minimum_threshold: parseInt(minThreshold) || 5
    };

    createProductMutation.mutate(productData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl mx-auto pt-8 space-y-6">
        <Button
          onClick={() => window.location.href = createPageUrl('Dashboard')}
          variant="outline"
          className="h-14 px-6 text-lg border-2"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="text-3xl font-bold">Add New Product</CardTitle>
            <p className="text-lg opacity-90 mt-2">Create a new product with QR code</p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-lg">{error}</AlertDescription>
                </Alert>
              )}

              {/* Product Info */}
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-900">Product Information</h3>
                
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-lg font-semibold">Product Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Bananas, Office Pens"
                    className="h-14 text-lg"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category" className="text-lg font-semibold">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Food, Office Supplies"
                    className="h-14 text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="description" className="text-lg font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Additional details..."
                    className="min-h-24 text-lg"
                  />
                </div>
              </div>

              {/* Stock Settings */}
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-2xl font-semibold text-gray-900">Stock Settings</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="initialStock" className="text-lg font-semibold">Initial Stock</Label>
                    <Input
                      id="initialStock"
                      type="number"
                      min="0"
                      value={initialStock}
                      onChange={(e) => setInitialStock(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="minThreshold" className="text-lg font-semibold">Low Stock Alert</Label>
                    <Input
                      id="minThreshold"
                      type="number"
                      min="0"
                      value={minThreshold}
                      onChange={(e) => setMinThreshold(e.target.value)}
                      className="h-14 text-lg"
                    />
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-2xl font-semibold text-gray-900">QR Code</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">Generate QR Code</Label>
                    <Button
                      type="button"
                      onClick={generateQR}
                      variant="outline"
                      className="h-12 px-6"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Generate
                    </Button>
                  </div>
                  
                  {qrData && (
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                      <QRGenerator value={qrData} size={250} />
                      <p className="text-center text-sm text-gray-500 mt-4">QR Data: {qrData}</p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={createProductMutation.isPending}
                className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Save className="w-8 h-8 mr-3" />
                {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}