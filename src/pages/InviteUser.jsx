import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Send, Copy, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InviteUser() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

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

  const createInviteMutation = useMutation({
    mutationFn: async (inviteEmail) => {
      const invitation = await base44.entities.Invitation.create({
        email: inviteEmail,
        invited_by: user.id
      });
      return invitation;
    },
    onSuccess: (invitation) => {
      // Create invite link with email and timestamp in URL (no database needed!)
      const timestamp = Date.now();
      const link = `${window.location.origin}${createPageUrl('UserSignup')}?email=${encodeURIComponent(email)}&t=${timestamp}`;
      setInviteLink(link);
      setEmail('');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createInviteMutation.mutate(email);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto pt-8 space-y-6">
        <Button
          onClick={() => window.location.href = createPageUrl('AdminDashboard')}
          variant="outline"
          className="h-14 px-6 text-lg border-2"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          Back to Admin Dashboard
        </Button>

        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-3xl font-bold">Invite New User</CardTitle>
            <p className="text-lg opacity-90 mt-2">Send an invitation to join your inventory system</p>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-xl font-semibold">
                  User Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-16 pl-14 text-xl"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={createInviteMutation.isPending}
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Send className="w-6 h-6 mr-3" />
                {createInviteMutation.isPending ? 'Generating Link...' : 'Generate Invite Link'}
              </Button>
            </form>

            {inviteLink && (
              <div className="mt-8 space-y-4">
                <Alert>
                  <CheckCircle className="h-6 w-6" />
                  <AlertDescription className="text-lg">
                    Invitation link generated successfully! <br/>
                    <strong className="text-red-600">⏰ Link expires in 5 minutes</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Share This Link (Valid for 5 minutes):</Label>
                  <div className="flex gap-2">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="h-14 text-base flex-1"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="h-14 px-6"
                    >
                      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                  <p className="text-sm text-red-600 font-semibold">
                    ⚠️ Important: This link will expire in 5 minutes. Send it to the user immediately!
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}