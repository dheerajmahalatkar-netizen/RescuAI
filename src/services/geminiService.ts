import { GoogleGenAI, Type } from "@google/genai";
import { EmergencyCategory, SeverityLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function classifyEmergency(input: string): Promise<{ category: EmergencyCategory, severity: SeverityLevel, reasoning: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Classify the following emergency description into a category and severity level: "${input}"
      Categories: medical, accident, fire, breathing, bleeding, other
      Severity Levels: Critical, High, Medium, Low`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: "One of the provided categories" },
            severity: { type: Type.STRING, description: "One of the provided severity levels" },
            reasoning: { type: Type.STRING, description: "Brief explanation" }
          },
          required: ["category", "severity", "reasoning"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Gemini Classification Error:", error);
    // Fallback classification
    return {
      category: EmergencyCategory.OTHER,
      severity: SeverityLevel.MEDIUM,
      reasoning: "AI classification failed, defaulting to medium."
    };
  }
}
