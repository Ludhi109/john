'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/authStore';


export default function LogoutButton() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    addNotification('info', 'Logged out successfully.', 3000);
    router.push('/login');
  };


  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-red-500/20 active:scale-95 group"
    >
      <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
      <span>Logout Session</span>
    </button>
  );
}
