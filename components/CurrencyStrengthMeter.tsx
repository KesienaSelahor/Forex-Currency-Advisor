
import React from 'react';
import { CurrencyStrength } from '../types';

interface Props {
  data: CurrencyStrength[];
}

const CurrencyStrengthMeter: React.FC<Props> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.strength - a.strength);

  return (
    <div className="bg-card p-4 rounded-xl shadow-lg border-l-4 border-blue-500">
      <h3 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2">
        <i className="fas fa-chart-line text-blue-500"></i> RELATIVE STRENGTH
      </h3>
      <div className="space-y-3">
        {sortedData.map((curr) => (
          <div key={curr.symbol} className="flex items-center gap-4">
            <span className="w-10 font-bold text-sm">{curr.symbol}</span>
            <div className="flex-1 bg-zinc-800 h-2.5 rounded-full overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 ${curr.strength >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ 
                  width: `${Math.abs(curr.strength)}%`,
                  marginLeft: curr.strength >= 0 ? '0' : 'auto'
                }}
              />
            </div>
            <span className={`text-xs font-mono w-12 text-right ${curr.strength >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {curr.strength > 0 ? '+' : ''}{curr.strength.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurrencyStrengthMeter;
