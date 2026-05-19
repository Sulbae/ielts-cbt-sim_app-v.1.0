import Link from 'next/link';
import { PenTool, Clock, Target } from 'lucide-react';

const TOPICS = [
  {
    id: 't2-education-01',
    category: 'Education',
    prompt: 'Some people believe that unpaid community service should be a compulsory part of high school programs (for example working for a charity, improving the neighborhood or teaching sports to younger children). To what extent do you agree or disagree?',
  },
  {
    id: 't2-technology-01',
    category: 'Technology',
    prompt: 'Nowadays, many people use social media to keep in touch with others and be aware of news. Do the advantages of this outweigh the disadvantages?',
  }
];

export default function WritingDashboard() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Writing Task 2</h1>
          <p className="text-gray-500 mt-2">Select a topic to start your 40-minute simulation.</p>
        </div>
      </div>

      <div className="space-y-6">
        {TOPICS.map((topic) => (
          <div key={topic.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-blue-600">
                    <Target className="w-4 h-4" />
                    {topic.category}
                  </div>
                  <h3 className="text-lg font-serif mb-4 leading-relaxed tracking-wide text-gray-900">
                    "{topic.prompt}"
                  </h3>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500 mt-4">
                   <div className="flex items-center gap-1.5">
                     <Clock className="w-4 h-4" />
                     40 Minutes
                   </div>
                   <div className="flex items-center gap-1.5">
                     <PenTool className="w-4 h-4" />
                     Task 2 Essay
                   </div>
                </div>
              </div>
              <div className="bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 p-6 flex items-center justify-center md:min-w-[200px]">
                <Link href={`/writing/${topic.id}`} className="w-full">
                  <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-md font-medium shadow-sm hover:bg-blue-700">Start Practice</button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
