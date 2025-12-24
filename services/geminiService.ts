
import { GoogleGenAI, Type } from "@google/genai";
import { MarketState, TradeSignal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const analyzeTradeSignal = async (
  pair: string,
  state: MarketState,
  isKillZone: boolean,
  volatilityScore: number
): Promise<TradeSignal> => {
  const systemPrompt = `
    You are a Senior Quant Developer explaining trades. 
    Analyze Forex data including Smart Money Concepts (SMC):
    - Identify SMT Divergence (DXY vs Majors).
    - Check ADR (Average Daily Range) Exhaustion (if >90%, downgrade signal to WAIT).
    - Analyze News Catalyst Scores.
    - Reference Liquidity Zones (Order Blocks/FVG).

    CRITICAL REASONING LABELS:
    - "Anchor Check": SMT Divergence/DXY Correlation.
    - "Crowd Behavior": Sentiment Analysis.
    - "Market Activity": Institutional Volume/Volatility.
    - "Range Exhaustion": ADR check.
    - "Smart Money": Order Blocks/FVG proximity.

    Output must be JSON. Provide specific Entry, TP (Take Profit), and SL (Stop Loss) prices based on current market state.
  `;

  const prompt = `
    Analyze ${pair} with current data:
    - Market State: ${JSON.stringify(state)}
    - Is Kill Zone: ${isKillZone}
    - Volatility Score: ${volatilityScore}
    - DXY Price: ${state.dxy.price} (${state.dxy.trend})
    - ADR Usage: ${state.adr.percentageUsed}%
    
    Determine if there is a SMT Divergence. Provide a high-probability trade setup.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pair: { type: Type.STRING },
            score: { type: Type.NUMBER },
            action: { type: Type.STRING, enum: ['STRONG BUY', 'BUY', 'WAIT', 'SELL', 'STRONG SELL'] },
            reasoning: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            quality: { type: Type.STRING, enum: ['Safe', 'Unsafe'] },
            tp: { type: Type.NUMBER },
            sl: { type: Type.NUMBER },
            smtDivergence: { type: Type.BOOLEAN },
            adrExhausted: { type: Type.BOOLEAN }
          },
          required: ['pair', 'score', 'action', 'reasoning', 'quality', 'tp', 'sl', 'smtDivergence', 'adrExhausted']
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      pair,
      score: 50,
      action: 'WAIT',
      reasoning: ['Data stream interrupted. Awaiting professional session confirmation.'],
      quality: 'Unsafe',
      tp: 0,
      sl: 0,
      smtDivergence: false,
      adrExhausted: false
    };
  }
};
