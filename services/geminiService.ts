
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getFoodInsights = async (foodName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short, 2-sentence mouth-watering description and some fun nutritional facts for ${foodName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            funFact: { type: Type.STRING },
          },
          required: ["description", "funFact"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      description: "Deliciously prepared with fresh ingredients.",
      funFact: "Best enjoyed while it's hot!"
    };
  }
};

export const polishReview = async (review: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Rewrite the following food review to be more descriptive and enthusiastic, but keep it brief: "${review}"`,
    });
    return response.text || review;
  } catch (error) {
    return review;
  }
};

export const getOrderSuggestion = async (cartItems: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on these items in the cart: ${cartItems.join(', ')}, suggest one more item or drink that would pair perfectly with them. Keep it very brief.`,
    });
    return response.text;
  } catch (error) {
    return "How about a refreshing cold drink?";
  }
};

export const checkDeliveryLocation = async (locationQuery: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Is delivery available in ${locationQuery}? Provide a brief confirmation and mention if there are any well-known landmarks nearby. Also, check if there's a "QuickBite" or similar high-quality restaurant in that area on Google Maps.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || "Checking availability...";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = chunks
      .filter((chunk: any) => chunk.maps)
      .map((chunk: any) => ({
        title: chunk.maps.title,
        uri: chunk.maps.uri
      }));

    return { text, links };
  } catch (error) {
    console.error("Maps Grounding Error:", error);
    return { text: "We're currently expanding! Check back soon for delivery in your area.", links: [] };
  }
};
