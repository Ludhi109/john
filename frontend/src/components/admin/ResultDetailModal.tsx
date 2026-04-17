'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, CheckCircle, AlertCircle, Award, Save, MessageSquare } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

interface Question {
  _id: string;
  type: 'MCQ' | 'short-answer' | 'coding';
  content: string;
  points: number;
  answer: string;
}

interface StudentAnswer {
  questionId: Question;
  answer: string;
}

interface ResultDetail {
  _id: string;
  user: { name: string; email: string };
  exam: { title: string; description: string };
  score: number;
  violationsCount: number;
  violationsLog: Array<{
    type: string;
    timestamp: string;
    description?: string;
  }>;
  answers: StudentAnswer[];
  createdAt: string;
}

interface ResultDetailModalProps {
  resultId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ResultDetailModal({ resultId, onClose, onUpdate }: ResultDetailModalProps) {
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualScore, setManualScore] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/results/${resultId}`);
        setResult(res.data);
        setManualScore(res.data.score);
      } catch (err) {
        console.error(err);
        addNotification('error', 'Failed to fetch result details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [resultId, addNotification]);

  const handleSaveScore = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/results/${resultId}/grade`, { score: manualScore });
      addNotification('success', 'Score updated successfully.');
      onUpdate();
      onClose();
    } catch (err) {
      console.error(err);
      addNotification('error', 'Failed to update score.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <div>
            <h2 className="text-2xl font-black text-white">{result.user.name}</h2>
            <p className="text-gray-400 text-sm">{result.exam.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Score</div>
              <div className="text-2xl font-black text-indigo-400">{result.score.toFixed(1)}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Violations</div>
              <div className={`text-2xl font-black ${result.violationsCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {result.violationsCount}
              </div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Submissions</div>
              <div className="text-2xl font-black text-white">{result.answers.length}</div>
            </div>
          </div>

          {/* Violation Log Section */}
          {result.violationsLog && result.violationsLog.length > 0 && (
            <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/20">
               <h3 className="text-sm font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <AlertCircle size={16} />
                 Security Violation Log
               </h3>
               <div className="space-y-3">
                 {result.violationsLog.map((log, lidx) => (
                   <div key={lidx} className="flex justify-between items-center text-xs py-2 border-b border-red-500/10 last:border-0">
                     <span className="text-gray-300 font-bold uppercase">{log.type.replace('-', ' ')}</span>
                     <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Detailed Answers */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-400" />
              <span>Response Review</span>
            </h3>

            {result.answers.map((ans, idx) => (
              <div key={idx} className="bg-gray-800/30 rounded-2xl border border-gray-700/50 overflow-hidden">
                <div className="bg-gray-800/50 px-6 py-3 border-b border-gray-700 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Question {idx + 1} ({ans.questionId.type})</span>
                  <span className="text-xs font-bold text-indigo-400">{ans.questionId.points} Points</span>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                     <p className="text-white font-medium mb-4">{ans.questionId.content}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Student Answer</div>
                      <div className="p-3 bg-gray-900 rounded-xl border border-gray-700 text-sm text-white whitespace-pre-wrap">
                        {ans.answer || 'No Answer'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Correct Answer / Key</div>
                      <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/20 text-sm text-indigo-200 whitespace-pre-wrap">
                         {ans.questionId.answer}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer / Grading */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
              <Award size={24} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Adjust Final Score</label>
              <input 
                type="number" 
                value={manualScore}
                onChange={(e) => setManualScore(parseFloat(e.target.value))}
                className="bg-transparent text-xl font-black text-white focus:outline-none w-24"
              />
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
             <button 
              onClick={onClose}
              className="flex-1 md:flex-none px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
             >
               Cancel
             </button>
             <button 
              onClick={handleSaveScore}
              disabled={saving}
              className="flex-1 md:flex-none px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 disabled:opacity-50"
             >
               {saving ? <div className="h-5 w-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Save size={18} />}
               <span>Finalize Grade</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
