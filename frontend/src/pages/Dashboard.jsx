import React, { useState, useEffect } from 'react';
import { 
  Activity, DollarSign, Server, LayoutDashboard, 
  CheckCircle, Clock, Zap, RefreshCw, Terminal 
} from 'lucide-react';

const MiniSparkline = ({ currentVal }) => {
  const [points, setPoints] = useState(Array(10).fill(0));
  
  useEffect(() => {
    setPoints(prev => {
      // Don't update if currentVal is undefined or 0 on first render unless it's genuinely 0
      return [...prev.slice(1), currentVal || 0];
    });
  }, [currentVal]);

  const width = 400;
  const height = 60;
  const step = width / 9;

  let pathD = `M 0 ${height - (points[0] / 100) * height}`;
  for (let i = 0; i < points.length - 1; i++) {
    const x1 = i * step;
    const y1 = height - (points[i] / 100) * height;
    const x2 = (i + 1) * step;
    const y2 = height - (points[i+1] / 100) * height;
    
    const cp1x = x1 + step / 2;
    const cp1y = y1;
    const cp2x = x1 + step / 2;
    const cp2y = y2;
    
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  }

  const fillPathD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="w-full h-full relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full overflow-visible z-10" preserveAspectRatio="none">
        <defs>
          <linearGradient id="miniFillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillPathD} fill="url(#miniFillGrad)" />
        <path d={pathD} fill="none" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle 
          cx={width} 
          cy={height - (points[points.length - 1] / 100) * height} 
          r="4" 
          fill="#00ff88" 
          className="animate-pulse"
          style={{ filter: 'drop-shadow(0 0 4px #00ff88)' }}
        />
      </svg>
    </div>
  );
};

export default function Dashboard({ setActiveTab }) {
  const [nodeMetrics, setNodeMetrics] = useState(null);
  const [costSummary, setCostSummary] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Quick Log Analyzer state
  const [logText, setLogText] = useState('');
  const [logType, setLogType] = useState('syslog');
  const [isLogAnalyzing, setIsLogAnalyzing] = useState(false);
  const [logResult, setLogResult] = useState(null);

  // Fetch functions
  const fetchNodeMetrics = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/node-metrics');
      const data = await res.json();
      if (data.success) {
        setNodeMetrics(data);
        setLastRefreshed(new Date());
      }
    } catch (e) {
      console.error("Error fetching node metrics:", e);
    }
  };

  const fetchCostSummary = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/cost-summary');
      const data = await res.json();
      if (data.success) {
        setCostSummary(data);
      }
    } catch (e) {
      console.error("Error fetching cost summary:", e);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNodeMetrics();
    fetchCostSummary();
  }, []);

  // Auto refresh Node Metrics every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchNodeMetrics();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    Promise.all([fetchNodeMetrics(), fetchCostSummary()]).then(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  const handleQuickAnalyze = async () => {
    if (!logText.trim()) return;
    setIsLogAnalyzing(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/analyze-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_text: logText,
          log_type: logType,
          context: "Quick analyze from dashboard"
        })
      });
      const data = await res.json();
      if (data.success) {
        setLogResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLogAnalyzing(false);
    }
  };

  // Helpers
  const getHealthColor = (cpu) => {
    if (cpu > 80) return "text-red-500";
    if (cpu > 50) return "text-yellow-500";
    return "text-green-500";
  };

  const getHealthBg = (cpu) => {
    if (cpu > 80) return "bg-red-500/10 border-red-500/30";
    if (cpu > 50) return "bg-yellow-500/10 border-yellow-500/30";
    return "bg-green-500/10 border-green-500/30";
  };

  const getHealthStatus = (cpu) => {
    if (cpu > 80) return "CRITICAL";
    if (cpu > 50) return "WARNING";
    return "HEALTHY";
  };

  const formatUptime = (hours) => {
    if (hours === undefined || hours === null) return "0h";
    const days = Math.floor(hours / 24);
    const hrs = Math.floor(hours % 24);
    if (days > 0) return `${days}d ${hrs}h`;
    return `${hrs}h`;
  };

  const recentActivity = [
    { text: "Server Monitor Connected — Node Exporter active", time: "just now", color: "bg-green-500" },
    { text: `Cost Analysis Complete — ${costSummary ? `$${costSummary.total_cost.toFixed(2)}` : '...'} analyzed`, time: "2 min ago", color: "bg-blue-500" },
    { text: "Log Analyzer Ready — AI powered by Gemini", time: "15 min ago", color: "bg-purple-500" },
    { text: "AWS Account 1 Connected — ap-south-1", time: "1 hour ago", color: "bg-yellow-500" },
    { text: "AI DevOps Copilot Started — v1.0", time: "2 hours ago", color: "bg-[#00ff88]" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto p-6 md:p-10 space-y-8 pb-32 animate-slide-up">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-app-accent" />
            Mission Control
          </h2>
          <p className="text-[14px] text-app-textMuted mt-1">AI DevOps Copilot — System Overview</p>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-app-textMuted font-medium">
          <Clock className="w-4 h-4" />
          <span>Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
          <button 
            onClick={handleManualRefresh}
            className={`p-1.5 hover:bg-white/5 rounded-md transition-colors ${isRefreshing ? 'animate-spin text-app-accent' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 1 — Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Server Health */}
        <div 
          onClick={() => setActiveTab('server-monitor')}
          className="glass-card p-5 rounded-[12px] border border-app-border hover:border-app-accent/50 cursor-pointer transition-all hover:shadow-glow-accent group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-app-textMuted group-hover:text-white transition-colors">
              <Server className="w-4 h-4" />
              <span className="text-[13px] font-medium uppercase tracking-wider">Server Health</span>
            </div>
            {nodeMetrics && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border ${getHealthBg(nodeMetrics.cpu_usage_percent)} ${getHealthColor(nodeMetrics.cpu_usage_percent)}`}>
                {getHealthStatus(nodeMetrics.cpu_usage_percent)}
              </span>
            )}
          </div>
          <div className="flex items-end gap-2">
            <h3 className={`text-[28px] font-black tracking-tight ${nodeMetrics ? getHealthColor(nodeMetrics.cpu_usage_percent) : 'text-white'}`}>
              {nodeMetrics ? `${nodeMetrics.cpu_usage_percent.toFixed(1)}%` : '...'}
            </h3>
            <span className="text-app-textMuted text-[12px] mb-1.5">CPU</span>
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-app-textMuted">
            <span>Mem: {nodeMetrics ? `${nodeMetrics.memory_used_percent.toFixed(1)}%` : '...'}</span>
            <span className="group-hover:text-app-accent transition-colors">View →</span>
          </div>
        </div>

        {/* Card 2: Cloud Costs */}
        <div 
          onClick={() => setActiveTab('cost-analyzer')}
          className="glass-card p-5 rounded-[12px] border border-app-border hover:border-blue-500/50 cursor-pointer transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-app-textMuted group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="text-[13px] font-medium uppercase tracking-wider">Cloud Costs</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border bg-blue-500/10 border-blue-500/30 text-blue-400">
              THIS MONTH
            </span>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-[28px] font-black tracking-tight text-white">
              {costSummary ? `$${costSummary.total_cost.toFixed(2)}` : '...'}
            </h3>
            <span className="text-app-textMuted text-[12px] mb-1.5">{costSummary?.currency || 'USD'}</span>
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-app-textMuted">
            <span>Auto-synced</span>
            <span className="group-hover:text-blue-400 transition-colors">Analyze →</span>
          </div>
        </div>

        {/* Card 3: AI Analysis */}
        <div className="glass-card p-5 rounded-[12px] border border-app-border relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-app-textMuted">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-[13px] font-medium uppercase tracking-wider">AI Engines</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border bg-purple-500/10 border-purple-500/30 text-purple-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> ONLINE
            </span>
          </div>
          <h3 className="text-[20px] font-bold tracking-tight text-white mb-2 mt-1">
            3 Features Active
          </h3>
          <div className="flex gap-3 text-[12px] text-app-textMuted mt-4">
            <div className="flex items-center gap-1" title="Log Analyzer"><Activity className="w-3.5 h-3.5 text-app-accent" /></div>
            <div className="flex items-center gap-1" title="Cost Analyzer"><DollarSign className="w-3.5 h-3.5 text-app-accent" /></div>
            <div className="flex items-center gap-1" title="Server Monitor"><Server className="w-3.5 h-3.5 text-app-accent" /></div>
            <span className="ml-auto flex items-center gap-1 text-app-accent"><CheckCircle className="w-3.5 h-3.5" /> All Green</span>
          </div>
        </div>

        {/* Card 4: System Uptime */}
        <div className="glass-card p-5 rounded-[12px] border border-app-border relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-app-textMuted">
              <Activity className="w-4 h-4 text-app-accent" />
              <span className="text-[13px] font-medium uppercase tracking-wider">System Uptime</span>
            </div>
          </div>
          <h3 className={`text-[28px] font-black tracking-tight ${nodeMetrics && nodeMetrics.uptime_hours > 24 ? 'text-app-accent' : 'text-yellow-500'}`}>
            {nodeMetrics ? formatUptime(nodeMetrics.uptime_hours) : '...'}
          </h3>
          <div className="mt-2 text-[12px] text-app-textMuted flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-app-accent"></span> Node Exporter running
          </div>
        </div>
      </div>

      {/* Row 2 — Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Live Server Metrics */}
        <div className="glass-panel p-6 rounded-[12px] border border-app-border flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-app-accent" /> Live Server Metrics
            </h3>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-500 tracking-wider">LIVE 5s</span>
            </div>
          </div>

          <div className="mb-6 h-[70px] relative border-b border-app-border/30 pb-4">
            <MiniSparkline currentVal={nodeMetrics?.cpu_usage_percent || 0} />
            <span className="absolute top-0 right-0 text-[10px] font-bold text-[#00ff88] tracking-widest bg-black/50 px-2 py-1 rounded">
              CPU TREND
            </span>
          </div>
          
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-[#050810] rounded-lg p-4 border border-app-border/50">
              <p className="text-[11px] text-app-textMuted uppercase tracking-wider font-medium mb-1">CPU Usage</p>
              <p className={`text-[20px] font-bold ${nodeMetrics ? getHealthColor(nodeMetrics.cpu_usage_percent) : 'text-white'}`}>
                {nodeMetrics ? `${nodeMetrics.cpu_usage_percent.toFixed(1)}%` : '--'}
              </p>
            </div>
            <div className="bg-[#050810] rounded-lg p-4 border border-app-border/50">
              <p className="text-[11px] text-app-textMuted uppercase tracking-wider font-medium mb-1">Memory Usage</p>
              <p className="text-[20px] font-bold text-white">
                {nodeMetrics ? `${nodeMetrics.memory_used_percent.toFixed(1)}%` : '--'}
              </p>
            </div>
            <div className="bg-[#050810] rounded-lg p-4 border border-app-border/50">
              <p className="text-[11px] text-app-textMuted uppercase tracking-wider font-medium mb-1">Load Avg</p>
              <p className="text-[20px] font-bold text-white tracking-tight">
                {nodeMetrics ? nodeMetrics.load_avg_1m : '--'}
              </p>
              <p className="text-[10px] text-app-textMuted font-mono">1m / 5m / 15m</p>
            </div>
            <div className="bg-[#050810] rounded-lg p-4 border border-app-border/50">
              <p className="text-[11px] text-app-textMuted uppercase tracking-wider font-medium mb-1">Network Rate</p>
              <p className="text-[20px] font-bold text-blue-400">
                {nodeMetrics ? `${nodeMetrics.network_receive_mb.toFixed(2)}` : '--'}
              </p>
              <p className="text-[10px] text-app-textMuted">MB/s (In)</p>
            </div>
          </div>
          
          <button 
            onClick={() => setActiveTab('server-monitor')}
            className="mt-6 w-full py-2.5 rounded-lg border border-app-border text-[13px] font-medium text-app-textMuted hover:text-white hover:border-app-accent transition-colors"
          >
            View Full Monitor &rarr;
          </button>
        </div>

        {/* Right Column: Quick Log Analyzer */}
        <div className="glass-panel p-6 rounded-[12px] border border-app-border flex flex-col">
          <h3 className="text-[16px] font-bold text-white flex items-center gap-2 mb-4">
            <Terminal className="w-4 h-4 text-purple-400" /> Quick Log Analyzer
          </h3>
          
          <div className="space-y-3 mb-4 flex-1">
            <select 
              value={logType}
              onChange={e => setLogType(e.target.value)}
              className="w-full bg-[#050810] border border-app-border rounded text-[13px] text-white p-2 focus:border-purple-500 focus:outline-none"
            >
              <option value="syslog">syslog</option>
              <option value="nginx">nginx</option>
              <option value="docker">docker</option>
              <option value="kubernetes">kubernetes</option>
              <option value="apache">apache</option>
              <option value="custom">custom</option>
            </select>
            <textarea
              value={logText}
              onChange={e => setLogText(e.target.value)}
              placeholder="Paste a few lines of error logs here..."
              className="w-full h-[80px] bg-[#050810] border border-app-border rounded text-[13px] text-white p-3 focus:border-purple-500 focus:outline-none font-mono resize-none"
            ></textarea>
            <button
              onClick={handleQuickAnalyze}
              disabled={isLogAnalyzing || !logText.trim()}
              className="w-full bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 py-2 rounded text-[13px] font-bold transition-colors disabled:opacity-50"
            >
              {isLogAnalyzing ? "Analyzing..." : "Quick Analyze"}
            </button>
          </div>

          {logResult && (
            <div className="mt-auto bg-[#050810] p-4 rounded-lg border border-app-border animate-slide-up mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  logResult.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                  logResult.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  logResult.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-green-500/20 text-green-500'
                }`}>
                  {logResult.severity}
                </span>
              </div>
              <p className="text-[13px] text-white leading-relaxed">{logResult.summary}</p>
            </div>
          )}
          
          <button 
            onClick={() => setActiveTab('analyzer')}
            className={`w-full py-2.5 rounded-lg border border-app-border text-[13px] font-medium text-app-textMuted hover:text-white hover:border-purple-400 transition-colors mt-auto`}
          >
            View Full Analysis &rarr;
          </button>
        </div>
      </div>

      {/* Row 3 — Recent Activity Timeline */}
      <div className="glass-panel p-6 rounded-[12px] border border-app-border">
        <h3 className="text-[16px] font-bold text-white flex items-center gap-2 mb-6">
          <Activity className="w-4 h-4 text-app-textMuted" /> Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivity.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="relative mt-1">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-[0_0_8px_currentColor] opacity-80`}></div>
                {idx !== recentActivity.length - 1 && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[1px] h-8 bg-app-border"></div>
                )}
              </div>
              <div className="flex-1 flex justify-between items-center bg-[#050810]/50 px-4 py-2.5 rounded border border-white/5">
                <span className="text-[13px] text-white font-medium">{item.text}</span>
                <span className="text-[11px] text-app-textMuted whitespace-nowrap">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
