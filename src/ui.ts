import { state, save } from './state';
import { CAST, castPortrait, type Who } from './identity';

// ---------- tiny DOM helper ----------
type Attrs = Record<string, string | number | boolean | EventListener | undefined>;
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, attrs: Attrs = {}, ...kids: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'html') el.innerHTML = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids) if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
  return el;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- sound: synthesized, nothing downloaded ----------
let ac: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (state.muted) return null;
  try { ac ??= new AudioContext(); if (ac.state === 'suspended') void ac.resume(); return ac; } catch { return null; }
}
function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.08, slide?: number, delay = 0) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sfx = {
  ding() { tone(880, 0.12, 'sine', 0.07); tone(1320, 0.22, 'sine', 0.07, undefined, 0.08); },
  buzz() { tone(150, 0.22, 'square', 0.04, 110); },
  pop() { tone(620, 0.06, 'triangle', 0.05, 900); },
  tick() { tone(1800, 0.015, 'square', 0.012); },
  whoosh() {
    const a = ctx(); if (!a) return;
    const len = a.sampleRate * 0.6, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.setValueAtTime(400, a.currentTime);
    f.frequency.exponentialRampToValueAtTime(2400, a.currentTime + 0.5); g.gain.value = 0.12;
    src.connect(f).connect(g).connect(a.destination); src.start();
  },
  fanfare() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.06, undefined, i * 0.11)); },
};
export function toggleMute(): boolean { state.muted = !state.muted; save(); return state.muted; }

// ---------- characters ----------
export type { Who } from './identity';
export const NAMES: Record<Who, string> = { zee: CAST.zee.name, peep: CAST.peep.name, moss: CAST.moss.name, gus: CAST.gus.name };

/** A framed portrait of a cast member, for use outside dialogue. */
export function portraitEl(who: Who, pose: string, px = 6, cls = ''): HTMLElement {
  const f = h('figure', { class: `frame ${who} ${cls}` }, castPortrait(who, pose, px));
  return f;
}

// ---------- dialogue ----------
// A terminal-style dialogue: allies (Zero, Keeper) on the left, the Watcher and "Support" on the right.
// Lines type out; click, Space or Enter finishes the line, then advances.
export type Line = { who: Who; pose: string; text: string };

export class Dialog {
  el: HTMLElement;
  private left = h('div', { class: 'slot left' });
  private right = h('div', { class: 'slot right' });
  private name = h('div', { class: 'speaker' });
  private text = h('p', { class: 'line' });
  private next = h('button', { class: 'btn small next', type: 'button' }, 'NEXT ▸');
  constructor() {
    this.el = h('section', { class: 'dialog', 'aria-live': 'polite' },
      this.left,
      h('div', { class: 'bubble' }, this.name, this.text, h('div', { class: 'bubble-foot' }, this.next)),
      this.right);
  }
  private place(who: Who, pose: string) {
    const side = who === 'peep' || who === 'gus' ? this.right : this.left;
    const other = side === this.left ? this.right : this.left;
    const cur = side.firstElementChild as HTMLElement | null;
    if (!cur || cur.dataset.who !== who || cur.dataset.pose !== pose) {
      const f = h('figure', { class: `frame ${who} ${cur && cur.dataset.who === who ? 'swap' : 'enter'}` }, castPortrait(who, pose, 6),
        h('figcaption', {}, CAST[who].name));
      f.dataset.who = who; f.dataset.pose = pose;
      side.replaceChildren(f);
    }
    side.classList.add('active'); other.classList.remove('active');
    this.el.dataset.side = side === this.left ? 'left' : 'right';
    this.el.dataset.who = who;
    this.name.innerHTML = `<span class="prompt">${CAST[who].handle}@glasstown</span><span class="sep">:~$</span>`;
    this.name.className = `speaker ${who}`;
  }
  /** Show one character without speaking (e.g. to set a pose). */
  pose(who: Who, pose: string) { this.place(who, pose); }
  clearSide(side: 'left' | 'right') { (side === 'left' ? this.left : this.right).replaceChildren(); }

  async say(lines: Line[], finalLabel = 'NEXT ▸'): Promise<void> {
    for (let i = 0; i < lines.length; i++) {
      const { who, pose, text } = lines[i];
      this.place(who, pose);
      this.reveal();
      this.next.textContent = i === lines.length - 1 ? finalLabel : 'NEXT ▸';
      await this.type(text);
      await this.wait();
    }
  }
  /** When the dialogue is not pinned (phones), bring it back into view as a character speaks. */
  private reveal() {
    if (getComputedStyle(this.el).position === 'sticky') return;
    const r = this.el.getBoundingClientRect();
    if (r.top < 56 || r.bottom > innerHeight) this.el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  }
  private type(text: string): Promise<void> {
    return new Promise((resolve) => {
      this.text.innerHTML = '';
      const html = text; // lines may contain <b>/<code>; reveal by characters of plain text
      const tmp = h('span', { html }); const plain = tmp.textContent ?? '';
      if (reduced()) { this.text.innerHTML = html; resolve(); return; }
      let n = 0, done = false;
      const finish = () => { if (done) return; done = true; clearInterval(t); this.text.innerHTML = html; this.el.removeEventListener('click', finish); resolve(); };
      const t = setInterval(() => {
        n += 2; this.text.textContent = plain.slice(0, n);
        if (n % 6 === 0) sfx.tick();
        if (n >= plain.length) finish();
      }, 28);
      this.el.addEventListener('click', finish);
    });
  }
  private wait(): Promise<void> {
    return new Promise((resolve) => {
      this.next.hidden = false; this.next.focus({ preventScroll: true });
      const go = (e?: Event) => { e?.stopPropagation(); this.next.removeEventListener('click', go); document.removeEventListener('keydown', key); this.next.hidden = true; sfx.pop(); resolve(); };
      const key = (e: KeyboardEvent) => { if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); go(); } };
      this.next.addEventListener('click', go);
      document.addEventListener('keydown', key);
    });
  }
}

// ---------- buttons, toasts ----------
export function btn(label: string, onclick: () => void, cls = ''): HTMLButtonElement {
  return h('button', { class: `btn ${cls}`, type: 'button', onclick: () => { sfx.pop(); onclick(); } }, label);
}

export function waitClick(el: HTMLElement): Promise<void> {
  return new Promise((r) => el.addEventListener('click', () => r(), { once: true }));
}

export function toast(msg: string, kind: 'good' | 'bad' | 'info' = 'info'): void {
  const t = h('div', { class: `toast ${kind}`, role: 'status' }, msg);
  document.body.append(t);
  setTimeout(() => t.classList.add('out'), 2200);
  setTimeout(() => t.remove(), 2700);
}

// ---------- quiz ----------
export type Q = { q: string; options: string[]; answer: number; why: string };

export function quiz(host: HTMLElement, qs: Q[]): Promise<void> {
  return new Promise((resolve) => {
    const box = h('section', { class: 'panel quiz' }, h('div', { class: 'label' }, 'Checkpoint'));
    host.append(box);
    let i = 0;
    const render = () => {
      const { q, options, answer, why } = qs[i];
      const list = h('div', { class: 'opts' });
      const note = h('p', { class: 'why', hidden: true });
      const body = h('div', { class: 'qbody' },
        h('p', { class: 'q' }, h('span', { class: 'qn' }, `${i + 1}/${qs.length}`), ' ', q), list, note);
      options.forEach((o, k) => {
        const b = h('button', { class: 'opt', type: 'button' }, o);
        b.addEventListener('click', () => {
          if (k === answer) {
            sfx.ding(); b.classList.add('right');
            list.querySelectorAll('button').forEach((x) => ((x as HTMLButtonElement).disabled = true));
            note.hidden = false; note.innerHTML = `✓ ${why}`;
            const nb = btn(i < qs.length - 1 ? 'Next question' : 'Finish level', () => { i++; if (i < qs.length) render(); else { box.remove(); resolve(); } }, 'primary');
            body.append(nb); nb.focus({ preventScroll: true });
          } else {
            sfx.buzz(); b.classList.add('wrong'); b.disabled = true;
          }
        });
        list.append(b);
      });
      box.querySelector('.qbody')?.remove();
      box.append(body);
      box.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    };
    render();
  });
}

export function scrollTo(el: HTMLElement): void {
  el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
}

// Random-looking strings for the simulated chain. Never real addresses.
const B32 = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function fake(prefix: string, len: number, alpha = B32): string {
  let s = prefix; for (let i = 0; i < len; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}
export const fakeT = () => fake('t1', 33, B58);
export const fakeU = () => fake('u1', 40);
export const short = (a: string) => a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a;
export const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
