'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, ShieldCheck, Trophy, ArrowRight, Zap, Globe, Lock } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-indigo-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 py-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-10 animate-fade-in shadow-xl backdrop-blur-md">
          <Zap size={14} fill="currentColor" />
          <span>v2.0 Performance Update</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 text-center leading-[0.9] max-w-4xl">
           Master Your <br />
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-500">
             Future Assessments
           </span>
        </h1>
        
        <p className="max-w-xl text-xl text-gray-400 mb-12 leading-relaxed text-center font-medium">
          The most secure, advanced, and intuitive platform for professional grade online examinations. 
          Built for scale, secured with integrity.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md justify-center">
          <button 
            onClick={() => router.push('/login')}
            className="group px-8 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-[0_0_40px_rgba(99,102,241,0.3)] active:scale-95"
          >
            <span>Launch Portal</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => router.push('/register')}
            className="px-8 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-lg border border-white/10 backdrop-blur-xl transition-all active:scale-95"
          >
            Create Account
          </button>
        </div>

        {/* Features Preview */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          <div className="group bg-white/[0.02] hover:bg-white/[0.04] p-8 rounded-[2.5rem] border border-white/[0.05] transition-all hover:border-indigo-500/30 hover:-translate-y-2">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-lg">
              <Lock size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-3">Anti-Cheat Engine</h3>
            <p className="text-gray-500 leading-relaxed font-medium">State-of-the-art monitoring with tab-switch detection, fullscreen enforcement, and interaction blocking.</p>
          </div>
          <div className="group bg-white/[0.02] hover:bg-white/[0.04] p-8 rounded-[2.5rem] border border-white/[0.05] transition-all hover:border-blue-500/30 hover:-translate-y-2">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg">
              <Globe size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-3">coding Intelligence</h3>
            <p className="text-gray-500 leading-relaxed font-medium">Integrated code editor with live execution via Judge0 API. Support for multiple languages and test-case validation.</p>
          </div>
          <div className="group bg-white/[0.02] hover:bg-white/[0.04] p-8 rounded-[2.5rem] border border-white/[0.05] transition-all hover:border-green-500/30 hover:-translate-y-2">
            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400 mb-6 group-hover:bg-green-500 group-hover:text-white transition-all shadow-lg">
              <Trophy size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-3">Global Rankings</h3>
            <p className="text-gray-500 leading-relaxed font-medium">Automated grading and real-time leaderboards. Instantly track your standing across all assessments.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-gray-600 font-medium text-sm mt-auto relative z-10 backdrop-blur-md">
        <div className="flex justify-center gap-8 mb-4">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>
        &copy; 2026 Online Examination System. Engineered for Performance.
      </footer>
    </div>
  );
}

