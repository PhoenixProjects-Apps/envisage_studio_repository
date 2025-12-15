import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { ToolType, GeneratedAsset, User } from './types';
import LayoutEditor from './components/LayoutEditor';
import CopyGenerator from './components/CopyGenerator';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import VideoGenerator from './components/VideoGenerator';
import ThreeDGenerator from './components/ThreeDGenerator';
import LoginScreen from './components/LoginScreen';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.DASHBOARD);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [initializing, setInitializing] = useState(true);

  // Load User and Assets from LocalStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('envisage_user');
    const storedAssets = localStorage.getItem('envisage_assets');
    
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
    if (storedAssets) {
        setAssets(JSON.parse(storedAssets));
    }
    setInitializing(false);
  }, []);

  // Save Assets to LocalStorage whenever they change
  useEffect(() => {
    if (!initializing) {
        localStorage.setItem('envisage_assets', JSON.stringify(assets));
    }
  }, [assets, initializing]);

  const handleLogin = (newUser: User) => {
      setUser(newUser);
      localStorage.setItem('envisage_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('envisage_user');
      // Optional: Decide if you want to clear assets on logout or keep them on device
      // localStorage.removeItem('envisage_assets'); 
  };

  const handleAssetCreated = (asset: GeneratedAsset) => {
    setAssets((prev) => [asset, ...prev]);
  };

  const renderContent = () => {
    switch (currentTool) {
      case ToolType.LAYOUT_EDITOR:
        return <LayoutEditor assets={assets} onAssetCreated={handleAssetCreated} />;
      case ToolType.COPY_WRITER:
        return <CopyGenerator onAssetCreated={handleAssetCreated} />;
      case ToolType.IMAGE_GEN:
        return <ImageGenerator onAssetCreated={handleAssetCreated} />;
      case ToolType.IMAGE_EDIT:
        return <ImageEditor onAssetCreated={handleAssetCreated} />;
      case ToolType.VIDEO_GEN:
        return <VideoGenerator onAssetCreated={handleAssetCreated} />;
      case ToolType.THREE_D_GEN:
        return <ThreeDGenerator onAssetCreated={handleAssetCreated} />;
      case ToolType.DASHBOARD:
      default:
        return (
          <div className="p-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.name}</h1>
            <p className="text-zinc-400 text-lg mb-10">Your all-in-one AI creative studio for business marketing.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard 
                    title="Generate Images" 
                    desc="Create stunning visuals with Gemini 3 Pro."
                    onClick={() => setCurrentTool(ToolType.IMAGE_GEN)}
                    color="from-blue-500 to-indigo-600"
                />
                <DashboardCard 
                    title="Edit Images" 
                    desc="Modify existing assets with natural language using Nano Banana."
                    onClick={() => setCurrentTool(ToolType.IMAGE_EDIT)}
                    color="from-indigo-500 to-purple-600"
                />
                <DashboardCard 
                    title="Create Videos" 
                    desc="Produce marketing clips with Veo 3."
                    onClick={() => setCurrentTool(ToolType.VIDEO_GEN)}
                    color="from-pink-500 to-rose-600"
                />
                 <DashboardCard 
                    title="3D Animated" 
                    desc="Generate 3D motion graphics and product loops."
                    onClick={() => setCurrentTool(ToolType.THREE_D_GEN)}
                    color="from-orange-500 to-red-600"
                />
                <DashboardCard 
                    title="Write Copy" 
                    desc="Generate ads, blogs, and taglines instantly."
                    onClick={() => setCurrentTool(ToolType.COPY_WRITER)}
                    color="from-emerald-500 to-teal-600"
                />
                <DashboardCard 
                    title="Layout Editor" 
                    desc="Assemble your assets into final marketing materials."
                    onClick={() => setCurrentTool(ToolType.LAYOUT_EDITOR)}
                    color="from-orange-500 to-amber-600"
                />
            </div>

            <div className="mt-12">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Recent Assets</h3>
                    <button onClick={() => setCurrentTool(ToolType.LAYOUT_EDITOR)} className="text-indigo-400 text-sm hover:text-indigo-300">View All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {assets.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-zinc-900 rounded-lg border border-dashed border-zinc-800 text-zinc-500">
                            No assets generated yet. Start creating!
                        </div>
                    ) : (
                        assets.slice(0, 6).map(asset => (
                            <div key={asset.id} className="aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 relative group transition-all hover:scale-105 hover:border-zinc-600 shadow-lg">
                                {asset.type === 'image' && <img src={asset.content} className="w-full h-full object-cover" alt="Asset"/>}
                                {asset.type === 'video' && (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500">
                                        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 flex items-center justify-center mb-1">▶</div>
                                        <span className="text-[10px]">VIDEO</span>
                                    </div>
                                )}
                                {asset.type === 'text' && <div className="p-3 text-[10px] text-zinc-400 overflow-hidden h-full leading-relaxed bg-zinc-900">{asset.content}</div>}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="text-[10px] text-white truncate w-full">{asset.metadata?.prompt}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </div>
        );
    }
  };

  if (initializing) {
      return <div className="h-screen w-screen bg-black flex items-center justify-center text-zinc-500">Loading Studio...</div>;
  }

  if (!user) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans">
      <Sidebar 
        currentTool={currentTool} 
        setTool={setCurrentTool} 
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 h-full overflow-y-auto bg-black relative scroll-smooth">
        {renderContent()}
      </main>
    </div>
  );
};

const DashboardCard: React.FC<{title: string, desc: string, onClick: () => void, color: string}> = ({ title, desc, onClick, color }) => (
    <div 
        onClick={onClick}
        className="group relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-6 cursor-pointer hover:border-zinc-600 transition-all hover:translate-y-[-2px] hover:shadow-xl hover:shadow-indigo-500/10"
    >
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color}`} />
        <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-indigo-400 transition-colors">{title}</h3>
        <p className="text-zinc-400 text-sm">{desc}</p>
    </div>
);

export default App;