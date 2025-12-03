import React, { useState } from 'react';
import { generateShortStory } from '../services/storyService';

interface StoryBookProps {
  onGenerate: () => void;
}

export const StoryBook: React.FC<StoryBookProps> = ({ onGenerate }) => {
  const [story, setStory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    onGenerate(); // Notify parent interaction
    const newStory = await generateShortStory(topic || "a magical forest");
    setStory(newStory);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10 flex flex-col h-[400px]">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">📖</span> Story Book
      </h2>

      {!story ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
          <p className="text-slate-300">Don't have a book handy? I can write one for you.</p>
          <input 
            type="text" 
            placeholder="Topic (e.g., 'Space cats')" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Writing...' : 'Generate Story'}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
           <div className="flex-1 overflow-y-auto scrollbar-hide pr-2 text-lg leading-relaxed text-slate-100 font-serif">
             {story.split('\n').map((para, i) => (
               <p key={i} className="mb-4">{para}</p>
             ))}
           </div>
           <button 
             onClick={() => setStory(null)}
             className="mt-4 text-sm text-blue-300 hover:text-blue-200 self-center"
           >
             Write another one
           </button>
        </div>
      )}
    </div>
  );
};