import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Download, Plus, Minus } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';

export default function AllActivity() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('all');

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

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 100),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = filterUser === 'all' || tx.user_id === filterUser;
    return matchesSearch && matchesUser;
  });

  const exportData = () => {
    const csv = [
      ['Date', 'User', 'Product', 'Type', 'Quantity Change', 'Previous Stock', 'New Stock'].join(','),
      ...filteredTransactions.map(tx => 
        [
          format(new Date(tx.created_date), 'yyyy-MM-dd HH:mm:ss'),
          tx.user_name,
          tx.product_name,
          tx.transaction_type,
          tx.quantity_change,
          tx.previous_stock,
          tx.resulting_stock
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => window.location.href = createPageUrl('AdminDashboard')}
            variant="outline"
            className="h-14 px-6 text-lg border-2"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back to Admin Dashboard
          </Button>
          
          <Button
            onClick={exportData}
            className="h-14 px-6 text-lg bg-green-600 hover:bg-green-700"
            disabled={filteredTransactions.length === 0}
          >
            <Download className="w-6 h-6 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-3xl font-bold">All Activity Log</CardTitle>
            <p className="text-lg opacity-90 mt-2">Complete transaction history</p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by product or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 text-lg"
                />
              </div>
              
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="h-14 text-lg">
                  <SelectValue placeholder="Filter by user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transactions List */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">
                  {searchQuery || filterUser !== 'all' 
                    ? 'No transactions match your filters' 
                    : 'No transactions yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-600 mb-4">
                  Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                </p>
                
                {filteredTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-6 border-2 rounded-lg hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {tx.transaction_type === 'add' ? (
                            <Plus className="w-6 h-6 text-green-600" />
                          ) : (
                            <Minus className="w-6 h-6 text-red-600" />
                          )}
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {tx.product_name}
                            </h3>
                            <p className="text-base text-gray-600">
                              by {tx.user_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-base ml-9">
                          <div>
                            <p className="text-gray-500 text-sm">Action</p>
                            <p className={`font-semibold ${tx.transaction_type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.transaction_type === 'add' ? 'Added' : 'Removed'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm">Quantity</p>
                            <p className="font-semibold">{Math.abs(tx.quantity_change)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm">Previous</p>
                            <p className="font-semibold">{tx.previous_stock}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm">New Stock</p>
                            <p className="font-semibold">{tx.resulting_stock}</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-500 mt-3 ml-9">
                          {format(new Date(tx.created_date), 'PPpp')}
                        </p>
                      </div>
                      
                      <Badge
                        variant={tx.transaction_type === 'add' ? 'default' : 'destructive'}
                        className="text-lg font-bold px-4 py-2"
                      >
                        {tx.transaction_type === 'add' ? '+' : '-'}{Math.abs(tx.quantity_change)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}