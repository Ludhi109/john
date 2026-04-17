'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Send, Play, ShieldAlert, Maximize2, X } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

interface Exam {
  _id: string;
  title: string;
  description: string;
  duration: number;
  attemptLimit: number;
  enableSecurity: boolean;
}

interface Question {
  _id: string;
  type: 'MCQ' | 'short-answer' | 'coding';
  content: string;
  points: number;
  options?: string[];
}

interface Violation {
  type: 'tab-switch' | 'fullscreen-exit' | 'inactivity';
  timestamp: Date;
}

export default function ExamRoom() {
  const { id: examId } = useParams();
  const router = useRouter();
  const { addNotification } = useNotificationStore();
  
  const [exam, setExam] = useState<Exam | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cheatingAttempts, setCheatingAttempts] = useState<Violation[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [showMobileNav, setShowMobileNav] = useState(false);


  // Anti-cheat: Detect tab switching and fullscreen
  useEffect(() => {
    if (!hasStarted || !exam?.enableSecurity) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const violation: Violation = { type: 'tab-switch', timestamp: new Date() };
        setCheatingAttempts(prev => [...prev, violation]);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && hasStarted) {
        const violation: Violation = { type: 'fullscreen-exit', timestamp: new Date() };
        setCheatingAttempts(prev => [...prev, violation]);
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleActivity = () => {
      setLastActivity(Date.now());
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('copy', handleCopyPaste as any);
    window.addEventListener('paste', handleCopyPaste as any);
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('copy', handleCopyPaste as any);
      window.removeEventListener('paste', handleCopyPaste as any);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [hasStarted]);


  useEffect(() => {
    if (cheatingAttempts.length >= 3) {
      handleSubmit();
    }
  }, [cheatingAttempts]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/student/exams/${examId}`);
        setExam(res.data.exam);
        setQuestions(res.data.questions);
        setTimeLeft(res.data.exam.duration * 60);
      } catch (err) {
        console.error(err);
        router.push('/student');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId, router]);

  // Timer logic
  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0 && !loading) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      // Inactivity check: 5 minutes (300 seconds)
      if (exam?.enableSecurity) {
        const inactivityDuration = (Date.now() - lastActivity) / 1000;
        if (inactivityDuration > 300) {
          addNotification('error', 'Inactivity timeout reached. Auto-submitting assessment.', 5000);
          handleSubmit();
          return;
        }
      }

      setTimeLeft(prev => {

        if (prev === 90) {
          addNotification('warning', 'Only 90 seconds remaining! System will auto-submit soon.', 10000);
        }
        if (prev === 30) {
          addNotification('error', 'Final warning: 30 seconds left!', 5000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, hasStarted]);


  const startExam = async () => {
    try {
      if (exam?.enableSecurity) {
        await document.documentElement.requestFullscreen();
      }
      setHasStarted(true);
      addNotification('success', 'Assessment initialized. Good luck!', 3000);
    } catch (err) {
      console.error('Fullscreen request failed:', err);
      addNotification('error', 'Fullscreen mode is required for this assessment. Please check your browser permissions.', 5000);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer
      }));
      const res = await api.post('/student/submit', { 
        examId, 
        answers: formattedAnswers,
        violations: cheatingAttempts 
      });
      addNotification('success', 'Assessment submitted successfully.', 5000);
      router.push(`/student/result/${res.data.attempt._id}`);
    } catch (err) {

      console.error(err);
      alert('Final submission failed. Your results were logged but redirect failed.');
      router.push('/student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <div className="max-w-2xl w-full bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] p-12 border border-white/[0.05] text-center shadow-2xl">
          <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto mb-8 animate-pulse">
            <ShieldAlert size={44} />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Security Checkpoint</h2>
          <p className="text-gray-400 text-lg mb-10 font-medium">
            You are about to enter a monitored assessment zone. <br />
            <span className="text-indigo-400">Fullscreen mode will be enforced.</span>
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Security Level</span>
              <span className={`font-bold flex items-center gap-2 ${exam?.enableSecurity ? 'text-green-400' : 'text-amber-400'}`}>
                {exam?.enableSecurity ? (
                  <>
                    <ShieldAlert size={16} />
                    High (Anti-Cheat Active)
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} />
                    Standard
                  </>
                )}
              </span>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Max Attempts</span>
              <span className="text-white font-bold">{exam?.attemptLimit} per user</span>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <span className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Questions</span>
              <span className="text-white font-bold">{questions.length} Items</span>
            </div>
          </div>

          <button 
            onClick={startExam}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
          >
            <Play className="fill-current" size={24} />
            <span className="text-xl">Initialize Assessment</span>
            <Maximize2 size={20} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-indigo-500/30">
      {/* Precision Header */}
      <header className="bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.05] px-10 h-20 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20">
            {currentIndex + 1}
          </div>
          <div>
            <h1 className="text-lg font-black text-white/90 truncate max-w-sm">{exam?.title}</h1>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ongoing Assessment</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          {cheatingAttempts.length > 0 && (
            <div className="flex items-center gap-3 text-red-400 bg-red-400/5 px-4 py-2 rounded-2xl border border-red-400/20 text-xs font-black uppercase tracking-widest animate-pulse">
              <AlertTriangle size={18} />
              <span>Security Warnings: {cheatingAttempts.length} / 3</span>
            </div>
          )}
          <div className="flex items-center gap-3 bg-white/[0.05] px-6 py-2.5 rounded-2xl border border-indigo-500/20 font-mono">
            <Clock size={20} className="text-indigo-400" />
            <span className="text-xl font-black text-indigo-400 tabular-nums">{formatTime(timeLeft)}</span>
          </div>

          <button 
            onClick={() => setShowMobileNav(true)}
            className="lg:hidden p-3 bg-white/5 rounded-2xl border border-white/10 text-indigo-400"
          >
            <Maximize2 size={24} />
          </button>

          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="hidden sm:flex bg-green-600 hover:bg-green-500 px-8 py-3 rounded-2xl font-black items-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-green-600/10 active:scale-95"
          >
            <Send size={18} />
            <span>Finish attempt</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Grid */}
        <aside className="w-96 bg-white/[0.01] border-r border-white/[0.05] p-10 overflow-y-auto hidden lg:block">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Question Matrix</h3>
             <span className="text-[10px] bg-white/5 py-1 px-3 rounded-full text-gray-400 font-bold">{Math.round((Object.keys(answers).length / questions.length) * 100)}% Complete</span>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {questions.map((q, idx) => (
              <button
                key={q._id}
                onClick={() => setCurrentIndex(idx)}
                className={`aspect-square rounded-2xl font-black text-sm flex items-center justify-center transition-all ${
                  currentIndex === idx 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-110 relative z-10 ring-4 ring-indigo-500/20' 
                    : answers[q._id] 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-white/5'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Arena */}
        <main className="flex-1 p-12 overflow-y-auto bg-[#070707] relative">
          <div className="max-w-4xl mx-auto py-10">
            <div className="flex justify-between items-center mb-12">
              <span className="text-indigo-400 text-xs font-black uppercase tracking-widest px-4 py-2 bg-indigo-400/5 rounded-full border border-indigo-400/10">
                Segment {currentIndex + 1}
              </span>
              <div className="flex items-center gap-3 text-gray-500 bg-white/5 px-4 py-2 rounded-xl text-xs font-bold uppercase">
                Weight: {currentQuestion?.points} Universal Points
              </div>
            </div>

            <div className="mb-16">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white mb-2">{currentQuestion?.content}</h2>
              <div className="h-1.5 w-20 bg-indigo-600 rounded-full"></div>
            </div>

            {/* MCQ Block */}
            {currentQuestion?.type === 'MCQ' && (
              <div className="grid grid-cols-1 gap-6">
                {currentQuestion.options?.map((option, idx) => (
                  <label 
                    key={idx}
                    className={`group flex items-center gap-6 p-8 rounded-[2rem] border-2 cursor-pointer transition-all active:scale-[0.99] ${
                      answers[currentQuestion._id] === option 
                        ? 'border-indigo-600 bg-indigo-600/5 shadow-2xl shadow-indigo-600/10' 
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      answers[currentQuestion._id] === option ? 'border-indigo-500 bg-indigo-500' : 'border-gray-700'
                    }`}>
                      {answers[currentQuestion._id] === option && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <input 
                      type="radio" 
                      name={currentQuestion._id}
                      className="hidden"
                      checked={answers[currentQuestion._id] === option}
                      onChange={() => handleAnswerChange(currentQuestion._id, option)}
                    />
                    <span className="text-xl font-bold text-gray-200">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Short Answer Block */}
            {currentQuestion?.type === 'short-answer' && (
              <div className="relative group">
                <textarea
                  className="w-full bg-white/[0.02] border-2 border-white/5 rounded-[2.5rem] p-10 text-xl font-medium text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04] transition-all min-h-[300px] shadow-2xl placeholder:text-gray-800"
                  placeholder="Elaborate your response here..."
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                />
              </div>
            )}

            {/* Coding Block */}
            {currentQuestion?.type === 'coding' && (
              <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
                <div className="bg-[#1e1e1e] px-6 py-4 border-b border-white/5 flex items-center justify-between">
                   <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                     <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                   </div>
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">JavaScript Engine v1.0</span>
                </div>
                <Editor
                  height="500px"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={answers[currentQuestion._id] || '// Performance grade code expected\n'}
                  onChange={(val) => handleAnswerChange(currentQuestion._id, val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 20 },
                    roundedSelection: true,
                    selectionHighlight: true,
                  }}
                />
              </div>
            )}

            <div className="mt-20 flex justify-between items-center bg-white/[0.02] p-8 rounded-[3rem] border border-white/5">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="flex items-center gap-4 text-gray-500 hover:text-white px-10 py-4 rounded-2xl transition-all disabled:opacity-10 group"
              >
                <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                <span className="font-black uppercase tracking-widest text-sm text-inherit">Prior Question</span>
              </button>
              
              <div className="text-gray-700 font-bold text-sm tracking-[0.3em] uppercase hidden md:block">
                Evaluation {currentIndex + 1} / {questions.length}
              </div>

              <button
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="flex items-center gap-4 bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-2xl transition-all disabled:opacity-10 group border border-white/5"
              >
                <span className="font-black uppercase tracking-widest text-sm">Next Question</span>
                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation Modal */}
      {showMobileNav && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col p-8">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black">Question Matrix</h2>
            <button onClick={() => setShowMobileNav(false)} className="p-2 bg-white/5 rounded-full">
              <X size={24} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {questions.map((q, idx) => (
              <button
                key={q._id}
                onClick={() => { setCurrentIndex(idx); setShowMobileNav(false); }}
                className={`aspect-square rounded-2xl font-black text-lg flex items-center justify-center transition-all ${
                  currentIndex === idx 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-500/20' 
                    : answers[q._id] 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-white/5 text-gray-500 border border-white/5'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-auto space-y-4">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-500 py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all"
            >
              <Send size={24} />
              <span>Submit Assessment</span>
            </button>
             <button 
              onClick={() => setShowMobileNav(false)}
              className="w-full bg-white/5 py-4 rounded-2xl font-bold text-gray-500"
            >
              Back to Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
