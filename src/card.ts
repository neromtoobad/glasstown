import { drawIdentity, playerNumber } from './identity';
import { state, elapsed } from './state';

const W = 1200, H = 675;
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

export const rank = () => (state.verified === 'shielded' ? 'Verified private payment' : 'Glasstown graduate');

/** The share card. Like a Wordle grid it brags without giving anything away: no txid, no address, no amount. */
export async function drawCard(canvas: HTMLCanvasElement): Promise<void> {
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d')!;
  try { await Promise.all([document.fonts.load(`700 40px ${MONO}`), document.fonts.load(`400 20px ${MONO}`)]); } catch { /* fallback fonts */ }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0b1610';
  for (let x = 0; x < W; x += 24) g.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 24) g.fillRect(0, y, W, 1);
  g.strokeStyle = '#23462f'; g.lineWidth = 2; g.strokeRect(24, 24, W - 48, H - 48);

  const id = document.createElement('canvas'); drawIdentity(id, 8, 20, '#07100b');
  g.imageSmoothingEnabled = false;
  g.drawImage(id, 64, 112, 416, 416);
  g.strokeStyle = '#5dff8f'; g.strokeRect(63, 111, 418, 418);
  g.font = `400 16px ${MONO}`; g.fillStyle = '#7fc79a';
  g.fillText(`MY PRIVATE IDENTITY #${playerNumber()}`, 64, 560);

  const x = 530;
  g.font = `700 16px ${MONO}`; g.fillStyle = '#7fc79a';
  g.fillText('GLASSTOWN · LEARN ZCASH PRIVACY', x, 96);
  g.fillStyle = '#5dff8f';
  g.fillText(state.verified === 'shielded' ? '■ VERIFIED: FULLY PRIVATE PAYMENT' : '■ ALL 7 LEVELS COMPLETE', x, 128);
  g.font = `700 44px ${MONO}`; g.fillStyle = '#ffffff';
  ['I made my first', 'private Zcash', 'payment.'].forEach((l, i) => g.fillText(l, x, 192 + i * 54));

  g.font = `400 21px ${MONO}`;
  const rows: [string, string, string][] = [['Amount', '██████████', '#eafff1'], ['To', '████████████████', '#eafff1'], ['Note', '█████████████', '#eafff1'], ['Fee', '0.0001 ZEC (the only public part)', '#7fc79a']];
  rows.forEach(([k, v, c], i) => { const y = 380 + i * 36; g.fillStyle = '#7fc79a'; g.fillText(k, x, y); g.fillStyle = c; g.fillText(v, x + 100, y); });

  g.font = `400 15px ${MONO}`; g.fillStyle = '#7fc79a';
  g.fillText(`Zero to private in ${elapsed()}`, x, 560);
  g.textAlign = 'right'; g.fillStyle = '#5dff8f'; g.fillText(location.host || 'glasstown', W - 64, 610); g.textAlign = 'left';
}

export function tweetUrl(): string {
  const text = state.verified === 'shielded'
    ? `I just made my first fully private Zcash payment, using Glasstown.\n\nAmount ████ · To ████ · Note ████\n\nZero to private in ${elapsed()}. Learn it in about 10 minutes:`
    : 'I just learned how to use Zcash privately in about 10 minutes, with a game called Glasstown.\n\nEvery wallet is glass until you shield it:';
  const u = new URL('https://x.com/intent/post');
  u.searchParams.set('text', text + '\n');
  u.searchParams.set('url', location.origin);
  u.searchParams.set('hashtags', 'Zcash,ZECATHON');
  return u.toString();
}
