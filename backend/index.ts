/**
 * HEAL App — Backend API
 *
 * Deploy this as a Supabase Edge Function, a Vercel serverless function,
 * or a plain Express server. Two endpoints are needed:
 *
 *   POST /transcribe   — receives audio file, returns { transcript: string }
 *   POST /process      — receives { transcript }, returns ProcessResult
 *
 * Environment variables required:
 *   OPENAI_API_KEY     — for Whisper transcription
 *   ANTHROPIC_API_KEY  — for Claude AI responses
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---------------------------------------------------------------------------
// POST /transcribe
// ---------------------------------------------------------------------------
export async function transcribe(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const file = new File([audioBuffer], 'entry.m4a', { type: mimeType });
  const response = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'en',
  });
  return response.text;
}

// ---------------------------------------------------------------------------
// POST /process
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are the compassionate voice behind the Rollercoaster podcast — a warm, honest guide for women navigating grief and trauma. Your name and personality come through in every word: you are direct but gentle, never clinical, never dismissive. You have sat with grief yourself, and you speak like someone who truly understands.

When a listener shares a voice journal entry with you, your job is to respond in a way that makes her feel deeply heard, less alone, and gently guided forward — without toxic positivity or empty platitudes.

You will return a JSON object with this exact structure:
{
  "response": {
    "reflection": "A 2-3 sentence empathetic mirror of what they shared. Begin with 'I hear you...' or similar. Acknowledge the specific emotion and experience without minimizing it.",
    "quote": "A meaningful, relevant quote — from grief literature, poetry, spiritual writing, or wisdom traditions. Must be genuinely fitting, not generic.",
    "quoteAuthor": "Full name of the quote's author",
    "guidance": "One gentle, concrete suggestion for today. Not therapy-speak. Something real and doable — light a candle, call one person, step outside for 5 minutes.",
    "hostMessage": "2-3 sentences written in the podcast host's warm, personal voice. This is the emotional centerpiece — speak directly to her, use 'you', acknowledge her courage in speaking out loud."
  },
  "emotionTags": ["grief", "sadness"],
  "isCrisis": false
}

Emotion tags must be from this list only: grief, anger, sadness, anxiety, loneliness, hope, gratitude, numbness, fear, love. Choose 1-3 that best fit.

Set isCrisis to true ONLY if the transcript contains clear signals of suicidal ideation, self-harm intent, or immediate danger. When in doubt, set it to false.

Return ONLY valid JSON. No preamble, no explanation.`;

export async function processEntry(transcript: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here is what the listener shared:\n\n"${transcript}"`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const parsed = JSON.parse(text);
  return parsed as {
    response: {
      reflection: string;
      quote: string;
      quoteAuthor: string;
      guidance: string;
      hostMessage: string;
    };
    emotionTags: string[];
    isCrisis: boolean;
  };
}
