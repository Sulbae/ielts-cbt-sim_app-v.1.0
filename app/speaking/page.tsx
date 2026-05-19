import Link from 'next/link';
import { Mic, Clock, Target } from 'lucide-react';

const CUE_CARDS = [
  {
    id: 's2-person-01',
    category: 'Person',
    prompt: 'Describe a person you know who is very helpful.',
    bulletPoints: [
      'who this person is',
      'how you know them',
      'how they help others',
      'and explain why you think this person is so helpful.'
    ]
  },
  {
    id: 's2-event-01',
    category: 'Event',
    prompt: 'Describe a memorable event that you attended.',
    bulletPoints: [
      'what the event was',
      'when and where it happened',
      'who you went with',
      'and explain why it was memorable to you.'
    ]
  }
];

export default function SpeakingDashboard() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Speaking Part 2</h1>
          <p className="text-gray-500 mt-2">Select a cue card to start your 1-minute prep and 2-minute recording.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CUE_CARDS.map((card) => (
          <div key={card.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-all">
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-sm font-medium text-blue-600">
                <Target className="w-4 h-4" />
                {card.category}
              </div>
              <h3 className="text-lg font-bold mb-4 leading-snug text-gray-900">
                {card.prompt}
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 mb-6 flex-1">
                {card.bulletPoints.map((bp, i) => (
                  <li key={i}>You should say: {bp}</li>
                ))}
              </ul>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                 <div className="flex items-center gap-1.5">
                   <Clock className="w-4 h-4" />
                   1m Prep + 2m Speak
                 </div>
              </div>
              <Link href={`/speaking/${card.id}`} className="w-full mt-auto">
                <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-medium shadow-sm hover:bg-blue-700">Start Practice</button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
