
import React from 'react';

interface MiniChartProps {
  pair: string;
  tp?: number;
  sl?: number;
  currentPrice?: number;
}

const MiniChart: React.FC<MiniChartProps> = ({ pair, tp, sl, currentPrice = 1.0885 }) => {
  if (!tp || !sl) {
    return (
      <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6 h-[220px] flex items-center justify-center">
        <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest animate-pulse">Scanning Prices...</span>
      </div>
    );
  }

  // Calculate percentage progress toward TP vs SL for the visual map
  // We'll normalize the current price between SL and TP for visualization
  const range = Math.abs(tp - sl);
  const diff = currentPrice - sl;
  const position = (diff / range) * 100;
  const clampedPosition = Math.max(15, Math.min(85, position));

  return (
    <div className="relative bg-zinc-950 rounded-xl border border-zinc-800 p-5 overflow-hidden shadow-inner">
      <div className="flex justify-between items-start mb-8">
        <div>
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Target Asset</span>
          <h4 className="text-xl font-mono font-black text-white">{pair}</h4>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest block mb-1">Live Price</span>
          <span className="text-xl font-mono font-black text-blue-400">{currentPrice.toFixed(5)}</span>
        </div>
      </div>

      {/* Visual Trade Map */}
      <div className="relative h-24 mb-10 px-4">
        {/* The Track */}
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-zinc-800 -translate-y-1/2 rounded-full shadow-inner"></div>
        
        {/* Safety Limit Point (Left/Start) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-5 h-5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] border-4 border-zinc-950 mb-2"></div>
          <span className="text-[9px] font-black text-red-500 uppercase mb-1">Safety Limit</span>
          <span className="text-[11px] font-mono font-bold text-white bg-zinc-900 px-2 rounded">{sl.toFixed(5)}</span>
        </div>

        {/* Profit Goal Point (Right/End) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-5 h-5 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] border-4 border-zinc-950 mb-2"></div>
          <span className="text-[9px] font-black text-green-500 uppercase mb-1">Profit Goal</span>
          <span className="text-[11px] font-mono font-bold text-white bg-zinc-900 px-2 rounded">{tp.toFixed(5)}</span>
        </div>

        {/* Current Position Marker */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out z-10"
          style={{ left: `${clampedPosition}%` }}
        >
          <div className="w-1.5 h-10 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] rounded-full mb-1"></div>
          <div className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded-md whitespace-nowrap -translate-x-1/2 uppercase tracking-tighter shadow-lg ring-2 ring-blue-400/30">
            PRICE IS HERE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-500/5 p-3 rounded-xl border border-green-500/20">
           <span className="text-[9px] font-black text-green-500 uppercase block mb-1">Potential Gain</span>
           <span className="text-lg font-mono font-bold text-green-400">+{Math.abs(Math.round((tp - currentPrice) * 10000))} Pips</span>
        </div>
        <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/20">
           <span className="text-[9px] font-black text-red-500 uppercase block mb-1">Potential Risk</span>
           <span className="text-lg font-mono font-bold text-red-400">-{Math.abs(Math.round((currentPrice - sl) * 10000))} Pips</span>
        </div>
      </div>

      <p className="mt-5 text-[10px] text-zinc-500 font-medium italic text-center bg-zinc-900/30 p-3 rounded border border-zinc-800/50">
        Summary: If price hits the <span className="text-green-500 font-bold">Goal</span>, you collect profit. If it hits the <span className="text-red-500 font-bold">Limit</span>, we exit to keep your money safe.
      </p>
    </div>
  );
};

export default MiniChart;
