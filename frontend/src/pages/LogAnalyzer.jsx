import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Trash2, AlertTriangle, Info, Clock, 
  Wrench, Shield, ShieldAlert, Terminal, Copy,
  Check, ChevronDown
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

const DEVOPS_TIPS = [
  "Did you know? DNS is always the problem.",
  "Analyzing stack traces in the 4th dimension...",
  "Running heuristics on container orchestration...",
  "Deploying on Friday is perfectly safe (said no one ever).",
  "Checking if it's a feature or a bug..."
];

export default function LogAnalyzer() {
  const [logText, setLogText] = useState('');
  const [logType, setLogType] = useState('nginx');
  const [context, setContext] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tipIndex, setTipIndex] = useState(0);
  
  const [copiedStep, setCopiedStep] = useState(null);
  const [copiedReport, setCopiedReport] = useState(false);
  
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const lineCount = Math.max(logText.split('\n').length, 1);
  const charCount = logText.length;

  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % DEVOPS_TIPS.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleAnalyze = async () => {
    if (!logText.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setTipIndex(0);

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

  const copyToClipboard = (text, type, index = null) => {
    navigator.clipboard.writeText(text);
    if (type === 'step') {
      setCopiedStep(index);
      setTimeout(() => setCopiedStep(null), 2000);
    } else if (type === 'report') {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low': return { color: 'text-[#3b82f6]', border: 'border-[#3b82f6]', bg: 'bg-[rgba(59,130,246,0.15)]', glow: 'shadow-glow-blue', hex: '#3b82f6' };
      case 'medium': return { color: 'text-[#eab308]', border: 'border-[#eab308]', bg: 'bg-[rgba(234,179,8,0.15)]', glow: 'shadow-glow-yellow', hex: '#eab308' };
      case 'high': return { color: 'text-[#f97316]', border: 'border-[#f97316]', bg: 'bg-[rgba(249,115,22,0.15)]', glow: 'shadow-glow-orange', hex: '#f97316' };
      case 'critical': return { color: 'text-[#ef4444]', border: 'border-[#ef4444]', bg: 'bg-[rgba(239,68,68,0.15)]', glow: 'shadow-glow-red', hex: '#ef4444' };
      default: return { color: 'text-[#64748b]', border: 'border-[#64748b]', bg: 'bg-[rgba(100,116,139,0.15)]', glow: '', hex: '#64748b' };
    }
  };

  const sampleLogTypes = ['NGINX Error', 'Docker Panic', 'K8s CrashLoop', 'Syslog Fatal'];
  const [sampleTypeIdx, setSampleTypeIdx] = useState(0);

  useEffect(() => {
    if (!result && !isAnalyzing) {
      const i = setInterval(() => {
        setSampleTypeIdx(prev => (prev + 1) % sampleLogTypes.length);
      }, 3000);
      return () => clearInterval(i);
    }
  }, [result, isAnalyzing]);

  return (
    <div className="max-w-[1000px] mx-auto p-6 md:p-10 space-y-10 pb-32">
      
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-[28px] font-bold text-white tracking-tight">Paste Your Logs</h2>
          <p className="text-[14px] text-app-textMuted mt-1">Submit your raw server logs below for instant diagnosis.</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select 
              value={logType}
              onChange={(e) => setLogType(e.target.value)}
              className="appearance-none bg-[#0a0f1e] border border-app-border rounded-lg pl-4 pr-10 py-2.5 text-[14px] font-medium text-white focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all w-full sm:w-[200px]"
            >
              {LOG_TYPES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-textMuted pointer-events-none" />
          </div>
          <input 
            type="text" 
            placeholder="Context (e.g., 'DB migration failed')"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="flex-1 bg-[#0a0f1e] border border-app-border rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent transition-all placeholder-app-textMuted"
          />
        </div>
        
        {/* Editor Area */}
        <div className="relative flex flex-col bg-[#060b18] border border-app-border rounded-[12px] overflow-hidden focus-within:border-app-accent focus-within:shadow-[0_0_0_3px_rgba(0,255,136,0.1)] transition-all duration-200">
          <div className="flex flex-1 min-h-[220px] relative">
            {/* Line Numbers */}
            <div 
              ref={lineNumbersRef}
              className="absolute left-0 top-0 bottom-0 w-[48px] py-4 text-right bg-transparent font-mono text-[13px] leading-[24px] text-app-textMuted opacity-50 select-none overflow-hidden pr-3 border-r border-app-border"
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            
            <textarea
              id="log-textarea"
              ref={textareaRef}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              onScroll={handleScroll}
              placeholder="Paste raw log data here..."
              className="w-full h-full py-4 pr-4 pl-[60px] bg-transparent font-mono text-[13px] leading-[24px] text-[#f1f5f9] focus:outline-none resize-y min-h-[220px] placeholder-app-textMuted/40"
              spellCheck={false}
            />
          </div>
          
          {/* Bottom Bar inside textarea container */}
          <div className="h-[48px] bg-app-sidebar/80 border-t border-app-border flex items-center justify-between px-4 shrink-0">
            <span className="text-[12px] font-mono text-app-textMuted">
              {charCount.toLocaleString()} / 10,000 chars
            </span>
            <div className="flex items-center gap-3">
              <button 
                onClick={clearAll}
                className="text-[13px] font-medium text-app-textMuted hover:text-white transition-colors px-3 py-1.5"
              >
                Clear
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!logText.trim() || isAnalyzing}
                className={`flex items-center gap-2 px-[24px] py-[10px] rounded-[10px] text-[14px] font-[700] transition-all duration-150 ${
                  !logText.trim() 
                    ? 'bg-app-border text-app-textMuted cursor-not-allowed'
                    : 'bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#000000] shadow-glow-accent hover:shadow-glow-accent-hover hover:scale-[1.02]'
                }`}
              >
                <Play className="w-[14px] h-[14px] fill-current" />
                Analyze Log
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!result && !isAnalyzing && !error && (
        <div className="py-24 flex flex-col items-center justify-center text-center animate-slide-up">
          <div className="w-[80px] h-[80px] mb-8 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[rgba(0,255,136,0.15)] rounded-full blur-xl"></div>
            <Terminal className="w-16 h-16 text-app-accent relative z-10" />
            <div className="absolute bottom-2 right-1 w-3 h-6 bg-app-accent animate-blink relative z-10"></div>
          </div>
          <h2 className="text-[32px] font-normal mb-3 tracking-tight text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a1a1aa]">Drop your logs. </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00ff88] to-[#00cc6a]">Get instant AI diagnosis.</span>
          </h2>
          <p className="text-[15px] text-app-textMuted font-medium h-6 transition-all duration-500">
            Waiting for {sampleLogTypes[sampleTypeIdx]} logs...
          </p>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="glass-card rounded-[12px] p-8 space-y-8 animate-slide-up overflow-hidden relative border border-app-border">
          <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
            <div>
              <h3 className="font-bold text-white text-lg">Gemini AI is analyzing your logs...</h3>
              <p className="text-[13px] text-app-accent font-mono mt-2 h-4">{DEVOPS_TIPS[tipIndex]}</p>
            </div>
          </div>

          <div className="w-full bg-[#050810] h-2 rounded-full overflow-hidden relative border border-app-border z-10">
            <div className="absolute top-0 bottom-0 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] animate-progress shadow-glow-accent rounded-full"></div>
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
        <div className="space-y-8 animate-slide-up">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h3 className="text-[22px] font-bold text-white tracking-tight">Analysis Report</h3>
              <div className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider border ${getSeverityStyles(result.severity).border} ${getSeverityStyles(result.severity).bg} ${getSeverityStyles(result.severity).color} ${getSeverityStyles(result.severity).glow}`}>
                {result.severity}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-app-textMuted">
                {new Date(result.analyzed_at).toLocaleString()}
              </span>
              <button 
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2), 'report')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-app-border text-[13px] font-medium text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                {copiedReport ? <Check className="w-4 h-4 text-app-accent" /> : <Copy className="w-4 h-4" />}
                {copiedReport ? 'Copied' : 'Copy Report'}
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div 
            className="glass-card rounded-[12px] p-6 border-l-[4px]" 
            style={{ 
              borderLeftColor: getSeverityStyles(result.severity).hex,
              backgroundColor: `color-mix(in srgb, ${getSeverityStyles(result.severity).hex} 2%, transparent)`
            }}
          >
            <p className="text-[16px] text-white font-medium leading-relaxed">{result.summary}</p>
          </div>

          {/* 3 Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-4 hover:-translate-y-[2px] hover:border-app-accent/20 transition-all duration-200 group">
              <div className="w-8 h-8 rounded-full bg-[rgba(99,102,241,0.2)] flex items-center justify-center border border-[rgba(99,102,241,0.3)]">
                <Info className="w-4 h-4 text-app-indigo" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-2 text-[14px]">What Happened</h4>
                <p className="text-app-textMuted text-[14px] leading-relaxed group-hover:text-app-textMain transition-colors">{result.what_happened}</p>
              </div>
            </div>
            
            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-4 hover:-translate-y-[2px] hover:border-app-accent/20 transition-all duration-200 group">
              <div className="w-8 h-8 rounded-full bg-[rgba(249,115,22,0.2)] flex items-center justify-center border border-[rgba(249,115,22,0.3)]">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-2 text-[14px]">Root Cause</h4>
                <p className="text-app-textMuted text-[14px] leading-relaxed group-hover:text-app-textMain transition-colors">{result.root_cause}</p>
              </div>
            </div>
            
            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-4 hover:-translate-y-[2px] hover:border-app-accent/20 transition-all duration-200 group">
              <div className="w-8 h-8 rounded-full bg-[rgba(0,255,136,0.2)] flex items-center justify-center border border-[rgba(0,255,136,0.3)] shadow-glow-accent">
                <Clock className="w-4 h-4 text-app-accent" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1 text-[14px]">Estimated Fix Time</h4>
                <p className="text-white text-[24px] font-light mt-1">{result.estimated_fix_time}</p>
              </div>
            </div>
          </div>

          {/* Fix Steps */}
          <div className="space-y-4 pt-4">
            <h4 className="text-[18px] font-bold text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-app-accent" />
              Steps to Fix
            </h4>
            <div className="space-y-3">
              {result.fix_steps?.map((step, idx) => (
                <div key={idx} className="bg-[rgba(0,255,136,0.03)] border border-[rgba(0,255,136,0.08)] p-[16px] rounded-[10px] flex gap-4 items-start relative group transition-all duration-200 hover:bg-[rgba(0,255,136,0.06)]">
                  <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-app-accent text-black font-bold text-[13px]">
                    {idx + 1}
                  </span>
                  <div className="flex-1 pt-0.5 pr-8">
                    <span className="text-[#f1f5f9] text-[15px] leading-relaxed">{step}</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(step, 'step', idx)}
                    className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-[rgba(255,255,255,0.1)] rounded-md transition-all"
                    title="Copy step"
                  >
                    {copiedStep === idx ? <Check className="w-4 h-4 text-app-accent" /> : <Copy className="w-4 h-4 text-app-textMuted" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Prevention Tips */}
          {result.prevention_tips?.length > 0 && (
            <div className="space-y-4 pt-4">
              <h4 className="text-[18px] font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-app-indigo" />
                Prevention Tips
              </h4>
              <div className="glass-card rounded-[12px] p-0 overflow-hidden border border-app-border">
                {result.prevention_tips.map((tip, idx) => (
                  <div key={idx} className={`flex items-start gap-4 p-5 ${idx !== result.prevention_tips.length - 1 ? 'border-b border-[rgba(255,255,255,0.04)]' : ''}`}>
                    <div className="mt-0.5 w-[22px] h-[22px] rounded-full bg-[rgba(0,255,136,0.1)] flex items-center justify-center shrink-0 border border-[rgba(0,255,136,0.2)]">
                      <Check className="w-3.5 h-3.5 text-app-accent stroke-[3]" />
                    </div>
                    <span className="text-[#e2e8f0] text-[15px] leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-10 pb-6 text-center border-t border-app-border mt-8">
            <span className="text-[13px] text-app-textMuted font-medium">
              Analyzed at {new Date(result.analyzed_at).toLocaleTimeString()} • Powered by <span className="text-white">Gemini AI</span> • AI DevOps Copilot v1.0
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
