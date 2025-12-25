
import React from 'react';
import { ADRInfo } from '../types.ts';

interface Props {
  data: ADRInfo;
}

const ADRMeter: React.FC<Props> = ({ data }) => {
  const isExhausted = data.percentageUsed >= 90;
  
  return (
    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-inner space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Market Energy Used</span>
        <span className={`text-xs font-mono font-bold ${isExhausted ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
          {data.percentageUsed}%
        </span>
      </div>
      
      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
        <div 
          className={`h-full transition-all duration-1000 ${isExhausted ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
          style={{ width: `${Math.min(data.percentageUsed, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-[9px] font-black text-zinc-500 uppercase tracking-tighter">
        <span className="bg-zinc-900 px-2 py-1 rounded">MOVED: {data.currentPips} POINTS</span>
        <span className="bg-zinc-900 px-2 py-1 rounded">DAILY LIMIT: {data.averagePips} POINTS</span>
      </div>

      <p className="text-[9px] text-zinc-500 italic bg-zinc-900/50 p-2 rounded border border-zinc-800/30">
        Tip: If this is near <span className="text-red-500 font-bold">100%</span>, don't enter new trades. The market is tired and likely to rest or reverse.
      </p>
    </div>
  );
};

export default ADRMeter;
