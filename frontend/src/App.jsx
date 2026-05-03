import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import LogAnalyzer from './pages/LogAnalyzer';

function App() {
  const [activeTab, setActiveTab] = useState('analyzer');

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden text-gray-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'analyzer' && <LogAnalyzer />}
        {activeTab === 'dashboard' && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Dashboard (Coming Soon)</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Settings (Coming Soon)</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
