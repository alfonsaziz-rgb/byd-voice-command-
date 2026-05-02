import { GoogleGenAI } from "@google/genai";
import { COMMAND_DATABASE, CommandMapping } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function processVoiceCommand(input: string): Promise<{
  mapping: CommandMapping | null;
  detectedLanguage: 'Arabic' | 'English';
  aiTranslation?: string;
  isCertain: boolean;
}> {
  // 1. Check local dictionary first
  const normalizedInput = input.toLowerCase();
  
  // Simple keyword matching for high certainty
  for (const cmd of COMMAND_DATABASE) {
    const hasKeyword = cmd.keywords.some(k => normalizedInput.includes(k.toLowerCase()));
    if (hasKeyword) {
      // If multiple keywords match, we could be smarter, but for now...
      // Let's check for exact matches in the list
      if (normalizedInput.includes(cmd.english.toLowerCase()) || normalizedInput.includes(cmd.arabic.toLowerCase())) {
        return {
          mapping: cmd,
          detectedLanguage: input.match(/[\u0600-\u06FF]/) ? 'Arabic' : 'English',
          isCertain: true
        };
      }
    }
  }

  // 2. Use Gemini for semantic matching and translation
  try {
    const prompt = `
      You are a BYD Song Plus 2025 DiLink 4 Voice Assistant Expert.
      User said: "${input}"
      
      Tasks:
      1. Identify if the command is in Arabic (MSA/Dialect) or English.
      2. Map this to the MOST ACCURATE Chinese command used in BYD DiLink 4.
      3. CRITICAL: In Arabic speech recognition, the word "BYD" is often wrongly transcribed as "بيعدي" (passing) or "بي عدي". If you see these patterns, treat them as "BYD" wake word.
      4. If the command is standard (AC, Windows, Sunroof, etc.), use the official terminology.
      
      Available Official Commands for reference:
      ${COMMAND_DATABASE.map(c => `- ${c.english} / ${c.arabic} -> ${c.chinese}`).join('\n')}
      
      Respond in JSON format:
      {
        "detectedLanguage": "Arabic" | "English",
        "chineseCommand": "string",
        "pinyin": "string",
        "explanation": "string in English",
        "isCertain": boolean (true if highly confident it matches a system command)
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Check if what Gemini returned is actually in our DB
    const dbMatch = COMMAND_DATABASE.find(c => c.chinese === result.chineseCommand);

    return {
      mapping: dbMatch || {
        id: 'ai_generated',
        chinese: result.chineseCommand,
        pinyin: result.pinyin,
        arabic: '',
        english: result.explanation,
        keywords: []
      },
      detectedLanguage: result.detectedLanguage,
      aiTranslation: result.chineseCommand,
      isCertain: result.isCertain
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      mapping: null,
      detectedLanguage: 'English',
      isCertain: false
    };
  }
}
