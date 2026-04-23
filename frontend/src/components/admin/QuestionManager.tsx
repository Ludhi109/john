'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Edit2, X, Check, Code, Type, List } from 'lucide-react';

interface TestCase {
  input: string;
  output: string;
}

interface Question {
  _id?: string;
  type: 'MCQ' | 'short-answer' | 'coding';
  content: string;
  options?: string[];
  answer: string;
  points: number;
  testCases?: TestCase[];
  keywords?: string[];
}

interface Props {
  examId: string;
  examTitle: string;
  onClose: () => void;
}

export default function QuestionManager({ examId, examTitle, onClose }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<Question['type']>('MCQ');
  const [content, setContent] = useState('');
  const [points, setPoints] = useState(1);
  const [answer, setAnswer] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [keywords, setKeywords] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: '', output: '' }]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/admin/questions/${examId}`);
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  const resetForm = () => {
    setType('MCQ');
    setContent('');
    setPoints(1);
    setAnswer('');
    setOptions(['', '', '', '']);
    setKeywords('');
    setTestCases([{ input: '', output: '' }]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (q: Question) => {
    setType(q.type);
    setContent(q.content);
    setPoints(q.points);
    setAnswer(q.answer);
    if (q.options) setOptions(q.options);
    if (q.keywords) setKeywords(q.keywords.join(', '));
    if (q.testCases) setTestCases(q.testCases);
    setEditingId(q._id || null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      examId,
      type,
      content,
      points,
      answer,
      options: type === 'MCQ' ? options : undefined,
      keywords: type === 'short-answer' ? keywords.split(',').map(k => k.trim()) : undefined,
      testCases: type === 'coding' ? testCases : undefined,
    };

    try {
      if (editingId) {
        await api.put(`/admin/questions/${editingId}`, payload);
        alert('Question updated successfully!');
      } else {
        await api.post('/admin/questions', payload);
        alert('Question added successfully!');
      }
      fetchQuestions();
      resetForm();
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert(`Error: ${message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Questions</h2>
            <p className="text-gray-400 text-sm">Exam: {examTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: Questions List */}
          <div className="w-1/3 border-r border-gray-800 flex flex-col bg-gray-900/10">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Question List</span>
              <button 
                onClick={() => { resetForm(); setShowForm(true); }}
                className="p-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center py-10 text-gray-500">Loading...</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-10 text-gray-600 italic">No questions yet</div>
              ) : (
                questions.map((q, idx) => (
                  <div key={q._id} className="group bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-indigo-500/50 transition-all cursor-pointer" onClick={() => handleEdit(q)}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase">{q.type}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(q._id!); }} className="text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{q.content}</p>
                    <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                       <span>Q{idx + 1}</span>
                       <span>{q.points} Points</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Question Form */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-950/20">
            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{editingId ? 'Edit Question' : 'Add New Question'}</h3>
                  <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                    {[
                      { id: 'MCQ', icon: List },
                      { id: 'short-answer', icon: Type },
                      { id: 'coding', icon: Code }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id as any)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          type === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <t.icon size={16} />
                        <span className="capitalize">{t.id.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Question Content</label>
                    <textarea
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                      placeholder="What is the result of 2 + 2?"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Points</label>
                      <input
                        type="number"
                        required
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={isNaN(points) ? '' : points}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setPoints(isNaN(val) ? 0 : val);
                        }}
                      />
                    </div>
                    {type !== 'coding' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Correct Answer</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder={type === 'MCQ' ? 'Exactly matches one option' : 'Main answer phrase'}
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* MCQ Options */}
                  {type === 'MCQ' && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                       {options.map((opt, idx) => (
                        <div key={idx}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Option {idx + 1}</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...options];
                              newOpts[idx] = e.target.value;
                              setOptions(newOpts);
                            }}
                          />
                        </div>
                       ))}
                    </div>
                  )}

                  {/* Short Answer Keywords */}
                  {type === 'short-answer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Evaluation Keywords (Comma separated)</label>
                      <input
                        type="text"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="keyword1, keyword2, keyword3"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                      />
                      <p className="text-[10px] text-gray-500 mt-1">If students include these in their answer, they get partial points.</p>
                    </div>
                  )}

                  {/* Coding Test Cases */}
                  {type === 'coding' && (
                    <div className="space-y-4 pt-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-400">Test Cases</label>
                        <button 
                          type="button" 
                          onClick={() => setTestCases([...testCases, { input: '', output: '' }])}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Case
                        </button>
                      </div>
                      {testCases.map((tc, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-gray-800/30 p-3 rounded-xl border border-gray-800">
                          <div className="col-span-5">
                            <label className="block text-[10px] text-gray-500 mb-1 uppercase">Input</label>
                            <input
                              type="text"
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none border-indigo-500/30"
                              value={tc.input}
                              onChange={(e) => {
                                const nu = [...testCases];
                                nu[idx].input = e.target.value;
                                setTestCases(nu);
                              }}
                            />
                          </div>
                          <div className="col-span-6">
                            <label className="block text-[10px] text-gray-500 mb-1 uppercase">Expected Output</label>
                            <input
                              type="text"
                              required
                              className="w-full bg-gray-900 border border-gray-800 rounded-lg py-1.5 px-3 text-sm text-white focus:outline-none border-indigo-500/30"
                              value={tc.output}
                              onChange={(e) => {
                                const nu = [...testCases];
                                nu[idx].output = e.target.value;
                                setTestCases(nu);
                              }}
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <button 
                              type="button" 
                              onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20"
                  >
                    {editingId ? 'Update Question' : 'Add Question'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="bg-indigo-500/10 p-6 rounded-3xl mb-4">
                  <Plus className="text-indigo-400 w-12 h-12" />
                </div>
                <h4 className="text-xl font-bold mb-2">Build your exam</h4>
                <p className="text-gray-500 max-w-xs mx-auto mb-6">Create multiple choice, short answer, or coding questions with automated evaluation.</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                  Create First Question
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
