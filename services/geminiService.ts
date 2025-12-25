
import { GoogleGenAI, Type } from "@google/genai";
import { HeightEstimationResult, ReferenceType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeHeight = async (
  imageBase64: string,
  referenceType: ReferenceType,
  wearingShoes: boolean
): Promise<HeightEstimationResult> => {
  const model = "gemini-3-pro-preview";

  const referenceHeights: Record<ReferenceType, string> = {
    [ReferenceType.DOOR]: "203cm",
    [ReferenceType.CREDIT_CARD]: "8.56cm",
    [ReferenceType.A4_PAPER]: "29.7cm",
    [ReferenceType.SODA_CAN]: "12.2cm",
    [ReferenceType.NONE]: "statistical average proportions (approx 7.5 heads high)"
  };

  const prompt = `
    Analyze this full-body image for scientific height estimation.
    User specifies they are ${wearingShoes ? 'wearing shoes' : 'barefoot'}.
    The reference scale provided is: ${referenceHeights[referenceType]}.

    1. Detect skeletal landmarks: vertex (top of head), chin, acromion (shoulders), greater trochanter (hips), patella (knees), and lateral malleolus (ankles).
    2. Calculate the pixel height of the individual from vertex to malleolus.
    3. If a reference object is present (e.g., door, card), use it to calibrate pixel-to-cm ratio.
    4. Estimate the camera's tilt and distance to apply perspective correction.
    5. Calculate anthropometric ratios: Head-to-Stature, Leg-to-Torso.
    6. Return a scientifically grounded estimate of the person's height in cm.

    Return the data in valid JSON format.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(",")[1],
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          estimatedHeightCm: { type: Type.NUMBER },
          confidenceRangeCm: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
          },
          landmarks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER, description: "x coordinate 0-1000" },
                y: { type: Type.NUMBER, description: "y coordinate 0-1000" },
                label: { type: Type.STRING },
              },
            },
          },
          ratios: {
            type: Type.OBJECT,
            properties: {
              headToBody: { type: Type.NUMBER },
              legToTorso: { type: Type.NUMBER },
              armLengthRatio: { type: Type.NUMBER },
            },
          },
          analysis: { type: Type.STRING },
          cameraPerspective: {
            type: Type.OBJECT,
            properties: {
              tiltAngleDegrees: { type: Type.NUMBER },
              estimatedDistanceMeters: { type: Type.NUMBER },
            },
          },
        },
        required: ["estimatedHeightCm", "confidenceRangeCm", "landmarks", "analysis"],
      },
    },
  });

  return JSON.parse(response.text) as HeightEstimationResult;
};

export const editImage = async (imageBase64: string, prompt: string): Promise<string> => {
  const model = 'gemini-2.5-flash-image';
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: imageBase64.split(",")[1],
            mimeType: 'image/jpeg',
          },
        },
        {
          text: prompt,
        },
      ],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data returned from model");
};

export const fetchLatestNews = async (query: string = "Latest breakthrough in human anthropometry and health technology"): Promise<{ text: string, sources: { title: string, uri: string }[] }> => {
  const model = 'gemini-3-flash-preview';
  const response = await ai.models.generateContent({
    model,
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const sources: { title: string, uri: string }[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  chunks.forEach((chunk: any) => {
    if (chunk.web) {
      sources.push({
        title: chunk.web.title || "Reference",
        uri: chunk.web.uri
      });
    }
  });

  return {
    text: response.text || "No news found.",
    sources: sources
  };
};
