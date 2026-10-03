import { drawIdentity, playerNumber } from './identity';
import { state, elapsed } from './state';
import { siteUrl, siteLabel } from './ui';

const W = 1200, H = 675;
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
const SANS = 'Inter, system-ui, sans-serif';

export const rank = () => (state.verified === 'shielded' ? 'Verified private payment' : 'Glasstown graduate');

/** The share card. Like a Wordle grid it brags without giving anything away: no txid, no address, no amount. */
export async function drawCard(canvas: HTMLCanvasElement): Promise<void> {
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d')!;
  try { await Promise.all([document.fonts.load(`800 40px ${SANS}`), document.fonts.load(`700 16px ${MONO}`)]); } catch { /* fallback fonts */ }
  // warm paper with a dot grid
  g.fillStyle = '#f6f7f2'; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(21,34,27,0.08)';
  for (let y = 11; y < H; y += 22) for (let x = 11; x < W; x += 22) g.fillRect(x, y, 2, 2);
  rr(g, 32, 32, W - 64, H - 64, 28); g.fillStyle = '#ffffff'; g.fill();
  g.strokeStyle = '#e6e9e1'; g.lineWidth = 2; g.stroke();

  // identity on a dark collectible tile
  rr(g, 72, 104, 432, 432, 28); g.fillStyle = '#0b1410'; g.fill();
  const id = document.createElement('canvas'); drawIdentity(id, 8, 20, '#0b1410');
  g.save(); rr(g, 88, 120, 400, 400, 18); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(id, 88, 120, 400, 400); g.restore();
  g.font = `700 15px ${MONO}`; g.fillStyle = '#5d6b63'; g.textAlign = 'center';
  g.fillText(`MY PRIVATE IDENTITY #${playerNumber()}`, 288, 572); g.textAlign = 'left';

  const x = 552;
  g.font = `700 15px ${MONO}`; g.fillStyle = '#5d6b63';
  g.fillText('GLASSTOWN · LEARN ZCASH PRIVACY', x, 104);
  const chip = state.verified === 'shielded' ? '✓ VERIFIED FULLY PRIVATE' : '✓ ALL 7 LEVELS COMPLETE';
  const cw = g.measureText(chip).width + 28;
  rr(g, x, 124, cw, 34, 17); g.fillStyle = '#e4f7ec'; g.fill();
  g.fillStyle = '#0b7a43'; g.fillText(chip, x + 14, 147);
  g.font = `800 50px ${SANS}`; g.fillStyle = '#15221b';
  ['I made my first', 'private Zcash', 'payment.'].forEach((l, i) => g.fillText(l, x, 222 + i * 58));

  // the redacted receipt: what the public sees
  rr(g, x, 362, 560, 168, 18); g.fillStyle = '#0b1410'; g.fill();
  g.font = `700 13px ${MONO}`; g.fillStyle = '#5dff8f'; g.fillText('WHAT THE PUBLIC SEES', x + 22, 392);
  g.font = `400 19px ${MONO}`;
  const rows: [string, string, string][] = [['Amount', '██████████', '#ffffff'], ['To', '████████████████', '#ffffff'], ['Note', '█████████████', '#ffffff'], ['Fee', '0.0001 ZEC (public)', '#8fd1a8']];
  rows.forEach(([k, v, col], i) => { const y = 426 + i * 29; g.fillStyle = '#8fd1a8'; g.fillText(k, x + 22, y); g.fillStyle = col; g.fillText(v, x + 130, y); });

  g.font = `600 16px ${SANS}`; g.fillStyle = '#5d6b63';
  g.fillText(`Zero to private in ${elapsed()}`, x, 576);
  g.textAlign = 'right'; g.fillStyle = '#12a15a'; g.font = `700 16px ${MONO}`; g.fillText(siteLabel(), W - 72, 576); g.textAlign = 'left';
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export function tweetUrl(): string {
  const text = state.verified === 'shielded'
    ? `I just made my first fully private Zcash payment, using Glasstown.\n\nAmount ████ · To ████ · Note ████\n\nZero to private in ${elapsed()}. Learn it in about 10 minutes:`
    : 'I just learned how to use Zcash privately in about 10 minutes, with a game called Glasstown.\n\nEvery wallet is glass until you shield it:';
  const u = new URL('https://x.com/intent/post');
  u.searchParams.set('text', text + '\n');
  u.searchParams.set('url', siteUrl());
  u.searchParams.set('hashtags', 'Zcash,ZECATHON');
  return u.toString();
}
