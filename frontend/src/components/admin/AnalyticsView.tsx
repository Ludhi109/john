'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { BarChart3, Users, Target, LayoutGrid, X, TrendingUp, HelpCircle } from 'lucide-react';

interface AnalyticsData {
  totalAttempts: number;
  avgScore: number;
  maxPoints: number;
  passRate: number;
  scoreDistribution: Record<string, number>;
}

interface AnalyticsViewProps {
  examId: string;
  examTitle: string;
  onClose: () => void;
}

export default function AnalyticsView({ examId, examTitle, onClose }: AnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/admin/analytics/${examId}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [examId]);

  if (loading) return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Crunching Data...</p>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[100] p-6">
      <div className="max-w-6xl w-full bg-gray-900 border border-white/10 rounded-[3rem] shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gray-900/50 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-3 text-indigo-400 mb-2">
              <BarChart3 size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Performance Analytics</span>
            </div>
            <h2 className="text-3xl font-black text-white">{examTitle}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/5"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <Users size={24} className="text-indigo-400 mb-4" />
              <div className="text-4xl font-black text-white mb-1">{data.totalAttempts}</div>
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Attempts</div>
            </div>
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <Target size={24} className="text-green-400 mb-4" />
              <div className="text-4xl font-black text-white mb-1">{data.avgScore.toFixed(1)}</div>
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Avg. Points / {data.maxPoints}</div>
            </div>
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
              <TrendingUp size={24} className="text-amber-400 mb-4" />
              <div className="text-4xl font-black text-white mb-1">{data.passRate.toFixed(1)}%</div>
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Success Rate</div>
            </div>
            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                <HelpCircle size={24} className="text-blue-400 mb-4" />
                <div className="text-4xl font-black text-white mb-1">{data.maxPoints}</div>
                <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Maximum Score</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {/* Score Distribution Chart */}
             <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
               <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                 <LayoutGrid size={20} className="text-indigo-400" />
                 Score Distribution
               </h3>
               <div className="space-y-8">
                 {Object.entries(data.scoreDistribution).map(([range, count]) => {
                   const percentage = data.totalAttempts > 0 ? (count / data.totalAttempts) * 100 : 0;
                   return (
                     <div key={range}>
                       <div className="flex justify-between items-center mb-3">
                         <span className="text-sm font-bold text-gray-400">{range}% Success</span>
                         <span className="text-sm font-black text-white">{count} Students ({percentage.toFixed(0)}%)</span>
                       </div>
                       <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                         <div 
                           className="h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-1000"
                           style={{ width: `${percentage}%` }}
                         />
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>

             {/* Performance Summary */}
             <div className="flex flex-col gap-6">
                <div className="bg-indigo-600/10 p-10 rounded-[3rem] border border-indigo-500/20 flex-1">
                   <h3 className="text-lg font-black text-indigo-400 mb-6">Expert Analysis</h3>
                   <div className="space-y-4">
                      {data.passRate > 70 ? (
                        <p className="text-gray-300 leading-relaxed font-medium">
                          The assessment difficulty is well-balanced. Over <span className="text-white font-bold">70%</span> of participants met the core objectives, indicating a high level of proficiency among the cohort.
                        </p>
                      ) : data.passRate > 40 ? (
                        <p className="text-gray-300 leading-relaxed font-medium">
                           Moderate success observed. The results indicate some areas of friction where candidates struggled to achieve maximum points. Consider reviewing the curriculum for common pitfalls.
                        </p>
                      ) : (
                        <p className="text-gray-300 leading-relaxed font-medium">
                          High friction alert. Success rates are significantly below average. It is recommended to analyze specific question responses to identify if certain modules require re-teaching or if assessment criteria are too stringent.
                        </p>
                      )}
                      
                      <div className="pt-6 grid grid-cols-2 gap-4">
                         <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Pass Benchmark</span>
                            <span className="text-white font-bold">{(data.maxPoints * 0.5).toFixed(1)} Points</span>
                         </div>
                         <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Cohort Size</span>
                            <span className="text-white font-bold">{data.totalAttempts} Tested</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-amber-400/5 p-8 rounded-[2rem] border border-amber-400/20 flex items-center gap-6">
                   <div className="w-16 h-16 bg-amber-400/10 rounded-2xl flex items-center justify-center text-amber-400 flex-shrink-0">
                      <TrendingUp size={32} />
                   </div>
                   <div>
                      <h4 className="font-black text-white uppercase tracking-wider text-xs mb-1">Improvement Pathway</h4>
                      <p className="text-gray-500 text-sm font-medium leading-snug">Focusing on students in the 25-50% bracket could increase the success rate by up to {data.scoreDistribution['25-50'] > 0 ? ((data.scoreDistribution['25-50'] / data.totalAttempts) * 100).toFixed(0) : 15}%.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
