import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './style.css';

import { h, btn, sfx, Dialog, toggleMute, sleep, reduced, portraitEl } from './ui';
import { state, complete, begin, reset } from './state';
import { drawIdentity, identityLayers, TRAIT_NAMES, traitList, playerNumber, CAST, paint, portraitGrid, PALS } from './identity';
import { level1, level2, level3, level4, label, type Ctx } from './levels-a';
import { level5, level6, level7, level8, playDarkPool } from './levels-b';
import { drawCard, tweetUrl, rank } from './card';
import { pixelText } from './font';

type Level = { n: number; title: string; tag: string; blurb: string; run: (c: Ctx) => Promise<unknown> };
const LEVELS: Level[] = [
  { n: 1, title: 'WATCHER’S DESK', tag: 'Why privacy', blurb: 'Sit in the Watcher’s chair. Profile a wallet in 60 seconds.', run: level1 },
  { n: 2, title: 'THE VAULT', tag: 'Wallet setup', blurb: 'Choose a wallet, guard 24 words, block fake support.', run: level2 },
  { n: 3, title: 'THE MARKET', tag: 'Getting ZEC', blurb: 'Swap, exchange or friend, and what each route leaks.', run: level3 },
  { n: 4, title: 'GLASS OR DARK', tag: 'Addresses', blurb: 'Read t1, u1, zs1 and tex1 at a glance.', run: level4 },
  { n: 5, title: 'DARK POOL', tag: 'Shielding · arcade', blurb: 'Grab ZEC, dodge the drones, dive into the pool.', run: level5 },
  { n: 6, title: 'SEALED MAIL', tag: 'Send & receive', blurb: 'Encrypted memos and payment QR codes.', run: level6 },
  { n: 7, title: 'THE EXIT', tag: 'Unshielding', blurb: 'Cash out without being matched.', run: level7 },
  { n: 8, title: 'INITIATION', tag: 'Real transaction', blurb: 'Make one real shielded tx. The Watcher inspects it.', run: level8 },
];

const app = document.getElementById('app')!;

// ---------- top bar ----------
const pips = h('nav', { class: 'pips', 'aria-label': 'Nodes' });
const xpEl = h('span', { class: 'xp' });
const mini = h('canvas', { class: 'mini-id', 'aria-hidden': 'true' }) as HTMLCanvasElement;
const muteBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Toggle sound' });
muteBtn.addEventListener('click', () => { const m = toggleMute(); muteBtn.textContent = m ? 'SOUND: OFF' : 'SOUND: ON'; });
muteBtn.textContent = state.muted ? 'SOUND: OFF' : 'SOUND: ON';
const bar = h('header', { class: 'topbar' },
  h('a', { class: 'brand', href: '#/' }, h('span', {}, 'GLASSTOWN'), h('small', {}, 'beta')),
  pips, h('div', { class: 'bar-right' }, xpEl, muteBtn, h('a', { href: '#/card', class: 'mini-link', 'aria-label': 'Your identity' }, mini)));
const main = h('main', { class: 'main' });
const foot = h('footer', { class: 'foot' },
  h('p', {}, 'NO WALLET CONNECTION · NEVER ASKS FOR YOUR SEED · NO ANALYTICS · PROGRESS STAYS IN YOUR BROWSER · ',
    h('a', { href: 'https://github.com/neromtoobad/glasstown', target: '_blank', rel: 'noopener noreferrer' }, 'SOURCE')),
  h('p', { class: 'fine' }, 'Facts checked against Zodl, ZIPs and Zcash community sources as of October 2026 (',
    h('a', { href: '#/sources' }, 'sources'), '). Glasstown is an independent ZECATHON community entry. Not affiliated with Zodl, ECC, the Zcash Foundation or zkSNARKs. Not financial advice.'));
app.append(bar, main, foot);

function refreshBar() {
  pips.replaceChildren(...LEVELS.map((l) => h('a', { class: `pip ${state.done.includes(l.n) ? 'done' : ''}`, href: `#/level/${l.n}`, title: `NODE ${String(l.n).padStart(2, '0')} · ${l.title}` }, String(l.n).padStart(2, '0'))));
  xpEl.textContent = `${state.done.length}/8 RENDERED`;
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
  if (hash === '#/arcade') return void arcadeScreen();
  if (hash === '#/sources') return void sourcesScreen();
  titleScreen();
}
window.addEventListener('hashchange', route);

function titleScreen() {
  const next = LEVELS.find((l) => !state.done.includes(l.n)) ?? LEVELS[7];
  const started = state.done.length > 0;
  const idCv = h('canvas', { class: 'hero-id' }) as HTMLCanvasElement;
  const caption = h('span', {}, started ? `IDENTITY · ${identityLayers()}/8 RENDERED` : 'IDENTITY · NOT YET YOURS');
  if (started) drawIdentity(idCv, identityLayers(), 10);
  else heroShuffle(idCv, caption);
  const hero = h('section', { class: 'hero' },
    h('div', { class: 'hero-copy' },
      h('div', { class: 'wordmark' }, pixelText('GLASSTOWN', 10)),
      h('p', { class: 'lede' }, 'Every wallet in Glasstown is made of glass. Anyone can read it. ', h('span', { class: 'hl' }, 'Get out.')),
      h('p', { class: 'sub' }, 'A Zcash initiation in eight nodes: wallet setup, getting ZEC, shielding, sending, receiving and unshielding, ending with ', h('b', {}, 'your first real shielded transaction'), '. Your 26×26 identity renders one trait per node.'),
      h('div', { class: 'row-actions' },
        state.done.length >= 8
          ? h('a', { class: 'btn primary big', href: '#/card' }, 'VIEW MY IDENTITY ▸')
          : h('a', { class: 'btn primary big', href: `#/level/${next.n}`, onclick: () => sfx.pop() }, started ? `RESUME · NODE ${String(next.n).padStart(2, '0')} ▸` : 'BEGIN INITIATION ▸'),
        h('a', { class: 'btn ghost', href: '#/arcade' }, 'PLAY DARK POOL'))),
    h('div', { class: 'hero-art' }, h('div', { class: 'hero-frame' }, idCv, caption)));
  const nodes = h('section', { class: 'nodes' }, label('Nodes'),
    h('div', { class: 'node-list' }, ...LEVELS.map((l) => h('a', { class: `node ${state.done.includes(l.n) ? 'done' : ''}`, href: `#/level/${l.n}` },
      h('span', { class: 'node-n' }, `NODE ${String(l.n).padStart(2, '0')}`),
      h('b', {}, l.title),
      h('span', { class: 'node-tag' }, l.tag),
      h('small', {}, l.blurb),
      h('span', { class: 'node-state' }, state.done.includes(l.n) ? '[ RENDERED ]' : '[ ENTER ▸ ]')))));
  const cast = h('section', { class: 'cast-row' }, label('Cast'), h('div', { class: 'cast-grid' }, ...([
    ['zee', 'wave', 'Your guide out of Glasstown. Speaks in zero-knowledge.'],
    ['peep', 'peer', 'Chain analytics. Reads anything made of glass.'],
    ['moss', 'key', 'Guards the vault. Strict about your 24 words.'],
    ['gus', 'smile', 'Verified badge. Very helpful. Do not trust.'],
  ] as const).map(([w, p, d]) => h('div', { class: 'cast-card' }, portraitEl(w, p, 4), h('b', {}, CAST[w].name), h('small', {}, d)))));
  main.replaceChildren(hero, nodes, cast);
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
    caption.textContent = `IDENTITY #${String(1 + r(9999)).padStart(4, '0')} · NOT YET YOURS`;
    setTimeout(tick, reduced() ? 2000 : 650);
  };
  tick();
}

async function playLevel(n: number) {
  const my = running;
  const L = LEVELS[n - 1]; if (!L) return titleScreen();
  begin();
  const dialog = new Dialog();
  const play = h('div', { class: 'play' });
  const head = h('div', { class: 'scene-head' },
    h('a', { class: 'btn small ghost', href: '#/' }, '◂ NODES'),
    h('div', {}, h('span', { class: 'lvl' }, `NODE ${String(n).padStart(2, '0')} / 08 · ${L.tag.toUpperCase()}`), h('h2', {}, L.title)));
  main.replaceChildren(h('section', { class: 'scene' }, head, dialog.el, play));
  await L.run({ dialog, play });
  if (my !== running) return; // the player navigated away mid-level
  complete(n, 100); refreshBar();
  dialog.el.classList.add('idle');
  if (n === 8) { location.hash = '#/card'; return; }
  await levelComplete(play, L);
}

async function levelComplete(play: HTMLElement, L: Level) {
  sfx.fanfare();
  const cv = h('canvas', { class: 'id-big' }) as HTMLCanvasElement;
  const layers = identityLayers();
  drawIdentity(cv, Math.max(0, layers - 1), 8, '#0a120e');
  const next = LEVELS[L.n];
  const box = h('section', { class: 'panel done-card' },
    h('div', { class: 'done-id' }, cv),
    h('div', {},
      h('span', { class: 'kicker' }, `NODE ${String(L.n).padStart(2, '0')} COMPLETE`),
      h('h3', {}, L.title),
      h('p', {}, 'Identity rendering · ', h('b', {}, `${layers}/8`), ' · new trait: ', h('b', { class: 'hl' }, TRAIT_NAMES[layers] ?? 'halo')),
      h('div', { class: 'row-actions' },
        next ? h('a', { class: 'btn primary', href: `#/level/${next.n}` }, `NODE ${String(next.n).padStart(2, '0')} · ${next.title} ▸`) : null,
        h('a', { class: 'btn ghost', href: '#/' }, 'ALL NODES'))));
  play.append(box);
  box.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
  await sleep(reduced() ? 0 : 600);
  cv.classList.add('flash'); drawIdentity(cv, layers, 8, '#0a120e');
}

async function arcadeScreen() {
  const my = running;
  const host = h('div', { class: 'play arcade' });
  main.replaceChildren(h('section', { class: 'scene' },
    h('div', { class: 'scene-head' }, h('a', { class: 'btn small ghost', href: '#/' }, '◂ NODES'),
      h('div', {}, h('span', { class: 'lvl' }, 'ARCADE · SHIELDING'), h('h2', {}, 'DARK POOL'))),
    h('p', { class: 'sub' }, 'Grab ZEC · carrying makes you visible to the drones · reach the dark pool to shield it · 60 s, 3 lives'),
    host));
  for (;;) {
    const r = await playDarkPool(host);
    if (my !== running) return;
    const again = h('div', { class: 'row-actions' });
    requestAnimationFrame(() => host.querySelector('.game-over')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' }));
    host.lastElementChild?.append(h('div', { class: 'game-over' },
      h('div', { class: 'go-score' }, h('span', {}, 'SHIELDED'), h('b', {}, `${r.shielded.toFixed(2)} ZEC`)),
      h('div', { class: 'go-score bad' }, h('span', {}, 'DOXXED'), h('b', {}, `${r.doxxed.toFixed(2)} ZEC`)),
      h('div', { class: 'go-score' }, h('span', {}, r.isBest ? 'NEW BEST' : 'BEST'), h('b', {}, `${r.best.toFixed(2)} ZEC`)), again));
    const go = await new Promise<string>((res) => again.append(btn('PLAY AGAIN', () => res('again'), 'primary'), h('a', { class: 'btn ghost', href: '#/', onclick: () => res('out') }, 'NODES')));
    if (go !== 'again' || my !== running) return;
    host.replaceChildren();
  }
}

async function cardScreen() {
  if (!state.done.includes(8)) {
    const cv = h('canvas', { class: 'id-big' }) as HTMLCanvasElement; drawIdentity(cv, identityLayers(), 8, '#0a120e');
    main.replaceChildren(h('section', { class: 'panel center pending' }, cv, h('h2', {}, `IDENTITY · ${identityLayers()}/8 RENDERED`), h('p', {}, 'Finish Node 08 (a real shielded transaction) to complete your identity card.'), h('a', { class: 'btn primary', href: '#/level/8' }, 'NODE 08 · INITIATION ▸')));
    return;
  }
  const cv = h('canvas', { class: 'share-card', 'aria-label': 'Your Glasstown identity card' }) as HTMLCanvasElement;
  const dl = btn('DOWNLOAD CARD', () => {
    cv.toBlob((b) => { if (!b) return; const a = h('a', { href: URL.createObjectURL(b), download: `glasstown-identity-${playerNumber()}.png` }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png');
  });
  const tw = h('a', { class: 'btn primary', href: tweetUrl(), target: '_blank', rel: 'noopener noreferrer', onclick: () => sfx.pop() }, 'POST ON X');
  main.replaceChildren(h('section', { class: 'graduate' },
    h('span', { class: 'kicker' }, `${rank()} · IDENTITY #${playerNumber()}`),
    h('h1', {}, state.verified === 'shielded' ? 'SHIELDED. THE WATCHER SAW NOTHING.' : 'INITIATION COMPLETE.'),
    h('div', { class: 'card-wrap' }, cv),
    h('div', { class: 'row-actions center' }, tw, dl, h('a', { class: 'btn ghost', href: '#/arcade' }, 'DARK POOL'), state.verified === 'shielded' ? null : h('a', { class: 'btn ghost', href: '#/level/8' }, 'VERIFY A REAL TX')),
    h('p', { class: 'fine center' }, 'X can’t attach an image from a link, so download the card and add it to your post. The card never shows your transaction ID, address or amount. Keep it that way.'),
    h('div', { class: 'panel traits' }, label('Traits'), h('dl', {}, ...traitList().flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)]))),
    h('div', { class: 'panel pass' }, portraitEl('zee', 'cheer', 3),
      h('div', {}, h('h3', {}, 'PASS IT ON'),
        h('p', {}, 'Send a friend 0.001 ZEC with the memo “initiated → ', location.host, '”. Every new shielded user makes the crowd everyone hides in bigger. That’s how privacy compounds.'))),
    h('p', { class: 'center' }, h('button', { class: 'linkish', type: 'button', onclick: () => { if (confirm('Reset all progress?')) { reset(); location.hash = '#/'; } } }, 'reset progress'))));
  await drawCard(cv);
}

function sourcesScreen() {
  const src: [string, string][] = [
    ['Zashi is now Zodl', 'https://zodl.com/zashi-is-becoming-zodl/'],
    ['Ironwood shielded pool (NU6.3, live 28 Jul 2026)', 'https://zodl.com/ironwood-is-live-on-zcash/'],
    ['ZIP-258: NU6.3 / Ironwood', 'https://zips.z.cash/zip-0258'],
    ['What is the turnstile (Orchard exit)', 'https://support.zodl.com/article/53-what-is-the-turnstile'],
    ['Shielding transparent ZEC in Zodl', 'https://support.zodl.com/article/36-shielding-transparent-zec'],
    ['Swapping into ZEC (NEAR Intents)', 'https://support.zodl.com/article/26-swapping-into-zec'],
    ['Depositing from exchanges', 'https://support.zodl.com/article/25-depositing-from-exchanges'],
    ['When are funds spendable (10 confirmations)', 'https://support.zodl.com/article/35-when-are-funds-spendable'],
    ['Creating your Zodl wallet (24 words + birthday)', 'https://support.zodl.com/article/23-creating-your-zodl-wallet'],
    ['Using the memo field', 'https://support.zodl.com/article/41-using-the-zcash-memo-field'],
    ['ZIP-316: Unified Addresses', 'https://zips.z.cash/zip-0316'],
    ['ZIP-317: fees', 'https://zips.z.cash/zip-0317'],
    ['ZIP-320: TEX addresses', 'https://zips.z.cash/zip-0320'],
    ['ZIP-321: payment requests', 'https://zips.z.cash/zip-0321'],
    ['Wallets updated for Ironwood', 'https://forum.zcashcommunity.com/t/ironwood-is-here-updated-wallets-libraries-aug-1/56557'],
    ['Zingo! downloads', 'https://zingolabs.org/zingo/download/'],
    ['Gemini shielded withdrawals', 'https://www.gemini.com/blog/youre-one-step-closer-to-financial-freedom-with-shielded-zec-withdrawals'],
  ];
  main.replaceChildren(h('section', { class: 'panel' }, label('Sources'),
    h('p', {}, 'Every fact in Glasstown was checked on 3 October 2026. Things move fast. When in doubt, trust your wallet’s own help pages.'),
    h('ul', { class: 'sources' }, ...src.map(([t, u]) => h('li', {}, h('a', { href: u, target: '_blank', rel: 'noopener noreferrer' }, t)))),
    h('a', { class: 'btn ghost', href: '#/' }, '◂ BACK')));
}

route();
