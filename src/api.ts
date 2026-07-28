import type { MatchState } from './types';

// In production (GitHub Pages), use the deployed backend URL.
// In development, Vite proxy handles /api → localhost:3001.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchActiveMatch(): Promise<MatchState | null> {
  const res = await fetch(`${API_BASE}/active-match`);
  const data = await res.json();
  return data.match ?? null;
}

export async function fetchActiveMatches(): Promise<MatchState[]> {
  const res = await fetch(`${API_BASE}/active-matches`);
  const data = await res.json();
  return data.matches ?? [];
}

export async function fetchActiveMatchById(matchId: string): Promise<MatchState | null> {
  const res = await fetch(`${API_BASE}/active-match/${encodeURIComponent(matchId)}`);
  const data = await res.json();
  return data.match ?? null;
}

export async function postActiveMatch(match: MatchState): Promise<void> {
  await fetch(`${API_BASE}/active-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ match }),
  });
}

export async function deleteActiveMatch(matchId?: string): Promise<void> {
  const url = matchId
    ? `${API_BASE}/active-match/${encodeURIComponent(matchId)}`
    : `${API_BASE}/active-match`;
  await fetch(url, { method: 'DELETE' });
}

export async function fetchAllMatches(): Promise<MatchState[]> {
  const res = await fetch(`${API_BASE}/matches`);
  const data = await res.json();
  return data.matches ?? [];
}

export async function deleteMatchApi(id: string): Promise<void> {
  await fetch(`${API_BASE}/matches/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Captain selections: captainId → category → opponentId → players[] */
export type CaptainSelectionsMap = Record<string, Record<string, Record<string, string[]>>>;

export async function fetchCaptainSelections(): Promise<CaptainSelectionsMap> {
  const res = await fetch(`${API_BASE}/captain-selections`);
  const data = await res.json();
  return data.selections ?? {};
}

export async function deleteCaptainSelectionsByCategory(category: string): Promise<void> {
  await fetch(`${API_BASE}/captain-selections/category/${encodeURIComponent(category)}`, { method: 'DELETE' });
}

export async function postCaptainSelection(captainId: string, selections: Record<string, Record<string, string[]>>): Promise<void> {
  await fetch(`${API_BASE}/captain-selections/${encodeURIComponent(captainId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selections }),
  });
}
