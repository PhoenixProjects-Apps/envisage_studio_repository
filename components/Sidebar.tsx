import React, { useState, useEffect, useRef } from 'react';
import { ToolType, User } from '../types';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Wand2, 
  Video, 
  Type, 
  Layers,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Box
} from 'lucide-react';

interface SidebarProps {
  currentTool: ToolType;
  setTool: (t: ToolType) => void;
  user?: User | null;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentTool, setTool, user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize state based on screen size
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, []);

  // Auto-dock logic: Collapse after 3 seconds of inactivity (mouse leave)
  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    // Only auto-dock if currently expanded
    if (!isCollapsed) {
      timerRef.current = setTimeout(() => {
        setIsCollapsed(true);
      }, 4000); // 4 seconds delay before auto-docking
    }
  };

  // Toggle button handler
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (!newState) {
      // If manually opening, clear any pending auto-close timers immediately
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const navItems = [
    { type: ToolType.DASHBOARD, label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { type: ToolType.COPY_WRITER, label: "Copywriter", icon: <Type size={20} /> },
    { type: ToolType.IMAGE_GEN, label: "Image Gen", icon: <ImageIcon size={20} /> },
    { type: ToolType.IMAGE_EDIT, label: "Image Edit", icon: <Wand2 size={20} /> },
    { type: ToolType.VIDEO_GEN, label: "Video Gen", icon: <Video size={20} /> },
    { type: ToolType.THREE_D_GEN, label: "3D Animated", icon: <Box size={20} /> },
    { type: ToolType.LAYOUT_EDITOR, label: "Layout Editor", icon: <Layers size={20} /> },
  ];

  return (
    <div 
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${isCollapsed ? 'w-20' : 'w-64'} bg-zinc-900 border-r border-zinc-800 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out relative z-50 shadow-xl`}
    >
      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full p-1 hover:text-white hover:bg-zinc-700 transition-colors shadow-md z-50"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`p-6 ${isCollapsed ? 'items-center px-0' : ''} flex flex-col`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'}`}>
           <img 
            src="https://placehold.co/40x40/2dd4bf/ffffff?text=ES" 
            alt="Envisage Studio" 
            className="w-8 h-8 rounded-lg shrink-0"
           />
           {!isCollapsed && (
             <h1 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden">
              Envisage
             </h1>
           )}
        </div>
        {!isCollapsed && <p className="text-xs text-zinc-500 mt-1 pl-10 whitespace-nowrap overflow-hidden transition-opacity duration-300">Branding Assistant</p>}
      </div>
      
      <nav className="flex-1 px-3 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.type}
            onClick={() => setTool(item.type)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group ${
              currentTool === item.type
                ? "bg-teal-600/10 text-teal-400"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title={isCollapsed ? item.label : undefined}
          >
            <div className="shrink-0">{item.icon}</div>
            {!isCollapsed && (
              <span className="whitespace-nowrap overflow-hidden transition-opacity duration-300">
                {item.label}
              </span>
            )}
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                    {item.label}
                </div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800 mt-auto">
         {/* Status Indicators */}
         {!isCollapsed ? (
            <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500 mb-4 whitespace-nowrap overflow-hidden">
              <p className="font-semibold text-zinc-400 mb-1">System Status</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Gemini 2.5 Active
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Veo 3.1 Active
              </div>
            </div>
         ) : (
             <div className="flex flex-col items-center gap-2 mb-4">
                 <span className="w-2 h-2 rounded-full bg-green-500" title="Gemini Active"></span>
                 <span className="w-2 h-2 rounded-full bg-blue-500" title="Veo Active"></span>
             </div>
         )}

        {/* User Profile */}
        {user && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between pt-2'}`}>
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full bg-zinc-700 shrink-0" />
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-zinc-200 truncate w-24">{user.name}</p>
                            <p className="text-[10px] text-zinc-500 truncate w-24">Pro Plan</p>
                        </div>
                    )}
                </div>
                <button 
                    onClick={onLogout}
                    className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    title="Log Out"
                >
                    <LogOut size={16} />
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;