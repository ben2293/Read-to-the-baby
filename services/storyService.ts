import { GoogleGenAI } from "@google/genai";
import { STORY_MODEL } from "../constants";

const apiKey = process.env.API_KEY;

export const generateShortStory = async (topic: string = "a cute adventure"): Promise<string> => {
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: STORY_MODEL,
      contents: `Write a very short (approx 100 words), engaging children's story about ${topic}. It should be suitable for reading aloud to a baby. Format it with simple paragraphs.`,
    });
    return response.text || "Once upon a time...";
  } catch (error) {
    console.error("Error generating story:", error);
    return "Once upon a time, there was a developer who forgot to check their API key. But then they fixed it, and everyone lived happily ever after.";
  }
};