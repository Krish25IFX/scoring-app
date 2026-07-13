import { jsPDF } from 'jspdf';
import type { MatchState } from './types';
import type { Captain } from './config/players';
import type { CaptainSelectionsMap } from './api';

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

export function exportCaptainSelectionsPDF(
  captainSelections: CaptainSelectionsMap,
  captains: Captain[],
  categoryLabels: Record<string, string>
) {
  const doc = new jsPDF();
  const margin = 15;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  const captainMap = Object.fromEntries(captains.map((c) => [c.id, c]));

  doc.setFontSize(16);
  doc.text('Captain Player Selections', margin, y);
  y += 10;

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 12;

  for (const [captainId, categories] of Object.entries(captainSelections)) {
    const captain = captainMap[captainId];
    if (!captain) continue;

    // Check page space
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${captain.name} — ${captain.teamName}`, margin, y);
    y += 8;

    for (const [category, opponents] of Object.entries(categories)) {
      if (y > pageHeight - 30) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${categoryLabels[category] ?? category}`, margin + 4, y);
      y += 6;

      for (const [opponentId, players] of Object.entries(opponents)) {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }

        const opponent = captainMap[opponentId];
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`vs ${opponent?.teamName ?? opponentId}:`, margin + 8, y);
        y += 5;

        doc.setFont('helvetica', 'normal');
        const playerText = players.join(', ');
        const lines = doc.splitTextToSize(playerText, 170);
        for (const line of lines) {
          if (y > pageHeight - 15) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin + 12, y);
          y += 5;
        }
        y += 2;
      }
      y += 3;
    }
    y += 6;
  }

  doc.save(`captain-selections-${new Date().toISOString().slice(0, 10)}.pdf`);
}
