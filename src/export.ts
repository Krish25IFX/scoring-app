import { jsPDF } from 'jspdf';
import type { MatchState } from './types';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportMatchJSON(match: MatchState) {
  const json = JSON.stringify(match, null, 2);
  downloadFile(json, `match-${match.id}.json`, 'application/json');
}

export function exportMatchCSV(match: MatchState) {
  const rows: string[] = [
    'Event Type,Timestamp,Details',
  ];
  for (const event of match.eventLog) {
    const details = event.payload ? JSON.stringify(event.payload) : '';
    rows.push(`${event.type},${new Date(event.timestamp).toISOString()},"${details}"`);
  }

  // Summary rows
  rows.push('');
  rows.push('Summary');
  rows.push(`Team A,${match.teams.A.name}`);
  rows.push(`Team B,${match.teams.B.name}`);
  rows.push(`Games Won A,${match.gamesWon.A}`);
  rows.push(`Games Won B,${match.gamesWon.B}`);
  rows.push(`Match Winner,${match.matchWinner ? match.teams[match.matchWinner].name : 'Incomplete'}`);
  rows.push(`Play Mode,${match.config.playMode}`);
  rows.push(`Best Of,${match.config.bestOf}`);

  for (const game of match.games) {
    rows.push(`Game ${game.gameIndex + 1},${game.scores.A}-${game.scores.B},Winner: ${game.winner ? match.teams[game.winner].name : 'N/A'}`);
  }

  downloadFile(rows.join('\n'), `match-${match.id}.csv`, 'text/csv');
}

export function exportMatchPDF(match: MatchState) {
  const doc = new jsPDF();
  const margin = 20;
  let y = margin;

  doc.setFontSize(18);
  doc.text('Badminton Match Report', margin, y);
  y += 12;

  doc.setFontSize(12);
  doc.text(`${match.teams.A.name} vs ${match.teams.B.name}`, margin, y);
  y += 8;
  doc.text(`Date: ${new Date(match.startedAt).toLocaleString()}`, margin, y);
  y += 8;
  doc.text(`Mode: ${match.config.playMode} · Best of ${match.config.bestOf}`, margin, y);
  y += 8;
  doc.text(`Points to win: ${match.config.pointsToWin.join(', ')}`, margin, y);
  y += 8;
  doc.text(`Win by 2: ${match.config.winByTwo ? 'Yes (no cap)' : 'No'}`, margin, y);
  y += 12;

  doc.setFontSize(14);
  doc.text('Results', margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.text(`Games: ${match.gamesWon.A} – ${match.gamesWon.B}`, margin, y);
  y += 8;

  for (const game of match.games) {
    const winner = game.winner ? match.teams[game.winner].name : 'Incomplete';
    doc.text(`Game ${game.gameIndex + 1}: ${game.scores.A}–${game.scores.B} (${winner})`, margin, y);
    y += 7;
  }

  y += 6;
  if (match.matchWinner) {
    doc.setFontSize(14);
    doc.text(`Winner: ${match.teams[match.matchWinner].name}`, margin, y);
  }

  doc.save(`match-${match.id}.pdf`);
}
