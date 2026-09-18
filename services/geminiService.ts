import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a short story based on a topic for kids.
 */
export const generateStory = async (topic: string, difficulty: string): Promise<string> => {
  try {
    const prompt = `Write a short, engaging English story for a primary school student about "${topic}". 
    Important: If the topic "${topic}" is in a language other than English, translate the concept to English first, then write the story in English.
    Difficulty level: ${difficulty}.
    Keep it under 150 words. 
    Use simple vocabulary but correct grammar. 
    Do not add any title or markdown formatting, just the raw story text.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Sorry, I couldn't write a story right now. Please try again!";
  } catch (error) {
    console.error("Gemini Story Gen Error:", error);
    throw error;
  }
};

/**
 * Generates High Quality Speech using Gemini TTS.
 * Note: This returns an AudioBuffer but does not support word-level timestamps easily yet.
 */
export const generateHighQualitySpeech = async (text: string, voiceName: string = 'Kore'): Promise<AudioBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext);
    return audioBuffer;

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};

// --- Audio Helper Functions (from guidelines) ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  // We copy the buffer because decodeAudioData detaches the array buffer
  const bufferCopy = data.buffer.slice(0);
  return await ctx.decodeAudioData(bufferCopy);
}