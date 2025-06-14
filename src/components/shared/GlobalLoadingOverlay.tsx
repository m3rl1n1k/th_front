
"use client";
import React from 'react';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { Loader2 } from 'lucide-react';

export function GlobalLoadingOverlay() {
  const { isLoading, loadingMessage } = useGlobalLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 z-[1000] flex flex-col items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      {loadingMessage && <p className="mt-4 text-lg text-foreground">{loadingMessage}</p>}
    </div>
  );
}
