import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';

export default function ActivityLog() {
  const [user, setUser] = useState(null);

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

      setUser(userData);
    } catch (error) {
      window.location.href = createPageUrl('Login');
    }
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['my-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8 space-y-6">
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
            <CardTitle className="text-3xl font-bold">My Activity Log</CardTitle>
            <p className="text-lg opacity-90 mt-2">{user?.full_name}</p>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">No transactions yet</p>
                <p className="text-lg text-gray-500 mt-2">Your activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-6 border-2 rounded-lg hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {tx.action}
                      </h3>
                      
                      <div className="space-y-1 text-base text-gray-600">
                        <p>
                          <span className="font-semibold">Product:</span> {tx.product_id || 'N/A'}
                        </p>
                        <p className="text-gray-500">
                          {format(new Date(tx.created_at), 'PPpp')}
                        </p>
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