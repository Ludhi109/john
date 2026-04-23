'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  Plus, Users, ClipboardList, Trash2, Edit2, BarChart3, Clock, 
  Settings, LogOut, Search, ChevronRight, X, ShieldCheck, BookOpen, Trophy, Zap
} from 'lucide-react';
import QuestionManager from '@/components/admin/QuestionManager';
import ResultsView from '@/components/admin/ResultsView';
import AnalyticsView from '@/components/admin/AnalyticsView';


interface Exam {
  _id: string;
  title: string;
  description: string;
  duration: number;
  attemptLimit: number;
  randomize: boolean;
  enableSecurity: boolean;
}

export default function AdminDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'exams' | 'results'>('exams');
  
  // Manage Questions State
  const [managingExam, setManagingExam] = useState<Exam | null>(null);
  const [analyzingExam, setAnalyzingExam] = useState<Exam | null>(null);


  // New Exam Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [randomize, setRandomize] = useState(false);
  const [enableSecurity, setEnableSecurity] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchExams = async () => {
    try {
      const res = await api.get('/admin/exams');
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { title, description, duration, attemptLimit, randomize, enableSecurity };
      if (editingExamId) {
        await api.put(`/admin/exams/${editingExamId}`, payload);
        alert('Exam updated successfully!');
      } else {
        await api.post('/admin/exams', payload);
        alert('Exam created successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchExams();
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || err.message || 'Unknown error';
      alert(`Error: ${message}`);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDuration(30);
    setAttemptLimit(1);
    setRandomize(false);
    setEnableSecurity(true);
    setEditingExamId(null);
  };

  const handleEditClick = (exam: Exam) => {
    setTitle(exam.title);
    setDescription(exam.description);
    setDuration(exam.duration);
    setAttemptLimit(exam.attemptLimit || 1);
    setRandomize(exam.randomize || false);
    setEnableSecurity(exam.enableSecurity !== undefined ? exam.enableSecurity : true);
    setEditingExamId(exam._id);
    setShowModal(true);
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm('Are you sure? This will delete all questions too.')) return;
    try {
      await api.delete(`/admin/exams/${id}`);
      fetchExams();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('This will RESET the entire database and create demo exams/students. Proceed?')) return;
    setLoading(true);
    try {
      await api.post('/admin/seed');
      fetchExams();
      alert('Database seeded successfully. Refreshing dashboard...');
    } catch (err) {
      console.error(err);
      alert('Seeding failed. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(exam => 
    exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    exam.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <div className="p-8">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-xl shadow-indigo-500/20 text-white">
          <div className="flex justify-between items-start">
            <h3 className="opacity-80 font-medium">Total Exams</h3>
            <BookOpen size={20} className="text-white/40" />
          </div>
          <p className="text-4xl font-bold mt-2">{exams.length}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-400 font-medium">Active Students</h3>
            <Users size={20} className="text-gray-600" />
          </div>
          <p className="text-4xl font-bold mt-2">12</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-400 font-medium">Average Score</h3>
            <Trophy size={20} className="text-gray-600" />
          </div>
          <p className="text-4xl font-bold mt-2">84%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-8 gap-8">
        <button 
          onClick={() => setActiveTab('exams')}
          className={`pb-4 font-bold transition-all px-2 ${activeTab === 'exams' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Exam Management
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`pb-4 font-bold transition-all px-2 ${activeTab === 'results' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Student Results
        </button>
      </div>

      {activeTab === 'exams' ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Manage Exams</h2>
            <div className="relative group max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Search exams, descriptions..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl py-3.5 pl-12 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-gray-800 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleSeedData}
                disabled={loading}
                className="bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white px-6 py-3.5 rounded-2xl font-black flex items-center gap-3 transition-all border border-amber-600/20 active:scale-95 whitespace-nowrap disabled:opacity-50"
              >
                <Zap size={20} />
                <span>Quick Seed</span>
              </button>

              <button 
                onClick={() => { resetForm(); setShowModal(true); }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-black flex items-center gap-3 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Create New Exam</span>
              </button>
            </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-900/50">
                    <th className="px-6 py-4 font-semibold text-gray-400 uppercase text-xs tracking-wider">Exam Details</th>
                    <th className="px-6 py-4 font-semibold text-gray-400 uppercase text-xs tracking-wider">Questions</th>
                    <th className="px-6 py-4 font-semibold text-gray-400 uppercase text-xs tracking-wider">Duration</th>
                    <th className="px-6 py-4 font-semibold text-center text-gray-400 uppercase text-xs tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredExams.map((exam) => (
                    <tr key={exam._id} className="hover:bg-gray-700/30 transition-all">
                      <td className="px-6 py-5">
                        <div className="font-bold text-white text-lg">{exam.title}</div>
                        <div className="text-xs text-gray-500 mt-1 max-w-md line-clamp-1">{exam.description || 'No description provided'}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2 text-gray-300">
                          <Clock size={16} className="text-indigo-400" />
                          <span className="font-mono">{exam.duration}m</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(exam)}
                            className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
                            title="Edit Exam"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => setManagingExam(exam)}
                            className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all border border-indigo-500/20"
                          >
                            Questions
                          </button>
                          <button 
                             onClick={() => setAnalyzingExam(exam)}
                             className="bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all border border-amber-500/20"
                          >
                             Analytics
                          </button>
                          <button 
                            onClick={() => handleDeleteExam(exam._id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>

                  ))}
                </tbody>
              </table>
              {exams.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  <BookOpen size={48} className="mx-auto mb-4 opacity-10" />
                  <p>No exams found. Click "Create New Exam" to get started.</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <ResultsView />
      )}

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
            <h2 className="text-2xl font-bold mb-6 text-white">New Assessment</h2>
            <form onSubmit={handleCreateExam} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Exam Title</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Advanced JavaScript Midterm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] transition-all"
                  placeholder="Tell students what to expect..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Duration (min)</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={isNaN(duration) ? '' : duration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setDuration(isNaN(val) ? 0 : val);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Attempts</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={isNaN(attemptLimit) ? '' : attemptLimit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setAttemptLimit(isNaN(val) ? 0 : val);
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/50 p-4 rounded-2xl border border-gray-700/50 justify-between">
                <div>
                   <span className="block text-sm font-bold text-white">Randomize Questions</span>
                   <span className="text-[10px] text-gray-500 font-medium">Shuffle order and options for students</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRandomize(!randomize)}
                  className={`w-12 h-6 rounded-full transition-all relative ${randomize ? 'bg-indigo-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${randomize ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              <div className="flex items-center gap-3 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 justify-between">
                <div>
                   <span className="block text-sm font-bold text-white flex items-center gap-2">
                     <ShieldCheck size={16} className="text-indigo-400" />
                     High-Security Mode
                   </span>
                   <span className="text-[10px] text-gray-500 font-medium italic">Enforces Fullscreen, Anti-Tab Switch, & Inactivity Timer</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableSecurity(!enableSecurity)}
                  className={`w-12 h-6 rounded-full transition-all relative ${enableSecurity ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enableSecurity ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-bold transition-all text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/30 text-white"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Manager Overlay */}
      {managingExam && (
        <QuestionManager 
          examId={managingExam._id} 
          examTitle={managingExam.title} 
          onClose={() => setManagingExam(null)} 
        />
      )}

      {/* Analytics Overlay */}
      {analyzingExam && (
        <AnalyticsView
          examId={analyzingExam._id}
          examTitle={analyzingExam.title}
          onClose={() => setAnalyzingExam(null)}
        />
      )}
    </div>

  );
}

