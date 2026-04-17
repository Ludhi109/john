'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Play, Clock, FileText, Trophy, CheckCircle, BookOpen, Search } from 'lucide-react';


interface Exam {
  _id: string;
  title: string;
  description: string;
  duration: number;
  attemptLimit: number;
  enableSecurity?: boolean;
}

interface Attempt {
  _id: string;
  exam: string;
  score: number;
  status: string;
  createdAt: string;
}

interface Stats {
  rank: number;
  totalPoints: number;
  examsTaken: number;
}

export default function StudentDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, attemptsRes, statsRes] = await Promise.all([
          api.get<Exam[]>('/student/exams'),
          api.get<Attempt[]>('/student/my-attempts'),
          api.get<Stats>('/student/stats')
        ]);
        setExams(examsRes.data);
        setAttempts(attemptsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  const filteredExams = exams.filter(exam => 
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    exam.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttemptForExam = (examId: string) => {
    return attempts.find(a => a.exam === examId);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Welcome back, Learner
          </h1>
          <p className="text-gray-400 text-lg">Your assessments for today are ready.</p>
        </div>
        <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Trophy size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Rank</div>
            <div className="text-xl font-bold text-indigo-400">#{stats?.rank || '--'}</div>
          </div>
        </div>
        <div className="bg-amber-400/10 border border-amber-400/20 p-4 rounded-2xl flex items-center gap-4">
          <div className="bg-amber-400 p-2 rounded-xl text-amber-950">
            <Trophy size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Points</div>
            <div className="text-xl font-bold text-amber-500">{stats?.totalPoints?.toFixed(1) || '0.0'}</div>
          </div>
        </div>
      </div>

      {/* Global Search Strip */}
      <div className="mb-10 bg-gray-900/50 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md">
        <div className="relative group w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="Search assessments by title, topic, or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-8 text-lg text-white placeholder:text-gray-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:bg-white/10 transition-all font-medium"
          />
        </div>
      </div>


      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-500 animate-pulse font-medium">Fetching available exams...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredExams.map((exam) => {
            const attempt = getAttemptForExam(exam._id);
            const isCompleted = !!attempt;

            return (
              <div 
                key={exam._id} 
                className={`group bg-gray-900 border ${isCompleted ? 'border-green-500/30' : 'border-gray-800'} rounded-3xl p-8 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all relative overflow-hidden flex flex-col`}
              >
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle size={10} />
                    <span>Completed</span>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl border transition-all shadow-lg ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-800 text-indigo-400 border-gray-700 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                    <FileText size={24} />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-400 bg-gray-800/50 px-3 py-1.5 rounded-xl border border-gray-800">
                    <Clock size={16} className="text-indigo-400" />
                    <span>{exam.duration}m</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-3 text-white">{exam.title}</h3>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed line-clamp-2">
                  {exam.description || 'A comprehensive evaluation of your skills and knowledge.'}
                </p>
                
                <div className="mt-auto flex gap-3">
                  {isCompleted ? (
                    <button 
                      onClick={() => router.push(`/student/result/${attempt._id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-3.5 rounded-xl font-bold transition-all border border-gray-700 text-gray-300"
                    >
                      <span>View My Result</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => router.push(`/student/exam/${exam._id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                      <Play size={18} fill="currentColor" />
                      <span>Start Attempt</span>
                    </button>
                  )}
                  <button 
                    onClick={() => router.push(`/student/leaderboard/${exam._id}`)}
                    className="p-3.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white border border-gray-700 transition-all"
                    title="View Leaderboard"
                  >
                    <Trophy size={20} />
                  </button>
                </div>
              </div>
            );
          })}
          {exams.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-800">
              <div className="bg-gray-800 p-6 rounded-3xl mb-4 opacity-20">
                <BookOpen size={48} className="text-gray-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-600">No Exams Available</h4>
              <p className="text-gray-700 text-sm mt-1">Check back later for new assessments.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

