import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Package, Scan, Plus, Search, LogOut, AlertCircle, Trash2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = createPageUrl('Login');
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      setUser(userData);
      
      if (userData.role === 'admin') {
        window.location.href = createPageUrl('AdminDashboard');
      }
    } catch (error) {
      window.location.href = createPageUrl('Login');
    }
  };

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = createPageUrl('Login');
  };

  const handleDelete = async (product) => {
    if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', product.id);

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch (error) {
        alert('Failed to delete product');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
                <p className="text-sm text-gray-600">{user?.full_name || 'Loading...'}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="h-12 px-6 text-base"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Large Scan Button */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-xl">
          <Button
            onClick={() => window.location.href = createPageUrl('Scanner')}
            className="w-full h-32 bg-transparent hover:bg-white/10 text-white text-2xl font-bold"
          >
            <Scan className="w-16 h-16 mr-4" />
            SCAN QR CODE
          </Button>
        </Card>

        {/* Action Button */}
        <Button
          onClick={() => window.location.href = createPageUrl('AddProduct')}
          className="w-full h-20 bg-green-600 hover:bg-green-700 text-xl font-semibold"
        >
          <Plus className="w-8 h-8 mr-3" />
          ADD PRODUCT
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 pl-14 text-xl border-2"
          />
        </div>

        {/* Inventory List */}
        <Card className="shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Current Inventory</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center py-4 border-b">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">
                  {searchQuery ? 'No products found' : 'No products yet. Add your first product!'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center py-5 px-4 border-b hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                      {product.category && (
                        <p className="text-base text-gray-600 mt-1">{product.category}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {product.current_stock <= product.minimum_threshold && (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      )}
                      <Badge
                        variant={product.current_stock <= product.minimum_threshold ? "destructive" : "default"}
                        className="text-2xl font-bold px-6 py-3"
                      >
                        {product.current_stock}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(product)}
                        className="h-10 px-4"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}