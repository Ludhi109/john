'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, BookOpen, Clock } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';


export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'student')) {
      router.push('/login');
    }
  }, [user, router, mounted]);

  if (!mounted) return null;
  if (!user || user.role !== 'student') return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Navbar */}
      <nav className="bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="text-xl font-bold text-indigo-400 flex items-center gap-2">
          <BookOpen size={24} />
          <span>Quiz Portal</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-gray-400">Welcome, </span>
            <span className="text-white font-medium">{user.name}</span>
          </div>
          <LogoutButton />
        </div>

      </nav>

      <div className="container mx-auto p-8 max-w-6xl">
        {children}
      </div>
    </div>
  );
}
