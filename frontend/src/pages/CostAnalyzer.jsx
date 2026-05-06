import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Calendar, TrendingDown, AlertCircle, 
  CheckCircle, Zap, ShieldAlert, BarChart, Play
} from 'lucide-react';

export default function CostAnalyzer() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountLabel, setAccountLabel] = useState('AWS Production');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set default dates: last 3 months
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const handleAnalyze = async () => {
    if (!startDate || !endDate) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/analyze-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          account_label: accountLabel
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to analyze costs');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
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

  // Helper to get color for bar chart based on percentage
  const getBarColor = (percentage) => {
    if (percentage > 50) return 'bg-[#ef4444]'; // Red
    if (percentage > 20) return 'bg-[#f97316]'; // Orange
    if (percentage > 5) return 'bg-[#eab308]';  // Yellow
    return 'bg-[#00ff88]';                      // Green
  };

  return (
    <div className="max-w-[1000px] mx-auto p-6 md:p-10 space-y-10 pb-32">
      
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-[28px] font-bold text-white tracking-tight">Cloud Cost Analyzer</h2>
          <p className="text-[14px] text-app-textMuted mt-1">Detect waste and optimize your AWS spending with AI.</p>
        </div>

        <div className="glass-card rounded-[12px] p-6 border border-app-border space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-app-indigo via-app-accent to-app-indigo opacity-50"></div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[13px] text-app-textMuted font-medium flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0a0f1e] border border-app-border rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-app-accent focus:ring-1 transition-all"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[13px] text-app-textMuted font-medium flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> End Date
              </label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0a0f1e] border border-app-border rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-app-accent focus:ring-1 transition-all"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[13px] text-app-textMuted font-medium flex items-center gap-2">
                <BarChart className="w-3.5 h-3.5" /> Account Label
              </label>
              <input 
                type="text" 
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                className="w-full bg-[#0a0f1e] border border-app-border rounded-lg px-4 py-2.5 text-[14px] text-white focus:outline-none focus:border-app-accent focus:ring-1 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !startDate || !endDate}
              className={`flex items-center gap-2 px-[24px] py-[10px] rounded-[10px] text-[14px] font-[700] transition-all duration-150 ${
                isAnalyzing || !startDate || !endDate
                  ? 'bg-app-border text-app-textMuted cursor-not-allowed'
                  : 'bg-gradient-to-br from-[#00ff88] to-[#00cc6a] text-[#000000] shadow-glow-accent hover:shadow-glow-accent-hover hover:scale-[1.02]'
              }`}
            >
              <DollarSign className="w-[16px] h-[16px]" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Costs'}
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!result && !isAnalyzing && !error && (
        <div className="py-24 flex flex-col items-center justify-center text-center animate-slide-up">
          <div className="w-[80px] h-[80px] mb-8 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[rgba(99,102,241,0.15)] rounded-full blur-xl"></div>
            <DollarSign className="w-16 h-16 text-app-indigo relative z-10" />
            <div className="absolute bottom-2 right-1 w-3 h-6 bg-app-indigo animate-blink relative z-10"></div>
          </div>
          <h2 className="text-[32px] font-normal mb-3 tracking-tight text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#a1a1aa]">Connect AWS. </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">Find Hidden Waste.</span>
          </h2>
          <p className="text-[15px] text-app-textMuted font-medium">
            Select a date range to generate an AI cost optimization report.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="glass-card rounded-[12px] p-8 space-y-8 animate-slide-up overflow-hidden relative border border-app-border">
          <div className="flex flex-col items-center justify-center text-center space-y-4 relative z-10">
            <div>
              <h3 className="font-bold text-white text-lg">Gemini AI is analyzing your billing data...</h3>
              <p className="text-[13px] text-app-indigo font-mono mt-2 h-4">Scanning for idle resources and anomalies...</p>
            </div>
          </div>

          <div className="w-full bg-[#050810] h-2 rounded-full overflow-hidden relative border border-app-border z-10">
            <div className="absolute top-0 bottom-0 bg-gradient-to-r from-app-indigo to-app-accent animate-progress shadow-glow-accent rounded-full"></div>
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
              <h3 className="text-[22px] font-bold text-white tracking-tight">Cost Optimization Report</h3>
              <div className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider border ${getSeverityStyles(result.severity).border} ${getSeverityStyles(result.severity).bg} ${getSeverityStyles(result.severity).color} ${getSeverityStyles(result.severity).glow}`}>
                {result.severity} Waste
              </div>
            </div>
            
            <span className="text-[13px] text-app-textMuted font-medium">
              Period: {result.period}
            </span>
          </div>

          {/* Big Total Cost Card */}
          <div className={`glass-card p-8 rounded-[16px] border ${result.total_cost > 1000 ? 'border-red-500/30 shadow-glow-red' : 'border-app-accent/30 shadow-glow-accent'} relative overflow-hidden flex items-center justify-between`}>
            <div className="relative z-10">
              <p className="text-app-textMuted text-[14px] font-medium uppercase tracking-wider mb-2">Total Spend</p>
              <h2 className={`text-[48px] font-black tracking-tight ${result.total_cost > 1000 ? 'text-red-400' : 'text-app-accent'}`}>
                ${result.total_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="relative z-10 hidden sm:block">
              <DollarSign className={`w-24 h-24 opacity-20 ${result.total_cost > 1000 ? 'text-red-400' : 'text-app-accent'}`} />
            </div>
          </div>

          {/* Service Breakdown Chart */}
          <div className="glass-card p-6 rounded-[12px] border border-app-border">
            <h4 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-app-indigo" /> Service Breakdown
            </h4>
            <div className="space-y-4">
              {result.service_breakdown?.map((service, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-white font-medium">{service.service_name}</span>
                    <span className="text-app-textMuted">${service.total_cost.toFixed(2)} ({service.percentage_of_total.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-[#1e293b] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getBarColor(service.percentage_of_total)}`}
                      style={{ width: `${Math.max(service.percentage_of_total, 1)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {(!result.service_breakdown || result.service_breakdown.length === 0) && (
                <div className="text-app-textMuted text-sm text-center py-4">No service data available.</div>
              )}
            </div>
          </div>

          {/* 3 Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-4 hover:-translate-y-[2px] transition-all duration-200 group">
              <div className="w-8 h-8 rounded-full bg-[rgba(99,102,241,0.2)] flex items-center justify-center border border-[rgba(99,102,241,0.3)]">
                <Zap className="w-4 h-4 text-app-indigo" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-2 text-[14px]">AI Summary</h4>
                <p className="text-app-textMuted text-[14px] leading-relaxed group-hover:text-app-textMain transition-colors line-clamp-3" title={result.ai_summary}>
                  {result.ai_summary}
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-4 hover:-translate-y-[2px] transition-all duration-200 group">
              <div className="w-8 h-8 rounded-full bg-[rgba(239,68,68,0.2)] flex items-center justify-center border border-[rgba(239,68,68,0.3)] shadow-glow-red">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1 text-[14px]">Waste Detected</h4>
                <p className="text-white text-[28px] font-black mt-1 tracking-tight">
                  {result.waste_detected?.length || 0}
                </p>
                <p className="text-app-textMuted text-[13px] mt-1">Issues found</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-[12px] flex flex-col gap-4 hover:-translate-y-[2px] transition-all duration-200 group">
              <div className="w-8 h-8 rounded-full bg-[rgba(0,255,136,0.2)] flex items-center justify-center border border-[rgba(0,255,136,0.3)] shadow-glow-accent">
                <TrendingDown className="w-4 h-4 text-app-accent" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1 text-[14px]">Est. Monthly Savings</h4>
                <p className="text-app-accent text-[28px] font-black mt-1 tracking-tight">
                  ${result.estimated_monthly_savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Waste Detected */}
            <div className="space-y-4">
              <h4 className="text-[18px] font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Waste Detected
              </h4>
              <div className="space-y-3">
                {result.waste_detected?.map((waste, idx) => (
                  <div key={idx} className="bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.1)] p-[16px] rounded-[10px] flex gap-4 items-start">
                    <span className="shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    </span>
                    <span className="text-[#f1f5f9] text-[14px] leading-relaxed">{waste}</span>
                  </div>
                ))}
                {(!result.waste_detected || result.waste_detected.length === 0) && (
                  <div className="text-app-textMuted text-[14px] italic">No waste detected. Good job!</div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h4 className="text-[18px] font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-app-accent" />
                Saving Recommendations
              </h4>
              <div className="space-y-3">
                {result.saving_recommendations?.map((rec, idx) => (
                  <div key={idx} className="bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.1)] p-[16px] rounded-[10px] flex gap-4 items-start">
                    <span className="shrink-0 mt-0.5">
                      <Zap className="w-4 h-4 text-app-accent" />
                    </span>
                    <span className="text-[#f1f5f9] text-[14px] leading-relaxed">{rec}</span>
                  </div>
                ))}
                {(!result.saving_recommendations || result.saving_recommendations.length === 0) && (
                  <div className="text-app-textMuted text-[14px] italic">No immediate recommendations.</div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
