import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Minus, Package } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';

export default function ActivityLog() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (error) {
      window.location.href = createPageUrl('Login');
    }
  };

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['my-transactions', user?.id],
    queryFn: () => base44.entities.Transaction.filter({ user_id: user.id }, '-created_date'),
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {tx.transaction_type === 'add' ? (
                            <Plus className="w-6 h-6 text-green-600" />
                          ) : (
                            <Minus className="w-6 h-6 text-red-600" />
                          )}
                          <h3 className="text-xl font-bold text-gray-900">
                            {tx.product_name}
                          </h3>
                        </div>
                        
                        <div className="space-y-1 text-base text-gray-600 ml-9">
                          <p>
                            <span className="font-semibold">Action:</span>{' '}
                            <span className={tx.transaction_type === 'add' ? 'text-green-600' : 'text-red-600'}>
                              {tx.transaction_type === 'add' ? 'Added' : 'Removed'} {Math.abs(tx.quantity_change)} units
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold">Previous Stock:</span> {tx.previous_stock}
                          </p>
                          <p>
                            <span className="font-semibold">New Stock:</span> {tx.resulting_stock}
                          </p>
                          <p className="text-gray-500">
                            {format(new Date(tx.created_date), 'PPpp')}
                          </p>
                        </div>
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