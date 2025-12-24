
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MarketState, TradeSignal } from './types';
import { MAJOR_PAIRS, SESSION_PAIRS } from './constants';
import { analyzeTradeSignal } from './services/geminiService';
import { getLagosTime, isKillZone, calculateVolatilityScore, getActiveSessions, formatLagosTime } from './utils/marketLogic';
import SessionClock from './components/SessionClock';
import CurrencyStrengthMeter from './components/CurrencyStrengthMeter';
import Gauge from './components/Gauge';
import MarketHoursTimeline from './components/MarketHoursTimeline';
import ADRMeter from './components/ADRMeter';
import MiniChart from './components/MiniChart';

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
        { id: '1', time: '14:30', currency: 'USD', impact: 'High', event: 'Consumer Price Index (Inflation) Data', catalystScore: 8.5 },
        { id: '2', time: '16:00', currency: 'CAD', impact: 'Medium', event: 'Bank of Canada Press Conference', catalystScore: -4.2 },
      ],
      dxy: {
        price: 104 + Math.random(),
        trend: Math.random() > 0.5 ? 'Bullish' : 'Bearish'
      },
      volatility: calculateVolatilityScore(getLagosTime()),
      liquidityZones: [
        { type: 'OB', price: 1.0850, strength: 5, bias: 'Demand' },
        { type: 'FVG', price: 1.0920, strength: 3, bias: 'Supply' }
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
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Sticky Menu Button */}
      <div ref={menuRef} className={`fixed top-4 right-4 md:right-8 z-[110] transition-all duration-500 transform ${isSticky ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-20 opacity-0 scale-90 pointer-events-none'}`}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl shadow-[0_15px_40px_rgba(37,99,235,0.4)] border border-blue-400/30 active:scale-95 transition-all group relative overflow-hidden ${isMenuOpen ? 'ring-2 ring-white/50' : ''}`}>
          {!isMenuOpen && <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></div>}
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-sm transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`}></i>
          <span className="text-xs font-black uppercase tracking-[0.2em]">MENU</span>
        </button>

        <div className={`absolute top-16 right-0 w-80 bg-[#151518]/95 backdrop-blur-3xl border border-zinc-700/50 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.9)] p-6 space-y-6 transition-all duration-300 origin-top-right ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
             <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Global Terminal</span>
              <span className="text-xl font-mono font-black text-blue-400 mt-1 tabular-nums">{formatLagosTime(currentTime)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-bullseye text-yellow-500"></i> Active Asset
            </span>
            <div className="relative">
              <select value={selectedPair} onChange={(e) => { setSelectedPair(e.target.value); setIsMenuOpen(false); }} className="w-full bg-zinc-950 border border-zinc-800 text-xs font-black text-white px-5 py-4 rounded-2xl outline-none uppercase cursor-pointer appearance-none hover:border-blue-500/30 transition-all shadow-inner">
                {MAJOR_PAIRS.map(pair => <option key={pair} value={pair} className="bg-[#151518]">{pair}</option>)}
              </select>
              <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"></i>
            </div>
          </div>
          <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMenuOpen(false); }} className="w-full py-4 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl border border-zinc-800 transition-all flex items-center justify-center gap-3">
            <i className="fas fa-chevron-up"></i> RETURN TO TOP
          </button>
        </div>
      </div>

      <header ref={headerRef} className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
        <div className="flex items-start gap-4">
          <div className="flex flex-col gap-2">
            <button onClick={() => refreshMarketData(true)} className={`p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 text-blue-500 shadow-lg ${isRefreshing ? 'animate-spin' : ''}`} title="Sync Live Data">
              <i className={`fas fa-sync-alt ${isRefreshing ? 'animate-spin' : ''}`}></i>
            </button>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
              <span className="bg-blue-600 px-3 py-1 rounded-lg text-sm align-middle italic font-bold">FX-CORE</span>
              QUANT TERMINAL
            </h1>
            <p className="text-zinc-500 text-sm mt-2 font-medium uppercase tracking-widest">Institutional Smarter Trading Engine</p>
          </div>
        </div>
        <SessionClock selectedSession={selectedSession} onSelectSession={setSelectedSession} />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Pulse & ADR */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-card rounded-xl overflow-hidden shadow-lg border-l-4 border-blue-500">
            <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Market Power</h3>
              <button onClick={() => toggleSection('strength')} className="text-zinc-600 hover:text-zinc-400">
                <i className={`fas ${visibleSections.strength ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.strength && (
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed bg-zinc-900 p-2 rounded italic">
                  Note: Measures which currency is winning. Look to pair a <span className="text-green-400 font-bold">Strong</span> currency with a <span className="text-red-400 font-bold">Weak</span> one for the easiest trades.
                </p>
                <CurrencyStrengthMeter data={marketState.currencies} />
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-xl border-l-4 border-orange-500 overflow-hidden">
             <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Daily Movement</h3>
              <button onClick={() => toggleSection('adr')} className="text-zinc-600 hover:text-zinc-400">
                <i className={`fas ${visibleSections.adr ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.adr && (
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed bg-zinc-900 p-2 rounded italic">
                  Note: Shows if the market has moved too much. If it's near <span className="text-red-500 font-bold">100%</span>, the move is likely over for the day—don't enter now!
                </p>
                <ADRMeter data={marketState.adr} />
              </div>
            )}
          </div>
          
          <div className="bg-card rounded-xl shadow-xl border-l-4 border-yellow-500">
            <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Choose Asset</h3>
              <button onClick={() => toggleSection('target')} className="text-zinc-600 hover:text-zinc-400">
                <i className={`fas ${visibleSections.target ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.target && (
              <div className="p-5">
                <div className="grid grid-cols-2 gap-2">
                  {MAJOR_PAIRS.map(pair => (
                    <button key={pair} onClick={() => setSelectedPair(pair)} className={`px-3 py-2.5 text-[11px] font-black rounded-lg border transition-all ${selectedPair === pair ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
                      {pair}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Center: The Brain */}
        <main className="lg:col-span-6 space-y-6">
          <div className="bg-card rounded-2xl shadow-2xl relative overflow-hidden border border-zinc-800/50">
            <div className="p-8 pb-4 flex items-center justify-between">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                  TRADING BRAIN: <span className="text-blue-500">{selectedPair}</span>
                </h2>
                {signal?.smtDivergence && (
                  <span className="text-[9px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full mt-2 self-start animate-pulse uppercase tracking-[0.2em]">Big Money Divergence Detected</span>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => toggleSection('analysis')} className="text-zinc-600 hover:text-zinc-400">
                  <i className={`fas ${visibleSections.analysis ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
              </div>
            </div>

            {visibleSections.analysis && (
              <div className="px-8 pb-8 pt-4 space-y-8 relative">
                {isAnalyzing && <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md z-20 flex items-center justify-center">
                  <span className="text-blue-400 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Running Institutional Scan...</span>
                </div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-6">
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed bg-zinc-900 p-3 rounded border border-zinc-800 italic">
                      Guide: Only trade when the confidence is above <span className="text-green-400 font-bold">80%</span>. A "Safe" setup means institutional banks are moving the same way.
                    </p>
                    {signal && <Gauge value={signal.score} label="Trade Confidence" />}
                    {signal && (
                      <div className={`p-6 rounded-2xl border-4 text-center transition-all ${signal.score >= 80 ? 'bg-green-500 text-black border-green-300 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : signal.score <= 30 ? 'bg-red-500 text-black border-red-300' : 'bg-zinc-800 text-zinc-100 border-zinc-700'}`}>
                        <span className="text-3xl font-black italic uppercase tracking-tighter block leading-none">{signal.action}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <MiniChart pair={selectedPair} tp={signal?.tp} sl={signal?.sl} currentPrice={marketState.dxy.price / 100} />
                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800">
                      <span className="text-[10px] font-black text-zinc-500 block mb-3 uppercase tracking-widest">Why This Trade?</span>
                      <ul className="space-y-2">
                        {signal?.reasoning.map((r, i) => (
                          <li key={i} className="text-[11px] flex items-start gap-2 group">
                            <i className="fas fa-info-circle text-blue-500 mt-0.5 text-[10px]"></i>
                            <span className="text-zinc-300 font-medium">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border-t-4 border-blue-600 shadow-2xl overflow-hidden">
            <div className="p-6 bg-zinc-900/50 flex items-center justify-between border-b border-zinc-800/50">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <i className="fas fa-university text-blue-500"></i> Big Bank Buy & Sell Zones
              </h3>
              <button onClick={() => toggleSection('liquidity')} className="text-zinc-600 hover:text-zinc-400">
                <i className={`fas ${visibleSections.liquidity ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.liquidity && (
              <div className="p-6 space-y-4">
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed bg-zinc-900 p-3 rounded border border-zinc-800 italic">
                  Note: These are hidden price levels where banks have millions in orders. If price hits a <span className="text-green-400 font-bold">Buying Zone</span>, expect a bounce up.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketState.liquidityZones.map((zone, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${zone.bias === 'Supply' ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'}`}>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${zone.bias === 'Supply' ? 'text-red-400' : 'text-green-400'}`}>
                          {zone.type === 'OB' ? 'Strong Bank Level' : 'Price Imbalance'} — {zone.bias === 'Supply' ? 'Selling Zone' : 'Buying Zone'}
                        </span>
                        <span className="text-lg font-mono font-black text-white">{zone.price.toFixed(4)}</span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: zone.strength }).map((_, i) => <div key={i} className={`w-1 h-3 rounded-full ${zone.bias === 'Supply' ? 'bg-red-500' : 'bg-green-500'}`} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Side: Catalyst & Crowd */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-card rounded-xl border-t-2 border-purple-500 shadow-xl overflow-hidden">
            <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Public Opinion</h3>
              <button onClick={() => toggleSection('crowd')} className="text-zinc-600 hover:text-zinc-400">
                <i className={`fas ${visibleSections.crowd ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.crowd && currentSentiment && (
              <div className="p-6 space-y-4">
                <p className="text-[10px] text-zinc-500 font-medium bg-zinc-900 p-2 rounded italic">
                  Strategy: Do the opposite of the crowd. If most people are <span className="text-green-400 font-bold">Buying</span>, you should look for <span className="text-red-400 font-bold">Selling</span> opportunities.
                </p>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-green-400">Buying {currentSentiment.long}%</span>
                  <span className="text-red-400">Selling {currentSentiment.short}%</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800">
                  <div className="bg-green-500 h-full" style={{ width: `${currentSentiment.long}%` }}></div>
                  <div className="bg-red-500 h-full" style={{ width: `${currentSentiment.short}%` }}></div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-center text-[10px] font-black text-zinc-400 uppercase">
                   Crowd Status: {currentSentiment.long > 70 ? 'Extreme Greed (Sell Now)' : currentSentiment.short > 70 ? 'Extreme Fear (Buy Now)' : 'Normal'}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border-t-2 border-red-500 shadow-xl overflow-hidden">
             <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">World News Tracker</h3>
              <button onClick={() => toggleSection('news')} className="text-zinc-600 hover:text-zinc-400">
                <i className={`fas ${visibleSections.news ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
            </div>
            {visibleSections.news && (
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-zinc-500 font-medium bg-zinc-900 p-2 rounded italic">
                  Note: Green scores (+) mean the currency is getting stronger. Red scores (-) mean it is getting weaker.
                </p>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {marketState.news.map(n => (
                      <div key={n.id} className="text-[11px] bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-red-500">{n.time}</span>
                          <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded">{n.currency}</span>
                        </div>
                        <p className="text-zinc-300 font-medium">{n.event}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[9px] font-bold text-zinc-600 uppercase">Impact Score</span>
                          <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full ${n.catalystScore! > 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.abs(n.catalystScore!) * 10}%`, marginLeft: n.catalystScore! > 0 ? '50%' : `${50 - Math.abs(n.catalystScore!) * 5}%` }}></div>
                          </div>
                          <span className={`text-[9px] font-black ${n.catalystScore! > 0 ? 'text-green-500' : 'text-red-500'}`}>{n.catalystScore! > 0 ? '+' : ''}{n.catalystScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-zinc-800 shadow-xl overflow-hidden">
             <div className="p-4 bg-zinc-900/50 flex justify-between items-center">
               <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Dollar Strength</h3>
               <button onClick={() => toggleSection('dollar')} className="text-zinc-600 hover:text-zinc-400">
                <i className={`fas ${visibleSections.dollar ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              </button>
             </div>
             {visibleSections.dollar && (
               <div className="p-5 space-y-4">
                  <p className="text-[10px] text-zinc-500 font-medium bg-zinc-900 p-2 rounded italic">
                    King Dollar: If the Dollar is <span className="text-green-400 font-bold">Strong</span>, EURUSD and Gold usually move <span className="text-red-400 font-bold">DOWN</span>.
                  </p>
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-500 uppercase">DXY Index</span>
                      <span className="text-xl font-mono font-black text-white">{marketState.dxy.price.toFixed(2)}</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded ${marketState.dxy.trend === 'Bullish' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{marketState.dxy.trend.toUpperCase()}</span>
                  </div>
                  <button onClick={() => runAnalysis()} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                    Search Best Trades Now
                  </button>
               </div>
             )}
          </div>
        </aside>
      </div>

      <div className="bg-card rounded-2xl border-t-4 border-sky-500 shadow-2xl overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/50">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
            <i className="fas fa-clock text-sky-500"></i> Best Times To Trade
          </h3>
          <button onClick={() => toggleSection('timeline')} className="text-zinc-600 hover:text-zinc-400">
            <i className={`fas ${visibleSections.timeline ? 'fa-eye' : 'fa-eye-slash'}`}></i>
          </button>
        </div>
        {visibleSections.timeline && (
          <div className="p-6 space-y-4">
            <p className="text-[10px] text-zinc-500 font-medium bg-zinc-900 p-2 rounded italic text-center max-w-lg mx-auto">
              Pro Tip: The <span className="text-orange-400 font-bold">Overlap</span> is the most profitable time because London and New York are both trading!
            </p>
            <MarketHoursTimeline />
          </div>
        )}
      </div>

      <footer className="text-center py-12 text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] opacity-40">
        Quant Core Terminal v3.2 // Ultimate Beginner Profit System
      </footer>
    </div>
  );
};

export default App;
