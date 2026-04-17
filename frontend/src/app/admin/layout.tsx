'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, BookOpen, Users } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, router, mounted]);

  if (!mounted) return null;
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 p-6 flex flex-col">
        <div className="text-2xl font-bold text-indigo-400 mb-10 flex items-center gap-2">
          <LayoutDashboard size={28} />
          <span>Quiz Admin</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 rounded-lg text-white transition-all">
            <BookOpen size={20} />
            <span>Manage Exams</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg transition-all">
            <Users size={20} />
            <span>Students</span>
          </button>
        </nav>
        
        <div className="mt-6 border-t border-gray-700 pt-6">
          <LogoutButton />
        </div>
      </aside>


      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your exams and track student performance.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-400 text-sm">Role: </span>
              <span className="text-indigo-400 font-medium">Administrator</span>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
