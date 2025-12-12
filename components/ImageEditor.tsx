import React, { useState, useRef } from 'react';
import { editMarketingImage } from '../services/geminiService';
import { GeneratedAsset } from '../types';
import { Wand2, Upload, Download, ArrowRight } from 'lucide-react';

interface ImageEditorProps {
  onAssetCreated: (asset: GeneratedAsset) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ onAssetCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === 'string') {
          setImage(ev.target.result);
          setResultImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    try {
      const editedUrl = await editMarketingImage(image, prompt);
      setResultImage(editedUrl);
      
      const newAsset: GeneratedAsset = {
        id: Date.now().toString(),
        type: 'image',
        content: editedUrl,
        createdAt: Date.now(),
        metadata: { prompt: `Edit: ${prompt}` }
      };
      onAssetCreated(newAsset);
    } catch (e) {
      console.error(e);
      alert('Failed to edit image. Ensure it is a valid format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 h-full">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
        <Wand2 className="text-indigo-400" /> Magic Editor
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Source */}
        <div className="space-y-4">
             <div 
                className={`bg-zinc-900 border-2 border-dashed ${image ? 'border-zinc-700' : 'border-zinc-600 hover:border-zinc-400'} rounded-xl h-64 flex flex-col items-center justify-center relative cursor-pointer transition-colors`}
                onClick={() => !image && fileInputRef.current?.click()}
             >
                {image ? (
                    <>
                        <img src={image} alt="Source" className="w-full h-full object-contain p-2" />
                        <button 
                            onClick={(e) => { e.stopPropagation(); setImage(null); setResultImage(null); }}
                            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
                        >
                            Remove
                        </button>
                    </>
                ) : (
                    <div className="text-center p-6">
                        <Upload className="mx-auto text-zinc-500 mb-2" size={32} />
                        <p className="text-zinc-400 text-sm">Click to upload base image</p>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp"
                />
             </div>
        </div>

        {/* Prompt & Action */}
        <div className="flex flex-col justify-center space-y-4">
             <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Instructions</label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none mb-4"
                    placeholder="e.g. Add a retro filter, remove the background, or add a logo to the top right..."
                />
                <button
                    onClick={handleEdit}
                    disabled={loading || !image || !prompt}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                        loading 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                >
                     {loading ? <span className="animate-pulse">Processing...</span> : <>Apply Edits <ArrowRight size={16} /></>}
                </button>
             </div>
        </div>
      </div>

      {/* Result */}
      {resultImage && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-8 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-zinc-400 text-sm font-semibold mb-3">Edited Result</h3>
            <div className="flex justify-center bg-zinc-950 rounded-lg p-4 relative">
                <img src={resultImage} alt="Edited" className="max-h-[500px] object-contain rounded shadow-lg" />
                 <a 
                    href={resultImage} 
                    download={`omni-edited-${Date.now()}.png`}
                    className="absolute bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg transition-colors"
                >
                    <Download size={20} />
                </a>
            </div>
        </div>
      )}
    </div>
  );
};

export default ImageEditor;