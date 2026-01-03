import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Users, AlertCircle, LogOut, UserPlus, Scan, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      if (userData.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
      }
    } catch (error) {
      window.location.href = createPageUrl('Login');
    }
  };

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-updated_date'),
  });

  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.Alert.filter({ is_resolved: false }, '-created_date'),
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const resolveAlertMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Alert.update(id, { is_resolved: true, is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
  });

  const handleResolveAlert = (alertId) => {
    resolveAlertMutation.mutate({ id: alertId });
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Login'));
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      try {
        await base44.entities.Product.delete(product.id);
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch (error) {
        alert('Failed to delete product');
      }
    }
  };

  const lowStockProducts = products.filter(p => p.current_stock <= p.minimum_threshold);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-purple-600">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
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
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => window.location.href = createPageUrl('Scanner')}
            className="h-24 bg-blue-600 hover:bg-blue-700 text-xl font-semibold"
          >
            <Scan className="w-8 h-8 mr-3" />
            SCAN QR CODE
          </Button>
          <Button
            onClick={() => window.location.href = createPageUrl('AddProduct')}
            className="h-24 bg-green-600 hover:bg-green-700 text-xl font-semibold"
          >
            <Plus className="w-8 h-8 mr-3" />
            ADD PRODUCT
          </Button>
          <Button
            onClick={() => window.location.href = createPageUrl('InviteUser')}
            className="h-24 bg-purple-600 hover:bg-purple-700 text-xl font-semibold"
          >
            <UserPlus className="w-8 h-8 mr-3" />
            INVITE USER
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Products</p>
                  <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                </div>
                <Package className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Low Stock Items</p>
                  <p className="text-3xl font-bold text-red-600">{lowStockProducts.length}</p>
                </div>
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                </div>
                <Users className="w-12 h-12 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-14">
            <TabsTrigger value="alerts" className="text-lg font-semibold">
              Alerts {alerts.length > 0 && `(${alerts.length})`}
            </TabsTrigger>
            <TabsTrigger value="inventory" className="text-lg font-semibold">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="users" className="text-lg font-semibold">
              Users
            </TabsTrigger>
          </TabsList>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Low Stock Alerts</h2>
                {loadingAlerts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <p className="text-xl text-gray-600">No active alerts</p>
                    <p className="text-lg text-gray-500 mt-2">All products are well stocked</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map(alert => (
                      <Alert key={alert.id} variant="destructive">
                        <AlertCircle className="h-6 w-6" />
                        <div className="flex-1">
                          <AlertDescription className="text-lg">
                            <strong>{alert.product_name}</strong> is running low!
                            <br />
                            Current stock: <strong>{alert.current_stock}</strong> (Threshold: {alert.threshold})
                          </AlertDescription>
                        </div>
                        <Button
                          onClick={() => handleResolveAlert(alert.id)}
                          variant="outline"
                          className="ml-4"
                        >
                          Mark Resolved
                        </Button>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Current Inventory</h2>
                {loadingProducts ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map(product => (
                      <div
                        key={product.id}
                        className="flex justify-between items-center py-4 px-4 border-b hover:bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                          {product.category && (
                            <p className="text-base text-gray-600">{product.category}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {product.current_stock <= product.minimum_threshold && (
                            <AlertCircle className="w-6 h-6 text-red-500" />
                          )}
                          <Badge
                            variant={product.current_stock <= product.minimum_threshold ? "destructive" : "default"}
                            className="text-xl font-bold px-6 py-2"
                          >
                            {product.current_stock}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">Active Users</h2>
                {loadingUsers ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map(u => (
                      <div key={u.id} className="flex justify-between items-center p-4 border rounded-lg bg-white">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{u.full_name || 'No name'}</p>
                          <p className="text-base text-gray-600">{u.email}</p>
                        </div>
                        <Badge className="text-base px-4 py-2">
                          {u.role || 'user'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}