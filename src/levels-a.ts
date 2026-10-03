import { h, btn, sfx, sleep, quiz, toast, scrollTo, fakeT, fakeU, fake, short, type Dialog } from './ui';
import { state, save } from './state';
import { classify } from './zcash';
import { qr } from './qr';

export type Ctx = { dialog: Dialog; play: HTMLElement };

// =====================================================================================
// LEVEL 1 · PEEP'S DESK: you play the chain watcher, then the target goes shielded
// =====================================================================================
export async function level1({ dialog, play }: Ctx): Promise<void> {
  await dialog.say([
    { who: 'zee', pose: 'wave', text: 'Welcome to <b>Glasstown</b>! I’m Zee. Here every wallet is made of glass. Anyone can look in.' },
    { who: 'peep', pose: 'read', text: 'And I look in. A lot. I’m <b>Peep</b>. I watch the public chain and I write everything down.' },
    { who: 'peep', pose: 'peer', text: 'Fancy trying my job? Here’s a case file: <b>one wallet address</b>. Click the payments to follow the money. You have 60 seconds.' },
  ], 'Open the case');

  const alex = fakeT();
  type Row = { when: string; dir: 'in' | 'out'; who: string; addr: string; amt: string; fact: string };
  const rows: Row[] = [
    { when: 'Mon 08:12', dir: 'out', who: 'Bean There Café', addr: fakeT(), amt: '0.004', fact: '☕ Buys coffee at Bean There Café every weekday around 8am' },
    { when: 'Fri 17:00', dir: 'in', who: 'ACME Corp Payroll', addr: fakeT(), amt: '2.10', fact: '💼 Works at ACME Corp. Paid 2.1 ZEC every other Friday' },
    { when: 'Sat 10:30', dir: 'out', who: 'Oak St Lettings', addr: fakeT(), amt: '1.20', fact: '🏠 Pays 1.2 ZEC rent to Oak St Lettings, so lives on Oak Street' },
    { when: 'Sat 11:05', dir: 'out', who: 'CityCare Pharmacy', addr: fakeT(), amt: '0.03', fact: '💊 Weekly pharmacy purchase. Health info, now public' },
    { when: 'Sun 19:40', dir: 'in', who: 'CoinMart (exchange)', addr: fakeT(), amt: '0.50', fact: '🪪 Withdrew from an exchange with ID checks. Real name on file: Alex Rivera' },
    { when: 'Tue 21:10', dir: 'out', who: '“sam.eth” (tagged in a public post)', addr: fakeT(), amt: '0.08', fact: '🍜 Split dinner with Sam. Sam’s whole history is now linked too' },
  ];

  const known = h('ol', { class: 'dossier-list' });
  const count = h('b', {}, '0');
  const count2 = h('span', { class: 'chip known-chip' }, '📒 0 facts');
  const timer = h('span', { class: 'timer' }, '60');
  const dossier = h('aside', { class: 'panel dossier' },
    h('div', { class: 'dossier-head' }, h('img', { src: '/chars/peep/read.webp', alt: '' }), h('div', {}, h('h4', {}, 'Peep’s dossier'), h('p', {}, 'Peep knows ', count, ' things about this wallet'))),
    known);
  const list = h('div', { class: 'tx-list' });
  const explorer = h('section', { class: 'panel explorer glass' },
    h('div', { class: 'explorer-head' }, h('span', { class: 'chip glass-chip' }, '🔍 Public explorer'), h('code', { class: 'mono' }, short(alex)), count2, timer),
    list);
  play.append(h('div', { class: 'split' }, explorer, dossier));
  scrollTo(explorer);

  let found = 0;
  const draw = () => {
    list.replaceChildren(...rows.map((r) => {
      const row = h('button', { class: 'tx-row', type: 'button' },
        h('span', { class: 'when' }, r.when),
        h('span', { class: `dir ${r.dir}` }, r.dir === 'in' ? '← in' : 'out →'),
        h('span', { class: 'who' }, r.who, h('small', { class: 'mono' }, short(r.addr))),
        h('span', { class: 'amt' }, `${r.amt} ZEC`));
      row.addEventListener('click', () => {
        if (row.classList.contains('seen')) return;
        row.classList.add('seen'); found++; count.textContent = String(found); count2.textContent = `📒 ${found} facts`; sfx.ding();
        known.append(h('li', { class: 'fact pop' }, r.fact));
        dialog.pose('peep', found % 2 ? 'read' : 'peer');
        if (found >= 5) finish();
      });
      return row;
    }));
  };
  draw();

  let t = 60, ended = false;
  let resolveCase: () => void = () => {};
  const caseDone = new Promise<void>((r) => (resolveCase = r));
  const iv = setInterval(() => { t--; timer.textContent = String(t); if (t <= 10) timer.classList.add('low'); if (t <= 0) finish(); }, 1000);
  function finish() { if (ended) return; ended = true; clearInterval(iv); timer.textContent = '✓'; resolveCase(); }
  await caseDone;
  await sleep(500);

  await dialog.say([
    { who: 'peep', pose: 'read', text: `Child’s play! From <b>one address</b> we got Alex’s job, salary, home street, pharmacy… and real name. Nobody hacked anything. It was all public.` },
    { who: 'zee', pose: 'worried', text: 'That’s how transparent blockchains work, Bitcoin included. A public address is like posting your bank statement on a billboard.' },
    { who: 'zee', pose: 'point', text: 'But look: Alex just installed a <b>shielded Zcash wallet</b>. Try following the new payments.' },
  ], 'Follow the new payments');

  // Alex goes shielded
  explorer.classList.remove('glass'); explorer.classList.add('fog');
  explorer.querySelector('.explorer-head code')!.textContent = short(fakeU());
  sfx.whoosh();
  const shieldedRows = ['Wed 08:09', 'Fri 17:02', 'Sat 10:31', 'Sat 11:07'];
  let pokes = 0;
  const pokedAll = new Promise<void>((resolve) => {
    list.replaceChildren(...shieldedRows.map((when) => {
      const row = h('button', { class: 'tx-row redacted', type: 'button' },
        h('span', { class: 'when' }, when),
        h('span', { class: 'dir' }, '████'),
        h('span', { class: 'who' }, '██████████', h('small', {}, 'shielded transaction')),
        h('span', { class: 'amt' }, '███ ZEC'));
      row.addEventListener('click', () => {
        if (row.classList.contains('seen')) return;
        row.classList.add('seen'); sfx.buzz(); pokes++;
        toast('Nothing to follow: sender, receiver, amount and memo are encrypted.', 'bad');
        dialog.pose('peep', pokes === 1 ? 'gasp' : pokes === 2 ? 'fog' : 'furious');
        if (pokes >= 2) resolve();
      });
      return row;
    }));
  });
  await pokedAll;
  await dialog.say([
    { who: 'peep', pose: 'furious', text: 'WHAT? I can see that <i>a</i> transaction happened and the tiny fee. That’s it. No sender, no receiver, no amount, no memo!' },
    { who: 'zee', pose: 'shield', text: 'That’s <b>Zcash shielded money</b>. Same coins, but behind frosted glass. Zero-knowledge proofs let the network check the math without seeing the details.' },
    { who: 'zee', pose: 'cheer', text: 'Now let’s get <b>you</b> one. By the end of this game you’ll make a real shielded transaction of your own.' },
  ]);
  await quiz(play, [
    { q: 'On a transparent blockchain, who can see your payments?', options: ['Only you', 'Only your bank', 'Anyone, forever'], answer: 2, why: 'Transparent chains are public ledgers. Anyone can read every payment, forever.' },
    { q: 'What can the public see in a fully shielded (z→z) Zcash transaction?', options: ['Sender and amount', 'Only that it happened, and the fee', 'Everything except the memo'], answer: 1, why: 'Sender, receiver, amount and memo are encrypted. The fee and the fact that a transaction exists are public.' },
  ]);
}

// =====================================================================================
// LEVEL 2 · MOSS'S VAULT: wallet setup, the 24 words, the scam DM
// =====================================================================================
const WORDS = ['maple', 'orbit', 'velvet', 'canyon', 'pickle', 'lantern', 'meadow', 'zebra', 'quartz', 'harbor', 'tundra', 'violet',
  'cobalt', 'falcon', 'ember', 'saddle', 'glacier', 'parrot', 'mango', 'thistle', 'ribbon', 'nectar', 'basalt', 'willow'];

export async function level2({ dialog, play }: Ctx): Promise<void> {
  await dialog.say([
    { who: 'moss', pose: 'key', text: 'Ah, a newcomer. I’m <b>Moss</b>, keeper of the vault. Before you hold any ZEC you need a <b>wallet</b>, and a wallet that can do <b>shielded</b> transactions.' },
    { who: 'moss', pose: 'notebook', text: 'What will you use it on?' },
  ], 'Choose my device');

  const pick = h('section', { class: 'panel' }, h('h3', {}, '1 · Pick your device'));
  const opts = h('div', { class: 'choice-row' });
  const detail = h('div', { class: 'device-detail' });
  pick.append(opts, detail);
  play.append(pick); scrollTo(pick);

  const devices: { id: 'ios' | 'android' | 'desktop'; label: string; icon: string }[] = [
    { id: 'ios', label: 'iPhone', icon: '📱' }, { id: 'android', label: 'Android', icon: '🤖' }, { id: 'desktop', label: 'Computer', icon: '💻' }];
  const chosen = new Promise<void>((resolve) => {
    for (const d of devices) {
      const b = h('button', { class: 'choice', type: 'button' }, h('span', { class: 'big' }, d.icon), d.label);
      b.addEventListener('click', () => {
        sfx.pop(); opts.querySelectorAll('.choice').forEach((x) => x.classList.remove('on')); b.classList.add('on');
        state.choices.device = d.id; save();
        renderDevice(d.id); resolve();
      });
      opts.append(b);
    }
  });
  function renderDevice(id: 'ios' | 'android' | 'desktop') {
    detail.replaceChildren();
    if (id === 'desktop') {
      detail.append(
        h('div', { class: 'rec' },
          h('div', {}, h('h4', {}, 'Get Zingo! for desktop'), h('p', {}, 'Zingo-PC runs on Windows, macOS and Linux and supports shielded ZEC (Ironwood). Zkool is another good option.'),
            h('a', { class: 'btn primary', href: 'https://zingolabs.org/zingo/download/', target: '_blank', rel: 'noopener noreferrer' }, 'Download Zingo! ↗')),
          h('div', { class: 'qr-card' }, qr('https://zodl.com', 4), h('small', {}, 'Prefer your phone? Scan to open zodl.com'))));
    } else {
      detail.append(
        h('div', { class: 'rec' },
          h('div', {}, h('h4', {}, `Get Zodl for ${id === 'ios' ? 'iPhone' : 'Android'}`),
            h('p', {}, 'Zodl is a popular shielded-by-default Zcash wallet. It used to be called ', h('b', {}, 'Zashi'), '. Same app, new name.'),
            h('a', { class: 'btn primary', href: 'https://zodl.com', target: '_blank', rel: 'noopener noreferrer' }, 'Open zodl.com ↗'),
            h('p', { class: 'fine' }, `Get it only from the ${id === 'ios' ? 'App Store' : 'Play Store, F-Droid or Zodl’s GitHub'}, through the links on zodl.com.`)),
          h('div', { class: 'qr-card' }, qr('https://zodl.com', 4), h('small', {}, 'On a computer? Scan with your phone'))));
    }
    detail.append(h('ul', { class: 'warns' },
      h('li', {}, '🚫 There is ', h('b', {}, 'no Zodl desktop app'), '. A “Zodl for PC” download is a scam.'),
      h('li', {}, '🚫 ', h('b', {}, 'Ywallet'), ' was not updated for Ironwood. Skip it.'),
      h('li', {}, '🚫 Exodus and Trust Wallet only do ', h('b', {}, 'transparent'), ' ZEC. They can’t finish this tutorial.')));
  }
  await chosen;
  const cont = h('div', { class: 'row-actions' });
  const next = new Promise<void>((r) => cont.append(btn('I’ve installed it ✓', r, 'primary'), btn('I’ll install it later, keep playing', r, 'ghost')));
  pick.append(cont);
  await next;
  cont.remove();

  // ---- seed ceremony
  await dialog.say([
    { who: 'moss', pose: 'scroll', text: 'When you create a wallet you get a <b>24-word recovery phrase</b>. Those words <b>are</b> your money. Whoever has them can spend it, from anywhere.' },
    { who: 'moss', pose: 'notebook', text: 'Here are some <b>practice words</b> so you know what it looks like. Never use these for real. Now, where would you keep the real ones?' },
  ], 'Show me');
  const seed = h('section', { class: 'panel' }, h('h3', {}, '2 · The 24 words'),
    h('div', { class: 'seed-grid' }, ...WORDS.map((w, i) => h('span', {}, h('i', {}, String(i + 1)), w))),
    h('p', { class: 'fine center' }, 'PRACTICE WORDS. A real phrase is random and only ever shown inside your wallet.'));
  play.append(seed); scrollTo(seed);

  const items: { t: string; safe: boolean; why: string }[] = [
    { t: 'Write them on paper and keep it somewhere safe', safe: true, why: 'Offline paper can’t be hacked. Keep it away from prying eyes, fire and water.' },
    { t: 'Screenshot them', safe: false, why: 'Photos sync to the cloud and other apps can read them.' },
    { t: 'Stamp them into a metal backup plate', safe: true, why: 'Metal survives fire and floods. Great for larger amounts.' },
    { t: 'Paste them into a notes app or cloud drive', safe: false, why: 'If someone gets into that account, they get your money too.' },
    { t: 'Email them to yourself', safe: false, why: 'Email is stored on servers you don’t control.' },
    { t: 'Read them to “Support” on a call', safe: false, why: 'No real support team ever needs your words.' },
  ];
  const sorter = h('section', { class: 'panel' }, h('h3', {}, 'Vault or glass? Sort each habit'));
  const cards = h('div', { class: 'sort-cards' });
  sorter.append(cards); play.append(sorter); scrollTo(sorter);
  let left = items.length;
  await new Promise<void>((resolve) => {
    for (const it of items) {
      const why = h('small', { class: 'why', hidden: true }, it.why);
      const card = h('div', { class: 'sort-card' }, h('p', {}, it.t), why);
      const pickSide = (safe: boolean) => {
        if (card.classList.contains('done')) return;
        if (safe === it.safe) {
          sfx.ding(); card.classList.add('done', it.safe ? 'safe' : 'leaky'); why.hidden = false; left--;
          dialog.pose('moss', it.safe ? 'thumbs' : 'no');
          card.querySelectorAll('button').forEach((b) => b.remove());
          if (left === 0) resolve();
        } else { sfx.buzz(); card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 400); dialog.pose('moss', 'no'); }
      };
      card.append(h('div', { class: 'sort-btns' }, btn('🔒 Vault', () => pickSide(true), 'small'), btn('🔍 Glass', () => pickSide(false), 'small')));
      cards.append(card);
    }
  });
  await dialog.say([
    { who: 'moss', pose: 'notebook', text: 'One more thing to write down: your <b>wallet birthday height</b>. It’s the block your wallet was born at, so a restore knows where to start scanning. Zodl shows it with your backup.' },
    { who: 'moss', pose: 'smile', text: 'Zodl asks you to back up after your first ZEC arrives. Don’t skip it. Zodl can’t recover lost words. Nobody can.' },
  ]);

  // ---- Gus
  const dm = h('section', { class: 'panel dm' },
    h('div', { class: 'dm-head' }, h('img', { src: '/chars/gus/smile.webp', alt: '' }), h('div', {}, h('b', {}, 'Zodl Support ✅'), h('small', {}, 'Direct message · now'))),
    h('p', { class: 'dm-body' }, 'Hi! 👋 Your wallet was flagged during the Ironwood upgrade. To keep your funds safe, please reply with your 24 recovery words within 15 minutes.'));
  play.append(dm); scrollTo(dm);
  dialog.pose('gus', 'smile');
  await dialog.say([{ who: 'gus', pose: 'ask', text: 'Heyyy, totally official support here. Just need those 24 little words. Quick quick!' }], 'Decide');
  await new Promise<void>((resolve) => {
    const acts = h('div', { class: 'row-actions' });
    acts.append(
      btn('Reply with my words', async () => {
        sfx.buzz(); dialog.pose('gus', 'run');
        toast('Gus emptied the (pretend) wallet in 4 seconds. Try again.', 'bad');
      }, 'danger'),
      btn('Block & report', () => { sfx.ding(); dialog.pose('gus', 'caught'); acts.remove(); dm.classList.add('blocked'); resolve(); }, 'primary'));
    dm.append(acts);
  });
  await dialog.say([
    { who: 'gus', pose: 'caught', text: 'Wha—? Blocked?! …fine.' },
    { who: 'moss', pose: 'no', text: 'Good. <b>Nobody legit will ever ask for your words.</b> Not Zodl, not an exchange, not me. Old Orchard funds never “expire” either. That’s another scam line.' },
  ]);
  dialog.clearSide('right');
  await quiz(play, [
    { q: 'How many words is a Zodl recovery phrase?', options: ['12', '24', '32'], answer: 1, why: 'Zodl uses 24 words. Write them down with your wallet birthday height.' },
    { q: '“Support” DMs you asking for your recovery phrase. What do you do?', options: ['Send it, they seem official', 'Send only the first 12 words', 'Block them. It’s always a scam'], answer: 2, why: 'Real teams never ask for your words. Anyone who has them can take everything.' },
  ]);
}

// =====================================================================================
// LEVEL 3 · THE MARKET: three ways to get ZEC and what each one leaks
// =====================================================================================
export async function level3({ dialog, play }: Ctx): Promise<void> {
  await dialog.say([
    { who: 'zee', pose: 'point', text: 'Welcome to the Market! There are three common ways to get your first ZEC. Each one leaves a different trail. Pick one to see how it works.' },
  ], 'Show me the routes');
  const routes: { id: 'swap' | 'exchange' | 'friend'; icon: string; title: string; sub: string; steps: string[]; peep: string; lands: string }[] = [
    { id: 'swap', icon: '🔁', title: 'Swap inside Zodl', sub: 'Have BTC, USDC or SOL? Swap it for ZEC in the app.',
      steps: ['In Zodl, tap <b>Swap</b> (powered by NEAR Intents).', 'Choose the coin and network you’re paying with, then send it to the deposit address Zodl shows.', 'ZEC arrives at a fresh <b>shielded</b> address. Nothing to shield afterwards.'],
      peep: 'I can see your payment on the <i>other</i> chain (it’s public there). The ZEC side lands in the fog.', lands: 'Lands shielded ✓' },
    { id: 'exchange', icon: '🏦', title: 'Buy on an exchange', sub: 'Coinbase, Kraken, Binance, OKX, Gemini…',
      steps: ['Buy ZEC on the exchange.', 'In Zodl, find your <b>transparent (t1…) address</b> for exchange deposits and withdraw to it. Most exchanges only send to t-addresses.', 'Zodl then shows a <b>Shield</b> button. Tap it to move the coins into the shielded pool.', 'Gemini can withdraw straight to a shielded address.'],
      peep: 'The exchange knows your name (ID checks). The withdrawal to your t1 address and its amount are public. After you shield, I lose you.', lands: 'Lands in glass → tap Shield' },
    { id: 'friend', icon: '🤝', title: 'From a friend', sub: 'Someone who already has ZEC sends you some.',
      steps: ['In Zodl, tap <b>Receive</b> and share your shielded address or QR code.', 'Your friend sends from their shielded wallet.', 'It arrives shielded. Nothing public except that a transaction happened.'],
      peep: 'Shielded to shielded? I get nothing. Not even the amount.', lands: 'Lands shielded ✓' },
  ];
  const sec = h('section', { class: 'panel' }, h('h3', {}, 'Choose your route'));
  const grid = h('div', { class: 'route-grid' });
  const info = h('div', { class: 'route-info' });
  sec.append(grid, info); play.append(sec); scrollTo(sec);
  await new Promise<void>((resolve) => {
    for (const r of routes) {
      const card = h('button', { class: 'route', type: 'button' }, h('span', { class: 'big' }, r.icon), h('b', {}, r.title), h('small', {}, r.sub), h('span', { class: 'chip' }, r.lands));
      card.addEventListener('click', () => {
        sfx.pop(); grid.querySelectorAll('.route').forEach((x) => x.classList.remove('on')); card.classList.add('on');
        state.choices.route = r.id; save();
        info.replaceChildren(
          h('ol', { class: 'steps' }, ...r.steps.map((s) => h('li', { html: s }))),
          h('div', { class: 'peep-sees' }, h('img', { src: '/chars/peep/peer.webp', alt: '' }), h('p', { html: `<b>What Peep sees:</b> ${r.peep}` })));
        if (r.id === 'swap') info.append(h('p', { class: 'warn-line' }, '⚠️ Double-check the coin and network before you send. Zodl warns that mistakes on swaps under $300 can’t be refunded.'));
        dialog.pose('peep', r.id === 'exchange' ? 'read' : 'fog');
        resolve();
      });
      grid.append(card);
    }
  });
  await sleep(400);
  const go = h('div', { class: 'row-actions' });
  await new Promise<void>((r) => { go.append(btn('Got it →', r, 'primary')); sec.append(go); });
  go.remove();

  await dialog.say([
    { who: 'zee', pose: 'think', text: 'Quick sort: where does each one land, in the <b>fog</b> (shielded) or in the <b>glass</b> (your t1 address, waiting to be shielded)?' },
  ], 'Sort them');
  const sorts: { t: string; fog: boolean; why: string }[] = [
    { t: 'Swap BTC → ZEC inside Zodl', fog: true, why: 'Zodl swaps deliver to a fresh shielded address.' },
    { t: 'Withdraw from Coinbase or Kraken', fog: false, why: 'Most exchanges send to a t1 address. Then tap Shield.' },
    { t: 'Withdraw from Gemini to your shielded address', fog: true, why: 'Gemini supports shielded withdrawals.' },
    { t: 'A friend sends from their shielded wallet', fog: true, why: 'Shielded to shielded stays in the fog.' },
  ];
  const box = h('section', { class: 'panel' }, h('h3', {}, 'Fog or glass?'));
  const cards = h('div', { class: 'sort-cards' }); box.append(cards); play.append(box); scrollTo(box);
  let n = sorts.length;
  await new Promise<void>((resolve) => {
    for (const s of sorts) {
      const why = h('small', { class: 'why', hidden: true }, s.why);
      const card = h('div', { class: 'sort-card' }, h('p', {}, s.t), why);
      const choose = (fog: boolean) => {
        if (fog === s.fog) { sfx.ding(); card.classList.add('done', fog ? 'safe' : 'leaky'); why.hidden = false; card.querySelector('.sort-btns')?.remove(); if (--n === 0) resolve(); }
        else { sfx.buzz(); card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 400); }
      };
      card.append(h('div', { class: 'sort-btns' }, btn('🌫 Fog', () => choose(true), 'small'), btn('🔍 Glass', () => choose(false), 'small')));
      cards.append(card);
    }
  });
  await quiz(play, [
    { q: 'You withdrew ZEC from an exchange to your Zodl t1 address. What next?', options: ['Nothing, it’s private now', 'Tap Shield in Zodl', 'Send it back to the exchange'], answer: 1, why: 'Funds on a t-address are public. Shielding moves them into the private pool, and Zodl prompts you to do it.' },
  ]);
}

// =====================================================================================
// LEVEL 4 · GLASS OR FOG: address types
// =====================================================================================
export async function level4({ dialog, play }: Ctx): Promise<void> {
  await dialog.say([
    { who: 'zee', pose: 'think', text: 'An address tells you what kind of jar your coins drop into. The <b>first letters</b> give it away.' },
    { who: 'peep', pose: 'peer', text: 'Glass jars are my favourite. Let’s see if you can spot them.' },
  ], 'Start sorting');

  const deck: { addr: string; fog: boolean; note: string }[] = [
    { addr: fakeT(), fog: false, note: '<b>t1…</b> = transparent. Public like Bitcoin. Use it for exchange withdrawals, then shield.' },
    { addr: fakeU() + fake('', 60), fog: true, note: '<b>u1…</b> = Unified Address. Zodl’s are shielded-only; payments land in the Ironwood pool.' },
    { addr: fake('tex1', 38), fog: false, note: '<b>tex1…</b> = TEX, an exchange-only transparent address (Binance uses these). It refuses coins that come from shielded addresses. Zodl handles it by unshielding first, so that amount becomes public.' },
    { addr: fake('zs1', 75), fog: true, note: '<b>zs1…</b> = Sapling, an older shielded pool. Still private.' },
    { addr: fake('t3', 33, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'), fog: false, note: '<b>t3…</b> = transparent too (a script/multisig address). Public.' },
    { addr: fakeU() + fake('', 60), fog: true, note: 'Another <b>u1…</b>. Zodl gives you a fresh one each time, and they all belong to your wallet.' },
  ];
  const sec = h('section', { class: 'panel' }, h('h3', {}, 'Glass or fog?'));
  const stageEl = h('div', { class: 'addr-stage' });
  const score = h('span', { class: 'chip' }, `0 / ${deck.length}`);
  sec.append(h('div', { class: 'sec-head' }, score), stageEl);
  play.append(sec); scrollTo(sec);
  let right = 0;
  for (const d of deck) {
    await new Promise<void>((resolve) => {
      const note = h('p', { class: 'why', hidden: true, html: d.note });
      const card = h('div', { class: 'addr-card enter' }, h('code', { class: 'mono addr' }, d.addr), note);
      const btns = h('div', { class: 'sort-btns wide' });
      let tries = 0;
      const pick = (fog: boolean) => {
        if (fog === d.fog) {
          sfx.ding(); if (tries === 0) right++; score.textContent = `${right} / ${deck.length}`;
          card.classList.add(fog ? 'is-fog' : 'is-glass'); note.hidden = false; btns.replaceChildren(btn('Next →', resolve, 'primary'));
          dialog.pose('peep', fog ? 'fog' : 'read');
        } else { tries++; sfx.buzz(); card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 400); }
      };
      btns.append(btn('🔍 Glass (public)', () => pick(false)), btn('🌫 Fog (shielded)', () => pick(true)));
      card.append(btns);
      stageEl.replaceChildren(card);
    });
  }

  // Real checker
  await dialog.say([
    { who: 'zee', pose: 'shield', text: `${right >= 5 ? 'Sharp eyes!' : 'Nice work!'} Here’s a tool you can use for real: paste any Zcash address and I’ll check its type and checksum, right here in your browser. Nothing is sent anywhere.` },
  ], 'Open the checker');
  const out = h('div', { class: 'check-out' });
  const input = h('input', { class: 'field mono', placeholder: 'Paste an address: u1…, t1…, zs1…, tex1…', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Zcash address' });
  input.addEventListener('input', () => {
    const r = classify(input.value);
    out.className = `check-out ${input.value.trim() ? (r.valid ? (r.shielded ? 'fog' : 'glass') : 'bad') : ''}`;
    out.replaceChildren(input.value.trim() ? h('div', {}, h('b', {}, (r.valid ? '✓ ' : '✗ ') + r.label), h('p', {}, r.note)) : '');
  });
  const checker = h('section', { class: 'panel' }, h('h3', {}, 'Address checker'), input, out,
    h('p', { class: 'fine' }, 'Checks the prefix and checksum only. Always copy-paste addresses, and compare the first and last few characters before sending.'));
  play.append(checker); scrollTo(checker);
  const cont = h('div', { class: 'row-actions' });
  await new Promise<void>((r) => { cont.append(btn('Continue →', r, 'primary')); checker.append(cont); });
  cont.remove();
  await quiz(play, [
    { q: 'Which address keeps you private when someone pays you?', options: ['t1…', 'u1… from Zodl', 'tex1…'], answer: 1, why: 'Zodl’s Unified Addresses are shielded-only, so the payment lands in the private pool.' },
    { q: 'Zodl shows you a different u1 address each time. Is something wrong?', options: ['Yes, I got hacked', 'No, they’re all mine, and fresh ones are harder to link', 'Yes, the old ones stop working'], answer: 1, why: 'Zcash wallets can make many addresses from one key. Fresh ones stop people linking your payments together.' },
  ]);
}
