import { drawIdentity, traitList, playerNumber } from './identity';
import { state, elapsed } from './state';

const W = 1200, H = 675;
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

export const rank = () => (state.verified === 'shielded' ? 'GHOST OF GLASSTOWN' : 'INITIATE');

/** The share card. Like a Wordle grid it brags without spoiling anything: no txid, no address, no amount. */
export async function drawCard(canvas: HTMLCanvasElement): Promise<void> {
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d')!;
  try { await Promise.all([document.fonts.load(`700 40px ${MONO}`), document.fonts.load(`400 20px ${MONO}`)]); } catch { /* fallback fonts */ }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  // faint grid
  g.fillStyle = '#0b1610';
  for (let x = 0; x < W; x += 24) g.fillRect(x, 0, 1, H);
  for (let y = 0; y < H; y += 24) g.fillRect(0, y, W, 1);
  g.strokeStyle = '#23462f'; g.lineWidth = 2; g.strokeRect(24, 24, W - 48, H - 48);

  // identity, crisp pixels
  const id = document.createElement('canvas'); drawIdentity(id, 8, 20, '#07100b');
  g.imageSmoothingEnabled = false;
  g.drawImage(id, 64, 112, 416, 416);
  g.strokeStyle = '#5dff8f'; g.lineWidth = 2; g.strokeRect(63, 111, 418, 418);
  g.font = `400 16px ${MONO}`; g.fillStyle = '#4f9e70';
  g.fillText(`IDENTITY #${playerNumber()} · 26 × 26`, 64, 560);
  g.fillText('STORED ONLY IN YOUR BROWSER', 64, 584);

  // headline
  const x = 530;
  g.font = `700 16px ${MONO}`; g.fillStyle = '#4f9e70';
  g.fillText('GLASSTOWN // A ZCASH INITIATION', x, 90);
  g.fillStyle = state.verified === 'shielded' ? '#5dff8f' : '#c8ffdc';
  g.fillText(state.verified === 'shielded' ? '■ VERIFIED FULLY SHIELDED' : '■ INITIATION COMPLETE', x, 122);
  g.font = `700 44px ${MONO}`; g.fillStyle = '#ffffff';
  ['I MADE MY FIRST', 'SHIELDED ZCASH', 'TRANSACTION.'].forEach((l, i) => g.fillText(l, x, 186 + i * 54));

  // redacted receipt
  g.font = `400 20px ${MONO}`;
  const rows: [string, string, string][] = [['AMOUNT', '██████████', '#c8ffdc'], ['TO', '████████████████', '#c8ffdc'], ['MEMO', '█████████████', '#c8ffdc'], ['FEE', '0.0001 ZEC (public)', '#4f9e70']];
  rows.forEach(([k, v, c], i) => { const y = 368 + i * 34; g.fillStyle = '#4f9e70'; g.fillText(k, x, y); g.fillStyle = c; g.fillText(v, x + 110, y); });

  // traits strip
  const traits = traitList().slice(0, 4);
  g.font = `400 14px ${MONO}`;
  traits.forEach(([k, v], i) => { const tx = x + (i % 2) * 300, ty = 528 + Math.floor(i / 2) * 26; g.fillStyle = '#4f9e70'; g.fillText(k.toUpperCase(), tx, ty); g.fillStyle = '#c8ffdc'; g.fillText(v.toUpperCase(), tx + 110, ty); });

  // footer
  g.font = `400 14px ${MONO}`; g.fillStyle = '#4f9e70';
  g.fillText(`${rank()} · ZERO → SHIELDED IN ${elapsed()}`, x, 612);
  g.textAlign = 'right'; g.fillStyle = '#5dff8f'; g.fillText(location.host || 'glasstown', W - 64, 612); g.textAlign = 'left';
}

export function tweetUrl(): string {
  const text = state.verified === 'shielded'
    ? `I just made my first fully shielded Zcash transaction in Glasstown.\n\nThe Watcher saw nothing.\nAMOUNT ████ · TO ████ · MEMO ████\n\nIdentity #${playerNumber()} rendered. Zero → shielded in ${elapsed()}.`
    : 'Glasstown: a Zcash initiation. Every wallet is glass until you shield it.\n\nEight nodes, one arcade game, and your first real shielded transaction:';
  const u = new URL('https://x.com/intent/post');
  u.searchParams.set('text', text + '\n');
  u.searchParams.set('url', location.origin);
  u.searchParams.set('hashtags', 'Zcash,ZECATHON');
  return u.toString();
}
