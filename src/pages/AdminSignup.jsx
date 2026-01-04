import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Package, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSignup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

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
          role: 'admin',
        });

      if (profileError) throw profileError;

      // Redirect to admin dashboard
      navigate(createPageUrl('AdminDashboard'));
    } catch (err) {
      setError(err.message || 'Failed to create admin account');
      setIsLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate(createPageUrl('Login'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-4xl font-bold text-gray-900">
            Admin Signup
          </CardTitle>
          <p className="text-lg text-gray-600 mt-3">
            Create your admin account
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base">{error}</AlertDescription>
              </Alert>
            )}

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
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 pl-12 text-lg"
                  required
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
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isLoading ? 'Creating Account...' : 'Create Admin Account'}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-base text-gray-600">
              Already have an account?{' '}
              <button 
                onClick={handleLoginClick}
                className="text-purple-600 font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}