import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './style.css';

import { h, btn, sfx, toggleMute, sleep, reduced } from './ui';
import { state, complete, begin, reset } from './state';
import { drawIdentity, identityLayers, playerNumber, paint, portraitGrid, PALS } from './identity';
import { LESSONS } from './lessons';
import { runLesson } from './lesson';
import { darkPool } from './game';
import { drawCard, tweetUrl, rank } from './card';
import { pixelText } from './font';

const TOTAL = LESSONS.length;
const PIECES = ['', 'outline', 'face', 'colours', 'hat', 'style', 'earring', 'eyes and halo'];
const app = document.getElementById('app')!;

// ---------- top bar ----------
const progress = h('span', { class: 'progress-text' });
const mini = h('canvas', { class: 'mini-id', 'aria-hidden': 'true' }) as HTMLCanvasElement;
const muteBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Toggle sound' });
const setMute = () => (muteBtn.textContent = state.muted ? 'Sound off' : 'Sound on');
muteBtn.addEventListener('click', () => { toggleMute(); setMute(); }); setMute();
const bar = h('header', { class: 'topbar' },
  h('a', { class: 'brand', href: '#/' }, 'GLASSTOWN'),
  h('div', { class: 'bar-right' }, progress, muteBtn, h('a', { href: '#/card', class: 'mini-link', 'aria-label': 'Your identity' }, mini)));
const main = h('main', { class: 'main' });
const foot = h('footer', { class: 'foot' },
  h('p', {}, 'No wallet connection · never asks for your 24 words · no tracking · ',
    h('a', { href: 'https://github.com/neromtoobad/glasstown', target: '_blank', rel: 'noopener noreferrer' }, 'open source'), ' · ', h('a', { href: '#/sources' }, 'sources')),
  h('p', { class: 'fine' }, 'Facts checked October 2026. An independent ZECATHON community entry, not affiliated with Zodl, ECC, the Zcash Foundation or zkSNARKs. Not financial advice.'));
app.append(bar, main, foot);

function refreshBar() {
  progress.textContent = `${state.done.length}/${TOTAL} levels`;
  drawIdentity(mini, identityLayers(), 2, '#0a120e');
}

// ---------- routes ----------
let running = 0;
function route() {
  running++;
  const hash = location.hash || '#/';
  const m = hash.match(/^#\/level\/(\d)$/);
  window.scrollTo({ top: 0 });
  refreshBar();
  if (m) return void playLevel(Number(m[1]));
  if (hash === '#/card') return void cardScreen();
  if (hash === '#/game') return void gameScreen();
  if (hash === '#/sources') return void sourcesScreen();
  titleScreen();
}
window.addEventListener('hashchange', route);

function titleScreen() {
  const next = LESSONS.find((l) => !state.done.includes(l.n));
  const started = state.done.length > 0;
  const idCv = h('canvas', { class: 'hero-id' }) as HTMLCanvasElement;
  const caption = h('span', {}, '');
  if (started) { drawIdentity(idCv, identityLayers(), 10); caption.textContent = `Your identity: ${identityLayers()}/8 pieces`; }
  const cta = next
    ? h('a', { class: 'btn primary big', href: `#/level/${next.n}`, onclick: () => sfx.pop() }, started ? `Continue: level ${next.n} →` : 'Start learning →')
    : h('a', { class: 'btn primary big', href: '#/card' }, 'See my identity card →');
  const hero = h('section', { class: 'hero' },
    h('div', { class: 'hero-copy' },
      h('div', { class: 'wordmark' }, pixelText('GLASSTOWN', 8)),
      h('h1', {}, 'Learn to use Zcash privately, in about 10 minutes.'),
      h('p', { class: 'sub' }, `${TOTAL} short levels. No experience needed. At the end you make your first private payment.`),
      h('div', { class: 'row-actions' }, cta, h('a', { class: 'btn ghost', href: '#/game' }, 'Just play the game'))),
    h('div', { class: 'hero-art' }, h('div', { class: 'hero-frame' }, idCv, caption)));
  const levels = h('section', { class: 'levels' }, h('h2', {}, 'Levels'),
    h('ol', { class: 'level-list' }, ...LESSONS.map((l) => h('li', {}, h('a', { class: `level ${state.done.includes(l.n) ? 'done' : ''}`, href: `#/level/${l.n}` },
      h('span', { class: 'level-n' }, state.done.includes(l.n) ? '✓' : String(l.n)),
      h('span', { class: 'level-text' }, h('b', {}, l.title), h('small', {}, l.blurb)),
      h('span', { class: 'level-go' }, state.done.includes(l.n) ? 'Replay' : 'Start'))))));
  const promise = h('section', { class: 'promise' },
    h('div', {}, h('b', {}, 'Public'), h('p', {}, 'Like glass: anyone can see your balance and payments.')),
    h('div', {}, h('b', { class: 'hl' }, 'Private (shielded)'), h('p', {}, 'Only you can see them. That’s what you’ll learn here.')));
  main.replaceChildren(hero, promise, levels);
  if (!started) heroShuffle(idCv, caption);
}

// Before you start, the hero frame flicks through random identities: one of them becomes yours.
function heroShuffle(cv: HTMLCanvasElement, caption: HTMLElement) {
  const my = running;
  const heads = ['hood', 'cap', 'beanie', 'hood'] as const, eyes = ['square', 'slit', 'visor'] as const, tex = ['solid', 'dither', 'noise'] as const;
  const cols = ['#5dff8f', '#7cf2ff', '#ffd23f', '#ff5e5e', '#f2f2f2', '#c08bff'];
  const tick = () => {
    if (my !== running || !cv.isConnected) return;
    const r = (k: number) => Math.floor(Math.random() * k);
    paint(cv, portraitGrid({ head: heads[r(4)], pal: r(PALS.length - 1), eyes: eyes[r(3)], eyeColor: cols[r(6)], halo: Math.random() > 0.4, dissolve: 0.3 + Math.random() * 0.7, earring: Math.random() > 0.6, texture: tex[r(3)] }, String(Math.random()), 'idle', 8), 10);
    caption.textContent = 'Your private identity unlocks as you learn';
    setTimeout(tick, reduced() ? 2000 : 700);
  };
  tick();
}

async function playLevel(n: number) {
  const my = running;
  const L = LESSONS[n - 1]; if (!L) return titleScreen();
  begin();
  const host = h('div', { class: 'lesson-host' });
  main.replaceChildren(host);
  await runLesson(host, L, TOTAL);
  if (my !== running) return;
  complete(n, 100); refreshBar();
  if (n === TOTAL) { location.hash = '#/card'; return; }
  await levelComplete(host, n);
}

async function levelComplete(host: HTMLElement, n: number) {
  sfx.fanfare();
  const cv = h('canvas', { class: 'id-big' }) as HTMLCanvasElement;
  const layers = identityLayers();
  drawIdentity(cv, Math.max(0, layers - 1), 8, '#0a120e');
  const next = LESSONS[n];
  host.replaceChildren(h('section', { class: 'card in done-card' },
    h('div', { class: 'done-id' }, cv),
    h('div', {},
      h('div', { class: 'kicker' }, `Level ${n} complete`),
      h('h2', {}, 'New piece unlocked: ', h('span', { class: 'hl' }, PIECES[n] ?? 'halo')),
      h('p', {}, `Your private identity is ${layers}/8 complete. Finish every level to unlock it all.`),
      h('div', { class: 'row-actions' },
        next ? h('a', { class: 'btn primary big', href: `#/level/${next.n}` }, `Next: ${next.title} →`) : null,
        h('a', { class: 'btn ghost', href: '#/' }, 'All levels')))));
  await sleep(reduced() ? 0 : 600);
  cv.classList.add('flash'); drawIdentity(cv, layers, 8, '#0a120e');
}

async function gameScreen() {
  const my = running;
  const host = h('div', { class: 'game-host' });
  const result = h('div', { class: 'game-result' });
  main.replaceChildren(h('section', { class: 'game-page' },
    h('a', { class: 'back', href: '#/' }, '← All levels'),
    h('h1', {}, 'Dark Pool'),
    h('p', { class: 'sub' }, 'Pick up coins, then carry them into the dark pool, where they’re private. Coins you carry are public, so the Watcher’s drones can spot you. 45 seconds.'),
    host, result));
  const play = () => darkPool(host, { seconds: 45, onEnd: (r) => {
    if (my !== running) return;
    result.replaceChildren(h('p', {}, `You hid ${r.shielded.toFixed(2)} ZEC. Best: ${r.best.toFixed(2)} ZEC.`),
      h('div', { class: 'row-actions' }, btn('Play again', () => { host.replaceChildren(); result.replaceChildren(); play(); }, 'primary'), h('a', { class: 'btn ghost', href: '#/level/1' }, 'Learn Zcash →')));
  } });
  play();
}

async function cardScreen() {
  if (!state.done.includes(TOTAL)) {
    const cv = h('canvas', { class: 'id-big' }) as HTMLCanvasElement; drawIdentity(cv, identityLayers(), 8, '#0a120e');
    const next = LESSONS.find((l) => !state.done.includes(l.n)) ?? LESSONS[TOTAL - 1];
    main.replaceChildren(h('section', { class: 'card in pending' }, cv, h('h2', {}, `Your identity: ${identityLayers()}/8 pieces`), h('p', {}, 'Finish all the levels to unlock your card.'), h('a', { class: 'btn primary big', href: `#/level/${next.n}` }, `Continue: level ${next.n} →`)));
    return;
  }
  const cv = h('canvas', { class: 'share-card', 'aria-label': 'Your Glasstown card' }) as HTMLCanvasElement;
  const dl = btn('Download card', () => {
    cv.toBlob((b) => { if (!b) return; const a = h('a', { href: URL.createObjectURL(b), download: `glasstown-${playerNumber()}.png` }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png');
  });
  const tw = h('a', { class: 'btn primary big', href: tweetUrl(), target: '_blank', rel: 'noopener noreferrer', onclick: () => sfx.pop() }, 'Share on X');
  main.replaceChildren(h('section', { class: 'graduate' },
    h('div', { class: 'kicker' }, rank()),
    h('h1', {}, state.verified === 'shielded' ? 'You made a private payment. The Watcher saw nothing.' : 'You finished Glasstown!'),
    h('div', { class: 'card-wrap' }, cv),
    h('div', { class: 'row-actions center' }, tw, dl, h('a', { class: 'btn ghost', href: '#/game' }, 'Play Dark Pool')),
    h('p', { class: 'fine center' }, 'Tip: download the card, then add it to your post. It never shows your address, amount or transaction ID.'),
    h('div', { class: 'card in pass' },
      h('h2', {}, 'Pass it on'),
      h('p', {}, 'Send a friend 0.001 ZEC with the note “learn at ', location.host, '”. The more people pay privately, the more private everyone is.')),
    h('p', { class: 'center' }, h('button', { class: 'linkish', type: 'button', onclick: () => { if (confirm('Start over? This clears your progress.')) { reset(); location.hash = '#/'; } } }, 'Start over'))));
  await drawCard(cv);
}

function sourcesScreen() {
  const src: [string, string][] = [
    ['Zashi is now Zodl', 'https://zodl.com/zashi-is-becoming-zodl/'],
    ['Ironwood, Zcash’s current private pool (live 28 Jul 2026)', 'https://zodl.com/ironwood-is-live-on-zcash/'],
    ['Shielding transparent ZEC in Zodl', 'https://support.zodl.com/article/36-shielding-transparent-zec'],
    ['Swapping into ZEC', 'https://support.zodl.com/article/26-swapping-into-zec'],
    ['Depositing from exchanges', 'https://support.zodl.com/article/25-depositing-from-exchanges'],
    ['When are funds spendable (about 12 minutes)', 'https://support.zodl.com/article/35-when-are-funds-spendable'],
    ['Creating your Zodl wallet (24 words)', 'https://support.zodl.com/article/23-creating-your-zodl-wallet'],
    ['Using the memo (note) field', 'https://support.zodl.com/article/41-using-the-zcash-memo-field'],
    ['Unified (private) addresses: ZIP-316', 'https://zips.z.cash/zip-0316'],
    ['Fees: ZIP-317', 'https://zips.z.cash/zip-0317'],
    ['Zingo! downloads', 'https://zingolabs.org/zingo/download/'],
    ['Gemini shielded withdrawals', 'https://www.gemini.com/blog/youre-one-step-closer-to-financial-freedom-with-shielded-zec-withdrawals'],
  ];
  main.replaceChildren(h('section', { class: 'card in' }, h('h2', {}, 'Sources'),
    h('p', {}, 'Everything in Glasstown was checked on 3 October 2026. If something looks different in your app, trust the app’s own help pages.'),
    h('ul', { class: 'sources' }, ...src.map(([t, u]) => h('li', {}, h('a', { href: u, target: '_blank', rel: 'noopener noreferrer' }, t)))),
    h('a', { class: 'btn ghost', href: '#/' }, '← Back')));
}

route();
