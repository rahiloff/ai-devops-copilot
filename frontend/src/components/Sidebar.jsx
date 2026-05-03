import React from 'react';
import { Activity, LayoutDashboard, Settings, Github, Terminal } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'analyzer', label: 'Log Analyzer', icon: Activity },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#1e293b] border-r border-slate-700 flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <div className="bg-green-500/10 p-2 rounded-lg">
          <Terminal className="w-6 h-6 text-green-500" />
        </div>
        <h1 className="font-bold text-lg text-white">DevOps Copilot</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${
                isActive 
                  ? 'bg-green-500/10 text-green-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <a 
          href="https://github.com/rahiloff/ai-devops-copilot" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors"
        >
          <Github className="w-5 h-5" />
          <span className="font-medium text-sm">GitHub</span>
        </a>
      </div>
    </div>
  );
}
