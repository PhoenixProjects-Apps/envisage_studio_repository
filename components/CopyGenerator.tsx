import React, { useState } from 'react';
import { generateMarketingCopy } from '../services/geminiService';
import { GeneratedAsset } from '../types';
import { Sparkles, Copy, Check } from 'lucide-react';

interface CopyGeneratorProps {
  onAssetCreated: (asset: GeneratedAsset) => void;
}

const CopyGenerator: React.FC<CopyGeneratorProps> = ({ onAssetCreated }) => {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('Instagram Ad');
  const [voice, setVoice] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const text = await generateMarketingCopy(topic, type, voice);
      setResult(text);
      
      const newAsset: GeneratedAsset = {
        id: Date.now().toString(),
        type: 'text',
        content: text,
        createdAt: Date.now(),
        metadata: { prompt: topic }
      };
      onAssetCreated(newAsset);

    } catch (e) {
      console.error(e);
      alert('Failed to generate copy');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h2 className="text-3xl font-bold text-white mb-6">AI Copywriter</h2>
      
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Topic / Product</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Eco-friendly coffee mugs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Content Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option>Instagram Ad</option>
              <option>LinkedIn Post</option>
              <option>Blog Post Outline</option>
              <option>Tagline</option>
              <option>Email Subject Line</option>
              <option>Product Description</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-400 mb-2">Brand Voice</label>
             <div className="flex gap-2">
                {['Professional', 'Witty', 'Urgent', 'Friendly'].map(v => (
                    <button
                        key={v}
                        onClick={() => setVoice(v)}
                        className={`px-4 py-2 rounded-full text-sm border ${
                            voice === v 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                        }`}
                    >
                        {v}
                    </button>
                ))}
             </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic}
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            loading 
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/20'
          }`}
        >
          {loading ? (
            <span className="animate-pulse">Generating Magic...</span>
          ) : (
            <>
              <Sparkles size={20} /> Generate Copy
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative group">
          <button 
            onClick={copyToClipboard}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded hover:bg-zinc-700 transition-colors"
          >
            {copied ? <Check size={18} className="text-green-500"/> : <Copy size={18} />}
          </button>
          <h3 className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-3">Result</h3>
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-zinc-200">{result}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopyGenerator;