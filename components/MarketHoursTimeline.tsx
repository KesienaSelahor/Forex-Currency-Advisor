import React, { useState, useEffect, useMemo } from 'react';
import { SESSIONS, TIMEZONES } from '../constants.ts';

const MarketHoursTimeline: React.FC = () => {
  // Detect user's local timezone on mount
  const [selectedTz, setSelectedTz] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      return "UTC";
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate the time in the selected timezone
  const tzDate = useMemo(() => {
    return new Date(currentTime.toLocaleString("en-US", { timeZone: selectedTz }));
  }, [currentTime, selectedTz]);

  // Calculate the timezone offset in hours relative to UTC
  const tzOffset = useMemo(() => {
    const utcStr = currentTime.toLocaleString("en-US", { timeZone: "UTC" });
    const tzStr = currentTime.toLocaleString("en-US", { timeZone: selectedTz });
    const utcDate = new Date(utcStr);
    const targetDate = new Date(tzStr);
    return (targetDate.getTime() - utcDate.getTime()) / 3600000;
  }, [currentTime, selectedTz]);

  const currentHour = tzDate.getHours();
  const currentMinute = tzDate.getMinutes();
  const totalMinutes = currentHour * 60 + currentMinute;
  const percentage = (totalMinutes / 1440) * 100;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const renderSessionBar = (session: typeof SESSIONS[0]) => {
    // Shift the session hours by the timezone offset
    let startHour = (session.start + tzOffset) % 24;
    if (startHour < 0) startHour += 24;
    
    let endHour = (session.end + tzOffset) % 24;
    if (endHour < 0) endHour += 24;

    const startMin = startHour * 60;
    const endMin = endHour * 60;

    // Handle wrap around
    if (startMin > endMin) {
      return (
        <>
          <div 
            className="absolute h-6 rounded-sm opacity-80 border-t border-white/10 transition-all duration-500"
            style={{ 
              left: `${(startMin / 1440) * 100}%`, 
              width: `${((1440 - startMin) / 1440) * 100}%`,
              backgroundColor: session.color 
            }}
          />
          <div 
            className="absolute h-6 rounded-sm opacity-80 border-t border-white/10 transition-all duration-500"
            style={{ 
              left: '0%', 
              width: `${(endMin / 1440) * 100}%`,
              backgroundColor: session.color 
            }}
          />
        </>
      );
    }

    return (
      <div 
        className="absolute h-6 rounded-sm opacity-80 border-t border-white/10 transition-all duration-500"
        style={{ 
          left: `${(startMin / 1440) * 100}%`, 
          width: `${((endMin - startMin) / 1440) * 100}%`,
          backgroundColor: session.color 
        }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex items-center gap-2">
            <i className="fas fa-globe text-sky-500 text-xs"></i>
            <select 
              value={selectedTz}
              onChange={(e) => setSelectedTz(e.target.value)}
              className="bg-transparent text-[11px] font-black text-white uppercase outline-none cursor-pointer"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value} className="bg-zinc-900 text-white">
                  {tz.label}
                </option>
              ))}
              {!TIMEZONES.some(t => t.value === selectedTz) && (
                <option value={selectedTz} className="bg-zinc-900 text-white">
                  Local: {selectedTz.split('/').pop()?.replace('_', ' ')}
                </option>
              )}
            </select>
          </div>
          <div className="text-[10px] font-black text-zinc-500 bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800">
            OFFSET: {tzOffset >= 0 ? '+' : ''}{tzOffset}H
          </div>
        </div>

        <div className="flex gap-4">
           {SESSIONS.map(s => (
            <div key={s.name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></div>
              <span className="text-[9px] font-black text-zinc-400 uppercase">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative h-56 bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-4 select-none overflow-hidden">
        {/* Time Grid Lines */}
        <div className="absolute inset-0 flex justify-between px-4">
          {hours.map(h => (
            <div key={h} className="h-full border-l border-zinc-800/20 relative">
              <span className="absolute top-2 left-1 text-[8px] text-zinc-600 font-mono">
                {h.toString().padStart(2, '0')}
              </span>
            </div>
          ))}
          <div className="h-full border-l border-zinc-800/20"></div>
        </div>

        {/* Session Rows */}
        <div className="relative h-full pt-8 space-y-4">
          {SESSIONS.map((session) => (
            <div key={session.name} className="relative h-6 group">
              <span className="absolute -left-1 -top-5 text-[9px] font-black text-zinc-500 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                {session.name} Market
              </span>
              {renderSessionBar(session)}
            </div>
          ))}
        </div>

        {/* Moving "Now" Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 shadow-[0_0_15px_rgba(239,68,68,0.6)] transition-all duration-1000"
          style={{ left: `calc(${percentage}% + 0px)` }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-zinc-950"></div>
          <div className="absolute bottom-4 -left-6 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase">
            {tzDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
        </div>
      </div>
      
      <p className="text-center text-[9px] text-zinc-600 font-medium uppercase tracking-[0.2em]">
        Timeline reflects sessions relative to <span className="text-zinc-400">{selectedTz.split('/').pop()?.replace('_', ' ')}</span> time
      </p>
    </div>
  );
};

export default MarketHoursTimeline;