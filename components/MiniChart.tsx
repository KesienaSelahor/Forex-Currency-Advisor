
import React from 'react';

interface MiniChartProps {
  pair: string;
  tp?: number;
  sl?: number;
  currentPrice?: number;
}

const MiniChart: React.FC<MiniChartProps> = ({ pair, tp, sl, currentPrice = 1.0885 }) => {
  // If no TP/SL, show a placeholder state
  if (!tp || !sl) {
    return (
      <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6 h-[220px] flex items-center justify-center">
        <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Awaiting Analysis...</span>
      </div>
    );
  }

  // Calculate percentage progress toward TP vs SL for the visual map
  // We'll normalize the current price between SL and TP for visualization
  const range = Math.abs(tp - sl);
  const position = ((currentPrice - sl) / range) * 100;
  const clampedPosition = Math.max(10, Math.min(90, position));

  return (
    <div className="relative bg-zinc-950 rounded-xl border border-zinc-800 p-5 overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Live Asset Map</span>
          <h4 className="text-xl font-mono font-black text-white">{pair}</h4>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-1">Market Price</span>
          <span className="text-xl font-mono font-black text-blue-400">{currentPrice.toFixed(5)}</span>
        </div>
      </div>

      {/* Visual Trade Map */}
      <div className="relative h-24 mb-8 px-2">
        {/* The Track */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -translate-y-1/2 rounded-full"></div>
        
        {/* Safety Limit Point (Left/Start) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] border-2 border-zinc-950 mb-2"></div>
          <span className="text-[10px] font-black text-red-500 uppercase">Exit Price</span>
          <span className="text-[11px] font-mono font-bold text-white">{sl.toFixed(5)}</span>
        </div>

        {/* Profit Goal Point (Right/End) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] border-2 border-zinc-950 mb-2"></div>
          <span className="text-[10px] font-black text-green-500 uppercase">Target Price</span>
          <span className="text-[11px] font-mono font-bold text-white">{tp.toFixed(5)}</span>
        </div>

        {/* Current Position Marker */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{ left: `${clampedPosition}%` }}
        >
          <div className="w-1 h-8 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] rounded-full mb-1"></div>
          <div className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded whitespace-nowrap -translate-x-1/2 uppercase tracking-tighter">
            YOU ARE HERE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
           <span className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Profit If Hit</span>
           <span className="text-green-400 font-mono font-bold">+{Math.abs(Math.round((tp - currentPrice) * 10000))} Pips</span>
        </div>
        <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
           <span className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Risk If Hit</span>
           <span className="text-red-400 font-mono font-bold">-{Math.abs(Math.round((currentPrice - sl) * 10000))} Pips</span>
        </div>
      </div>

      <p className="mt-4 text-[9px] text-zinc-500 font-medium italic text-center bg-zinc-900/30 p-2 rounded">
        Goal: If the price moves to the <span className="text-green-500 font-bold">Target</span>, you win. If it falls to the <span className="text-red-500 font-bold">Exit</span>, the trade closes to protect you.
      </p>
    </div>
  );
};

export default MiniChart;
