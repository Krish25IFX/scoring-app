const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Database setup
const db = new Database(path.join(__dirname, 'tournament.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS active_match (
    id INTEGER PRIMARY KEY CHECK (id = 1),
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

// Prepared statements
const getActiveMatch = db.prepare('SELECT state FROM active_match WHERE id = 1');
const upsertActiveMatch = db.prepare(`
  INSERT INTO active_match (id, state, updated_at) VALUES (1, ?, ?)
  ON CONFLICT(id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at
`);
const deleteActiveMatch = db.prepare('DELETE FROM active_match WHERE id = 1');

const insertMatch = db.prepare('INSERT OR REPLACE INTO matches (id, state, created_at, ended_at) VALUES (?, ?, ?, ?)');
const getAllMatches = db.prepare('SELECT state FROM matches ORDER BY created_at DESC');

const upsertCaptainSelection = db.prepare(`
  INSERT INTO captain_selections (captain_id, players, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(captain_id) DO UPDATE SET players = excluded.players, updated_at = excluded.updated_at
`);
const getAllCaptainSelections = db.prepare('SELECT captain_id, players FROM captain_selections');

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ─── Active Match (live scoring) ───

// GET current active match (polled by spectators)
app.get('/api/active-match', (req, res) => {
  const row = getActiveMatch.get();
  if (!row) {
    return res.json({ match: null });
  }
  res.json({ match: JSON.parse(row.state) });
});

// POST update active match (called by operator on every point)
app.post('/api/active-match', (req, res) => {
  const { match } = req.body;
  if (!match) {
    return res.status(400).json({ error: 'match is required' });
  }
  upsertActiveMatch.run(JSON.stringify(match), Date.now());

  // Also save to matches history
  insertMatch.run(match.id, JSON.stringify(match), match.startedAt, match.endedAt || null);

  res.json({ ok: true });
});

// DELETE clear active match
app.delete('/api/active-match', (req, res) => {
  deleteActiveMatch.run();
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
  const { players } = req.body;
  if (!Array.isArray(players)) {
    return res.status(400).json({ error: 'players must be an array' });
  }
  upsertCaptainSelection.run(req.params.captainId, JSON.stringify(players), Date.now());
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
