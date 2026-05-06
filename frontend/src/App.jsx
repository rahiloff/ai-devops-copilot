import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LogAnalyzer from './pages/LogAnalyzer';
import CostAnalyzer from './pages/CostAnalyzer';
import ServerMonitor from './pages/ServerMonitor';
import Dashboard from './pages/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    if (activeTab === 'analyzer') return 'Log Analyzer';
    if (activeTab === 'cost-analyzer') return 'Cost Analyzer';
    if (activeTab === 'server-monitor') return 'Server Monitor';
    if (activeTab === 'dashboard') return 'Dashboard';
    if (activeTab === 'settings') return 'Settings';
    return '';
  };

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden text-app-textMain flex-col md:flex-row font-sans">
      {/* Sidebar - Hidden on mobile, shown on md+ */}
      <div className="hidden md:block w-[260px] shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header Bar */}
        <header className="h-[56px] border-b border-app-border bg-app-bg/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center">
            <h2 className="text-[16px] font-bold tracking-tight text-white">{getPageTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            {/* API Status */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-app-accent animate-pulse-fast shadow-glow-accent"></span>
              <span className="text-app-textMuted font-medium text-[13px]">API Connected</span>
            </div>
            
            <div className="w-[1px] h-4 bg-app-border mx-2 hidden sm:block"></div>
            
            {/* Clock */}
            <div className="text-app-accent font-mono text-[13px] hidden sm:block font-medium">
              {time.toLocaleTimeString([], { hour12: false })}
            </div>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto relative">
          {activeTab === 'analyzer' && <LogAnalyzer />}
          {activeTab === 'cost-analyzer' && <CostAnalyzer />}
          {activeTab === 'server-monitor' && <ServerMonitor />}
          {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === 'settings' && (
            <div className="flex items-center justify-center h-full text-app-textMuted animate-fade-in">
              <p>Settings (Coming Soon)</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden border-t border-app-border bg-app-sidebar flex items-center justify-around p-3 shrink-0 z-20">
        <button onClick={() => setActiveTab('analyzer')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'analyzer' ? 'text-app-accent' : 'text-app-textMuted'}`}>
          <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <span className="text-[10px]">Analyzer</span>
        </button>
        <button onClick={() => setActiveTab('cost-analyzer')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'cost-analyzer' ? 'text-app-accent' : 'text-app-textMuted'}`}>
          <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-[10px]">Costs</span>
        </button>
        <button onClick={() => setActiveTab('server-monitor')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'server-monitor' ? 'text-app-accent' : 'text-app-textMuted'}`}>
          <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
          <span className="text-[10px]">Monitor</span>
        </button>
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'dashboard' ? 'text-app-accent' : 'text-app-textMuted'}`}>
          <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          <span className="text-[10px]">Dashboard</span>
        </button>
      </div>
    </div>
  );
}

export default App;
