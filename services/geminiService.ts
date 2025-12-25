
import { GoogleGenAI, Type } from "@google/genai";
import { MarketState, TradeSignal } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const analyzeTradeSignal = async (
  pair: string,
  state: MarketState,
  isKillZone: boolean,
  volatilityScore: number
): Promise<TradeSignal> => {
  const systemPrompt = `
    You are a Senior Quant Developer explaining trades to a BEGINNER. 
    Analyze Forex data using advanced institutional concepts but EXPLAIN them simply:
    - SMT Divergence: Check if the Dollar and the Pair are moving in ways that confirm a trend or signal a reversal.
    - Daily Movement (ADR): If the market has already moved >90% of its normal daily distance, tell the user to WAIT.
    - News Catalysts: How news headlines are actually moving the needle.
    - Institutional Zones: Where big banks are likely entering.

    RULES:
    - Avoid technical abbreviations like "OB", "FVG", "SMT" in the 'reasoning' array. Use "Bank Entry Zone", "Price Gap", "Divergence".
    - Provide a specific 'tp' (Profit Target) and 'sl' (Safety Stop) price.
    - 'score' is 0-100.
    - Output MUST be valid JSON.
  `;

  const prompt = `
    Analyze ${pair} with current data:
    - Market State: ${JSON.stringify(state)}
    - Daily Movement Usage: ${state.adr.percentageUsed}%
    - Institutional Presence: ${JSON.stringify(state.liquidityZones)}
    - Dollar Index Trend: ${state.dxy.trend}
    - Is it a High-Volatility Period: ${isKillZone}
    
    Provide a high-probability trade setup with clear Profit and Safety prices.
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
      reasoning: ['Awaiting data sync. Keep an eye on the Daily Movement bar.'],
      quality: 'Unsafe',
      tp: 0,
      sl: 0,
      smtDivergence: false,
      adrExhausted: false
    };
  }
};
