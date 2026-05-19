'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Mic, PenTool } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function Page() {
  const { user, signInWithGoogle } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-12">
      <div className="max-w-3xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
            Realistic IELTS <br className="hidden sm:inline" />
            Computer-Based Testing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience strict examiner-style evaluation. Analyze your weaknesses with explainable AI feedback for Writing Task 2 and Speaking Part 2.
          </p>
        </div>

        {!user ? (
          <div className="flex flex-col items-center gap-4 pt-4">
            <button className="h-12 px-8 text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition" onClick={signInWithGoogle}>
              Sign In to Start Practicing
            </button>
            <p className="text-sm text-gray-500 italic">
              Free access using your Google account.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/writing">
              <button className="flex items-center h-14 px-8 text-base bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 shadow-sm gap-2">
                <PenTool className="w-5 h-5" />
                Start Writing Task 2
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </Link>
            <Link href="/speaking">
              <button className="flex items-center h-14 px-8 text-base bg-white border border-gray-300 text-gray-900 rounded-md font-medium hover:bg-gray-50 shadow-sm gap-2">
                <Mic className="w-5 h-5" />
                Start Speaking Part 2
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </Link>
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-6 pt-16 text-left border-t border-gray-200 mt-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium text-gray-900">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Strict Evaluation
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              We prioritize realism over motivation. Our system provides conservative, evidence-based scoring aligned with IELTS band descriptors.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium text-gray-900">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Explainable AI
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              No black-box scores. Understand exactly why you received your band score with detailed, measurable weakness analysis.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium text-gray-900">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Authentic CBT Interface
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Simulate the layout and constraints of the official computer-delivered IELTS environment for both Writing and Speaking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
