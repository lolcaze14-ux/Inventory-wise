import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Package, Mail, Lock, User, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UserSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteEmail = urlParams.get('email');
    const timestamp = urlParams.get('t');
    
    if (!inviteEmail || !timestamp) {
      setError('Invalid invitation link - missing parameters');
      return;
    }

    setEmail(decodeURIComponent(inviteEmail));
    
    // Check if link is expired (5 minutes)
    const linkCreatedAt = new Date(parseInt(timestamp));
    const expiryTime = new Date(linkCreatedAt.getTime() + 5 * 60 * 1000);
    setExpiresAt(expiryTime);
    
    const now = new Date();
    if (now > expiryTime) {
      setError('This invitation link has expired. Please request a new one.');
    }
  }, []);

  useEffect(() => {
    if (expiresAt) {
      const timer = setInterval(() => {
        const now = new Date();
        const diff = expiresAt - now;
        
        if (diff <= 0) {
          setTimeRemaining('Expired');
          setError('This invitation has expired. Please request a new one.');
          clearInterval(timer);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [expiresAt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Double-check expiry
    const now = new Date();
    if (expiresAt && now > expiresAt) {
      setError('This invitation has expired. Please request a new one.');
      setIsLoading(false);
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          role: 'user',
        });

      if (profileError) throw profileError;

      window.location.href = createPageUrl('Dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  const isExpired = timeRemaining === 'Expired' || (expiresAt && new Date() > expiresAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-4xl font-bold text-gray-900">
            Join Inventory
          </CardTitle>
          <p className="text-lg text-gray-600 mt-3">
            You've been invited! Create your account
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          {error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-base">{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {email && (
                <Alert className="mb-6">
                  <CheckCircle className="h-5 w-5" />
                  <AlertDescription className="text-base">
                    Valid invitation for {email}
                  </AlertDescription>
                </Alert>
              )}
              
              {timeRemaining && timeRemaining !== 'Expired' && (
                <Alert className="mb-6 bg-yellow-50 border-yellow-200">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <AlertDescription className="text-base text-yellow-800">
                    Link expires in: <strong>{timeRemaining}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="fullName" className="text-lg font-semibold">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-14 pl-12 text-lg"
                  required
                  autoFocus
                  disabled={isExpired}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-lg font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  className="h-14 pl-12 text-lg bg-gray-100"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="text-lg font-semibold">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 text-lg"
                  required
                  minLength={6}
                  disabled={isExpired}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || isExpired}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {isExpired && (
            <div className="mt-6 text-center">
              <p className="text-base text-gray-600">
                Link expired? Contact your administrator for a new invitation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}