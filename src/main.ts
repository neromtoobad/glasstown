import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/jetbrains-mono/400.css';
import './style.css';

import { h, btn, sfx, Dialog, preload, toggleMute, charImg, sleep, reduced } from './ui';
import { state, complete, begin, reset } from './state';
import { drawIdentity, identityLayers, LAYER_NAMES } from './identity';
import { level1, level2, level3, level4, type Ctx } from './levels-a';
import { level5, level6, level7, level8 } from './levels-b';
import { drawCard, tweetUrl, rank } from './card';

type Level = { n: number; title: string; tag: string; icon: string; blurb: string; run: (c: Ctx) => Promise<unknown> };
const LEVELS: Level[] = [
  { n: 1, title: 'Peep’s Desk', tag: 'Why privacy', icon: '🔍', blurb: 'Play the chain watcher. Dox a wallet in 60 seconds.', run: level1 },
  { n: 2, title: 'Moss’s Vault', tag: 'Wallet setup', icon: '🗝', blurb: 'Pick a wallet, guard 24 words, block a scammer.', run: level2 },
  { n: 3, title: 'The Market', tag: 'Getting ZEC', icon: '🏦', blurb: 'Swap, exchange or friend, and what each one leaks.', run: level3 },
  { n: 4, title: 'Glass or Fog', tag: 'Addresses', icon: '🫙', blurb: 'Sort t1, u1, zs1 and tex1 addresses.', run: level4 },
  { n: 5, title: 'The Shield', tag: 'Shielding', icon: '🛡', blurb: 'Move coins from glass into the Ironwood fog.', run: level5 },
  { n: 6, title: 'Moth Mail', tag: 'Send & receive', icon: '📨', blurb: 'Send with an encrypted memo. Make a payment QR.', run: level6 },
  { n: 7, title: 'The Exit', tag: 'Unshielding', icon: '🚪', blurb: 'Cash out without Peep matching you.', run: level7 },
  { n: 8, title: 'Your First Shield', tag: 'The real thing', icon: '🎓', blurb: 'Make a real shielded transaction. Peep inspects it.', run: level8 },
];

const app = document.getElementById('app')!;
preload();

// ---------- top bar ----------
const pips = h('div', { class: 'pips', 'aria-label': 'Progress' });
const xpEl = h('span', { class: 'xp' });
const mini = h('canvas', { class: 'mini-id', width: 52, height: 52, 'aria-hidden': 'true' }) as HTMLCanvasElement;
const muteBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Toggle sound' });
muteBtn.addEventListener('click', () => { const m = toggleMute(); muteBtn.textContent = m ? '🔇' : '🔊'; });
muteBtn.textContent = state.muted ? '🔇' : '🔊';
const bar = h('header', { class: 'topbar' },
  h('a', { class: 'brand', href: '#/' }, h('img', { src: '/chars/zee/wave.webp', alt: '' }), h('span', {}, 'Glasstown')),
  pips, h('div', { class: 'bar-right' }, xpEl, mini, muteBtn));
const main = h('main', { class: 'main' });
const foot = h('footer', { class: 'foot' },
  h('p', {}, '🔒 No wallet connection · never asks for your seed · no analytics · progress stays in your browser · ',
    h('a', { href: 'https://github.com/neromtoobad/glasstown', target: '_blank', rel: 'noopener noreferrer' }, 'open source')),
  h('p', { class: 'fine' }, 'Facts checked against Zodl, ZIPs and Zcash community sources as of October 2026 (',
    h('a', { href: '#/sources' }, 'sources'), '). Glasstown is an independent ZECATHON community entry, not affiliated with Zodl, ECC, the Zcash Foundation or zkSNARKs. Not financial advice.'));
app.append(bar, main, foot);

function refreshBar() {
  pips.replaceChildren(...LEVELS.map((l) => h('a', { class: `pip ${state.done.includes(l.n) ? 'done' : ''}`, href: `#/level/${l.n}`, title: `${l.n}. ${l.title}` }, String(l.n))));
  xpEl.textContent = `${state.done.length * 100} XP`;
  drawIdentity(mini, identityLayers(), 2);
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
  if (hash === '#/sources') return void sourcesScreen();
  titleScreen();
}
window.addEventListener('hashchange', route);

function titleScreen() {
  const next = LEVELS.find((l) => !state.done.includes(l.n)) ?? LEVELS[7];
  const started = state.done.length > 0;
  const hero = h('section', { class: 'hero' },
    h('div', { class: 'hero-copy' },
      h('span', { class: 'kicker' }, 'A Zcash onboarding game'),
      h('h1', {}, 'Glasstown'),
      h('p', { class: 'lede' }, 'In Glasstown every wallet is made of glass. Everyone can see your money. ', h('b', {}, 'Let’s fix that.')),
      h('p', { class: 'sub' }, '8 short levels take you from zero to your ', h('b', {}, 'first real shielded transaction'), ': wallet setup, getting ZEC, shielding, sending, receiving and unshielding. About 10 minutes of play.'),
      h('div', { class: 'row-actions' },
        h('a', { class: 'btn primary big', href: `#/level/${next.n}`, onclick: () => sfx.pop() }, started ? `Continue: Level ${next.n} →` : 'Start playing →'),
        state.done.length >= 8 ? h('a', { class: 'btn ghost', href: '#/card' }, 'My card') : null)),
    h('div', { class: 'cast' }, charImg('zee', 'wave', 'c1'), charImg('peep', 'peer', 'c2'), charImg('moss', 'key', 'c3'), charImg('gus', 'smile', 'c4')));
  const map = h('section', { class: 'map' }, h('h2', {}, 'The map'),
    h('div', { class: 'tiles' }, ...LEVELS.map((l) => h('a', { class: `tile ${state.done.includes(l.n) ? 'done' : ''}`, href: `#/level/${l.n}` },
      h('span', { class: 'tile-n' }, String(l.n)), h('span', { class: 'tile-icon' }, l.icon),
      h('b', {}, l.title), h('span', { class: 'chip' }, l.tag), h('small', {}, l.blurb)))));
  const castInfo = h('section', { class: 'cast-info' }, ...([
    ['zee', 'wave', 'Zee', 'Your guide. Knows every corner of the fog.'],
    ['peep', 'read', 'Peep', 'Chain watcher. Reads anything made of glass.'],
    ['moss', 'scroll', 'Moss', 'Vault keeper. Strict about your 24 words.'],
    ['gus', 'ask', 'Gus', '“Support agent.” Do not trust Gus.'],
  ] as const).map(([w, p, n, d]) => h('div', { class: 'cast-card' }, charImg(w, p), h('b', {}, n), h('small', {}, d))));
  main.replaceChildren(hero, map, castInfo);
}

async function playLevel(n: number) {
  const my = running;
  const L = LEVELS[n - 1]; if (!L) return titleScreen();
  begin();
  const dialog = new Dialog();
  const play = h('div', { class: 'play' });
  const head = h('div', { class: 'scene-head' },
    h('a', { class: 'btn small ghost', href: '#/' }, '← Map'),
    h('div', {}, h('span', { class: 'lvl' }, `Level ${n} of 8`), h('h2', {}, `${L.icon} ${L.title}`)),
    h('span', { class: 'chip tag' }, L.tag));
  main.replaceChildren(h('section', { class: 'scene' }, head, dialog.el, play));
  const result = await L.run({ dialog, play });
  if (my !== running) return; // the player navigated away mid-level
  complete(n, 100); refreshBar();
  dialog.el.classList.add('idle');
  if (n === 8) { location.hash = '#/card'; void result; return; }
  await levelComplete(play, L);
}

async function levelComplete(play: HTMLElement, L: Level) {
  sfx.fanfare();
  const cv = h('canvas', { class: 'id-big' }) as HTMLCanvasElement;
  const layers = identityLayers();
  drawIdentity(cv, Math.max(0, layers - 1), 8);
  const next = LEVELS[L.n];
  const box = h('section', { class: 'panel done-card' },
    h('div', { class: 'done-id' }, cv),
    h('div', {},
      h('span', { class: 'kicker' }, `Level ${L.n} complete · +100 XP`),
      h('h3', {}, `${L.title} ✓`),
      h('p', {}, 'Your shielded identity gained a layer: ', h('b', {}, LAYER_NAMES[layers] ?? 'gold shield')),
      h('div', { class: 'row-actions' },
        next ? h('a', { class: 'btn primary', href: `#/level/${next.n}` }, `Next: ${next.title} →`) : null,
        h('a', { class: 'btn ghost', href: '#/' }, 'Map'))));
  play.append(box);
  box.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
  await sleep(reduced() ? 0 : 500);
  cv.classList.add('flash'); drawIdentity(cv, layers, 8);
}

async function cardScreen() {
  if (state.done.length < 8 && !state.done.includes(8)) {
    main.replaceChildren(h('section', { class: 'panel center' }, h('h2', {}, 'Your card is waiting'), h('p', {}, 'Finish level 8 to unlock your shielded identity card.'), h('a', { class: 'btn primary', href: '#/level/8' }, 'Go to level 8 →')));
    return;
  }
  const cv = h('canvas', { class: 'share-card', 'aria-label': 'Your Glasstown graduation card' }) as HTMLCanvasElement;
  const dl = btn('⬇ Download card', () => {
    cv.toBlob((b) => { if (!b) return; const a = h('a', { href: URL.createObjectURL(b), download: 'glasstown-shielded.png' }); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png');
  });
  const tw = h('a', { class: 'btn primary', href: tweetUrl(), target: '_blank', rel: 'noopener noreferrer', onclick: () => sfx.pop() }, 'Post on X');
  main.replaceChildren(h('section', { class: 'graduate' },
    h('span', { class: 'kicker' }, `${rank()} · zero → shielded`),
    h('h1', {}, state.verified === 'shielded' ? 'You’re shielded. Peep saw nothing.' : 'You graduated Glasstown!'),
    h('div', { class: 'card-wrap' }, cv),
    h('div', { class: 'row-actions center' }, tw, dl, h('a', { class: 'btn ghost', href: '#/level/8' }, state.verified === 'shielded' ? 'Back to level 8' : 'Verify a real transaction')),
    h('p', { class: 'fine center' }, 'Tip: X can’t attach images from a link, so download the card and add it to your post. The card never shows your transaction ID, address or amount. Keep it that way.'),
    h('div', { class: 'panel pass' }, h('img', { src: '/chars/zee/point.webp', alt: '' }),
      h('div', {}, h('h3', {}, 'Pass it on: shield a friend'),
        h('p', {}, 'Send a friend 0.001 ZEC with the memo “welcome to the fog → ', location.host, '”. Every new shielded user makes the crowd everyone hides in bigger. That’s how privacy grows.'))),
    h('p', { class: 'center' }, h('button', { class: 'linkish', type: 'button', onclick: () => { if (confirm('Reset all progress?')) { reset(); location.hash = '#/'; } } }, 'Reset progress'))));
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
  main.replaceChildren(h('section', { class: 'panel' }, h('h2', {}, 'Sources'),
    h('p', {}, 'Every fact in Glasstown was checked on 3 October 2026. Things move fast; when in doubt, trust your wallet’s own help pages.'),
    h('ul', { class: 'sources' }, ...src.map(([t, u]) => h('li', {}, h('a', { href: u, target: '_blank', rel: 'noopener noreferrer' }, t)))),
    h('a', { class: 'btn ghost', href: '#/' }, '← Back')));
}

route();
