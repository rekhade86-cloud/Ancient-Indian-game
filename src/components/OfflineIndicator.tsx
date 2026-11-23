import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-3 z-40 flex items-center gap-2 rounded-lg border border-[#d4af37]/50 bg-[#1e120d] px-3 py-1.5 text-xs font-medium text-[#f5deb0] shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#d4af37]" aria-hidden="true" />
      <span>Offline Mode · Playing Locally</span>
    </div>
  );
};
