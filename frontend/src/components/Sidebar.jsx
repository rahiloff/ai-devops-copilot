import React from 'react';
import { Activity, LayoutDashboard, Settings, Github, Terminal, DollarSign, Server } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'analyzer', label: 'Log Analyzer', icon: Activity },
    { id: 'cost-analyzer', label: 'Cost Analyzer', icon: DollarSign },
    { id: 'server-monitor', label: 'Server Monitor', icon: Server },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full bg-app-sidebar border-r border-app-border flex flex-col h-full z-20">
      
      {/* Brand */}
      <div className="h-[56px] px-5 flex items-center gap-3 border-b border-app-border shrink-0">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(0,255,136,0.1)] border border-app-accent/30 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
          <Terminal className="w-3.5 h-3.5 text-app-accent" />
        </div>
        <h1 className="font-bold text-[14px] text-white tracking-tight">AI DevOps Copilot</h1>
        <span className="ml-auto bg-[rgba(255,255,255,0.05)] text-[10px] text-app-textMuted px-2 py-0.5 rounded-full border border-app-border font-mono font-medium">v1.0</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-[16px] py-[10px] rounded-[8px] transition-all duration-150 relative ${
                isActive 
                  ? 'bg-[rgba(0,255,136,0.08)] text-app-accent border-l-[3px] border-l-app-accent pl-[13px]' 
                  : 'text-app-textMuted hover:bg-[rgba(255,255,255,0.04)] hover:text-white border-l-[3px] border-l-transparent pl-[13px]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="font-medium text-[14px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 mb-2">
        <a 
          href="https://github.com/rahiloff/ai-devops-copilot" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-app-accent text-app-accent hover:bg-app-accent hover:text-black transition-colors duration-200 group"
        >
          <Github className="w-4 h-4" />
          <span className="font-semibold text-[13px]">GitHub Repo</span>
        </a>
        <div className="text-center mt-3">
          <span className="text-[11px] text-app-textMuted font-medium">Built by Rahil T</span>
        </div>
      </div>
    </div>
  );
}
