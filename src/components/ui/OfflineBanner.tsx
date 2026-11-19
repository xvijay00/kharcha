import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount } = useOnlineStatus();

  return (
    <div
      className={cn(
        'fixed top-14 left-0 right-0 z-40 overflow-hidden transition-all duration-300 ease-in-out',
        !isOnline
          ? 'max-h-16 opacity-100 translate-y-0'
          : 'max-h-0 opacity-0 -translate-y-2'
      )}
    >
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
        <div className="flex items-center justify-center gap-2 text-amber-800">
          <WifiOff className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">
            You&apos;re offline — changes saved locally
            {pendingCount > 0 && (
              <span className="ml-1 text-amber-600">
                ({pendingCount} pending sync)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;
