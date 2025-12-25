import React, { useState, useEffect } from 'react';
import { getLagosTime, formatLagosTime, getActiveSessions, isOverlapActive } from '../utils/marketLogic.ts';

interface Props {
  selectedSession: string;
  onSelectSession: (session: string) => void;
}

const SessionClock: React.FC<Props> = ({ selectedSession, onSelectSession }) => {
  const [time, setTime] = useState(getLagosTime());

  useEffect(() => {
    const timer = setInterval(() => setTime(getLagosTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sessions = getActiveSessions(time);
  const overlapActive = isOverlapActive(time);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-xl gap-6 shadow-inner">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-zinc-600 tracking-[0.3em] uppercase">Lagos/Market Time</span>
        <span className="text-4xl font-mono font-bold text-white tabular-nums tracking-tighter">
          {formatLagosTime(time)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {sessions.map(s => (
          <button 
            key={s.name} 
            onClick={() => onSelectSession(s.name)}
            className={`px-3 py-2 rounded-lg border text-[10px] font-black transition-all duration-300 flex items-center gap-2 ${selectedSession === s.name ? 'ring-2 ring-offset-2 ring-offset-black ring-white' : ''} ${s.isOpen ? 'bg-zinc-800 border-green-500/50 text-green-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${s.isOpen ? 'bg-green-400 animate-pulse' : 'bg-zinc-700'}`}></div>
            {s.name.toUpperCase()}
          </button>
        ))}
        
        <button
          onClick={() => onSelectSession('Overlap')}
          className={`px-3 py-2 rounded-lg border text-[10px] font-black transition-all duration-300 flex items-center gap-2 ${selectedSession === 'Overlap' ? 'ring-2 ring-offset-2 ring-offset-black ring-white' : ''} ${overlapActive ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}
        >
          <i className={`fas fa-bolt ${overlapActive ? 'text-orange-400 animate-bounce' : 'text-zinc-700'}`}></i>
          OVERLAP
        </button>
      </div>
    </div>
  );
};

export default SessionClock;