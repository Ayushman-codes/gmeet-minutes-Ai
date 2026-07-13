import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const PROMPT = `You are given the audio recording of a meeting.
Return ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{
  "attendees": string[],
  "summary_text": string,
  "key_points": string[],
  "decisions": string[],
  "action_items": [
    { "description": string, "owner_name": string | null, "due_date": string | null }
  ]
}`;

export async function summarizeMeetingAudio(audioFile) {
  const uploaded = await ai.files.upload({ file: audioFile });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: [PROMPT, uploaded],
  });

  const cleaned = response.text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON — see raw text for manual recovery.');
  }
}
