'use client';

import { AkiorHUD } from '@/components/akior-hud';
import { useAuth } from '@/contexts/auth-context';
import { LoginPage } from '@/components/login-page';
import { Loader2 } from 'lucide-react';

export default function TalkPage() {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading AKIOR...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AkiorHUD />
    </div>
  );
}
