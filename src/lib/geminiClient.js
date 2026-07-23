import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const PROMPT = `You are given the audio recording of a meeting. Transcribe and summarize it.

CRITICAL RULES — DO NOT BREAK THESE:
- DO NOT generate, guess, infer, or fabricate any person names.
- For "attendees": return [] (empty array). You MUST NOT output any names here. Even if you hear names, return [].
- For "owner_name" in action items: return null. You MUST NOT output any names here.
- Never use placeholder or example names like "John", "Sarah", "Mark", "Emily", "Speaker 1", "Participant A", etc.
- Base ALL content (summary, key points, decisions, action items) strictly on what is actually said in the audio.
- The summary must describe WHAT was discussed, not WHO said what.

EMPTY / NO CONTENT RULES:
- If the audio is empty, silent, too short (under 5 seconds), contains no speech, or only has background noise/static, return this exact JSON:
  { "attendees": [], "summary_text": "No meaningful audio content was captured in this recording.", "key_points": [], "decisions": [], "action_items": [] }
- Do NOT fabricate a summary from silence, background noise, or unintelligible audio.
- If you cannot clearly understand what is being said, return the empty result above.
- Only summarize content you can clearly hear and understand.

Return ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{
  "attendees": [],
  "summary_text": string,
  "key_points": string[],
  "decisions": string[],
  "action_items": [
    { "description": string, "owner_name": null, "due_date": string | null }
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
