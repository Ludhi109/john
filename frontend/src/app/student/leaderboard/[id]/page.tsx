'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Trophy, ChevronLeft, Award, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface LeaderboardEntry {
  _id: string;
  user: {
    name: string;
  };
  score: number;
  endTime: string;
}

export default function Leaderboard() {
  const { id: examId } = useParams();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get(`/student/leaderboard/${examId}`);
        setEntries(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [examId]);


  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-all"
        >
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-12 text-center relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <Trophy size={64} className="mx-auto mb-4 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
            <h1 className="text-4xl font-black tracking-tight mb-2">Global Leaderboard</h1>
            <p className="text-indigo-100 opacity-80">The top performers of this assessment</p>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-20 text-gray-500 italic">
                No submissions yet. Be the first to top the charts!
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry, idx) => (
                  <div 
                    key={entry._id}
                    className={`flex items-center gap-6 p-6 rounded-2xl border transition-all ${
                      idx === 0 
                        ? 'bg-amber-400/10 border-amber-400/30' 
                        : idx === 1 
                          ? 'bg-slate-300/10 border-slate-300/30' 
                          : idx === 2 
                            ? 'bg-orange-400/10 border-orange-400/30' 
                            : 'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-xl ${
                      idx === 0 ? 'bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(251,191,36,0.4)]' :
                      idx === 1 ? 'bg-slate-300 text-slate-800' :
                      idx === 2 ? 'bg-orange-400 text-orange-950' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-bold text-lg">{entry.user.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock size={12} />
                        <span>Completed on {format(new Date(entry.endTime), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-white">{entry.score.toFixed(1)}</div>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Points</div>
                    </div>

                    {idx < 3 && (
                      <Award className={`${
                        idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-orange-400'
                      }`} size={28} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
