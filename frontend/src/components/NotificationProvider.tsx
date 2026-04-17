'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function NotificationProvider() {
  const { notifications, removeNotification } = useNotificationStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-4 max-w-md w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`group relative overflow-hidden flex items-center gap-4 p-5 rounded-3xl border shadow-2xl backdrop-blur-3xl animate-in slide-in-from-right transition-all duration-500 hover:scale-[1.02] ${
            n.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
            n.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            n.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}
        >
          {/* Progress Bar */}
          {n.duration && n.duration > 0 && (
             <div 
               className={`absolute bottom-0 left-0 h-1 transition-all duration-[var(--duration)] ease-linear ${
                  n.type === 'success' ? 'bg-green-500' :
                  n.type === 'error' ? 'bg-red-500' :
                  n.type === 'warning' ? 'bg-amber-500' :
                  'bg-indigo-500'
               }`}
               style={{ 
                 width: '0%', 
                 animation: `progress ${n.duration}ms linear forwards`,
                 '--duration': `${n.duration}ms`
               } as any}
             />
          )}

          <div className="flex-shrink-0">
            {n.type === 'success' && <CheckCircle size={24} />}
            {n.type === 'error' && <XCircle size={24} />}
            {n.type === 'warning' && <AlertCircle size={24} />}
            {n.type === 'info' && <Info size={24} />}
          </div>
          
          <p className="flex-1 font-bold text-sm leading-snug">{n.message}</p>
          
          <button
            onClick={() => removeNotification(n.id)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={18} />
          </button>

        </div>
      ))}
    </div>
  );
}
