import { drawIdentity } from './identity';
import { state, elapsed } from './state';

const W = 1200, H = 675;

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export const rank = () => (state.verified === 'shielded' ? 'Ghost of Glasstown' : 'Fog Walker');

/** The share card. Like a Wordle grid it brags without spoiling: no txid, no address, no amount. */
export async function drawCard(canvas: HTMLCanvasElement): Promise<void> {
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d')!;
  try { await Promise.all([document.fonts.load('700 48px Fredoka'), document.fonts.load('800 20px Nunito'), document.fonts.load('400 20px "JetBrains Mono"')]); } catch { /* fallback fonts */ }
  const [town, peep, zee] = await Promise.all([loadImg('/town.webp'), loadImg('/chars/peep/defeated.webp'), loadImg('/chars/zee/cheer.webp')]);

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#eef8f7'); bg.addColorStop(1, '#f3f0fc');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  if (town) { g.globalAlpha = 0.28; g.drawImage(town, 0, 0, W, (W * town.height) / town.width); g.globalAlpha = 1; }
  // frost veil
  const veil = g.createLinearGradient(0, 0, W, 0);
  veil.addColorStop(0, 'rgba(255,255,255,0.86)'); veil.addColorStop(0.62, 'rgba(255,255,255,0.72)'); veil.addColorStop(1, 'rgba(240,236,252,0.55)');
  g.fillStyle = veil; g.fillRect(0, 0, W, H);

  // identity
  const id = document.createElement('canvas'); drawIdentity(id, 8, 13);
  g.save(); g.shadowColor = 'rgba(28,43,58,0.18)'; g.shadowBlur = 30; g.shadowOffsetY = 10;
  rr(g, 60, 120, 370, 370, 28); g.fillStyle = '#fff'; g.fill(); g.restore();
  g.save(); rr(g, 72, 132, 346, 346, 20); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(id, 72, 132, 346, 346); g.restore();
  g.font = '800 18px Nunito'; g.fillStyle = '#5b6b7a'; g.textAlign = 'center';
  g.fillText('MY SHIELDED IDENTITY · 26×26', 245, 525);

  // headline
  g.textAlign = 'left';
  g.font = '800 18px Nunito'; g.fillStyle = '#1f8f82';
  rr(g, 480, 88, state.verified === 'shielded' ? 330 : 250, 38, 19); g.fillStyle = '#d7f3ef'; g.fill();
  g.fillStyle = '#137a6e'; g.fillText(state.verified === 'shielded' ? '✓ VERIFIED FULLY SHIELDED' : '✓ GRADUATED GLASSTOWN', 498, 114);
  g.fillStyle = '#1c2b3a'; g.font = '700 50px Fredoka';
  ['I made my first', 'shielded Zcash', 'transaction.'].forEach((l, i) => g.fillText(l, 480, 190 + i * 58));

  // redacted receipt
  const rows: [string, string][] = [['Amount', '████████'], ['To', '██████████████'], ['Memo', '███████████'], ['Fee', '0.0001 ZEC (public)']];
  g.font = '400 22px "JetBrains Mono"';
  rows.forEach(([k, v], i) => {
    const y = 382 + i * 40;
    g.fillStyle = '#7a8a99'; g.fillText(k.padEnd(7, ' '), 482, y);
    g.fillStyle = k === 'Fee' ? '#5b6b7a' : '#2a3442'; g.fillText(v, 600, y);
  });

  // footer
  g.fillStyle = 'rgba(28,43,58,0.08)'; g.fillRect(0, H - 70, W, 70);
  g.font = '700 26px Fredoka'; g.fillStyle = '#1c2b3a'; g.fillText('Glasstown', 60, H - 26);
  g.font = '700 18px Nunito'; g.fillStyle = '#5b6b7a';
  g.fillText(`a Zcash onboarding game  ·  ${rank()}  ·  zero → shielded in ${elapsed()}`, 200, H - 29);
  g.textAlign = 'right'; g.fillStyle = '#1f8f82'; g.fillText(location.host || 'glasstown', W - 40, H - 29);

  if (peep) g.drawImage(peep, W - 230, 80, 180, (180 * peep.height) / peep.width);
  if (zee) g.drawImage(zee, W - 160, 360, 115, (115 * zee.height) / zee.width);
}

export function tweetUrl(): string {
  const text = state.verified === 'shielded'
    ? 'I just made my first fully shielded Zcash transaction in Glasstown 🦓\n\nPeep the nosy owl couldn’t see a thing.\nAmount ████ · To ████ · Memo ████\n\nZero → shielded in ' + elapsed() + '. Your turn:'
    : 'I graduated from Glasstown, a game that takes you from zero to your first shielded Zcash transaction 🦓\n\nEveryone can see your money. Let’s fix that:';
  const u = new URL('https://x.com/intent/post');
  u.searchParams.set('text', text + '\n');
  u.searchParams.set('url', location.origin);
  u.searchParams.set('hashtags', 'Zcash,ZECATHON');
  return u.toString();
}
