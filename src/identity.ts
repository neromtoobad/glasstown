// A 26×26 pixel "shielded identity". It is drawn from a random seed and the player's in-game
// choices. It never touches a key or an address. Each finished level adds one layer.
import { state } from './state';

type Pal = { bg1: string; bg2: string; body: string; shade: string; hood: string; hoodShade: string; eye: string; skin: string };
const PALS: Pal[] = [
  { bg1: '#dff3f1', bg2: '#c8ebe6', body: '#2bb3a3', shade: '#1f8f82', hood: '#33415c', hoodShade: '#242f44', eye: '#f4b728', skin: '#f2d7c2' },
  { bg1: '#ece8fb', bg2: '#ddd5f7', body: '#8b7ae6', shade: '#6d5bd0', hood: '#2d2a4a', hoodShade: '#1f1d36', eye: '#7cf2d7', skin: '#e8c1a0' },
  { bg1: '#fff3d6', bg2: '#ffe7ad', body: '#f4b728', shade: '#d39a12', hood: '#3b3a36', hoodShade: '#2a2926', eye: '#5ad1ff', skin: '#c99872' },
  { bg1: '#e3f0ff', bg2: '#cfe4ff', body: '#4f8df5', shade: '#3a6fd0', hood: '#1e2a3a', hoodShade: '#141d29', eye: '#ffd166', skin: '#8d5a3b' },
  { bg1: '#fde6ee', bg2: '#fbd3e1', body: '#ef6f9c', shade: '#cf4f7f', hood: '#3a2c3f', hoodShade: '#291f2d', eye: '#a3ffcf', skin: '#f5d5b8' },
  { bg1: '#e6f6e0', bg2: '#d2eec7', body: '#5bbf6a', shade: '#3f9c4f', hood: '#2c3b2f', hoodShade: '#1e2a21', eye: '#ffe066', skin: '#b07a55' },
];

function rng(seedStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
}

export const LAYER_NAMES = ['glass outline', 'eyes', 'colour', 'background', 'hood', 'frost aura', 'moth pin', 'privacy mask', 'gold shield'];

/** Draw the identity with `layers` layers (0–8). */
export function drawIdentity(canvas: HTMLCanvasElement, layers: number, px = 8): void {
  const N = 26;
  canvas.width = N * px; canvas.height = N * px;
  const g = canvas.getContext('2d'); if (!g) return;
  g.imageSmoothingEnabled = false;
  const c = state.choices;
  const r = rng(state.seed + (c.device ?? '') + (c.route ?? ''));
  const pal = PALS[Math.floor(r() * PALS.length)];
  const eyeStyle = Math.floor(r() * 3);
  const bgStyle = Math.floor(r() * 3);
  const grid: (string | null)[][] = Array.from({ length: N }, () => Array(N).fill(null));
  const set = (x: number, y: number, col: string) => { if (x >= 0 && y >= 0 && x < N && y < N) grid[y][x] = col; };
  const inHead = (x: number, y: number) => (x - 12.5) ** 2 + (y - 11) ** 2 <= 36;
  const inBody = (x: number, y: number) => y >= 18 && ((x - 12.5) / 9) ** 2 + ((y - 26) / 8) ** 2 <= 1;
  const inHood = (x: number, y: number) => ((x - 12.5) ** 2 + (y - 10.5) ** 2 <= 64 && y <= 17) || (y > 15 && y < 21 && Math.abs(x - 12.5) <= 8 - (y - 15) * 0.2);

  // background
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (layers < 3) { set(x, y, '#f4f8fb'); continue; }
    const alt = bgStyle === 0 ? (x + y) % 6 < 3 : bgStyle === 1 ? (x % 4 === 0 && y % 4 === 0) : y < 13;
    set(x, y, alt ? pal.bg2 : pal.bg1);
  }
  // frost aura (behind the figure)
  if (layers >= 5) {
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2, d = 9 + r() * 4;
      const x = Math.round(12.5 + Math.cos(a) * d), y = Math.round(12 + Math.sin(a) * d * 0.95);
      set(x, y, r() > 0.5 ? '#ffffff' : '#e3dcf7');
    }
  }
  // body + head
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (inBody(x, y)) set(x, y, layers >= 2 ? (x > 13 ? pal.shade : pal.body) : '#d6e2ea');
    if (inHead(x, y)) set(x, y, layers >= 2 ? pal.skin : '#e7eef3');
  }
  // hood over the head edges and shoulders
  if (layers >= 4) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (inHood(x, y) && !((x - 12.5) ** 2 + (y - 11.5) ** 2 <= 26 && y >= 7)) set(x, y, x > 13 ? pal.hoodShade : pal.hood);
  }
  // glass outline
  const isFig = (x: number, y: number) => inHead(x, y) || inBody(x, y) || (layers >= 4 && inHood(x, y));
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (isFig(x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isFig(x + dx, y + dy))) set(x, y, layers >= 2 ? '#1c2b3a' : '#9fb3c2');
  }
  // eyes
  if (layers >= 1) {
    const eye = layers >= 2 ? pal.eye : '#1c2b3a';
    if (eyeStyle === 0) { set(10, 11, eye); set(15, 11, eye); set(10, 10, eye); set(15, 10, eye); }
    else if (eyeStyle === 1) { set(9, 11, eye); set(10, 11, eye); set(15, 11, eye); set(16, 11, eye); }
    else { set(10, 11, eye); set(15, 11, eye); set(11, 11, '#ffffff'); set(16, 11, '#ffffff'); }
  }
  // privacy mask
  if (layers >= 7) for (let x = 8; x <= 17; x++) for (let y = 13; y <= 15; y++) if (inHead(x, y)) set(x, y, y === 13 ? '#2a3442' : '#1c2430');
  // moth pin
  if (layers >= 6) { const m = '#f4b728'; set(17, 21, m); set(19, 21, m); set(18, 22, '#7a5a10'); set(17, 22, m); set(19, 22, m); }
  // gold shield badge
  if (layers >= 8) {
    const gd = '#f4b728', gs = '#c48a0c';
    for (let y = 19; y <= 23; y++) for (let x = 10; x <= 14; x++) {
      const w = y <= 21 ? 2 : y === 22 ? 1 : 0;
      if (Math.abs(x - 12) <= w) set(x, y, x > 12 ? gs : gd);
    }
    set(12, 20, '#fff6d6');
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const col = grid[y][x]; if (!col) continue;
    g.fillStyle = col; g.fillRect(x * px, y * px, px, px);
  }
}

export function identityLayers(): number {
  return Math.min(8, state.done.length);
}
