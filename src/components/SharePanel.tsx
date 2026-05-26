import { useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useMatch } from '../context/MatchContext';

export default function SharePanel() {
  const { match } = useMatch();

  const shareUrl = useMemo(() => {
    if (!match) return '';
    const base = window.location.origin + window.location.pathname;
    return `${base}#/spectator`;
  }, [match]);

  if (!match) return null;

  return (
    <div className="p-4 rounded-xl border-2" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <h3 className="font-semibold mb-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Share Spectator View
      </h3>
      <div className="flex items-center gap-4">
        <QRCodeSVG value={shareUrl} size={96} />
        <div className="flex-1 min-w-0">
          <p className="text-xs break-all" style={{ color: 'var(--color-text-muted)' }}>{shareUrl}</p>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="mt-2 text-xs px-3 py-1 rounded border"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
          >
            Copy URL
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Open this URL on another device to view the live scoreboard. Note: state syncs when both devices are on the same page (shared state via context in this tab only).
      </p>
    </div>
  );
}
