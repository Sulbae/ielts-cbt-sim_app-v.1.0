'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { doc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Clock, AlertCircle } from 'lucide-react';

const TOPICS: Record<string, string> = {
  't2-education-01': 'Some people believe that unpaid community service should be a compulsory part of high school programs (for example working for a charity, improving the neighborhood or teaching sports to younger children). To what extent do you agree or disagree?',
  't2-technology-01': 'Nowadays, many people use social media to keep in touch with others and be aware of news. Do the advantages of this outweigh the disadvantages?',
};

export default function WritingSimulator() {
  const { id } = useParams() as { id: string };
  const promptText = TOPICS[id];
  const { user, loading } = useAuth();
  const router = useRouter();

  const [content, setContent] = useState('');
  const [timeLeft, setTimeLeft] = useState(40 * 60); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      alert('Please sign in to continue.');
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const contentRef = useRef(content);
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const wordCount = content.trim().split(/\\s+/).filter(w => w.length > 0).length;

  const handleSubmit = async (autoSubmit = false) => {
    if (!user) return;
    if (!autoSubmit && wordCount < 50) {
      alert('Essay too short. Please write more before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('Submitting and evaluating your essay (this might take a few moments)...');

    try {
      const newDocRef = doc(collection(db, 'essays'));
      const finalContent = contentRef.current;
      
      const essayData = {
        userId: user.uid,
        promptId: id,
        content: finalContent,
        status: 'submitted',
        bandScore: 0,
        scores: {},
        metrics: { wordCount },
        feedback: '',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(newDocRef, essayData);

      const response = await fetch('/api/evaluate/writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ 
          essayId: newDocRef.id,
          content: finalContent,
          prompt: promptText
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Evaluation failed.');
      }

      const evaluation = data.evaluation;
      const combinedFeedback = JSON.stringify({
        markdown: evaluation.feedback,
        corrections: evaluation.sentenceCorrections
      });

      await updateDoc(newDocRef, {
        status: 'graded',
        bandScore: evaluation.bandScore,
        scores: evaluation.scores,
        feedback: combinedFeedback,
        updatedAt: serverTimestamp()
      });

      router.push(`/writing/result/${newDocRef.id}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to submit essay. Please try again.');
      setIsSubmitting(false);
      setSubmitMessage('');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !user || !promptText) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#E4E3E0] p-4 font-sans relative">
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm">
           <div className="text-xl font-medium text-gray-900 bg-white p-8 rounded-lg shadow-xl border text-center max-w-sm">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              {submitMessage}
           </div>
        </div>
      )}

      <div className="flex justify-between items-center bg-white border border-gray-200 shadow-sm p-3 mb-4 rounded-md">
        <div className="font-semibold px-4 text-gray-900">IELTS CBT System</div>
        <div className={`flex items-center gap-2 font-mono text-xl px-6 rounded py-1 ${timeLeft < 300 ? 'text-red-600 bg-red-50' : 'text-gray-900'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
        <div className="px-4">
            <button onClick={() => handleSubmit(false)} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium text-sm transition">
              Submit Test
            </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[500px]">
        <div className="h-full bg-white overflow-y-auto rounded-md shadow-sm">
          <div className="p-8">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 pb-2 border-b">Writing Task 2</h2>
            <div className="prose prose-stone max-w-none">
              <p className="text-base text-gray-900 mb-4">
                You should spend about 40 minutes on this task.
              </p>
              <p className="text-base text-gray-900 mb-6">
                Write about the following topic:
              </p>
              <div className="bg-slate-50 p-6 rounded-md border text-lg font-serif italic text-gray-800 leading-relaxed shadow-inner">
                {promptText}
              </div>
              <p className="text-base text-gray-900 mt-8">
                Give reasons for your answer and include any relevant examples from your own knowledge or experience.
              </p>
              <p className="text-base font-semibold text-gray-900 mt-4">
                Write at least 250 words.
              </p>
            </div>
          </div>
        </div>

        <div className="h-full flex flex-col bg-white rounded-md shadow-sm">
          <textarea 
            className="flex-1 border-0 focus:ring-0 outline-none p-8 text-base leading-relaxed resize-none rounded-t-md font-sans text-gray-900"
            placeholder="Start typing your essay here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
          <div className="bg-gray-50 border-t border-gray-200 p-3 px-6 flex justify-between items-center text-sm font-mono text-gray-500">
            <div className="flex items-center gap-2">
              Word count: <span className={wordCount < 250 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>{wordCount}</span>
            </div>
            {wordCount < 250 && (
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle className="w-3.5 h-3.5" /> Minimum 250 words required
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
