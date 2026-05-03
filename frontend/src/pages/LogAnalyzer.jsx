import React, { useState } from 'react';
import { 
  Play, Trash2, AlertTriangle, Info, Clock, 
  CheckCircle2, ShieldAlert, Cpu, Terminal
} from 'lucide-react';
import Typewriter from '../components/Typewriter';

const LOG_TYPES = [
  { id: 'nginx', label: 'NGINX' },
  { id: 'apache', label: 'Apache' },
  { id: 'system', label: 'System (syslog)' },
  { id: 'docker', label: 'Docker' },
  { id: 'kubernetes', label: 'Kubernetes' },
  { id: 'custom', label: 'Custom' }
];

export default function LogAnalyzer() {
  const [logText, setLogText] = useState('');
  const [logType, setLogType] = useState('nginx');
  const [context, setContext] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!logText.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/analyze-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_text: logText,
          log_type: logType,
          context: context || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to analyze logs');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    setLogText('');
    setContext('');
    setResult(null);
    setError(null);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const sampleLog = `[error] 24#24: *1 connect() failed (111: Connection refused) while connecting to upstream, client: 192.168.1.1, server: localhost, request: "GET /api/users HTTP/1.1", upstream: "http://127.0.0.1:8080/api/users"`;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 pb-20">
      
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">AI Log Analyzer</h2>
        <p className="text-slate-400">Diagnose server issues instantly with generative AI.</p>
      </div>

      {/* Input Section */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700 flex gap-4 bg-slate-800/50">
          <select 
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
          >
            {LOG_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <input 
            type="text" 
            placeholder="Context (e.g., 'Occurred after DB migration')"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>
        
        <div className="relative flex-1">
          <textarea
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder="Paste your raw server logs here..."
            className="w-full h-64 bg-[#0f172a] p-6 text-sm font-mono text-slate-300 focus:outline-none resize-none border-b border-transparent focus:border-green-500 transition-colors"
            spellCheck={false}
          />
        </div>
        
        <div className="p-4 bg-slate-800/50 flex justify-between items-center border-t border-slate-700">
          <button 
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          
          <button
            onClick={handleAnalyze}
            disabled={!logText.trim() || isAnalyzing}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
              !logText.trim() 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-green-500 text-slate-900 hover:bg-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Analyze Log
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="p-12 border border-slate-700 rounded-2xl bg-[#1e293b] shadow-xl relative overflow-hidden mt-8">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/50 to-transparent animate-[shimmer_2s_infinite] -translate-x-full"></div>
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur pulse-ring"></div>
              <Cpu className="w-12 h-12 text-green-500 relative z-10" />
            </div>
            <p className="text-slate-400 font-medium animate-pulse text-lg">AI is diagnosing your logs...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isAnalyzing && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 mt-8">
          <ShieldAlert className="w-6 h-6 text-red-500 mt-1 shrink-0" />
          <div>
            <h3 className="text-red-500 font-bold mb-1">Analysis Failed</h3>
            <p className="text-red-400/80 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !isAnalyzing && !error && (
        <div className="p-12 border border-slate-700 border-dashed rounded-2xl bg-slate-800/30 flex flex-col items-center justify-center text-center mt-8">
          <Terminal className="w-16 h-16 text-slate-600 mb-6" />
          <p className="text-slate-400 font-mono text-sm max-w-md">
            <Typewriter text="Waiting for input... Paste your server logs above and let AI diagnose the issue." speed={40} />
          </p>
          <div className="mt-8 text-left bg-slate-900 p-4 rounded-lg font-mono text-xs text-slate-500 w-full max-w-2xl overflow-x-auto shadow-inner border border-slate-800">
            <span className="text-slate-600"># Example log</span><br />
            {sampleLog}
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && !isAnalyzing && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
          
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-bold text-white flex-1">Analysis Report</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getSeverityColor(result.severity)}`}>
              {result.severity} Severity
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {new Date(result.analyzed_at).toLocaleString()}
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800 to-[#1e293b] border border-slate-700 shadow-lg">
            <p className="text-xl text-white font-medium">{result.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Info className="w-5 h-5" />
                <h4 className="font-bold">What Happened</h4>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{result.what_happened}</p>
            </div>
            
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold">Root Cause</h4>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{result.root_cause}</p>
            </div>
            
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-green-400">
                <Clock className="w-5 h-5" />
                <h4 className="font-bold">Estimated Fix Time</h4>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed text-2xl font-light mt-2">{result.estimated_fix_time}</p>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Actionable Fix Steps
              </h4>
            </div>
            <div className="p-6 bg-[#0f172a]">
              <ol className="space-y-4">
                {result.fix_steps.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300 font-mono text-sm leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {result.prevention_tips?.length > 0 && (
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6">
              <h4 className="text-lg font-bold text-white mb-4">Prevention Tips</h4>
              <ul className="space-y-3">
                {result.prevention_tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></span>
                    <span className="text-slate-400 text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
