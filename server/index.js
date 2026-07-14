const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3001;

// Database setup — Turso (remote) or local SQLite fallback
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:tournament.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize tables
(async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS active_matches (
      match_id TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      ended_at INTEGER
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS captain_selections (
      captain_id TEXT PRIMARY KEY,
      players TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);
})();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '5mb' }));

// ─── Active Matches (live scoring — supports multiple simultaneous) ───

app.get('/api/active-matches', async (req, res) => {
  const result = await db.execute('SELECT match_id, state FROM active_matches ORDER BY updated_at DESC');
  const matches = result.rows.map((r) => JSON.parse(r.state));
  res.json({ matches });
});

app.get('/api/active-match', async (req, res) => {
  const result = await db.execute('SELECT match_id, state FROM active_matches ORDER BY updated_at DESC');
  const matches = result.rows.map((r) => JSON.parse(r.state));
  res.json({ match: matches[0] ?? null, matches });
});

app.get('/api/active-match/:matchId', async (req, res) => {
  const result = await db.execute({ sql: 'SELECT state FROM active_matches WHERE match_id = ?', args: [req.params.matchId] });
  if (result.rows.length === 0) return res.json({ match: null });
  res.json({ match: JSON.parse(result.rows[0].state) });
});

app.post('/api/active-match', async (req, res) => {
  const { match } = req.body;
  if (!match || !match.id) {
    return res.status(400).json({ error: 'match with id is required' });
  }
  await db.execute({
    sql: `INSERT INTO active_matches (match_id, state, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(match_id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at`,
    args: [match.id, JSON.stringify(match), Date.now()]
  });
  await db.execute({
    sql: 'INSERT OR REPLACE INTO matches (id, state, created_at, ended_at) VALUES (?, ?, ?, ?)',
    args: [match.id, JSON.stringify(match), match.startedAt, match.endedAt || null]
  });
  if (match.matchWinner) {
    await db.execute({ sql: 'DELETE FROM active_matches WHERE match_id = ?', args: [match.id] });
  }
  res.json({ ok: true });
});

app.delete('/api/active-match/:matchId', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM active_matches WHERE match_id = ?', args: [req.params.matchId] });
  res.json({ ok: true });
});

app.delete('/api/active-match', async (req, res) => {
  await db.execute('DELETE FROM active_matches');
  res.json({ ok: true });
});

// ─── Match History ───

app.get('/api/matches', async (req, res) => {
  const result = await db.execute('SELECT state FROM matches ORDER BY created_at DESC');
  const matches = result.rows.map((r) => JSON.parse(r.state));
  res.json({ matches });
});

app.delete('/api/matches/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM matches WHERE id = ?', args: [req.params.id] });
  res.json({ ok: true });
});

// ─── Captain Selections ───

app.get('/api/captain-selections', async (req, res) => {
  const result = await db.execute('SELECT captain_id, players FROM captain_selections');
  const selections = {};
  for (const row of result.rows) {
    selections[row.captain_id] = JSON.parse(row.players);
  }
  res.json({ selections });
});

app.post('/api/captain-selections/:captainId', async (req, res) => {
  const { selections } = req.body;
  if (!selections || typeof selections !== 'object') {
    return res.status(400).json({ error: 'selections must be an object keyed by opponent captain id' });
  }
  await db.execute({
    sql: `INSERT INTO captain_selections (captain_id, players, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(captain_id) DO UPDATE SET players = excluded.players, updated_at = excluded.updated_at`,
    args: [req.params.captainId, JSON.stringify(selections), Date.now()]
  });
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
