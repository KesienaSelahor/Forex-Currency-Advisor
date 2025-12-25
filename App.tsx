
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MarketState, TradeSignal } from './types.ts';
import { MAJOR_PAIRS, SESSIONS } from './constants.ts';
import { analyzeTradeSignal } from './services/geminiService.ts';
import { getLagosTime, isKillZone, calculateVolatilityScore, getActiveSessions, formatLagosTime } from './utils/marketLogic.ts';
import SessionClock from './components/SessionClock.tsx';
import CurrencyStrengthMeter from './components/CurrencyStrengthMeter.tsx';
import Gauge from './components/Gauge.tsx';
import MarketHoursTimeline from './components/MarketHoursTimeline.tsx';
import ADRMeter from './components/ADRMeter.tsx';
import MiniChart from './components/MiniChart.tsx';

const App: React.FC = () => {
  const [marketState, setMarketState] = useState<MarketState | null>(null);
  const [selectedPair, setSelectedPair] = useState<string>('EURUSD');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(getLagosTime());

  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    strength: true,
    adr: true,
    target: true,
    news: true,
    analysis: true,
    liquidity: true,
    crowd: true,
    dollar: true,
    timeline: true
  });

  const toggleSection = (section: string) => {
    setVisibleSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const reloadApp = () => {
    window.location.reload();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom;
        setIsSticky(headerBottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(getLagosTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const active = getActiveSessions(getLagosTime()).find(s => s.isOpen);
    if (active) setSelectedSession(active.name);
    else setSelectedSession('London');
  }, []);

  const refreshMarketData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    
    const mockState: MarketState = {
      currencies: [
        { symbol: 'USD', strength: Math.random() * 200 - 100, change: 1.2 },
        { symbol: 'EUR', strength: Math.random() * 200 - 100, change: -0.8 },
        { symbol: 'GBP', strength: Math.random() * 200 - 100, change: 0.3 },
        { symbol: 'JPY', strength: Math.random() * 200 - 100, change: -2.1 },
        { symbol: 'AUD', strength: Math.random() * 200 - 100, change: 0.1 },
        { symbol: 'CAD', strength: Math.random() * 200 - 100, change: 0.5 },
        { symbol: 'XAU', strength: Math.random() * 200 - 100, change: 1.1 },
      ],
      sentiment: MAJOR_PAIRS.map(p => ({
        pair: p,
        long: Math.floor(Math.random() * 60) + 20,
        short: 0
      })).map(s => ({ ...s, short: 100 - s.long })),
      news: [
        { id: '1', time: '14:30', currency: 'USD', impact: 'High', event: 'Consumer Price Inflation Data', catalystScore: 8.5 },
        { id: '2', time: '16:00', currency: 'CAD', impact: 'Medium', event: 'Bank of Canada Interest Rate News', catalystScore: -4.2 },
      ],
      dxy: {
        price: 104 + Math.random(),
        trend: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
      },
      volatility: calculateVolatilityScore(getLagosTime()),
      liquidityZones: [
        { type: 'Institutional Buy Zone', price: 1.0850, strength: 5, bias: 'Buying Zone' },
        { type: 'Unfilled Price Gap', price: 1.0920, strength: 3, bias: 'Selling Zone' }
      ],
      adr: {
        currentPips: 85,
        averagePips: 100,
        percentageUsed: 85
      }
    };
    
    setMarketState(mockState);
    if (isManual) setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  useEffect(() => {
    refreshMarketData();
    const interval = setInterval(refreshMarketData, 60000);
    return () => clearInterval(interval);
  }, [refreshMarketData]);

  const runAnalysis = useCallback(async () => {
    if (!marketState) return;
    setIsAnalyzing(true);
    const result = await analyzeTradeSignal(
      selectedPair, 
      marketState, 
      isKillZone(getLagosTime()), 
      calculateVolatilityScore(getLagosTime())
    );
    setSignal(result);
    setIsAnalyzing(false);
  }, [selectedPair, marketState]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  if (!marketState) return <div className="h-screen flex items-center justify-center text-zinc-500 font-mono uppercase tracking-widest">Booting Trading Core...</div>;

  const currentSentiment = marketState.sentiment.find(s => s.pair === selectedPair);

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
      {/* Enhanced Sticky Menu */}
      <div ref={menuRef} className={`fixed top-4 right-4 md:right-8 z-[110] transition-all duration-500 transform ${isSticky ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-90 pointer-events-none'}`}>
        <div className="flex flex-col items-end gap-3">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center gap-3 bg-zinc-900/90 backdrop-blur-lg hover:bg-zinc-800 text-white px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-zinc-700/50 active:scale-95 transition-all group relative overflow-hidden ${isMenuOpen ? 'ring-2 ring-blue-500/50' : ''}`}>
             <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-compass'} text-blue-500 transition-transform duration-500 ${isMenuOpen ? 'rotate-90' : ''}`}></i>
            <span className="text-xs font-black uppercase tracking-[0.2em]">MENU</span>
          </button>

          <div className={`w-80 bg-[#0f0f11]/95 backdrop-blur-3xl border border-zinc-800 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.9)] p-6 space-y-6 transition-all duration-300 origin-top-right ${isMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}`}>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Global Terminal</span>
                <span className="text-xl font-mono font-black text-blue-500 mt-1 tabular-nums">{formatLagosTime(currentTime)}</span>
              </div>
              <button onClick={reloadApp} className="p-2.5 bg-zinc-900 rounded-xl text-zinc-500 hover:text-red-500 border border-zinc-800 transition-colors" title="Reload System">
                <i className="fas fa-power-off"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Quick Sessions</span>
              <div className="grid grid-cols-2 gap-2">
                {SESSIONS.map(s => (
                  <button key={s.name} onClick={() => { setSelectedSession(s.name); setIsMenuOpen(false); }} className={`px-3 py-2 text-[9px] font-black rounded-lg border transition-all ${selectedSession === s.name ? 'bg-blue-600 text-white border-blue-500' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Target Assets</span>
               <div className="grid grid-cols-4 gap-2">
                {MAJOR_PAIRS.slice(0, 8).map(pair => (
                  <button key={pair} onClick={() => { setSelectedPair(pair); setIsMenuOpen(false); }} className={`p-2 text-[9px] font-black rounded-lg border transition-all ${selectedPair === pair ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                    {pair.replace('USD', '')}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); setIsMenuOpen(false); }} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3">
              <i className="fas fa-bolt"></i> SEE LIVE ACTION
            </button>
          </div>
        </div>
      </div>

      <header ref={headerRef} className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
        <div className="flex items-start gap-4">
          <div className="flex flex-col gap-2">
            <button onClick={() => refreshMarketData(true)} className={`p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 text-blue-500 shadow-lg ${isRefreshing ? 'animate-spin' : ''}`} title="Refresh Market Data">
              <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
            </button>
            <button onClick={reloadApp} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95 text-zinc-600" title="Full System Reset">
              <i className="fas fa-redo-alt"></i>
            </button>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
              <span className="bg-blue-600 px-3 py-1 rounded-lg text-sm align-middle italic font-bold">FX-CORE</span>
              QUANT TERMINAL
            </h1>
            <p className="text-zinc-500 text-sm mt-2 font-medium uppercase tracking-widest">Institutional Profit & Logic Engine</p>
          </div>
        </div>
        <SessionClock selectedSession={selectedSession} onSelectSession={setSelectedSession} />
      </header>

      {/* Primary Market Context Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Information Bars */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-card rounded-xl overflow-hidden shadow-lg border-l-4 border-blue-500">
            <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Market Power</h3>
              <button onClick={() => toggleSection('strength')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <i className={`fas ${visibleSections.strength ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.strength && (
              <div className="p-4 space-y-4">
                <CurrencyStrengthMeter data={marketState.currencies} />
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-xl border-l-4 border-orange-500 overflow-hidden">
             <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Daily Movement</h3>
              <button onClick={() => toggleSection('adr')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <i className={`fas ${visibleSections.adr ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.adr && (
              <div className="p-4">
                <ADRMeter data={marketState.adr} />
              </div>
            )}
          </div>
          
          <div className="bg-card rounded-xl shadow-xl border-l-4 border-yellow-500">
            <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Asset Selector</h3>
              <button onClick={() => toggleSection('target')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <i className={`fas ${visibleSections.target ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.target && (
              <div className="p-5">
                <div className="grid grid-cols-2 gap-2">
                  {MAJOR_PAIRS.map(pair => (
                    <button key={pair} onClick={() => setSelectedPair(pair)} className={`px-3 py-2.5 text-[11px] font-black rounded-lg border transition-all ${selectedPair === pair ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}>
                      {pair}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Center: Market Infrastructure */}
        <main className="lg:col-span-6 space-y-6">
          <div className="bg-card rounded-2xl border-t-4 border-sky-500 shadow-2xl overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/50">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <i className="fas fa-clock text-sky-500"></i> Best Times To Trade
              </h3>
              <button onClick={() => toggleSection('timeline')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <i className={`fas ${visibleSections.timeline ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.timeline && (
              <div className="p-6 space-y-6">
                <MarketHoursTimeline />
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border-t-4 border-blue-600 shadow-2xl overflow-hidden">
            <div className="p-6 bg-zinc-900/50 flex items-center justify-between border-b border-zinc-800/50">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <i className="fas fa-university text-blue-500"></i> Big Bank Accumulation Zones
              </h3>
              <button onClick={() => toggleSection('liquidity')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <i className={`fas ${visibleSections.liquidity ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.liquidity && (
              <div className="p-6 space-y-4">
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed bg-zinc-900 p-3 rounded border border-zinc-800 italic">
                  Observation: Banks wait for price to hit these zones before entering massive trades.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketState.liquidityZones.map((zone, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center transition-all hover:scale-[1.02] ${zone.bias === 'Selling Zone' ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${zone.bias === 'Selling Zone' ? 'text-red-400' : 'text-green-400'}`}>
                          {zone.type} — {zone.bias}
                        </span>
                        <span className="text-lg font-mono font-black text-white">{zone.price.toFixed(4)}</span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: zone.strength }).map((_, i) => <div key={i} className={`w-1 h-3 rounded-full ${zone.bias === 'Selling Zone' ? 'bg-red-500' : 'bg-green-500'}`} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Side: Environmental Data */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-card rounded-xl border border-zinc-800 shadow-xl overflow-hidden">
             <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
               <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Dollar Index Context</h3>
               <button onClick={() => toggleSection('dollar')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <i className={`fas ${visibleSections.dollar ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
             </div>
             {visibleSections.dollar && (
               <div className="p-5 space-y-4">
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-500 uppercase">DXY Value</span>
                      <span className="text-xl font-mono font-black text-white">{marketState.dxy.price.toFixed(2)}</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded shadow-sm ${marketState.dxy.trend === 'Bullish' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{marketState.dxy.trend.toUpperCase()}</span>
                  </div>
               </div>
             )}
          </div>

          <div className="bg-card rounded-xl border-t-2 border-red-500 shadow-xl overflow-hidden">
             <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Macro News Pulse</h3>
              <button onClick={() => toggleSection('news')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <i className={`fas ${visibleSections.news ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.news && (
              <div className="p-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {marketState.news.map(n => (
                      <div key={n.id} className="text-[11px] bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-red-500">{n.time}</span>
                          <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded">{n.currency}</span>
                        </div>
                        <p className="text-zinc-300 font-medium leading-snug">{n.event}</p>
                      </div>
                    ))}
                  </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border-t-2 border-purple-500 shadow-xl overflow-hidden">
            <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Public Sentiment</h3>
              <button onClick={() => toggleSection('crowd')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <i className={`fas ${visibleSections.crowd ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.crowd && currentSentiment && (
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-green-400">Buying {currentSentiment.long}%</span>
                  <span className="text-red-400">Selling {currentSentiment.short}%</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800">
                  <div className="bg-green-500 h-full" style={{ width: `${currentSentiment.long}%` }}></div>
                  <div className="bg-red-500 h-full" style={{ width: `${currentSentiment.short}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* FINAL SECTION: Live Analysis & Trade Verdict (At the Bottom) */}
      <div id="final-action" className="mt-12">
        <div className="bg-card rounded-3xl shadow-2xl relative overflow-hidden border-2 border-blue-500/40 bg-gradient-to-b from-[#1a1a1e] to-[#0a0a0c]">
          <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-1">CONFLUENCE MASTER SUMMARY</span>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                LIVE VERDICT: <span className="text-blue-500">{selectedPair}</span>
              </h2>
            </div>
            <div className="flex gap-4">
              <button onClick={() => runAnalysis()} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg active:scale-95">
                RE-CALCULATE ANALYSIS
              </button>
              <button onClick={() => toggleSection('analysis')} className="text-zinc-600 hover:text-zinc-400">
                <i className={`fas ${visibleSections.analysis ? 'fa-eye' : 'fa-eye-slash'} text-xl`}></i>
              </button>
            </div>
          </div>

          {visibleSections.analysis && (
            <div className="p-8 space-y-8 relative">
              {isAnalyzing && <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-20 flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
                  <p className="text-blue-400 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Running Institutional Algorithm...</p>
                </div>
              </div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                <div className="space-y-8">
                  {signal && <Gauge value={signal.score} label="Overall Confidence" />}
                  
                  <div className={`p-10 rounded-3xl border-4 text-center transition-all ${signal?.score && signal.score >= 80 ? 'bg-green-500 text-black border-green-300 shadow-[0_0_60px_rgba(34,197,94,0.5)]' : signal?.score && signal.score <= 30 ? 'bg-red-500 text-black border-red-300' : 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-inner'}`}>
                    <span className="text-[11px] font-black uppercase tracking-widest block mb-1 opacity-70">EXECUTION SIGNAL</span>
                    <span className="text-5xl font-black italic uppercase tracking-tighter block leading-none">{signal?.action || 'STANDBY'}</span>
                  </div>

                  {/* HIGH-IMPACT LIVE ACTION BLOCK */}
                  <div className="bg-zinc-950 p-8 rounded-3xl border border-blue-500/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <i className="fas fa-terminal text-8xl"></i>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
                      <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest">TRADER LIVE SUMMARY:</h4>
                    </div>
                    <p className="text-base font-bold leading-relaxed text-zinc-100">
                      {signal?.score && signal.score >= 80 
                        ? `ACTION NOW: Strong Institutional alignment detected. The ${selectedPair} is ready. Enter at market price. Use Target: ${signal.tp.toFixed(5)} and Exit: ${signal.sl.toFixed(5)}.`
                        : signal?.score && signal.score >= 50 
                        ? `ACTION: Partial alignment. Enter with reduced risk (half lot size). Monitor Dollar trend for next 15 minutes before committing fully.`
                        : `NO ACTION: High risk period or conflicting data. Stay on the sidelines. The Quant Core suggests waiting for the next session overlap for a clearer path.`
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <MiniChart pair={selectedPair} tp={signal?.tp} sl={signal?.sl} currentPrice={marketState.dxy.price / 100} />
                  <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 shadow-inner">
                    <span className="text-[10px] font-black text-zinc-600 block mb-4 uppercase tracking-[0.2em]">Institutional Reasoning:</span>
                    <ul className="space-y-3">
                      {signal?.reasoning.map((r, i) => (
                        <li key={i} className="text-[12px] flex items-start gap-3 group">
                          <i className="fas fa-shield-alt text-blue-500 mt-1 text-[10px]"></i>
                          <span className="text-zinc-200 font-semibold leading-snug">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center py-12 text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
        Quant Core Terminal v3.4 // Deploy-Ready Institutional Engine
      </footer>
    </div>
  );
};

export default App;
