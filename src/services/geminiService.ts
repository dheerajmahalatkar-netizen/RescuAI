import { GoogleGenAI, Type } from "@google/genai";
import { EmergencyCategory, SeverityLevel, FirstAidStep, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.code === 429 || error?.message?.includes('429') || error?.message?.includes('quota'))) {
      console.warn(`Quota hit, retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function analyzeEmergency(
  text?: string, 
  imageUrl?: string, 
  language: string = 'English'
): Promise<{ 
  category: EmergencyCategory, 
  severity: SeverityLevel, 
  reasoning: string,
  firstAidAdvice: FirstAidStep[],
  localizedSummary: string
}> {
  try {
    const parts: any[] = [];
    
    if (text) {
      parts.push({ text: `Emergency Description: ${text}` });
    }
    
    if (imageUrl) {
      // imageUrl is expected to be a base64 data URL from the client
      const base64Data = imageUrl.split(',')[1];
      const mimeType = imageUrl.split(',')[0].split(':')[1].split(';')[0];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const prompt = `Analyze this emergency situation and provide:
    1. Classification (category and severity)
    2. Reasoning 
    3. Step-by-step first aid advice in ${language} (BOTH title and description).
    4. Matching Lucide icon names for each step.
    5. A short, highly descriptive visualPrompt for each step (in English), for an image generator (no text in images).
    6. A clear, loud, localized narration script for each step in ${language}, optimized for blind users (describing actions simply).
    7. A brief reassuring summary in ${language}.
    
    Response must be in JSON.
    Preferred Language for all user-facing strings (title, description, summary, narration): ${language}`;

    parts.push({ text: prompt });

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            severity: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            firstAidAdvice: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  icon: { type: Type.STRING, description: "Lucide icon name" },
                  visualPrompt: { type: Type.STRING, description: "Detailed description for an AI image generator to illustrate this specific medical step clearly. No text." },
                  narration: { type: Type.STRING, description: "Localized narration for blind users." }
                },
                required: ["title", "description", "visualPrompt", "narration"]
              }
            },
            localizedSummary: { type: Type.STRING }
          },
          required: ["category", "severity", "reasoning", "firstAidAdvice", "localizedSummary"]
        }
      }
    }));

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      category: EmergencyCategory.OTHER,
      severity: SeverityLevel.MEDIUM,
      reasoning: "AI analysis failed.",
      firstAidAdvice: [{ 
        title: "Stay Calm", 
        description: "Wait for professional help to arrive.", 
        icon: "AlertCircle", 
        visualPrompt: "A person sitting calmly breathing deeply",
        narration: "Please stay calm. Keep breathing slowly and wait for help."
      }],
      localizedSummary: "Please stay calm. Help is on the way."
    };
  }
}

export async function generateVisual(prompt: string): Promise<string | null> {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A clear, high-quality, professional medical instructional diagram illustrating: ${prompt}. Minimalist isometric style, clean white background. High contrast. Focused on physical actions. STRICTLY NO TEXT OR WORDS IN IMAGE. Professional healthcare aesthetic.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      },
    }));

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Image generation error:", error);
    // Silent fail for visuals is okay, UI has fallbacks
    return null;
  }
}

export async function getNearbyHospitals(lat: number, lng: number): Promise<any[]> {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the 5 closest hospitals and trauma centers near coordinates (${lat}, ${lng}). 
      Rank them by proximity and emergency capability.
      Provide the result in JSON format: 
      [{ "name": string, "address": string, "lat": number, "lng": number, "distance": string, "rating": number, "phone": string, "emergency": boolean, "rankingReason": string }]`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    }));

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Hospital search error:", error);
    return [];
  }
}

export async function getAIChatResponse(
  history: ChatMessage[], 
  message: string, 
  language: string = 'English',
  situationContext: string = ''
): Promise<string> {
  try {
    const formattedHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `Emergency medical assistant. Respond in ${language}. Context: ${situationContext}`
      }
    }));

    return response.text.trim();
  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm sorry, I'm having trouble connecting. Please wait for emergency services.";
  }
}
