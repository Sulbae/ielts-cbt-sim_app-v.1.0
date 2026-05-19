'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, Flag, Info } from 'lucide-react';
import Link from 'next/link';

export default function WritingResult() {
  const { id } = useParams() as { id: string };
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [essay, setEssay] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }

    if (user && id) {
      const fetchEssay = async () => {
        try {
          const docRef = doc(db, 'essays', id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.userId !== user.uid) {
              setError('Unauthorized access.');
            } else {
              setEssay(data);
            }
          } else {
            setError('Essay not found.');
          }
        } catch (err: any) {
          setError(err.message);
        }
      };
      
      fetchEssay();
    }
  }, [user, loading, id, router]);

  if (loading || (!essay && !error)) return <div className="p-12 text-center text-gray-500">Loading evaluation...</div>;
  if (error) return <div className="p-12 text-center text-red-500">{error}</div>;

  let feedbackData = { markdown: '', corrections: [] };
  try {
    if (essay.feedback) {
      feedbackData = JSON.parse(essay.feedback);
    }
  } catch (e) {
    console.error("Failed to parse feedback JSON", e);
  }

  const { taskResponse, coherence, lexical, grammar } = essay.scores || {};

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/writing" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Tasks
      </Link>
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Evaluation Report</h1>
          <p className="text-gray-500 mt-2">IELTS Writing Task 2</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-1">Overall Band</div>
          <div className="text-5xl font-mono font-bold text-blue-600">{essay.bandScore?.toFixed(1)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Task Response', score: taskResponse },
          { label: 'Coherence & Cohesion', score: coherence },
          { label: 'Lexical Resource', score: lexical },
          { label: 'Grammar', score: grammar }
        ].map((s) => (
          <div key={s.label} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 truncate">{s.label}</div>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-mono font-semibold text-gray-900">{s.score?.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
               <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: (s.score / 9) * 100 + '%' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Examiner Feedback */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-8 border border-gray-200 rounded-xl shadow-sm bg-white">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Examiner Feedback
            </h2>
            <div className="prose prose-stone max-w-none text-gray-800 font-sans">
              <ReactMarkdown>{feedbackData.markdown}</ReactMarkdown>
            </div>
          </div>
          
          {feedbackData.corrections?.length > 0 && (
            <div className="p-8 border border-gray-200 rounded-xl shadow-sm bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Key Corrections
              </h2>
              <div className="space-y-6">
                {feedbackData.corrections.map((corr: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-md bg-red-50/50 border border-red-100">
                    <div className="text-sm text-red-500 line-through mb-2">{corr.original}</div>
                    <div className="text-sm text-green-700 font-medium mb-3">{corr.corrected}</div>
                    <div className="text-sm text-gray-600 bg-white p-3 rounded-md border border-gray-200 shadow-sm leading-relaxed">
                      <strong className="text-gray-900">Explanation:</strong> {corr.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Original Essay */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Original Submission</h2>
          <div className="bg-orange-50/50 border border-orange-100 shadow-inner rounded-xl p-6 h-auto sticky top-6">
            <div className="text-xs text-gray-500 mb-4 font-mono">
              Word Count: {essay.metrics?.wordCount}
            </div>
            <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
              {essay.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
