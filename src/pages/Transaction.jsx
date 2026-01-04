import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Package, Plus, Minus, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function Transaction() {
  const [user, setUser] = useState(null);
  const [productId, setProductId] = useState(null);
  const [transactionType, setTransactionType] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('productId');
    if (prodId) {
      setProductId(prodId);
    }
  }, []);

  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = createPageUrl('Login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUser(userData);
    } catch (error) {
      window.location.href = createPageUrl('Login');
    }
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    }
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
      const { error } = await supabase
        .from('alerts')
        .insert(alertData);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    if (!product) {
      setError('Product not found');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const quantityChange = transactionType === 'add' ? qty : -qty;
      const newStock = product.current_stock + quantityChange;

      if (newStock < 0) {
        setError('Not enough stock to remove');
        setIsProcessing(false);
        return;
      }

      await updateProductMutation.mutateAsync({
        id: product.id,
        data: { 
          current_stock: newStock,
          updated_date: new Date().toISOString()
        }
      });

      if (newStock <= product.minimum_threshold) {
        await createAlertMutation.mutateAsync({
          product_id: product.id,
          product_name: product.name,
          current_stock: newStock,
          threshold: product.minimum_threshold,
          is_read: false,
          is_resolved: false
        });
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = createPageUrl('Dashboard');
      }, 2000);

    } catch (err) {
      setError('Failed to update stock: ' + err.message);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-8 space-y-6">
          <Button
            onClick={() => window.location.href = createPageUrl('Dashboard')}
            variant="outline"
            className="h-14 px-6 text-lg border-2"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back to Dashboard
          </Button>
          <Alert variant="destructive">
            <AlertTriangle className="h-6 w-6" />
            <AlertDescription className="text-lg">
              Product not found. This QR code is not registered.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success!</h2>
            <p className="text-xl text-gray-600">Stock updated successfully</p>
            <p className="text-lg text-gray-500 mt-4">Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8 space-y-6">
        <Button
          onClick={() => window.location.href = createPageUrl('Dashboard')}
          variant="outline"
          className="h-14 px-6 text-lg border-2"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-4">
              <Package className="w-12 h-12" />
              <div>
                <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
                <p className="text-lg opacity-90 mt-2">Current Stock: {product.current_stock}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-8">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-6 w-6" />
                  <AlertDescription className="text-lg">{error}</AlertDescription>
                </Alert>
              )}

              {product.current_stock <= product.minimum_threshold && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-6 w-6" />
                  <AlertDescription className="text-lg">
                    ⚠️ Low Stock Alert: Only {product.current_stock} units remaining!
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Label className="text-xl font-semibold">Action</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => setTransactionType('add')}
                    variant={transactionType === 'add' ? 'default' : 'outline'}
                    className="h-20 text-xl font-semibold"
                  >
                    <Plus className="w-8 h-8 mr-2" />
                    Add Stock
                  </Button>
                  <Button
                    onClick={() => setTransactionType('remove')}
                    variant={transactionType === 'remove' ? 'default' : 'outline'}
                    className="h-20 text-xl font-semibold"
                  >
                    <Minus className="w-8 h-8 mr-2" />
                    Remove Stock
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="quantity" className="text-xl font-semibold">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="h-16 text-2xl text-center"
                  required
                  autoFocus
                />
              </div>

              <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Current Stock:</span>
                  <span>{product.current_stock}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Change:</span>
                  <span className={transactionType === 'add' ? 'text-green-600' : 'text-red-600'}>
                    {transactionType === 'add' ? '+' : '-'}{quantity || 0}
                  </span>
                </div>
                <div className="border-t-2 pt-3 flex justify-between text-xl font-bold">
                  <span>New Stock:</span>
                  <span>
                    {transactionType === 'add' 
                      ? product.current_stock + (parseInt(quantity) || 0)
                      : product.current_stock - (parseInt(quantity) || 0)
                    }
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isProcessing || !quantity}
                className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isProcessing ? 'Processing...' : 'Confirm Update'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}