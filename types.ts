
export interface CurrencyStrength {
  symbol: string;
  strength: number; // -100 to 100
  change: number;
}

export interface MarketSentiment {
  pair: string;
  long: number;
  short: number;
}

export interface NewsEvent {
  id: string;
  time: string;
  currency: string;
  impact: 'High' | 'Medium' | 'Low';
  event: string;
  catalystScore?: number; // -10 to 10 (Bearish to Bullish)
}

export interface LiquidityZone {
  type: string; // "Institutional Order Zone" or "Market Price Gap"
  price: number;
  strength: number; // 1-5
  bias: 'Buying Zone' | 'Selling Zone';
}

export interface ADRInfo {
  currentPips: number;
  averagePips: number;
  percentageUsed: number;
}

export interface TradeSignal {
  pair: string;
  score: number; // 0-100
  action: 'STRONG BUY' | 'BUY' | 'WAIT' | 'SELL' | 'STRONG SELL';
  reasoning: string[];
  quality: 'Safe' | 'Unsafe';
  tp: number;
  sl: number;
  smtDivergence: boolean;
  adrExhausted: boolean;
}

export interface MarketState {
  currencies: CurrencyStrength[];
  sentiment: MarketSentiment[];
  news: NewsEvent[];
  dxy: {
    price: number;
    trend: 'Bullish' | 'Bearish' | 'Neutral';
  };
  volatility: number; // 0-100
  liquidityZones: LiquidityZone[];
  adr: ADRInfo;
}
