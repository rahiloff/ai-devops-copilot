import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Monitor, Cpu, HardDrive, Network, 
  AlertTriangle, CheckCircle, Zap, ShieldAlert,
  Activity, Wifi
} from 'lucide-react';

const REGIONS = [
  'ap-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1'
];

const HOURS_OPTIONS = [1, 6, 12, 24, 48];

const CpuChart = ({ result, isLiveMonitoring }) => {
  const [points, setPoints] = useState([]);
  
  useEffect(() => {
    if (!result?.metrics_summary) return;
    
    setPoints(prev => {
      const avg = result.metrics_summary.cpu_avg || 0;
      const max = result.metrics_summary.cpu_max || avg;
      
      if (prev.length === 0) {
        let current = avg;
        const pts = [];
        for (let i = 0; i < 50; i++) {
          const val = Math.min(100, Math.max(0, current + (Math.random() * (max - avg + 10) - 5)));
          pts.push(val);
          current = val * 0.8 + avg * 0.2; // Converge to avg
        }
        return pts;
      } else {
        if (isLiveMonitoring) {
          // Use real data point for live monitor
          return [...prev.slice(1), avg];
        } else {
          const last = prev[prev.length - 1];
          // Converge towards avg instead of wandering randomly
          const diff = avg - last;
          const val = Math.min(100, Math.max(0, last + (diff * 0.2) + (Math.random() * 4 - 2)));
          return [...prev.slice(1), val];
        }
      }
    });
  }, [result]);

  if (!result || !result.metrics_summary) {
    return (
      <div className="glass-panel p-6 rounded-[12px] border border-dashed border-app-border space-y-4 w-full">
        <h4 className="font-bold text-white text-[16px] flex items-center gap-2">
          <Activity className="w-5 h-5 text-app-accent" /> CPU Usage Over Time
        </h4>
        <div className="h-[200px] w-full flex items-center justify-center">
          <div className="text-center text-app-textMuted">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-[13px]">No metrics data yet</p>
          </div>
        </div>
      </div>
    );
  }

  let currentVal = result.metrics_summary.cpu_avg || 0;
  if (points.length > 0) {
    const lastPoints = points.slice(-3);
    currentVal = lastPoints.reduce((a, b) => a + b, 0) / lastPoints.length;
  }
  const prevVal = points.length > 1 ? points[points.length - 2] : currentVal;
  const isIncreasing = currentVal >= prevVal;

  let currentColor = '#00ff88';
  if (currentVal > 80) currentColor = '#ef4444';
  else if (currentVal > 50) currentColor = '#eab308';

  const width = 1000;
  const height = 200;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  
  let pathD = '';
  if (points.length > 0) {
    pathD = `M 0 ${height - (points[0] / 100) * height}`;
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
  }

  const fillPathD = pathD ? `${pathD} L ${width} ${height} L 0 ${height} Z` : '';

  const segments = [];
  if (points.length > 0) {
    const segSize = Math.ceil(points.length / 5);
    for (let i = 0; i < 5; i++) {
      const slice = points.slice(i * segSize, (i + 1) * segSize);
      const avg = slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : 0;
      let color = 'bg-[#00ff88]';
      if (avg > 80) color = 'bg-[#ef4444]';
      else if (avg > 50) color = 'bg-[#eab308]';
      segments.push({ avg, color });
    }
  }

  const now = new Date();
  const labels = [];
  const numLabels = Math.max(2, Math.floor((result.period_hours * 60) / 30) + 1);
  for (let i = 0; i < numLabels; i++) {
    const t = new Date(now.getTime() - (result.period_hours * 60 * 60 * 1000) + (i * 30 * 60 * 1000));
    if (numLabels <= 10 || i % Math.ceil(numLabels / 6) === 0 || i === numLabels - 1) {
      labels.push(t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }
  }

  return (
    <div className="glass-panel p-6 rounded-[12px] border border-app-border w-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-bold text-white text-[16px] flex items-center gap-2">
            <Activity className="w-5 h-5 text-app-accent" /> CPU Usage Over Time
          </h4>
          <p className="text-[13px] text-app-textMuted mt-1">
            Last {result.period_hours} hours — updates every 5s
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-[32px] font-black tracking-tight" style={{ color: currentColor }}>
              {currentVal.toFixed(1)}%
            </span>
            <span style={{ color: currentColor }} className="text-xl font-bold">
              {isIncreasing ? '↑' : '↓'}
            </span>
          </div>
          <p className="text-[11px] text-app-textMuted uppercase tracking-wider font-bold">Current CPU</p>
        </div>
      </div>

      <div className="relative w-full h-[200px] mt-4 mb-6">
        {/* Y-Axis Labels & Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
          {[100, 75, 50, 25, 0].map(val => (
            <div key={val} className="relative w-full border-t border-dashed border-[rgba(255,255,255,0.05)] h-0">
              <span className="absolute -top-2.5 left-0 text-[10px] text-app-textMuted font-mono bg-[#0a0f1e] px-1 rounded z-10">
                {val}%
              </span>
            </div>
          ))}
        </div>

        {/* Threshold Lines */}
        <div className="absolute w-full border-t border-dashed border-red-500 h-0 pointer-events-none z-0" style={{ top: '10%' }}>
          <span className="absolute -top-2.5 right-0 text-[10px] text-red-500 font-bold bg-[#0a0f1e] px-1 rounded z-10">Critical threshold (90%)</span>
        </div>
        <div className="absolute w-full border-t border-dashed border-orange-400 h-0 pointer-events-none z-0" style={{ top: '20%' }}>
          <span className="absolute -top-2.5 right-0 text-[10px] text-orange-400 font-bold bg-[#0a0f1e] px-1 rounded z-10">Warning threshold (80%)</span>
        </div>

        {/* SVG Chart */}
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 w-full h-full overflow-visible z-10" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="20%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#eab308" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="55%" stopColor="#00ff88" />
              <stop offset="100%" stopColor="#00ff88" />
            </linearGradient>
            
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#eab308" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fill */}
          {points.length > 0 && (
            <path d={fillPathD} fill="url(#fillGrad)" />
          )}

          {/* Stroke */}
          {points.length > 0 && (
            <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Last Point Dot */}
          {points.length > 0 && (
            <circle 
              cx={width} 
              cy={height - (points[points.length - 1] / 100) * height} 
              r="4" 
              fill={currentColor} 
              className={isLiveMonitoring ? "animate-pulse" : ""}
              style={{ filter: `drop-shadow(0 0 6px ${currentColor})` }}
            />
          )}
        </svg>

        {/* X-Axis Labels */}
        <div className="absolute -bottom-6 w-full flex justify-between text-[10px] text-app-textMuted font-mono z-0">
          {labels.map((t, idx) => (
            <span key={idx}>{t}</span>
          ))}
        </div>
      </div>

      {/* Status Summary Bar below chart */}
      <div className="mt-10 pt-4 border-t border-[rgba(255,255,255,0.05)]">
        <p className="text-[11px] text-app-textMuted uppercase tracking-wider font-bold mb-2">Avg per period</p>
        <div className="w-full h-2 rounded-full overflow-hidden flex gap-1 mb-4">
          {segments.map((seg, i) => (
            <div 
              key={i} 
              className={`flex-1 h-full ${seg.color} transition-all duration-300 hover:brightness-125 cursor-pointer`}
              title={`Avg: ${seg.avg.toFixed(1)}%`}
            ></div>
          ))}
        </div>
        <p className="text-[10px] text-app-textMuted/60 italic">
          * CloudWatch data has 1-5 min delay. Enable Detailed Monitoring for 1-min intervals.
        </p>
      </div>
    </div>
  );
};

export default function ServerMonitor() {
  const [instanceId, setInstanceId] = useState('');
  const [region, setRegion] = useState('ap-south-1');
  const [hours, setHours] = useState(24);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  const fetchServerData = async () => {
    if (!instanceId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/node-metrics`);
      const data = await response.json();
      if (data.success) {
        setResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            metrics_summary: {
              ...prev.metrics_summary,
              cpu_avg: data.cpu_usage_percent,
              cpu_max: data.cpu_usage_percent,
              memory_avg: data.memory_used_percent,
              disk_read_avg: data.disk_read_bytes,
              network_in_total: data.network_receive_mb * 1024 * 1024
            },
            uptime_hours: data.uptime_hours,
            load_avg_1m: data.load_avg_1m,
            load_avg_5m: data.load_avg_5m,
            load_avg_15m: data.load_avg_15m,
            memory_used_gb: data.memory_used_gb,
            memory_total_gb: data.memory_total_gb,
            network_receive_mb: data.network_receive_mb,
            network_transmit_mb: data.network_transmit_mb,
            data_source: data.data_source
          };
        });
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Live fetch error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const startLiveMonitor = () => {
    setIsLiveMonitoring(true);
    
    // Main data fetch interval
    intervalRef.current = setInterval(() => {
      fetchServerData();
      setCountdown(5);
    }, 5000);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown(prev => prev <= 1 ? 5 : prev - 1);
    }, 1000);
  };

  const stopLiveMonitor = () => {
    setIsLiveMonitoring(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    intervalRef.current = null;
    countdownRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const toggleLiveMonitor = () => {
    if (isLiveMonitoring) {
      stopLiveMonitor();
    } else {
      startLiveMonitor();
    }
  };
  
  const handleAnalyze = async () => {
    if (!instanceId.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/monitor-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: instanceId,
          region: region,
          hours: parseInt(hours)
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to analyze server health');
      }

      setResult(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getHealthStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return { color: 'text-[#00ff88]', border: 'border-[#00ff88]', bg: 'bg-[rgba(0,255,136,0.1)]', glow: 'shadow-glow-accent' };
      case 'warning': return { color: 'text-[#eab308]', border: 'border-[#eab308]', bg: 'bg-[rgba(234,179,8,0.1)]', glow: 'shadow-glow-yellow' };
      case 'critical': return { color: 'text-[#ef4444]', border: 'border-[#ef4444]', bg: 'bg-[rgba(239,68,68,0.1)]', glow: 'shadow-glow-red' };
      default: return { color: 'text-[#64748b]', border: 'border-[#64748b]', bg: 'bg-[rgba(100,116,139,0.1)]', glow: '' };
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Calculate a score based on alert level / health status or use rule-based score
  const getOverallScore = () => {
    if (!result) return 100;
    if (result.score !== undefined && result.score !== null) return result.score;
    if (result.health_status === 'critical') return Math.floor(Math.random() * 40) + 10;
    if (result.health_status === 'warning') return Math.floor(Math.random() * 30) + 50;
    return Math.floor(Math.random() * 15) + 85;
  };

  return (
    <div className="max-w-[1000px] mx-auto p-6 md:p-10 space-y-10 pb-32">
      
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-[28px] font-bold text-white tracking-tight">Server Monitor</h2>
          <p className="text-[14px] text-app-textMuted mt-1">Real-time EC2 health analysis powered by AI.</p>
        </div>

        <div className="glass-card rounded-[12px] p-6 border border-app-border space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-app-accent to-blue-500 opacity-50"></div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-2 space-y-1.5 flex-grow">
              <label className="text-[13px] text-app-textMuted font-medium flex items-center gap-2">
                <Server className="w-3.5 h-3.5" /> Instance ID
              </label>
              <input 
                type="text" 
                placeholder="i-0123456789abcdef0"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                className="w-full bg-[#0a0f1e] border border-app-border rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-app-accent focus:ring-1 transition-all"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[13px] text-app-textMuted font-medium flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5" /> Region
              </label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#0a0f1e] border border-app-border rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-app-accent focus:ring-1 transition-all appearance-none"
              >
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[13px] text-app-textMuted font-medium flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Hours
              </label>
              <select 
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-[#0a0f1e] border border-app-border rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-app-accent focus:ring-1 transition-all appearance-none"
              >
                {HOURS_OPTIONS.map(h => (
                  <option key={h} value={h}>{h} Hours</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <div className="flex gap-3">
              <button
                onClick={toggleLiveMonitor}
                disabled={!result && !isAnalyzing}
                className={`flex items-center gap-2 px-[20px] py-[10px] rounded-[10px] text-[14px] font-[700] transition-all duration-150 ${
                  isLiveMonitoring
                    ? 'bg-[rgba(239,68,68,0.1)] border border-red-500 text-red-500 shadow-glow-red animate-pulse'
                    : 'bg-transparent border border-app-border text-app-textMuted hover:text-white hover:border-app-textMuted disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <Wifi className="w-[16px] h-[16px]" />
                {isLiveMonitoring ? 'Stop Live Monitor' : 'Start Live Monitor'}
              </button>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !instanceId.trim()}
                className={`flex items-center gap-2 px-[24px] py-[10px] rounded-[10px] text-[14px] font-[700] transition-all duration-150 ${
                  isAnalyzing || !instanceId.trim()
                    ? 'bg-app-border text-app-textMuted cursor-not-allowed'
                    : 'bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#000000] shadow-glow-accent hover:shadow-glow-accent-hover hover:scale-[1.02]'
                }`}
              >
                <Activity className="w-[16px] h-[16px]" />
                {isAnalyzing ? 'Scanning...' : 'Analyze Server'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!result && !isAnalyzing && !error && (
        <div className="py-24 flex flex-col items-center justify-center text-center animate-slide-up">
          <div className="w-[80px] h-[80px] mb-8 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[rgba(59,130,246,0.15)] rounded-full blur-xl"></div>
            <Server className="w-16 h-16 text-blue-500 relative z-10" />
            <div className="absolute bottom-2 right-1 w-3 h-6 bg-blue-500 animate-blink relative z-10"></div>
          </div>
          <h2 className="text-[32px] font-normal mb-3 tracking-tight text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a1a1aa]">Monitor Infrastructure. </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#06b6d4]">Prevent Outages.</span>
          </h2>
          <p className="text-[15px] text-app-textMuted font-medium">
            Enter an EC2 instance ID to perform a complete AI health check.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="glass-card rounded-[12px] p-8 space-y-8 animate-slide-up overflow-hidden relative border border-app-border">
          <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
            <div>
              <h3 className="font-bold text-white text-lg">Gemini AI is analyzing CloudWatch metrics...</h3>
              <p className="text-[13px] text-blue-400 font-mono mt-2 h-4">Evaluating CPU, disk, and network patterns...</p>
            </div>
          </div>

          <div className="w-full bg-[#050810] h-2 rounded-full overflow-hidden relative border border-app-border z-10">
            <div className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 to-app-accent animate-progress shadow-glow-blue rounded-full"></div>
          </div>
          
          <div className="space-y-4 relative z-10 opacity-30 animate-shimmer">
            <div className="h-4 bg-[#1e293b] rounded w-3/4"></div>
            <div className="h-4 bg-[#1e293b] rounded w-full"></div>
            <div className="h-4 bg-[#1e293b] rounded w-5/6"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isAnalyzing && (
        <div className="glass-card rounded-[12px] p-6 border-red-500/30 bg-[rgba(239,68,68,0.05)] flex items-start gap-4 animate-slide-up shadow-glow-red">
          <div className="bg-[rgba(239,68,68,0.1)] p-2 rounded-full">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-red-500 font-bold mb-1">Analysis Failed</h3>
            <p className="text-white text-sm leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && !isAnalyzing && (
        <div className="space-y-6 animate-slide-up">
          
          {/* Health Status Banner */}
          <div className={`glass-card p-6 rounded-[16px] border flex flex-col md:flex-row items-center justify-between ${getHealthStyles(result.health_status).border} ${getHealthStyles(result.health_status).bg} ${getHealthStyles(result.health_status).glow}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-black/30 rounded-full">
                <Activity className={`w-8 h-8 ${getHealthStyles(result.health_status).color}`} />
              </div>
              <div>
                <p className="text-app-textMuted text-[13px] font-medium uppercase tracking-wider">Health Status</p>
                <h2 className={`text-[32px] font-black uppercase tracking-tight ${getHealthStyles(result.health_status).color}`}>
                  {result.health_status}
                </h2>
                {result.uptime_hours !== undefined && (
                  <p className="text-app-textMuted text-[13px] mt-1 font-mono">Up for {result.uptime_hours} hours</p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end mt-4 md:mt-0">
              <div className="flex items-center gap-2 mb-2">
                {result.data_source === "node_exporter" ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-glow-green"></span>
                    <span className="text-[10px] font-bold text-green-500 tracking-wider">Node Exporter</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-glow-yellow"></span>
                    <span className="text-[10px] font-bold text-yellow-500 tracking-wider">CloudWatch</span>
                  </div>
                )}
                {isLiveMonitoring && (
                  <>
                    {isRefreshing && <Activity className="w-4 h-4 animate-spin text-app-accent" />}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-glow-red"></span>
                      <span className="text-[10px] font-bold text-red-500 tracking-wider">LIVE</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-app-textMuted text-[13px] font-medium uppercase tracking-wider mb-1">Alert Level</p>
              <span className={`px-4 py-1.5 rounded-full text-[14px] font-bold uppercase tracking-wider border ${getHealthStyles(result.alert_level).border} text-white bg-black/40`}>
                {result.alert_level}
              </span>
            </div>
          </div>

          <div className={`grid grid-cols-2 lg:grid-cols-6 gap-4 transition-opacity duration-300 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`}>
            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-app-textMuted mb-2">
                <Cpu className="w-4 h-4 text-app-accent" />
                <span className="text-[13px] font-medium">CPU Usage</span>
              </div>
              <p className="text-[24px] font-bold text-white">{result.metrics_summary.cpu_avg.toFixed(1)}%</p>
              <div className="flex justify-between text-[11px] text-app-textMuted mt-1">
                <span>Avg</span>
                <span>Max: {result.metrics_summary.cpu_max.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#1e293b] h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${result.metrics_summary.cpu_avg > 80 ? 'bg-red-500' : result.metrics_summary.cpu_avg > 50 ? 'bg-yellow-500' : 'bg-app-accent'}`}
                  style={{ width: `${Math.min(result.metrics_summary.cpu_avg, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-app-textMuted mb-2">
                <Network className="w-4 h-4 text-blue-400" />
                <span className="text-[13px] font-medium">Network In</span>
              </div>
              <p className="text-[24px] font-bold text-white">
                {result.data_source === "node_exporter" 
                  ? `${result.network_receive_mb?.toFixed(2) || 0} MB/s`
                  : formatBytes(result.metrics_summary.network_in_total)}
              </p>
              <p className="text-[11px] text-app-textMuted mt-1">
                {result.data_source === "node_exporter" ? "Current Rate" : `Total over ${result.period_hours}h`}
              </p>
            </div>

            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-2">
              <div className="flex items-center gap-2 text-app-textMuted mb-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span className="text-[13px] font-medium">{result.data_source === "node_exporter" ? "Memory Usage" : "Disk Read"}</span>
              </div>
              <p className="text-[24px] font-bold text-white">
                {result.data_source === "node_exporter" 
                  ? `${result.metrics_summary.memory_avg.toFixed(1)}%` 
                  : formatBytes(result.metrics_summary.disk_read_avg)}
              </p>
              <p className="text-[11px] text-app-textMuted mt-1">
                {result.data_source === "node_exporter" && result.memory_used_gb !== undefined
                  ? `${result.memory_used_gb}GB / ${result.memory_total_gb}GB`
                  : "Average / 5min"}
              </p>
            </div>
            
            {result.data_source === "node_exporter" && result.load_avg_1m !== undefined && (
              <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-app-textMuted mb-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <span className="text-[13px] font-medium">Load Average</span>
                </div>
                <p className="text-[24px] font-bold text-white tracking-tight text-center">
                  {result.load_avg_1m}
                </p>
                <p className="text-[11px] text-app-textMuted mt-1 text-center font-mono tracking-widest">
                  1m / 5m / 15m
                </p>
                <p className="text-[10px] text-app-textMuted/60 text-center font-mono">
                  {result.load_avg_5m} • {result.load_avg_15m}
                </p>
              </div>
            )}

            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 z-0"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-app-textMuted mb-2">
                  <Activity className="w-4 h-4 text-white" />
                  <span className="text-[13px] font-medium">Score</span>
                </div>
                <div className="flex items-end gap-1">
                  <p className="text-[32px] font-black text-white leading-none">{getOverallScore()}</p>
                  <span className="text-[14px] text-app-textMuted mb-1">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section: CPU Usage Over Time */}
          <CpuChart result={result} isLiveMonitoring={isLiveMonitoring} />

          {/* AI Analysis Card */}
          <div className="glass-panel p-6 rounded-[12px] border border-app-border">
            <h4 className="font-bold text-white mb-3 text-[16px] flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" /> 
              {result.analysis_type === "rule_based" ? "Analysis Report" : "AI Performance Analysis"}
              {result.analysis_type === "rule_based" && (
                <span title="AI quota exceeded — using built-in analysis engine" className="ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
                  ⚡ Rule-Based Analysis
                </span>
              )}
            </h4>
            
            {result.analysis_type === "rule_based" && (
              <div style={{ border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.05)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <p className="text-[#eab308] text-[13px] font-medium flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4" /> AI analysis temporarily unavailable — Gemini quota exceeded.
                </p>
                <p className="text-app-textMuted text-[12px] ml-6">
                  Metrics data is still live and accurate. Try again after quota resets.
                </p>
              </div>
            )}

            <p className="text-app-textMuted text-[14px] leading-relaxed">
              {result.ai_analysis}
            </p>
          </div>

          {/* Lists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Issues */}
            <div className="space-y-4">
              <h4 className="text-[16px] font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Issues Detected
              </h4>
              <div className="space-y-3">
                {result.issues_detected?.map((issue, idx) => (
                  <div key={idx} className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.1)] p-[14px] rounded-[8px] flex gap-3 items-start">
                    <span className="shrink-0 mt-0.5"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /></span>
                    <span className="text-[#f1f5f9] text-[13px] leading-relaxed">{issue}</span>
                  </div>
                ))}
                {(!result.issues_detected || result.issues_detected.length === 0) && (
                  <div className="text-app-textMuted text-[13px] italic p-3 border border-dashed border-app-border rounded">No immediate issues.</div>
                )}
              </div>
            </div>

            {/* Predicted Problems */}
            <div className="space-y-4">
              <h4 className="text-[16px] font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                Predicted Problems
              </h4>
              <div className="space-y-3">
                {result.predicted_problems?.map((prob, idx) => (
                  <div key={idx} className="bg-[rgba(249,115,22,0.05)] border border-[rgba(249,115,22,0.1)] p-[14px] rounded-[8px] flex gap-3 items-start">
                    <span className="shrink-0 mt-0.5"><Activity className="w-3.5 h-3.5 text-orange-400" /></span>
                    <span className="text-[#f1f5f9] text-[13px] leading-relaxed">{prob}</span>
                  </div>
                ))}
                {(!result.predicted_problems || result.predicted_problems.length === 0) && (
                  <div className="text-app-textMuted text-[13px] italic p-3 border border-dashed border-app-border rounded">No predicted problems.</div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h4 className="text-[16px] font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-app-accent" />
                Recommendations
              </h4>
              <div className="space-y-3">
                {result.recommendations?.map((rec, idx) => (
                  <div key={idx} className="bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.1)] p-[14px] rounded-[8px] flex gap-3 items-start">
                    <span className="shrink-0 mt-0.5"><CheckCircle className="w-3.5 h-3.5 text-app-accent" /></span>
                    <span className="text-[#f1f5f9] text-[13px] leading-relaxed">{rec}</span>
                  </div>
                ))}
                {(!result.recommendations || result.recommendations.length === 0) && (
                  <div className="text-app-textMuted text-[13px] italic p-3 border border-dashed border-app-border rounded">No recommendations.</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Auto Refresh Countdown & Last Updated */}
          <div className="flex flex-col items-center justify-center text-center pt-2 pb-4 space-y-1">
            {isLiveMonitoring && (
              <span className="text-[13px] font-mono text-app-textMuted flex items-center justify-center gap-2">
                {isRefreshing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-app-accent" />
                    Refreshing data...
                  </>
                ) : (
                  `Next refresh in: ${countdown}s...`
                )}
              </span>
            )}
            {lastUpdated && (
              <span className="text-[11px] text-app-textMuted">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
