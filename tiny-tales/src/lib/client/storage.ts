import type { SavedStory } from './types';

/**
 * Everything is kept in this browser only (no accounts). Reads and writes are wrapped because browsers can
 * throw or return nothing in private windows or after site data is cleared; the app then keeps working
 * without saving and says so (PRD: storage unavailable).
 */
const KEY = 'tt:v1';

interface Store {
  consented: boolean;
  session: string;
  stories: SavedStory[];
}

const newId = (): string => {
  const c = globalThis.crypto;
  return c?.randomUUID ? c.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

let memory: Store | null = null;
let working = true;

function read(): Store {
  if (memory) return memory;
  let parsed: Partial<Store> | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    working = false;
  }
  memory = {
    consented: !!parsed?.consented,
    session: parsed?.session && /^[a-z0-9-]{8,40}$/.test(parsed.session) ? parsed.session : newId(),
    stories: Array.isArray(parsed?.stories) ? parsed!.stories! : [],
  };
  write();
  return memory;
}

function write(): void {
  if (!memory) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
    working = true;
  } catch {
    working = false;
  }
}

export const storageWorks = (): boolean => {
  read();
  return working;
};
export const sessionId = (): string => read().session;
export const hasConsented = (): boolean => read().consented;
export function giveConsent(): void {
  read().consented = true;
  write();
}
export const listStories = (): SavedStory[] => [...read().stories].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export function saveStory(item: Omit<SavedStory, 'id' | 'createdAt'> & { id?: string }): SavedStory {
  const store = read();
  const existing = item.id ? store.stories.find((s) => s.id === item.id) : undefined;
  const saved: SavedStory = { ...item, id: existing?.id ?? item.id ?? newId(), createdAt: existing?.createdAt ?? new Date().toISOString() };
  store.stories = [saved, ...store.stories.filter((s) => s.id !== saved.id)];
  write();
  return saved;
}

export function deleteStory(id: string): void {
  const store = read();
  store.stories = store.stories.filter((s) => s.id !== id);
  write();
}
