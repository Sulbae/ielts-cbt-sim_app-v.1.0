'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { doc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Mic, Square, Loader2 } from 'lucide-react';

const CUE_CARDS: Record<string, any> = {
  's2-person-01': {
    category: 'Person',
    prompt: 'Describe a person you know who is very helpful.',
    bulletPoints: [
      'who this person is',
      'how you know them',
      'how they help others',
      'and explain why you think this person is so helpful.'
    ]
  },
  's2-event-01': {
    category: 'Event',
    prompt: 'Describe a memorable event that you attended.',
    bulletPoints: [
      'what the event was',
      'when and where it happened',
      'who you went with',
      'and explain why it was memorable to you.'
    ]
  }
};

type Step = 'initial' | 'prep' | 'speak' | 'submitting';

export default function SpeakingSimulator() {
  const { id } = useParams() as { id: string };
  const cardData = CUE_CARDS[id];
  const { user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('initial');
  const [timeLeft, setTimeLeft] = useState(60); 
  const [isRecording, setIsRecording] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      alert('Please sign in to continue.');
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (step === 'prep') {
      setTimeLeft(60);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            startRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (step === 'speak') {
      setTimeLeft(120); 
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const startPrep = () => setStep('prep');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
         if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
         stream.getTracks().forEach(track => track.stop());
         const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
         submitAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStep('speak');
    } catch (err) {
      console.error(err);
      alert('Microphone access denied or error starting recording.');
      setStep('initial');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStep('submitting');
    }
  };

  const submitAudio = async (blob: Blob) => {
    if (!user) return;
    setStep('submitting');
    setSubmitMessage('Processing audio and grading your response...');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        
        const newDocRef = doc(collection(db, 'speakingAttempts'));
        await setDoc(newDocRef, {
          userId: user.uid,
          cueCardId: id,
          audioUrl: '', 
          status: 'pending',
          bandScore: 0,
          scores: {},
          metrics: { duration: 120 - timeLeft },
          feedback: '',
          transcript: '',
          submittedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const response = await fetch('/api/evaluate/speaking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({ 
            attemptId: newDocRef.id,
            audioData: base64data,
            mimeType: blob.type,
            prompt: cardData.prompt,
            bulletPoints: cardData.bulletPoints
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Evaluation failed.');

        const evaluation = data.evaluation;
        const combinedFeedback = JSON.stringify({
          markdown: evaluation.feedback,
          transcript: evaluation.transcript
        });

        await updateDoc(newDocRef, {
          status: 'graded',
          bandScore: evaluation.bandScore,
          scores: evaluation.scores,
          feedback: combinedFeedback,
          transcript: evaluation.transcript,
          updatedAt: serverTimestamp()
        });

        router.push(`/speaking/result/${newDocRef.id}`);
      };

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to submit audio.');
      setStep('initial');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !user || !cardData) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1A1C23] p-4 text-white relative">
      <div className="flex-1 flex flex-col items-center justify-center container mx-auto max-w-2xl px-4 py-8">
        
        <div className="w-full text-center mb-8">
           {step === 'initial' && <h2 className="text-2xl text-gray-400 font-mono">Ready to practice</h2>}
           {step === 'prep' && <h2 className="text-3xl text-orange-400 font-mono font-bold animate-pulse">Preparation Time</h2>}
           {step === 'speak' && <h2 className="text-3xl text-red-500 font-mono font-bold animate-pulse flex items-center justify-center gap-2">
             <div className="w-4 h-4 rounded-full bg-red-500" />
             Recording
           </h2>}
           {step === 'submitting' && <h2 className="text-2xl text-blue-400 font-mono">Uploading Audio...</h2>}
        </div>

        {(step === 'prep' || step === 'speak') && (
           <div className="mb-12 font-mono text-7xl font-bold tracking-tighter">
             {formatTime(timeLeft)}
           </div>
        )}

        <div className="w-full bg-white text-black p-8 rounded-xl shadow-2xl">
           <div className="border border-gray-200 rounded-lg p-6 bg-[#fcfcfc]">
             <h3 className="text-xl font-bold mb-4 font-serif text-gray-900">{cardData.prompt}</h3>
             <p className="text-sm text-gray-500 mb-3 font-semibold">You should say:</p>
             <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800 mb-4">
                {cardData.bulletPoints.map((bp: string, i: number) => (
                  <li key={i}>{bp}</li>
                ))}
             </ul>
           </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4">
          {step === 'initial' && (
            <button onClick={startPrep} className="bg-white text-black h-16 px-8 rounded-full text-lg font-bold hover:bg-gray-100 transition">
              Begin Preparation (1 min)
            </button>
          )}
          {step === 'prep' && (
            <button onClick={startRecording} className="bg-red-600 text-white h-16 px-8 rounded-full text-lg font-bold gap-2 flex items-center hover:bg-red-700 transition">
              <Mic className="w-5 h-5 mr-2" />
              Skip Prep & Start Recording
            </button>
          )}
          {step === 'speak' && (
            <button onClick={stopRecording} className="bg-gray-200 text-black h-16 px-8 rounded-full text-lg font-bold gap-2 flex items-center hover:bg-gray-300 transition">
              <Square className="w-5 h-5 mr-2 text-black" />
              Finish Recording
            </button>
          )}
          {step === 'submitting' && (
            <button disabled className="bg-transparent border border-gray-500 text-gray-300 h-16 px-8 rounded-full text-lg gap-2 flex items-center cursor-not-allowed">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
