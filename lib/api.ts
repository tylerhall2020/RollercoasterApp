import * as FileSystem from 'expo-file-system';
import { AIResponse, EmotionTag } from './storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

// ---------------------------------------------------------------------------
// Transcription  (audio file → text via Whisper on your backend)
// ---------------------------------------------------------------------------

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not set');

  const uploadResult = await FileSystem.uploadAsync(
    `${BACKEND_URL}/transcribe`,
    audioUri,
    {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'audio',
      mimeType: 'audio/m4a',
    }
  );

  if (uploadResult.status !== 200) {
    throw new Error(`Transcription failed: ${uploadResult.status}`);
  }

  const data = JSON.parse(uploadResult.body) as { transcript: string };
  return data.transcript;
}

// ---------------------------------------------------------------------------
// AI Response  (transcript → compassionate response via Claude on your backend)
// ---------------------------------------------------------------------------

export interface ProcessResult {
  response: AIResponse;
  emotionTags: EmotionTag[];
  isCrisis: boolean;
}

export async function processEntry(transcript: string): Promise<ProcessResult> {
  if (!BACKEND_URL) throw new Error('EXPO_PUBLIC_BACKEND_URL is not set');

  const res = await fetch(`${BACKEND_URL}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });

  if (!res.ok) {
    throw new Error(`AI processing failed: ${res.status}`);
  }

  return res.json() as Promise<ProcessResult>;
}
