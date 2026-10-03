import { h, btn, sfx, sleep, quiz, toast, scrollTo, fakeT, fakeU, fake, short, portraitEl, type Dialog } from './ui';
import { state, save } from './state';
import { classify } from './zcash';
import { qr } from './qr';

export type Ctx = { dialog: Dialog; play: HTMLElement };

export const label = (t: string) => h('div', { class: 'label' }, t);

// =====================================================================================
// NODE 01 · WATCHER'S DESK: you play the chain watcher, then the target goes shielded
// =====================================================================================
export async function level1({ dialog, play }: Ctx): Promise<void> {
  await dialog.say([
    { who: 'zee', pose: 'wave', text: 'You’re in <b>Glasstown</b>. Every wallet here is made of glass: balances, payments and counterparties are public, forever. I’m <b>Zero</b>. I’ll get you out.' },
    { who: 'peep', pose: 'read', text: 'Not so fast. I’m the <b>Watcher</b>. Chain analytics. I read glass for a living.' },
    { who: 'peep', pose: 'peer', text: 'Sit at my desk for a minute. One wallet address, sixty seconds. Click its payments and build me a profile.' },
  ], 'OPEN CASE FILE');

  const alex = fakeT();
  type Row = { when: string; dir: 'in' | 'out'; who: string; addr: string; amt: string; fact: string };
  const rows: Row[] = [
    { when: 'MON 08:12', dir: 'out', who: 'Bean There Café', addr: fakeT(), amt: '0.004', fact: 'Buys coffee at Bean There Café, weekdays ~08:00' },
    { when: 'FRI 17:00', dir: 'in', who: 'ACME Corp Payroll', addr: fakeT(), amt: '2.10', fact: 'Employer: ACME Corp. Salary 2.1 ZEC, biweekly' },
    { when: 'SAT 10:30', dir: 'out', who: 'Oak St Lettings', addr: fakeT(), amt: '1.20', fact: 'Rent 1.2 ZEC to Oak St Lettings, so lives on Oak Street' },
    { when: 'SAT 11:05', dir: 'out', who: 'CityCare Pharmacy', addr: fakeT(), amt: '0.03', fact: 'Weekly pharmacy purchase (health data)' },
    { when: 'SUN 19:40', dir: 'in', who: 'CoinMart (exchange)', addr: fakeT(), amt: '0.50', fact: 'Exchange with ID checks. Legal name on file: ALEX RIVERA' },
    { when: 'TUE 21:10', dir: 'out', who: 'sam.eth (posts publicly)', addr: fakeT(), amt: '0.08', fact: 'Pays Sam, so Sam’s history is linked too' },
  ];

  const known = h('ol', { class: 'dossier-list' });
  const count = h('b', {}, '0');
  const count2 = h('span', { class: 'chip known-chip' }, '0 FACTS');
  const timer = h('span', { class: 'timer' }, '60');
  const dossier = h('aside', { class: 'panel dossier' },
    h('div', { class: 'dossier-head' }, portraitEl('peep', 'read', 2), h('div', {}, label('Profile: subject 0x1'), h('p', {}, 'The Watcher knows ', count, ' facts'))),
    known);
  const list = h('div', { class: 'tx-list' });
  const explorer = h('section', { class: 'panel explorer glass' },
    h('div', { class: 'explorer-head' }, h('span', { class: 'chip glass-chip' }, 'PUBLIC EXPLORER'), h('code', { class: 'mono' }, short(alex)), count2, timer),
    list);
  play.append(h('div', { class: 'split' }, explorer, dossier));
  scrollTo(explorer);

  let found = 0;
  list.replaceChildren(...rows.map((r) => {
    const row = h('button', { class: 'tx-row', type: 'button' },
      h('span', { class: 'when' }, r.when),
      h('span', { class: `dir ${r.dir}` }, r.dir === 'in' ? '← IN' : 'OUT →'),
      h('span', { class: 'who' }, r.who, h('small', { class: 'mono' }, short(r.addr))),
      h('span', { class: 'amt' }, `${r.amt} ZEC`));
    row.addEventListener('click', () => {
      if (row.classList.contains('seen')) return;
      row.classList.add('seen'); found++; count.textContent = String(found); count2.textContent = `${found} FACTS`; sfx.ding();
      known.append(h('li', { class: 'fact pop' }, r.fact));
      dialog.pose('peep', found % 2 ? 'read' : 'peer');
      if (found >= 5) finish();
    });
    return row;
  }));

  let t = 60, ended = false;
  let resolveCase: () => void = () => {};
  const caseDone = new Promise<void>((r) => (resolveCase = r));
  const iv = setInterval(() => { t--; timer.textContent = String(t); if (t <= 10) timer.classList.add('low'); if (t <= 0) finish(); }, 1000);
  function finish() { if (ended) return; ended = true; clearInterval(iv); timer.textContent = 'OK'; resolveCase(); }
  await caseDone;
  await sleep(500);

  await dialog.say([
    { who: 'peep', pose: 'read', text: 'Job. Salary. Street. Pharmacy. Legal name. From <b>one address</b>, without hacking anything. Glass does the work for me.' },
    { who: 'zee', pose: 'worried', text: 'That’s every transparent chain, Bitcoin included. A public address is a bank statement taped to a window.' },
    { who: 'zee', pose: 'point', text: 'Now watch. The subject just moved to a <b>shielded Zcash wallet</b>. Follow the new payments.' },
  ], 'FOLLOW THEM');

  explorer.classList.remove('glass'); explorer.classList.add('fog');
  explorer.querySelector('.explorer-head code')!.textContent = short(fakeU());
  sfx.whoosh();
  let pokes = 0;
  const pokedAll = new Promise<void>((resolve) => {
    list.replaceChildren(...['WED 08:09', 'FRI 17:02', 'SAT 10:31', 'SAT 11:07'].map((when) => {
      const row = h('button', { class: 'tx-row redacted', type: 'button' },
        h('span', { class: 'when' }, when),
        h('span', { class: 'dir' }, '████'),
        h('span', { class: 'who' }, '██████████', h('small', {}, 'shielded transaction')),
        h('span', { class: 'amt' }, '███ ZEC'));
      row.addEventListener('click', () => {
        if (row.classList.contains('seen')) return;
        row.classList.add('seen'); sfx.buzz(); pokes++;
        toast('NO TRAIL: sender, receiver, amount and memo are encrypted.', 'bad');
        dialog.pose('peep', pokes === 1 ? 'gasp' : pokes === 2 ? 'fog' : 'furious');
        if (pokes >= 2) resolve();
      });
      return row;
    }));
  });
  await pokedAll;
  await dialog.say([
    { who: 'peep', pose: 'furious', text: 'I get “a transaction happened” and a fee. No sender. No receiver. No amount. No memo.' },
    { who: 'zee', pose: 'shield', text: 'Shielded Zcash. Zero-knowledge proofs let the network verify every payment <b>without seeing it</b>. Same money. No glass.' },
    { who: 'zee', pose: 'cheer', text: 'Eight nodes. At the last one you make a <b>real</b> shielded transaction. Your identity renders as you go.' },
  ]);
  await quiz(play, [
    { q: 'On a transparent blockchain, who can see your payments?', options: ['Only you', 'Only your bank', 'Anyone, forever'], answer: 2, why: 'Transparent chains are public ledgers. Anyone can read every payment, forever.' },
    { q: 'What can the public see in a fully shielded (z→z) Zcash transaction?', options: ['Sender and amount', 'That it happened, and the fee', 'Everything except the memo'], answer: 1, why: 'Sender, receiver, amount and memo are encrypted. Only the fact that a transaction exists, and its fee, are public.' },
  ]);
}

// =====================================================================================
// NODE 02 · THE VAULT: wallet setup, the 24 words, the fake support DM
// =====================================================================================
const WORDS = ['maple', 'orbit', 'velvet', 'canyon', 'pickle', 'lantern', 'meadow', 'zebra', 'quartz', 'harbor', 'tundra', 'violet',
  'cobalt', 'falcon', 'ember', 'saddle', 'glacier', 'parrot', 'mango', 'thistle', 'ribbon', 'nectar', 'basalt', 'willow'];

export async function level2({ dialog, play }: Ctx): Promise<void> {
  await dialog.say([
    { who: 'moss', pose: 'key', text: 'I’m the <b>Keeper</b>. Nothing leaves the vault without a key. First you need a wallet that speaks <b>shielded</b>.' },
    { who: 'moss', pose: 'notebook', text: 'Which machine are you on?' },
  ], 'SELECT DEVICE');

  const pick = h('section', { class: 'panel' }, label('01 · Device'));
  const opts = h('div', { class: 'choice-row' });
  const detail = h('div', { class: 'device-detail' });
  pick.append(opts, detail);
  play.append(pick); scrollTo(pick);

  const devices: { id: 'ios' | 'android' | 'desktop'; label: string; icon: string }[] = [
    { id: 'ios', label: 'iPhone', icon: '[ iOS ]' }, { id: 'android', label: 'Android', icon: '[ AND ]' }, { id: 'desktop', label: 'Computer', icon: '[ PC ]' }];
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
          h('div', {}, h('h4', {}, 'Zingo! for desktop'), h('p', {}, 'Zingo-PC runs on Windows, macOS and Linux and supports shielded ZEC (Ironwood). Zkool is another option.'),
            h('a', { class: 'btn primary', href: 'https://zingolabs.org/zingo/download/', target: '_blank', rel: 'noopener noreferrer' }, 'DOWNLOAD ZINGO! ↗')),
          h('div', { class: 'qr-card' }, qr('https://zodl.com', 4), h('small', {}, 'Prefer your phone? Scan for zodl.com'))));
    } else {
      detail.append(
        h('div', { class: 'rec' },
          h('div', {}, h('h4', {}, `Zodl for ${id === 'ios' ? 'iPhone' : 'Android'}`),
            h('p', {}, 'Zodl is a popular shielded-by-default Zcash wallet. It used to be called ', h('b', {}, 'Zashi'), ': same app, new name.'),
            h('a', { class: 'btn primary', href: 'https://zodl.com', target: '_blank', rel: 'noopener noreferrer' }, 'OPEN ZODL.COM ↗'),
            h('p', { class: 'fine' }, `Install only from the ${id === 'ios' ? 'App Store' : 'Play Store, F-Droid or Zodl’s GitHub'}, through the links on zodl.com.`)),
          h('div', { class: 'qr-card' }, qr('https://zodl.com', 4), h('small', {}, 'On a computer? Scan with your phone'))));
    }
    detail.append(h('ul', { class: 'warns' },
      h('li', {}, h('b', {}, '✕ '), 'There is ', h('b', {}, 'no Zodl desktop app'), '. A “Zodl for PC” download is a scam.'),
      h('li', {}, h('b', {}, '✕ '), h('b', {}, 'Ywallet'), ' was not updated for Ironwood. Skip it.'),
      h('li', {}, h('b', {}, '✕ '), 'Exodus and Trust Wallet only handle ', h('b', {}, 'transparent'), ' ZEC. They can’t finish this run.')));
  }
  await chosen;
  const cont = h('div', { class: 'row-actions' });
  const next = new Promise<void>((r) => cont.append(btn('INSTALLED ✓', r, 'primary'), btn('LATER, KEEP PLAYING', r, 'ghost')));
  pick.append(cont);
  await next;
  cont.remove();

  await dialog.say([
    { who: 'moss', pose: 'scroll', text: 'A new wallet shows you a <b>24-word recovery phrase</b>. Those words <b>are</b> the money. Anyone who has them can spend it from anywhere.' },
    { who: 'moss', pose: 'notebook', text: 'These are <b>practice words</b>. Never use them. Now tell me where the real ones go.' },
  ], 'SHOW ME');
  const seed = h('section', { class: 'panel' }, label('02 · Recovery phrase (practice)'),
    h('div', { class: 'seed-grid' }, ...WORDS.map((w, i) => h('span', {}, h('i', {}, String(i + 1).padStart(2, '0')), w))),
    h('p', { class: 'fine center' }, 'PRACTICE ONLY. A real phrase is random and only ever shown inside your wallet.'));
  play.append(seed); scrollTo(seed);

  const items: { t: string; safe: boolean; why: string }[] = [
    { t: 'Write them on paper, store it somewhere safe', safe: true, why: 'Offline paper can’t be hacked. Keep it away from eyes, fire and water.' },
    { t: 'Screenshot them', safe: false, why: 'Photos sync to the cloud, and other apps can read them.' },
    { t: 'Stamp them into a metal backup plate', safe: true, why: 'Metal survives fire and flood. Good for larger amounts.' },
    { t: 'Paste them into a notes app or cloud drive', safe: false, why: 'Whoever gets into that account gets your money too.' },
    { t: 'Email them to yourself', safe: false, why: 'Email sits on servers you don’t control.' },
    { t: 'Read them to “Support” on a call', safe: false, why: 'No real support team ever needs your words.' },
  ];
  const sorter = h('section', { class: 'panel' }, label('03 · Vault or glass?'));
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
      card.append(h('div', { class: 'sort-btns' }, btn('VAULT', () => pickSide(true), 'small'), btn('GLASS', () => pickSide(false), 'small')));
      cards.append(card);
    }
  });
  await dialog.say([
    { who: 'moss', pose: 'notebook', text: 'Write down one more thing: your <b>wallet birthday height</b>, the block your wallet was created at. A restore uses it to know where to start scanning.' },
    { who: 'moss', pose: 'smile', text: 'Zodl asks for the backup after your first ZEC lands. Do it then. Lost words can’t be recovered by anyone.' },
  ]);

  const dm = h('section', { class: 'panel dm' },
    h('div', { class: 'dm-head' }, portraitEl('gus', 'smile', 2), h('div', {}, h('b', {}, 'Zodl Support ✓'), h('small', {}, 'DIRECT MESSAGE · NOW'))),
    h('p', { class: 'dm-body' }, 'Hello! Your wallet was flagged during the Ironwood upgrade. To keep your funds safe, reply with your 24 recovery words within 15 minutes.'));
  play.append(dm); scrollTo(dm);
  dialog.pose('gus', 'smile');
  await dialog.say([{ who: 'gus', pose: 'ask', text: 'Official support here. Routine verification, nothing to worry about. Just the 24 words and we’re done.' }], 'DECIDE');
  await new Promise<void>((resolve) => {
    const acts = h('div', { class: 'row-actions' });
    acts.append(
      btn('REPLY WITH WORDS', () => { sfx.buzz(); dialog.pose('gus', 'run'); toast('DRAINED. The (practice) wallet was emptied in four seconds. Try again.', 'bad'); }, 'danger'),
      btn('BLOCK + REPORT', () => { sfx.ding(); dialog.pose('gus', 'caught'); acts.remove(); dm.classList.add('blocked'); resolve(); }, 'primary'));
    dm.append(acts);
  });
  await dialog.say([
    { who: 'gus', pose: 'caught', text: '…connection terminated.' },
    { who: 'moss', pose: 'no', text: '<b>Nobody legitimate will ever ask for your words.</b> Not Zodl, not an exchange, not me. And old Orchard funds never “expire”. That’s another scam script.' },
  ]);
  dialog.clearSide('right');
  await quiz(play, [
    { q: 'How many words is a Zodl recovery phrase?', options: ['12', '24', '32'], answer: 1, why: 'Zodl uses 24 words. Write them down with your wallet birthday height.' },
    { q: '“Support” messages you asking for your recovery phrase. You:', options: ['Send it, they look official', 'Send only the first 12 words', 'Block them. It’s always a scam'], answer: 2, why: 'Real teams never ask for your words. Anyone holding them can take everything.' },
  ]);
}

// =====================================================================================
// NODE 03 · THE MARKET: three ways to get ZEC and what each one leaks
// =====================================================================================
export async function level3({ dialog, play }: Ctx): Promise<void> {
  await dialog.say([
    { who: 'zee', pose: 'point', text: 'Three common ways to get your first ZEC. Each one leaves a different trail. Pick one and see what the Watcher gets.' },
  ], 'SHOW ROUTES');
  const routes: { id: 'swap' | 'exchange' | 'friend'; icon: string; title: string; sub: string; steps: string[]; peep: string; lands: string }[] = [
    { id: 'swap', icon: '⇄', title: 'Swap inside Zodl', sub: 'Have BTC, USDC or SOL? Swap it for ZEC in the app.',
      steps: ['In Zodl, tap <b>Swap</b> (powered by NEAR Intents).', 'Pick the coin and network you’re paying with, then send to the deposit address Zodl shows.', 'ZEC arrives at a fresh <b>shielded</b> address. Nothing left to shield.'],
      peep: 'Your payment on the <i>other</i> chain is public there. The ZEC side lands in the dark.', lands: 'LANDS SHIELDED' },
    { id: 'exchange', icon: '⌂', title: 'Buy on an exchange', sub: 'Coinbase, Kraken, Binance, OKX, Gemini…',
      steps: ['Buy ZEC on the exchange.', 'In Zodl, copy your <b>transparent (t1…) address</b> for exchange deposits and withdraw to it. Most exchanges only send to t-addresses.', 'Zodl then shows a <b>Shield</b> button. Tap it to move the coins into the shielded pool.', 'Gemini can withdraw straight to a shielded address.'],
      peep: 'The exchange knows your name (ID checks). The withdrawal to your t1 address and its amount are public. After you shield, I lose you.', lands: 'LANDS IN GLASS → SHIELD' },
    { id: 'friend', icon: '⇆', title: 'From a friend', sub: 'Someone who already holds ZEC sends you some.',
      steps: ['In Zodl, tap <b>Receive</b> and share your shielded address or QR code.', 'Your friend sends from their shielded wallet.', 'It arrives shielded. The only public fact is that a transaction happened.'],
      peep: 'Shielded to shielded? Nothing. Not even the amount.', lands: 'LANDS SHIELDED' },
  ];
  const sec = h('section', { class: 'panel' }, label('01 · Choose a route'));
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
          h('div', { class: 'peep-sees' }, portraitEl('peep', 'peer', 2), h('p', { html: `<b>WATCHER SEES:</b> ${r.peep}` })));
        if (r.id === 'swap') info.append(h('p', { class: 'warn-line' }, '! Check the coin and network before you send. Zodl warns that mistakes on swaps under $300 can’t be refunded.'));
        dialog.pose('peep', r.id === 'exchange' ? 'read' : 'fog');
        resolve();
      });
      grid.append(card);
    }
  });
  await sleep(400);
  const go = h('div', { class: 'row-actions' });
  await new Promise<void>((r) => { go.append(btn('GOT IT ▸', r, 'primary')); sec.append(go); });
  go.remove();

  await dialog.say([
    { who: 'zee', pose: 'think', text: 'Sort them: does each one land in the <b>dark</b> (shielded), or in <b>glass</b> (your t1 address, waiting to be shielded)?' },
  ], 'SORT');
  const sorts: { t: string; fog: boolean; why: string }[] = [
    { t: 'Swap BTC → ZEC inside Zodl', fog: true, why: 'Zodl swaps deliver to a fresh shielded address.' },
    { t: 'Withdraw from Coinbase or Kraken', fog: false, why: 'Most exchanges send to a t1 address. Then tap Shield.' },
    { t: 'Withdraw from Gemini to your shielded address', fog: true, why: 'Gemini supports shielded withdrawals.' },
    { t: 'A friend sends from their shielded wallet', fog: true, why: 'Shielded to shielded stays dark.' },
  ];
  const box = h('section', { class: 'panel' }, label('02 · Dark or glass?'));
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
      card.append(h('div', { class: 'sort-btns' }, btn('DARK', () => choose(true), 'small'), btn('GLASS', () => choose(false), 'small')));
      cards.append(card);
    }
  });
  await quiz(play, [
    { q: 'You withdrew ZEC from an exchange to your Zodl t1 address. Next?', options: ['Nothing, it’s private now', 'Tap Shield in Zodl', 'Send it back to the exchange'], answer: 1, why: 'Funds on a t-address are public. Shielding moves them into the private pool, and Zodl prompts you to do it.' },
  ]);
}

// =====================================================================================
// NODE 04 · GLASS OR DARK: address types
// =====================================================================================
export async function level4({ dialog, play }: Ctx): Promise<void> {
  await dialog.say([
    { who: 'zee', pose: 'think', text: 'An address tells you what your coins drop into. The <b>prefix</b> gives it away.' },
    { who: 'peep', pose: 'peer', text: 'Glass is my favourite. Let’s see if you can spot it.' },
  ], 'START');

  const deck: { addr: string; fog: boolean; note: string }[] = [
    { addr: fakeT(), fog: false, note: '<b>t1…</b> = transparent. Public like Bitcoin. Use it for exchange withdrawals, then shield.' },
    { addr: fakeU() + fake('', 60), fog: true, note: '<b>u1…</b> = Unified Address. Zodl’s are shielded-only; payments land in the Ironwood pool.' },
    { addr: fake('tex1', 38), fog: false, note: '<b>tex1…</b> = TEX, an exchange-only transparent address (Binance uses them). It refuses coins that come from shielded addresses. Zodl handles it by unshielding first, so that amount becomes public.' },
    { addr: fake('zs1', 75), fog: true, note: '<b>zs1…</b> = Sapling, an older shielded pool. Still private.' },
    { addr: fake('t3', 33, '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'), fog: false, note: '<b>t3…</b> = also transparent (a script or multisig address). Public.' },
    { addr: fakeU() + fake('', 60), fog: true, note: 'Another <b>u1…</b>. Zodl gives you a fresh one every time, and they all belong to your wallet.' },
  ];
  const sec = h('section', { class: 'panel' }, label('01 · Glass or dark?'));
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
          card.classList.add(fog ? 'is-fog' : 'is-glass'); note.hidden = false; btns.replaceChildren(btn('NEXT ▸', resolve, 'primary'));
          dialog.pose('peep', fog ? 'fog' : 'read');
        } else { tries++; sfx.buzz(); card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 400); }
      };
      btns.append(btn('GLASS (PUBLIC)', () => pick(false)), btn('DARK (SHIELDED)', () => pick(true)));
      card.append(btns);
      stageEl.replaceChildren(card);
    });
  }

  await dialog.say([
    { who: 'zee', pose: 'shield', text: `${right}/${deck.length} on the first try. Here’s a real tool: paste any Zcash address and I’ll check its type and checksum in your browser. Nothing is sent anywhere.` },
  ], 'OPEN CHECKER');
  const out = h('div', { class: 'check-out' });
  const input = h('input', { class: 'field mono', placeholder: 'paste an address: u1… t1… zs1… tex1…', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Zcash address' });
  input.addEventListener('input', () => {
    const r = classify(input.value);
    out.className = `check-out ${input.value.trim() ? (r.valid ? (r.shielded ? 'fog' : 'glass') : 'bad') : ''}`;
    out.replaceChildren(input.value.trim() ? h('div', {}, h('b', {}, (r.valid ? '✓ ' : '✕ ') + r.label), h('p', {}, r.note)) : '');
  });
  const checker = h('section', { class: 'panel' }, label('02 · Address checker'), input, out,
    h('p', { class: 'fine' }, 'Checks prefix and checksum only. Always copy-paste addresses, then compare the first and last few characters before you send.'));
  play.append(checker); scrollTo(checker);
  const cont = h('div', { class: 'row-actions' });
  await new Promise<void>((r) => { cont.append(btn('CONTINUE ▸', r, 'primary')); checker.append(cont); });
  cont.remove();
  await quiz(play, [
    { q: 'Which address keeps you private when someone pays you?', options: ['t1…', 'u1… from Zodl', 'tex1…'], answer: 1, why: 'Zodl’s Unified Addresses are shielded-only, so the payment lands in the private pool.' },
    { q: 'Zodl shows a different u1 address each time. Problem?', options: ['Yes, I got hacked', 'No: they’re all mine, and fresh ones are harder to link', 'Yes, the old ones stop working'], answer: 1, why: 'One key can make many addresses. Fresh ones stop people linking your payments together.' },
  ]);
}
