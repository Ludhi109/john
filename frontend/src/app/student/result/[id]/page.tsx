'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, Trophy, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Attempt {
  _id: string;
  exam: {
    title: string;
    description: string;
    duration: number;
    _id: string;
  };
  score: number;
  violationsCount: number;
  isVerified: boolean;
  createdAt: string;
}


export default function ExamResult() {
  const { id: attemptId } = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/student/attempts/${attemptId}`);
        setAttempt(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
      <p className="text-gray-500 font-medium">Calculating final score...</p>
    </div>
  );

  if (!attempt) return <div className="min-h-screen bg-gray-950 text-white p-8">Result not found.</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => router.push('/student')}
          className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-all"
        >
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
          
          <div className="p-8 md:p-12 text-center border-b border-gray-800">
            <div className="inline-flex p-4 bg-indigo-500/10 rounded-full text-indigo-400 mb-6 border border-indigo-500/20">
              <Trophy size={48} className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tight">Exam Completed!</h1>
            <p className="text-gray-400 text-lg max-w-lg mx-auto">{attempt.exam.title}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800 bg-gray-900/50">
            <div className="p-10 text-center">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Final Score</div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-5xl font-black text-white">{attempt.score.toFixed(1)}</div>
                {attempt.isVerified && (
                   <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded-lg border border-green-500/20 uppercase tracking-tighter">
                     <CheckCircle size={10} />
                     Verified
                   </span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2 font-medium">Total points awarded</div>
            </div>

            <div className="p-10 text-center">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Security Rank</div>
              <div className={`text-5xl font-black ${attempt.violationsCount === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                {attempt.violationsCount === 0 ? 'A+' : 'B'}
              </div>
              <div className={`text-xs mt-2 font-medium flex items-center justify-center gap-1 ${attempt.violationsCount === 0 ? 'text-green-500' : 'text-amber-500'}`}>
                {attempt.violationsCount === 0 ? (
                  <>
                    <CheckCircle size={14} />
                    <span>No Violations</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} />
                    <span>{attempt.violationsCount} Warnings</span>
                  </>
                )}
              </div>
            </div>
            <div className="p-10 text-center">
              <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Time Details</div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 text-white font-bold">
                   <Calendar size={16} className="text-indigo-400" />
                   <span>{format(new Date(attempt.createdAt), 'MMM dd')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                   <Clock size={14} />
                   <span>{attempt.exam.duration}m Limit</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-12 bg-gray-900/80">
            <div className="bg-gray-800 border border-gray-700/50 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold mb-4">What's Next?</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                Your results have been securely transmitted to the administration. 
                You can now view the global rankings to see where you stand.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button 
                  onClick={() => router.push(`/student/leaderboard/${attempt.exam._id}`)}
                  className="bg-indigo-600 hover:bg-indigo-700 py-4 rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20"
                 >
                   View Leaderboard
                 </button>
                 <button 
                  onClick={() => router.push('/student')}
                  className="bg-gray-700 hover:bg-gray-600 py-4 rounded-xl font-bold transition-all border border-gray-600"
                 >
                   Back to Portal
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
