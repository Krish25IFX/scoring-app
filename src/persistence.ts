import { openDB, type IDBPDatabase } from 'idb';
import type { MatchState, MatchSummary } from './types';

const DB_NAME = 'badminton-scoring';
const DB_VERSION = 1;
const STORE_NAME = 'matches';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveMatch(match: MatchState): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, match);
}

export async function getMatch(id: string): Promise<MatchState | undefined> {
  const db = await getDb();
  return db.get(STORE_NAME, id);
}

export async function getAllMatches(): Promise<MatchSummary[]> {
  const db = await getDb();
  const all: MatchState[] = await db.getAll(STORE_NAME);
  return all
    .map((m) => ({
      id: m.id,
      teams: m.teams,
      gamesWon: m.gamesWon,
      matchWinner: m.matchWinner,
      config: m.config,
      startedAt: m.startedAt,
      endedAt: m.endedAt,
      games: m.games,
    }))
    .sort((a, b) => b.startedAt - a.startedAt);
}

export async function deleteMatch(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export async function getFullMatch(id: string): Promise<MatchState | undefined> {
  const db = await getDb();
  return db.get(STORE_NAME, id);
}
