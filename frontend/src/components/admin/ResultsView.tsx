'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User, Calendar, Award, Eye, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import ResultDetailModal from './ResultDetailModal';


interface Result {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  exam: {
    _id: string;
    title: string;
  };
  score: number;
  status: string;
  startTime: string;
  endTime: string;
  violationsCount: number;
  createdAt: string;
}


export default function ResultsView() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);


  const fetchResults = async () => {
    try {
      const res = await api.get('/admin/results');
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-900/50">
            <th className="px-6 py-4 font-semibold text-gray-400 uppercase text-xs tracking-wider">Student</th>
            <th className="px-6 py-4 font-semibold text-gray-400 uppercase text-xs tracking-wider">Exam</th>
            <th className="px-6 py-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-center">Score</th>
            <th className="px-6 py-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-center">Date</th>
            <th className="px-6 py-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-center">Security</th>
            <th className="px-6 py-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {results.map((result) => (
            <tr key={result._id} className="hover:bg-gray-700/30 transition-all">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-white">{result.user.name}</div>
                    <div className="text-xs text-gray-500">{result.user.email}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="text-gray-300 font-medium">{result.exam?.title || 'Deleted Exam'}</div>
              </td>
              <td className="px-6 py-5 text-center">
                <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-full border border-green-500/20 font-bold">
                  <Award size={14} />
                  <span>{result.score.toFixed(1)}</span>
                </div>
              </td>
              <td className="px-6 py-5 text-center">
                <div className="flex flex-col items-center text-gray-400 text-xs">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{format(new Date(result.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                  <span className="opacity-50 mt-0.5">{format(new Date(result.createdAt), 'hh:mm a')}</span>
                </div>
              </td>
              <td className="px-6 py-5 text-center">
                {result.violationsCount > 0 ? (
                  <div className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20 text-xs font-bold">
                    <AlertCircle size={14} />
                    <span>{result.violationsCount} Violations</span>
                  </div>
                ) : (
                  <span className="text-gray-600 text-xs">Clean</span>
                )}
              </td>
              <td className="px-6 py-5 text-center">
                <button 
                  onClick={() => setSelectedResultId(result._id)}
                  className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all" 
                  title="Review & Grade"
                >
                  <Eye size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {selectedResultId && (
        <ResultDetailModal 
          resultId={selectedResultId} 
          onClose={() => setSelectedResultId(null)}
          onUpdate={fetchResults}
        />
      )}

      {results.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Award size={48} className="mx-auto mb-4 opacity-10" />
          <p>No student submissions found yet.</p>
        </div>
      )}
    </div>
  );
}
