import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const PROMPT = `You are given the audio recording of a meeting. Transcribe and summarize it.

CRITICAL RULES:
- ONLY include attendee names that are EXPLICITLY spoken/mentioned in the audio.
- If you cannot clearly identify any names, return an empty array [] for attendees.
- NEVER guess, infer, or make up names. Do not use placeholder names like "John", "Sarah", "Mark", "Emily".
- Base ALL content (summary, key points, decisions, action items) strictly on what is actually said in the audio.

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
    contents: [
      { text: PROMPT },
      { fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } },
    ],
  });

  const cleaned = response.text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini response was not valid JSON — see raw text for manual recovery.');
  }
}
