import AsyncStorage from '@react-native-async-storage/async-storage';

export type EmotionTag =
  | 'grief'
  | 'anger'
  | 'sadness'
  | 'anxiety'
  | 'loneliness'
  | 'hope'
  | 'gratitude'
  | 'numbness'
  | 'fear'
  | 'love';

export interface JournalEntry {
  id: string;
  createdAt: string;          // ISO string
  audioUri: string;           // local file URI
  durationMs: number;
  transcript: string;
  emotionTags: EmotionTag[];
  response: AIResponse | null;
  isCrisis: boolean;
}

export interface AIResponse {
  reflection: string;         // empathetic mirror of what they shared
  quote: string;              // a meaningful quote
  quoteAuthor: string;
  guidance: string;           // gentle, actionable suggestion
  hostMessage: string;        // written in the podcast host's voice
}

const ENTRIES_KEY = 'rc_journal_entries';

async function getAll(): Promise<JournalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

async function getById(id: string): Promise<JournalEntry | null> {
  const all = await getAll();
  return all.find((e) => e.id === id) ?? null;
}

async function save(entry: JournalEntry): Promise<void> {
  const all = await getAll();
  const idx = all.findIndex((e) => e.id === entry.id);
  if (idx >= 0) {
    all[idx] = entry;
  } else {
    all.unshift(entry);
  }
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(all));
}

async function remove(id: string): Promise<void> {
  const all = await getAll();
  const filtered = all.filter((e) => e.id !== id);
  await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
}

function createEntry(audioUri: string, durationMs: number): JournalEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    audioUri,
    durationMs,
    transcript: '',
    emotionTags: [],
    response: null,
    isCrisis: false,
  };
}

export const Storage = { getAll, getById, save, remove, createEntry };
