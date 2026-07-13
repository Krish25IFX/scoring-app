const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Database setup — use DB_PATH env for container deployments
const dbPath = process.env.DB_PATH || path.join(__dirname, 'tournament.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS active_matches (
    match_id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    ended_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS captain_selections (
    captain_id TEXT PRIMARY KEY,
    players TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

// Migrate: if old single-row active_match table exists, drop it
try { db.exec('DROP TABLE IF EXISTS active_match'); } catch { /* ignore */ }

// Prepared statements
const getAllActiveMatches = db.prepare('SELECT match_id, state FROM active_matches ORDER BY updated_at DESC');
const getActiveMatchById = db.prepare('SELECT state FROM active_matches WHERE match_id = ?');
const upsertActiveMatch = db.prepare(`
  INSERT INTO active_matches (match_id, state, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(match_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at
`);
const deleteActiveMatchById = db.prepare('DELETE FROM active_matches WHERE match_id = ?');

const insertMatch = db.prepare('INSERT OR REPLACE INTO matches (id, state, created_at, ended_at) VALUES (?, ?, ?, ?)');
const getAllMatches = db.prepare('SELECT state FROM matches ORDER BY created_at DESC');

const upsertCaptainSelection = db.prepare(`
  INSERT INTO captain_selections (captain_id, players, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(captain_id) DO UPDATE SET players = excluded.players, updated_at = excluded.updated_at
`);
const getAllCaptainSelections = db.prepare('SELECT captain_id, players FROM captain_selections');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '5mb' }));

// ─── Active Matches (live scoring — supports multiple simultaneous) ───

// GET all active matches (spectators see a list)
app.get('/api/active-matches', (req, res) => {
  const rows = getAllActiveMatches.all();
  const matches = rows.map((r) => JSON.parse(r.state));
  res.json({ matches });
});

// GET single active match by ID (backward compat + spectator detail)
app.get('/api/active-match', (req, res) => {
  // Return all active matches for backward compatibility
  const rows = getAllActiveMatches.all();
  const matches = rows.map((r) => JSON.parse(r.state));
  // Return first match for old clients, all for new
  res.json({ match: matches[0] ?? null, matches });
});

app.get('/api/active-match/:matchId', (req, res) => {
  const row = getActiveMatchById.get(req.params.matchId);
  if (!row) return res.json({ match: null });
  res.json({ match: JSON.parse(row.state) });
});

// POST update an active match (called by operator on every point)
app.post('/api/active-match', (req, res) => {
  const { match } = req.body;
  if (!match || !match.id) {
    return res.status(400).json({ error: 'match with id is required' });
  }
  upsertActiveMatch.run(match.id, JSON.stringify(match), Date.now());

  // Also save to matches history
  insertMatch.run(match.id, JSON.stringify(match), match.startedAt, match.endedAt || null);

  // If match is completed, remove from active
  if (match.matchWinner) {
    deleteActiveMatchById.run(match.id);
  }

  res.json({ ok: true });
});

// DELETE a specific active match
app.delete('/api/active-match/:matchId', (req, res) => {
  deleteActiveMatchById.run(req.params.matchId);
  res.json({ ok: true });
});

// DELETE all active matches (legacy)
app.delete('/api/active-match', (req, res) => {
  db.prepare('DELETE FROM active_matches').run();
  res.json({ ok: true });
});

// ─── Match History ───

app.get('/api/matches', (req, res) => {
  const rows = getAllMatches.all();
  const matches = rows.map((r) => JSON.parse(r.state));
  res.json({ matches });
});

app.delete('/api/matches/:id', (req, res) => {
  db.prepare('DELETE FROM matches WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── Captain Selections ───

app.get('/api/captain-selections', (req, res) => {
  const rows = getAllCaptainSelections.all();
  const selections = {};
  for (const row of rows) {
    selections[row.captain_id] = JSON.parse(row.players);
  }
  res.json({ selections });
});

app.post('/api/captain-selections/:captainId', (req, res) => {
  const { selections } = req.body;
  if (!selections || typeof selections !== 'object') {
    return res.status(400).json({ error: 'selections must be an object keyed by opponent captain id' });
  }
  upsertCaptainSelection.run(req.params.captainId, JSON.stringify(selections), Date.now());
  res.json({ ok: true });
});

// ─── Start Server ───

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏸 Scoring server running on http://0.0.0.0:${PORT}`);
  console.log(`   Spectators connect to: http://<your-ip>:${PORT}`);
  console.log(`   API endpoints:`);
  console.log(`     GET  /api/active-match`);
  console.log(`     POST /api/active-match`);
  console.log(`     GET  /api/matches`);
  console.log(`     GET  /api/captain-selections\n`);
});
