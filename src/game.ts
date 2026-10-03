// DARK POOL: a small arcade game about shielding.
// Grab ZEC in the lit glass district. While you carry it you're transparent, so Watcher drones
// can see you and trace you. Reach the dark pool to shield what you carry: inside it they lose you.
import { sfx } from './ui';
import { state, save } from './state';
import { playerTraits, PALS } from './identity';

const W = 320, H = 192;
type V = { x: number; y: number };
type Drone = V & { vx: number; vy: number; tx: number; ty: number; chase: number; lost: number };
type Coin = V & { v: number; t: number };
type Pop = V & { text: string; t: number; color: string };

export type Result = { shielded: number; doxxed: number; best: number; isBest: boolean };

const POOL = { x: 228, y: 22, w: 84, h: 148 };
const SIGHT_EMPTY = 30, SIGHT_CARRY = 54;
const WALLS = [
  { x: 60, y: 40, w: 22, h: 30 }, { x: 120, y: 24, w: 30, h: 20 }, { x: 150, y: 110, w: 26, h: 34 },
  { x: 70, y: 128, w: 34, h: 20 }, { x: 196, y: 20, w: 12, h: 26 },
];
const inRect = (p: V, r: { x: number; y: number; w: number; h: number }, pad = 0) => p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + pad;
const inPool = (p: V) => inRect(p, POOL, -3);
const blocked = (p: V, rad: number) => p.x < rad || p.y < rad || p.x > W - rad || p.y > H - rad || WALLS.some((w) => inRect(p, w, rad));

export function darkPool(host: HTMLElement, opts: { seconds?: number; onEnd: (r: Result) => void }): () => void {
  const seconds = opts.seconds ?? 60;
  const wrap = document.createElement('div'); wrap.className = 'game';
  const hud = document.createElement('div'); hud.className = 'game-hud';
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'game-cv'; cv.tabIndex = 0;
  cv.setAttribute('aria-label', 'Dark Pool game. Move with arrow keys or WASD, or hold and drag on the screen.');
  const help = document.createElement('div'); help.className = 'game-help';
  help.innerHTML = '<span>Move: arrow keys, or press and drag</span><span>Pick up coins → carry them into the dark pool</span>';
  wrap.append(hud, cv, help); host.append(wrap);
  const g = cv.getContext('2d')!; g.imageSmoothingEnabled = false;

  const traits = playerTraits(); const pal = PALS[traits.pal];
  const me = { x: POOL.x + POOL.w / 2, y: POOL.y + POOL.h / 2, carry: 0, inv: 0 };
  let shielded = 0, doxxed = 0, lives = 3, time = seconds, last = 0, running = true, started = false, spawnT = 0;
  const drones: Drone[] = [];
  const coins: Coin[] = [];
  const pops: Pop[] = [];
  const trail: V[] = [];
  const keys = new Set<string>();
  let pointer: V | null = null;

  const addDrone = () => {
    let p: V; do { p = { x: 20 + Math.random() * 160, y: 20 + Math.random() * 150 }; } while (blocked(p, 6) || Math.hypot(p.x - me.x, p.y - me.y) < 80);
    drones.push({ ...p, vx: 0, vy: 0, tx: p.x, ty: p.y, chase: 0, lost: 0 });
  };
  const addCoin = () => {
    let p: V; do { p = { x: 12 + Math.random() * 200, y: 12 + Math.random() * 168 }; } while (blocked(p, 5));
    coins.push({ ...p, v: [0.01, 0.01, 0.02, 0.05][Math.floor(Math.random() * 4)], t: 0 });
  };
  addDrone();
  // Dev builds expose live state so a scripted bot can play (tests and trailer capture). Stripped from production.
  if (import.meta.env.DEV) (window as unknown as { __dp: unknown }).__dp = { me, coins, drones, pool: POOL, walls: WALLS, get shielded() { return shielded; }, get lives() { return lives; }, get time() { return time; } };
  for (let i = 0; i < 4; i++) addCoin();

  const onKey = (e: KeyboardEvent, down: boolean) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
      e.preventDefault(); down ? keys.add(k) : keys.delete(k); started = true;
    }
  };
  const kd = (e: KeyboardEvent) => onKey(e, true), ku = (e: KeyboardEvent) => onKey(e, false);
  const toLocal = (e: PointerEvent): V => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H }; };
  const pd = (e: PointerEvent) => { pointer = toLocal(e); started = true; cv.setPointerCapture(e.pointerId); cv.focus({ preventScroll: true }); };
  const pm = (e: PointerEvent) => { if (pointer) pointer = toLocal(e); };
  const pu = () => { pointer = null; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  cv.addEventListener('pointerdown', pd); cv.addEventListener('pointermove', pm); cv.addEventListener('pointerup', pu); cv.addEventListener('pointercancel', pu);

  const pop = (x: number, y: number, text: string, color: string) => pops.push({ x, y, text, t: 1.2, color });

  function step(dt: number) {
    // player
    let dx = 0, dy = 0;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 1; if (keys.has('arrowright') || keys.has('d')) dx += 1;
    if (keys.has('arrowup') || keys.has('w')) dy -= 1; if (keys.has('arrowdown') || keys.has('s')) dy += 1;
    if (pointer) { const vx = pointer.x - me.x, vy = pointer.y - me.y, d = Math.hypot(vx, vy); if (d > 3) { dx = vx / d; dy = vy / d; } }
    const len = Math.hypot(dx, dy) || 1, sp = 88;
    const nx = me.x + (dx / len) * sp * dt, ny = me.y + (dy / len) * sp * dt;
    if (!blocked({ x: nx, y: me.y }, 4)) me.x = nx;
    if (!blocked({ x: me.x, y: ny }, 4)) me.y = ny;
    me.inv = Math.max(0, me.inv - dt);
    const hidden = inPool(me);
    if (!hidden && (dx || dy) && me.carry > 0) { trail.push({ x: me.x, y: me.y }); if (trail.length > 26) trail.shift(); }
    else if (trail.length) trail.shift();

    // shield on entering the pool
    if (hidden && me.carry > 0) {
      shielded += me.carry; pop(me.x, me.y - 8, `+${me.carry.toFixed(2)} PRIVATE`, '#5dff8f'); me.carry = 0; sfx.whoosh(); trail.length = 0;
    }
    // coins
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i]; c.t += dt;
      if (Math.hypot(c.x - me.x, c.y - me.y) < 7) { me.carry = +(me.carry + c.v).toFixed(2); coins.splice(i, 1); sfx.ding(); pop(c.x, c.y - 6, `+${c.v} public`, '#9fc6d4'); }
    }
    spawnT += dt; if (spawnT > 1.6 && coins.length < 6) { spawnT = 0; addCoin(); }

    // drones
    for (const d of drones) {
      const dist = Math.hypot(me.x - d.x, me.y - d.y);
      const sees = !hidden && dist < (me.carry > 0 ? SIGHT_CARRY : SIGHT_EMPTY);
      if (sees) { d.chase = 1.0; d.lost = 0; } else if (d.chase > 0) { d.chase -= dt; if (hidden) d.lost = 0.9; }
      d.lost = Math.max(0, d.lost - dt);
      let tx = d.tx, ty = d.ty, spd = 32;
      if (d.chase > 0 && !hidden) { tx = me.x; ty = me.y; spd = 52 + Math.min(16, me.carry * 100); }
      else if (Math.hypot(d.tx - d.x, d.ty - d.y) < 4) { d.tx = 12 + Math.random() * (POOL.x - 50); d.ty = 12 + Math.random() * 168; }
      const vx = tx - d.x, vy = ty - d.y, l = Math.hypot(vx, vy) || 1;
      const ax = d.x + (vx / l) * spd * dt, ay = d.y + (vy / l) * spd * dt;
      if (!blocked({ x: ax, y: d.y }, 5) && !inPool({ x: ax, y: d.y })) d.x = ax; else d.tx = d.x - (vx / l) * 30;
      if (!blocked({ x: d.x, y: ay }, 5) && !inPool({ x: d.x, y: ay })) d.y = ay; else d.ty = d.y - (vy / l) * 30;
      if (!hidden && me.inv <= 0 && dist < 7) {
        lives--; doxxed += me.carry;
        pop(me.x, me.y - 8, me.carry > 0 ? `CAUGHT −${me.carry.toFixed(2)}` : 'CAUGHT', '#ff4d4d');
        me.carry = 0; me.inv = 2.2; sfx.buzz(); trail.length = 0;
        me.x = POOL.x + POOL.w / 2; me.y = POOL.y + POOL.h / 2;
        if (lives <= 0) end();
      }
    }
    // more watchers over time
    const want = 1 + Math.floor((seconds - time) / 15);
    if (drones.length < Math.min(3, want)) addDrone();
    for (let i = pops.length - 1; i >= 0; i--) { pops[i].t -= dt; pops[i].y -= 14 * dt; if (pops[i].t <= 0) pops.splice(i, 1); }
    time -= dt; if (time <= 0) { time = 0; end(); }
  }

  function px(x: number, y: number, w: number, h: number, c: string) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
  function draw(now: number) {
    // glass district: lit grid
    px(0, 0, W, H, '#07110d');
    g.fillStyle = '#0d2219';
    for (let x = 0; x < W; x += 8) g.fillRect(x, 0, 1, H);
    for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 1);
    for (const w of WALLS) { px(w.x, w.y, w.w, w.h, '#123a4a'); g.strokeStyle = '#9fc6d4'; g.globalAlpha = 0.55; g.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1); g.globalAlpha = 1; px(w.x + 3, w.y + 3, 3, 3, '#ffd23f'); }
    // dark pool: dithered void with drifting pixels
    px(POOL.x, POOL.y, POOL.w, POOL.h, '#000');
    for (let y = POOL.y; y < POOL.y + POOL.h; y += 2) for (let x = POOL.x + ((y / 2) % 2); x < POOL.x + POOL.w; x += 4) { g.fillStyle = '#04100a'; g.fillRect(x, y, 1, 1); }
    for (let i = 0; i < 18; i++) { const t = now / 1000 + i * 7.3; const x = POOL.x + ((i * 37 + t * 6) % POOL.w), y = POOL.y + ((i * 53 + Math.sin(t) * 9 + POOL.h) % POOL.h); px(x, y, 1, 1, i % 3 ? '#1d3a2a' : '#3f7f5f'); }
    g.strokeStyle = '#5dff8f'; g.globalAlpha = 0.35; g.setLineDash([2, 2]); g.strokeRect(POOL.x + 0.5, POOL.y + 0.5, POOL.w - 1, POOL.h - 1); g.setLineDash([]); g.globalAlpha = 1;
    g.fillStyle = '#5dff8f'; g.font = '8px "JetBrains Mono", monospace'; g.globalAlpha = 0.8; g.fillText('DARK POOL', POOL.x + 18, POOL.y + 10); g.fillText('= PRIVATE', POOL.x + 22, POOL.y + POOL.h - 4); g.globalAlpha = 1;
    // coins
    for (const c of coins) { const b = Math.sin(c.t * 5) > 0 ? 0 : 1; const y0 = c.y - b; px(c.x - 3, y0 - 3, 6, 6, '#f4b728'); px(c.x - 2, y0 - 2, 4, 4, '#ffd23f'); px(c.x - 2, y0 - 2, 4, 1, '#7a5a10'); px(c.x, y0 - 1, 1, 1, '#7a5a10'); px(c.x - 1, y0, 1, 1, '#7a5a10'); px(c.x - 2, y0 + 1, 4, 1, '#7a5a10'); }
    // trail = the public record of a transparent wallet
    for (let i = 0; i < trail.length; i++) { g.globalAlpha = (i / trail.length) * 0.6; px(trail[i].x - 1, trail[i].y - 1, 2, 2, '#9fc6d4'); } g.globalAlpha = 1;
    // drones
    for (const d of drones) {
      const chasing = d.chase > 0 && !inPool(me);
      g.strokeStyle = chasing ? '#ff4d4d' : '#ff8a8a'; g.globalAlpha = chasing ? 0.5 : 0.18;
      g.beginPath(); g.arc(d.x, d.y, me.carry > 0 ? SIGHT_CARRY : SIGHT_EMPTY, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
      if (chasing) { g.strokeStyle = '#ff4d4d'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(me.x, me.y); g.stroke(); g.setLineDash([]); }
      px(d.x - 4, d.y - 3, 8, 7, '#dfe8ea'); px(d.x - 3, d.y - 2, 6, 5, '#b9c7cc');
      const lx = Math.max(-1, Math.min(1, (me.x - d.x) / 30)), ly = Math.max(-1, Math.min(1, (me.y - d.y) / 30));
      px(d.x - 2 + lx, d.y - 1 + ly, 3, 3, chasing ? '#ff2a2a' : '#c0392b');
      if (d.lost > 0) { g.fillStyle = '#ffd23f'; g.fillText('?', d.x - 2, d.y - 6); }
      else if (chasing) { g.fillStyle = '#ff4d4d'; g.fillText('!', d.x - 1, d.y - 6); }
    }
    // player: a tiny hooded identity
    const blink = me.inv > 0 && Math.floor(now / 100) % 2 === 0;
    if (!blink) {
      const hid = inPool(me);
      g.globalAlpha = hid ? 0.55 : 1;
      px(me.x - 4, me.y - 5, 8, 9, pal.main); px(me.x - 4, me.y - 5, 3, 9, pal.light); px(me.x - 2, me.y - 3, 5, 4, '#050807');
      px(me.x - 1, me.y - 2, 1, 1, traits.eyeColor); px(me.x + 1, me.y - 2, 1, 1, traits.eyeColor);
      if (me.carry > 0 && !hid) { px(me.x - 1, me.y - 9, 3, 3, '#f4b728'); }
      g.globalAlpha = 1;
    }
    for (const p of pops) { g.globalAlpha = Math.min(1, p.t); g.fillStyle = p.color; g.fillText(p.text, p.x - p.text.length * 2.4, p.y); } g.globalAlpha = 1;
    if (!started) {
      px(0, H / 2 - 18, W, 36, 'rgba(0,0,0,0.75)');
      g.textAlign = 'center'; g.fillStyle = '#5dff8f'; g.fillText('TAP HERE OR PRESS AN ARROW KEY TO START', W / 2, H / 2 - 3);
      g.fillStyle = '#c8ffdc'; g.fillText('coins you carry are public: the drones can see them', W / 2, H / 2 + 9); g.textAlign = 'left';
    }
    hud.innerHTML = `<span>Time <b>${Math.ceil(time)}s</b></span><span class="${me.carry > 0 ? 'exposed' : ''}">Carrying (public) <b>${me.carry.toFixed(2)}</b></span><span class="ok">Hidden in pool (private) <b>${shielded.toFixed(2)}</b></span><span>Lives <b>${'■'.repeat(Math.max(0, lives))}${'□'.repeat(3 - Math.max(0, lives))}</b></span>`;
  }

  let raf = 0;
  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0); last = now;
    if (started) step(dt);
    draw(now);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function cleanup() {
    running = false; cancelAnimationFrame(raf);
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
  }
  let ended = false;
  function end() {
    if (ended) return; ended = true;
    cleanup();
    const best = Math.max(state.best ?? 0, shielded);
    const isBest = shielded > (state.best ?? 0) && shielded > 0;
    state.best = +best.toFixed(2); save();
    sfx.fanfare();
    draw(performance.now());
    g.fillStyle = 'rgba(0,0,0,0.82)'; g.fillRect(0, H / 2 - 30, W, 60);
    g.textAlign = 'center'; g.font = '10px "JetBrains Mono", monospace';
    g.fillStyle = '#ffffff'; g.fillText(lives <= 0 ? 'CAUGHT! GAME OVER' : 'TIME UP!', W / 2, H / 2 - 10);
    g.fillStyle = '#5dff8f'; g.fillText(`HIDDEN IN THE POOL: ${shielded.toFixed(2)} ZEC`, W / 2, H / 2 + 6);
    g.fillStyle = '#ff4d4d'; g.font = '8px "JetBrains Mono", monospace'; g.fillText(`LOST TO THE WATCHER: ${doxxed.toFixed(2)} ZEC`, W / 2, H / 2 + 20); g.textAlign = 'left';
    opts.onEnd({ shielded: +shielded.toFixed(2), doxxed: +doxxed.toFixed(2), best: state.best, isBest });
  }
  cv.focus({ preventScroll: true });
  return cleanup;
}
