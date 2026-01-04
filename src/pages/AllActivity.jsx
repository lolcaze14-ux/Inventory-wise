import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Download } from 'lucide-react';
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

      if (userData.role !== 'admin') {
        window.location.href = createPageUrl('Dashboard');
      }

      setUser(userData);
    } catch (error) {
      window.location.href = createPageUrl('Login');
    }
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['all-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const exportData = () => {
    const csv = [
      ['Date', 'User ID', 'Action', 'Product ID'].join(','),
      ...filteredTransactions.map(tx => 
        [
          format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm:ss'),
          tx.user_id,
          tx.action,
          tx.product_id || 'N/A'
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
            <p className="text-lg opacity-90 mt-2">Complete activity history</p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 text-lg"
                />
              </div>
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
                  {searchQuery ? 'No activities match your search' : 'No activities yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-600 mb-4">
                  Showing {filteredTransactions.length} activit{filteredTransactions.length !== 1 ? 'ies' : 'y'}
                </p>
                
                {filteredTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-6 border-2 rounded-lg hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {tx.action}
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-base">
                          <div>
                            <p className="text-gray-500 text-sm">User ID</p>
                            <p className="font-semibold text-gray-900">{tx.user_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm">Product ID</p>
                            <p className="font-semibold text-gray-900">{tx.product_id || 'N/A'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-gray-500 text-sm">Time</p>
                            <p className="font-semibold text-gray-900">
                              {format(new Date(tx.created_at), 'PPpp')}
                            </p>
                          </div>
                        </div>
                      </div>
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