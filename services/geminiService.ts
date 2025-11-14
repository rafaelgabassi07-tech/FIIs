import { GoogleGenAI, Type } from "@google/genai";
import { NewsArticle, GroundingSource, HistoricalDataPoint } from '../types';

const getAi = () => {
  // Fix: Switched to `process.env.API_KEY` to resolve the TypeScript error and align with API key guidelines.
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    // Isso será capturado pelo bloco try-catch da função chamadora.
    throw new Error("API Key not found.");
  }
  return new GoogleGenAI({ apiKey });
}

export interface FIIMarketData {
    ticker: string;
    name: string;
    currentPrice: number;
}

export const fetchFIIMarketData = async (tickers: string[]): Promise<FIIMarketData[]> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Para os seguintes tickers de Fundos de Investimento Imobiliário (FIIs) brasileiros: ${tickers.join(', ')}, forneça o nome completo do fundo e um preço atual de mercado realista para cada um.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fiis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ticker: {
                    type: Type.STRING,
                    description: "O ticker do FII, por exemplo, 'MXRF11'.",
                  },
                  name: {
                    type: Type.STRING,
                    description: "O nome completo do fundo.",
                  },
                  currentPrice: {
                    type: Type.NUMBER,
                    description: "O preço atual de mercado da cota do fundo.",
                  },
                },
                required: ["ticker", "name", "currentPrice"],
              },
            },
          },
          required: ["fiis"],
        },
      },
    });

    const jsonString = response.text;
    const parsed = JSON.parse(jsonString);
    const tickerSet = new Set(tickers);
    const filteredFIIs = parsed.fiis.filter((fii: FIIMarketData) => tickerSet.has(fii.ticker));
    return filteredFIIs as FIIMarketData[];

  } catch (error) {
    console.error("Error fetching FII market data:", error);
    if (error instanceof Error && error.message.includes("API Key not found")) {
        // Fix: Updated error message to align with guidelines (do not instruct user on API key setup).
        throw new Error("A chave de API não foi encontrada.");
    }
    throw new Error("Não foi possível buscar os dados de mercado. Tente novamente mais tarde.");
  }
};

export const fetchFIIHistoricalData = async (
  ticker: string,
  periodInDays: number
): Promise<HistoricalDataPoint[]> => {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Gere dados históricos de preço diário para o FII brasileiro com o ticker '${ticker}' nos últimos ${periodInDays} dias. A resposta deve ser um array JSON dentro de um objeto com a chave "history". Cada objeto no array deve ter uma 'date' (no formato 'YYYY-MM-DD') e um 'value' (representando o preço de fechamento como um número). Ordene os resultados do mais antigo para o mais recente.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            history: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: {
                    type: Type.STRING,
                    description: "A data no formato YYYY-MM-DD.",
                  },
                  value: {
                    type: Type.NUMBER,
                    description: "O preço de fechamento do FII na data especificada.",
                  },
                },
                required: ["date", "value"],
              },
            },
          },
          required: ["history"],
        },
      },
    });

    const jsonString = response.text;
    const parsed = JSON.parse(jsonString);
    return (parsed.history || []) as HistoricalDataPoint[];
  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error);
    // Retorna um array vazio em caso de erro para não quebrar a agregação da carteira.
    return [];
  }
};


export const fetchFIINews = async (): Promise<{ articles: NewsArticle[], sources: GroundingSource[] }> => {
  try {
    const ai = getAi();
    const prompt = `Busque e resuma as 10 notícias mais importantes da semana sobre o mercado de Fundos de Investimento Imobiliário (FIIs) no Brasil. Para cada notícia, forneça um título, um resumo e a data.`;
    
    // Fix: Using googleSearch with JSON parsing is against the guidelines as the output format is not guaranteed.
    // Switched to using responseSchema to enforce a JSON output. This makes the response parsing reliable.
    // As a result, grounding sources from googleSearch will not be available, but the UI handles this gracefully.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                articles: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "O título da notícia." },
                            summary: { type: Type.STRING, description: "Um resumo da notícia." },
                            date: { type: Type.STRING, description: "A data da notícia." },
                        },
                        required: ["title", "summary", "date"],
                    }
                }
            },
            required: ["articles"],
        }
      },
    });

    const jsonString = response.text;
    const parsed = JSON.parse(jsonString);
    const articles = parsed.articles || [];

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const uniqueSources = new Map<string, GroundingSource>();
    groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
            uniqueSources.set(chunk.web.uri, {
                uri: chunk.web.uri,
                title: chunk.web.title
            });
        }
    });
    
    const sources = Array.from(uniqueSources.values());

    return { articles, sources };

  } catch (error) {
    console.error("Error fetching FII news:", error);
    if (error instanceof Error && error.message.includes("API Key not found")) {
        // Fix: Updated error message to align with guidelines (do not instruct user on API key setup).
        throw new Error("A chave de API não foi encontrada.");
    }
    throw new Error("Não foi possível buscar as notícias. A IA pode estar ocupada, tente novamente.");
  }
};