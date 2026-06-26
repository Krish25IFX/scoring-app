import type { MatchState } from './types';

const API_BASE = '/api';

export async function fetchActiveMatch(): Promise<MatchState | null> {
  const res = await fetch(`${API_BASE}/active-match`);
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

export async function deleteActiveMatch(): Promise<void> {
  await fetch(`${API_BASE}/active-match`, { method: 'DELETE' });
}

export async function fetchAllMatches(): Promise<MatchState[]> {
  const res = await fetch(`${API_BASE}/matches`);
  const data = await res.json();
  return data.matches ?? [];
}

export async function deleteMatchApi(id: string): Promise<void> {
  await fetch(`${API_BASE}/matches/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function fetchCaptainSelections(): Promise<Record<string, string[]>> {
  const res = await fetch(`${API_BASE}/captain-selections`);
  const data = await res.json();
  return data.selections ?? {};
}

export async function postCaptainSelection(captainId: string, players: string[]): Promise<void> {
  await fetch(`${API_BASE}/captain-selections/${encodeURIComponent(captainId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ players }),
  });
}
