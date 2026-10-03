import { h, btn, sfx, sleep, quiz, toast, scrollTo, fakeT, fakeU, short, hex, portraitEl } from './ui';
import { state, save } from './state';
import { classify, zip321, memoBytes, inspectTx, isTxid, type TxView } from './zcash';
import { qr } from './qr';
import { darkPool, type Result } from './game';
import { label, type Ctx } from './levels-a';

// =====================================================================================
// NODE 05 · DARK POOL: shielding, as an arcade game
// =====================================================================================
export function playDarkPool(host: HTMLElement, seconds = 60): Promise<Result> {
  return new Promise((resolve) => {
    const box = h('section', { class: 'panel game-panel' }, label('Dark Pool · arcade'));
    host.append(box); scrollTo(box);
    darkPool(box, { seconds, onEnd: (r) => resolve(r) });
  });
}

export async function level5({ dialog, play }: Ctx): Promise<void> {
  await dialog.say([
    { who: 'zee', pose: 'point', text: 'ZEC that arrives on a <b>t1 address</b> sits in glass. Anyone can see it, and every move is traceable. <b>Shielding</b> moves it into the dark pool.' },
    { who: 'peep', pose: 'peer', text: 'My drones patrol the glass district. Carry coins out there and they’ll see you from further away. If one touches you, you’re <b>doxxed</b> and what you carry is lost.' },
    { who: 'zee', pose: 'shield', text: 'Grab ZEC, reach the <b>dark pool</b> on the right, and it’s shielded automatically. Inside the pool they can’t see you. 60 seconds, three lives.' },
  ], 'START GAME');

  dialog.el.classList.add('idle');
  let r = await playDarkPool(play);
  for (;;) {
    const again = h('div', { class: 'row-actions' });
    const stats = h('div', { class: 'game-over' },
      h('div', { class: 'go-score' }, h('span', {}, 'SHIELDED'), h('b', {}, `${r.shielded.toFixed(2)} ZEC`)),
      h('div', { class: 'go-score bad' }, h('span', {}, 'DOXXED'), h('b', {}, `${r.doxxed.toFixed(2)} ZEC`)),
      h('div', { class: 'go-score' }, h('span', {}, r.isBest ? 'NEW BEST' : 'BEST'), h('b', {}, `${r.best.toFixed(2)} ZEC`)), again);
    play.lastElementChild?.append(stats);
    stats.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    dialog.pose('peep', r.shielded > r.doxxed ? 'defeated' : 'read');
    const choice = await new Promise<'again' | 'go'>((res) => again.append(btn('PLAY AGAIN', () => res('again')), btn('CONTINUE ▸', () => res('go'), 'primary')));
    if (choice === 'go') { dialog.el.classList.remove('idle'); break; }
    play.lastElementChild?.remove();
    r = await playDarkPool(play);
  }

  await dialog.say([
    { who: 'peep', pose: 'fog', text: r.shielded > 0 ? `I logged every coin you picked up in the open, and lost every one you got into the pool. ${r.shielded.toFixed(2)} ZEC: gone dark.` : 'Nothing shielded? Then I can see all of it.' },
    { who: 'zee', pose: 'think', text: 'Same in real life: <b>shielding is visible on the way in</b>, because the coins come from a public address. After that your balance and payments are private.' },
    { who: 'zee', pose: 'shield', text: 'In Zodl it’s one tap: when transparent funds land, it shows a <b>Shield</b> button. Fee is about 0.00015 ZEC. Zodl then waits for <b>10 confirmations</b> (about 12 minutes today, faster after November’s planned upgrade).' },
    { who: 'zee', pose: 'point', text: 'The pool has a name: <b>Ironwood</b>. Since July 2026 it’s Zcash’s main shielded pool, replacing Orchard after a bug fix. Your address doesn’t change; the wallet handles it.' },
  ]);
  await quiz(play, [
    { q: 'You shield 0.05 ZEC from your t1 address. What can the Watcher still see?', options: ['Nothing at all', 'The t1 address and the amount going in', 'Who you pay next'], answer: 1, why: 'Shielding from a transparent address shows the source and amount. After that, your activity is private.' },
    { q: 'What is Zcash’s current main shielded pool called?', options: ['Orchard', 'Ironwood', 'Lighthouse'], answer: 1, why: 'Ironwood (NU6.3) went live on 28 July 2026. Orchard is now exit-only.' },
  ]);
}

// =====================================================================================
// NODE 06 · SEALED MAIL: shielded send + memo, and receiving
// =====================================================================================
export async function level6({ dialog, play }: Ctx): Promise<void> {
  const keeperAddr = fakeU();
  await dialog.say([
    { who: 'zee', pose: 'cheer', text: 'Inside the pool, payments are <b>sealed</b>. Pay the Keeper for the vault and attach a <b>memo</b>, an encrypted note only the recipient can open.' },
    { who: 'zee', pose: 'point', text: 'Type a memo and watch both screens: what the <b>Watcher</b> gets from the chain, and what the <b>Keeper</b> sees in his wallet.' },
  ], 'WRITE MEMO');

  const amt = h('input', { class: 'field', type: 'number', min: '0.0001', step: '0.0001', value: '0.001', 'aria-label': 'Amount in ZEC' });
  const memo = h('textarea', { class: 'field', rows: 3, maxlength: 512, placeholder: 'for the vault tour' }) as HTMLTextAreaElement;
  const bytes = h('small', { class: 'bytes' }, '0 / 512 BYTES');
  const cipher = h('code', { class: 'cipher mono' });
  const plain = h('p', { class: 'plain' });
  const plainAmt = h('b', {}, '0.001 ZEC');
  const update = () => {
    const n = memoBytes(memo.value);
    bytes.textContent = `${n} / 512 BYTES`; bytes.classList.toggle('over', n > 512);
    cipher.textContent = hex(180);
    plain.textContent = memo.value || '…';
    plainAmt.textContent = `${Number(amt.value || 0)} ZEC`;
  };
  memo.addEventListener('input', update); amt.addEventListener('input', update);
  const sendBtn = btn('SEND SHIELDED ▸', () => {}, 'primary');
  const sec = h('section', { class: 'panel' },
    label('01 · Compose'),
    h('div', { class: 'compose' },
      h('label', {}, 'TO', h('code', { class: 'mono field ro' }, short(keeperAddr) + ' (shielded)')),
      h('label', {}, 'AMOUNT (ZEC)', amt),
      h('label', { class: 'grow' }, 'MEMO (OPTIONAL, ENCRYPTED)', memo, bytes)),
    h('div', { class: 'split two' },
      h('div', { class: 'view public' }, h('h4', {}, 'PUBLIC CHAIN / WATCHER'),
        h('dl', {}, h('dt', {}, 'From'), h('dd', {}, '████████'), h('dt', {}, 'To'), h('dd', {}, '████████'), h('dt', {}, 'Amount'), h('dd', {}, '████'),
          h('dt', {}, 'Memo'), h('dd', {}, cipher), h('dt', {}, 'Fee'), h('dd', {}, '0.0001 ZEC (public)'))),
      h('div', { class: 'view private' }, h('h4', {}, 'KEEPER’S WALLET'),
        h('dl', {}, h('dt', {}, 'Received'), h('dd', {}, plainAmt), h('dt', {}, 'Memo'), h('dd', {}, plain)))),
    h('p', { class: 'fine' }, 'Every memo is padded to the same 512 bytes before it’s encrypted, so even its length stays secret.'),
    h('div', { class: 'row-actions' }, sendBtn));
  play.append(sec); scrollTo(sec); update();
  memo.focus({ preventScroll: true });

  await new Promise<void>((resolve) => sendBtn.addEventListener('click', () => {
    if (memoBytes(memo.value) > 512) { toast('Memos max out at 512 bytes.', 'bad'); return; }
    state.choices.memo = memo.value.slice(0, 80); save();
    sfx.whoosh(); sendBtn.disabled = true; sec.classList.add('sent'); resolve();
  }));
  dialog.pose('peep', 'fog');
  await sleep(600);
  await dialog.say([
    { who: 'moss', pose: 'smile', text: memo.value ? `Received. “${memo.value.slice(0, 80)}${memo.value.length > 80 ? '…' : ''}”. Only I can read that.` : 'Received. Next time attach a memo. Only I would be able to read it.' },
    { who: 'peep', pose: 'furious', text: 'Transaction exists. Fee: 0.0001. That’s the whole file?' },
    { who: 'zee', pose: 'point', text: '<b>Receiving</b> works the same way. In Zodl tap <b>Receive</b> and share your address or QR. Many wallets can also read a <b>payment link</b> with the amount and memo prefilled (ZIP-321). Build one.' },
  ], 'BUILD PAYMENT QR');

  const ex = fakeU() + 'example';
  const qrBox = h('div', { class: 'qr-card' });
  const uri = h('code', { class: 'mono uri' });
  const rAmt = h('input', { class: 'field', type: 'number', step: '0.001', value: '0.01', 'aria-label': 'Amount' });
  const rMemo = h('input', { class: 'field', value: 'invoice #0042', 'aria-label': 'Memo' });
  const redraw = () => { const u = zip321(ex, Number(rAmt.value), rMemo.value); uri.textContent = u; qrBox.replaceChildren(qr(u, 3), h('small', {}, 'EXAMPLE ONLY. THIS ADDRESS IS FAKE.')); };
  rAmt.addEventListener('input', redraw); rMemo.addEventListener('input', redraw);
  const recv = h('section', { class: 'panel' }, label('02 · Request payment'),
    h('div', { class: 'rec' }, h('div', { class: 'compose' }, h('label', {}, 'AMOUNT (ZEC)', rAmt), h('label', {}, 'MEMO', rMemo), uri), qrBox),
    h('p', { class: 'fine' }, 'Memos only travel to shielded addresses. A payment to a t1 address can’t carry one.'));
  play.append(recv); scrollTo(recv); redraw();
  const cont = h('div', { class: 'row-actions' });
  await new Promise<void>((r) => { cont.append(btn('CONTINUE ▸', r, 'primary')); recv.append(cont); });
  cont.remove();
  await quiz(play, [
    { q: 'How long can a Zcash memo be?', options: ['140 characters', 'Up to 512 bytes', 'Unlimited'], answer: 1, why: 'Up to 512 bytes, encrypted for the recipient only. Emoji take more than one byte.' },
    { q: 'You pay a friend shielded-to-shielded. What does the public see?', options: ['Your names', 'The amount', 'That it happened, and the fee'], answer: 2, why: 'Sender, receiver, amount and memo are all encrypted.' },
  ]);
}

// =====================================================================================
// NODE 07 · THE EXIT: unshielding without getting linked, and good habits
// =====================================================================================
export async function level7({ dialog, play }: Ctx): Promise<void> {
  const tAddr = fakeT(), exAddr = fakeT();
  await dialog.say([
    { who: 'zee', pose: 'think', text: 'Sometimes you have to leave the pool, for example to sell on an exchange. That’s <b>unshielding</b>: the amount and the destination address become public.' },
    { who: 'peep', pose: 'read', text: `And I keep records. 09:02 today: ${short(tAddr)} shielded <b>1.2345 ZEC</b>. Cash out. Let’s see if I can match you.` },
  ], 'PLAN EXIT');

  let amount: 'same' | 'diff' | null = null, when: 'now' | 'later' | null = null;
  const verdict = h('div', { class: 'verdict' });
  const mk = (text: string, onPick: () => void, group: HTMLElement) => {
    const b = h('button', { class: 'choice small', type: 'button' }, text);
    b.addEventListener('click', () => { sfx.pop(); group.querySelectorAll('.choice').forEach((x) => x.classList.remove('on')); b.classList.add('on'); onPick(); });
    return b;
  };
  const gA = h('div', { class: 'choice-row' }), gB = h('div', { class: 'choice-row' });
  gA.append(mk('1.2345 ZEC (all of it)', () => (amount = 'same'), gA), mk('0.8 ZEC, rest stays shielded', () => (amount = 'diff'), gA));
  gB.append(mk('Right now (09:15)', () => (when = 'now'), gB), mk('A few days later', () => (when = 'later'), gB));
  const goBtn = btn('UNSHIELD TO EXCHANGE ▸', () => {}, 'primary');
  const sec = h('section', { class: 'panel' }, label('01 · Beat the round-trip match'),
    h('p', { class: 'fine' }, `Destination: your exchange deposit address ${short(exAddr)} (transparent).`),
    h('h4', {}, 'AMOUNT'), gA, h('h4', {}, 'TIMING'), gB, h('div', { class: 'row-actions' }, goBtn), verdict);
  play.append(sec); scrollTo(sec);

  await new Promise<void>((resolve) => goBtn.addEventListener('click', () => {
    if (!amount || !when) { toast('Pick an amount and a time first.', 'info'); return; }
    sfx.whoosh();
    if (amount === 'same') {
      sfx.buzz(); dialog.pose('peep', 'read');
      verdict.className = 'verdict bad';
      verdict.innerHTML = `<b>MATCHED.</b> 1.2345 in, 1.2345 out${when === 'now' ? ' 13 minutes later' : ''}. Exact amounts are fingerprints. The Watcher links you to ${short(tAddr)}. Try again.`;
      state.choices.exit = 'linked';
    } else if (when === 'now') {
      sfx.buzz(); dialog.pose('peep', 'peer');
      verdict.className = 'verdict meh';
      verdict.innerHTML = '<b>SUSPICIOUS.</b> A shield and an unshield 13 minutes apart, with nothing in between. He can’t prove it, but he’s guessing. Give it time.';
    } else {
      sfx.fanfare(); dialog.pose('peep', 'defeated');
      verdict.className = 'verdict good';
      verdict.innerHTML = '<b>CLEAN EXIT.</b> A different amount, days later, with the rest still shielded. Nothing links it to the 09:02 shield.';
      state.choices.exit = 'clean'; save(); goBtn.disabled = true; resolve();
    }
  }));

  await dialog.say([
    { who: 'zee', pose: 'point', text: 'Heads-up: some exchanges, Binance for example, give you a <b>tex1…</b> deposit address. It only accepts coins from a transparent address. Zodl handles it by unshielding first, so that amount becomes public.' },
    { who: 'zee', pose: 'shield', text: 'Last part. Decrypt the six habits that actually keep you private.' },
  ], 'DECRYPT');
  const habits: [string, string][] = [
    ['STAY SHIELDED', 'Keep your balance in the shielded pool. Unshield only when you must.'],
    ['NO ROUND TRIPS', 'Don’t shield and then unshield the same amount soon after.'],
    ['FRESH ADDRESSES', 'One address per person or service. Zodl rotates them for you.'],
    ['WORDS STAY OFFLINE', 'Never type your 24 words into a website, chat or “support” form.'],
    ['VERIFY ADDRESSES', 'Copy-paste, then compare the first and last characters before you send.'],
    ['VIEWING KEYS', 'Need to show your history to an accountant? Share a viewing key. It can see, but it can’t spend.'],
  ];
  const deck = h('div', { class: 'habit-deck' });
  const hs = h('section', { class: 'panel' }, label('02 · Habits'), deck);
  play.append(hs); scrollTo(hs);
  let flipped = 0;
  await new Promise<void>((resolve) => {
    for (const [front, back] of habits) {
      const c = h('button', { class: 'habit', type: 'button' }, h('span', { class: 'front' }, `▓▓ ${front} ▓▓`), h('span', { class: 'back' }, h('b', {}, front), back));
      c.addEventListener('click', () => { if (c.classList.contains('flip')) return; c.classList.add('flip'); sfx.pop(); if (++flipped === habits.length) resolve(); });
      deck.append(c);
    }
  });
  await quiz(play, [
    { q: 'You shielded 2.5 ZEC this morning. Best way to cash out 1 ZEC?', options: ['Unshield 2.5 ZEC right now', 'Unshield 1 ZEC later and keep the rest shielded', 'Send it to a t1 address and back'], answer: 1, why: 'A different amount, with time in between, breaks the link. Keep the rest shielded.' },
  ]);
}

// =====================================================================================
// NODE 08 · INITIATION: the real transaction, then the Watcher inspects it
// =====================================================================================
export async function level8({ dialog, play }: Ctx): Promise<boolean> {
  await dialog.say([
    { who: 'zee', pose: 'cheer', text: 'Initiation. One <b>real</b> shielded transaction. Sending 0.001 ZEC (about $1.30) costs a fee of around 0.0001 ZEC, roughly 13 cents.' },
    { who: 'zee', pose: 'point', text: 'Tick each step as you go. When it’s done, paste the transaction ID and let the Watcher try to read it.' },
  ], 'SHOW CHECKLIST');

  const steps = [
    'Install <b>Zodl</b> (phone) or <b>Zingo!</b> (desktop) from the official site.',
    'Write your <b>24 words</b> and <b>birthday height</b> on paper.',
    'Get a little ZEC: <b>Swap</b> in Zodl, or withdraw from an exchange to your <b>t1</b> address. 0.01 ZEC (~$13) is plenty.',
    'If it landed on t1, tap <b>Shield</b>, then wait for <b>10 confirmations</b>.',
    'Send <b>0.001 ZEC</b> to a shielded address (your own fresh one, or a friend’s) <b>with a memo</b>.',
  ];
  const list = h('ol', { class: 'checklist' });
  steps.forEach((s, i) => {
    const cb = h('input', { type: 'checkbox', id: `ck${i}` }) as HTMLInputElement;
    cb.checked = !!state.checklist[i];
    cb.addEventListener('change', () => { state.checklist[i] = cb.checked; save(); if (cb.checked) sfx.ding(); });
    list.append(h('li', {}, cb, h('label', { for: `ck${i}`, html: s })));
  });

  const myAddr = h('input', { class: 'field mono', placeholder: 'paste your own shielded address (Zodl → Receive)', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Your shielded address' });
  const myMemo = h('input', { class: 'field', value: 'initiated via glasstown', 'aria-label': 'Memo' });
  const helperOut = h('div', { class: 'helper-out' });
  const redraw = () => {
    const info = classify(myAddr.value);
    if (!myAddr.value.trim()) { helperOut.replaceChildren(); return; }
    if (!info.valid || !info.shielded) { helperOut.replaceChildren(h('p', { class: 'warn-line' }, info.valid ? `That’s a ${info.label}. Use a shielded u1… or zs1… address so it stays private and can carry a memo.` : info.note)); return; }
    const u = zip321(myAddr.value, 0.001, myMemo.value);
    helperOut.replaceChildren(h('div', { class: 'rec' }, h('div', {}, h('p', {}, '✓ Shielded address. Scan with Zodl, or open this on your phone:'), h('a', { class: 'mono uri', href: u }, u)), h('div', { class: 'qr-card' }, qr(u, 3))));
  };
  myAddr.addEventListener('input', redraw); myMemo.addEventListener('input', redraw);

  const sec = h('section', { class: 'panel' }, label('01 · Mission'), list,
    h('details', { class: 'helper' }, h('summary', {}, 'OPTIONAL: build a payment QR for step 5 (send to yourself)'),
      h('p', { class: 'fine' }, 'Zodl gives you a fresh address every time you open Receive, so sending to your own new address works. Everything here stays in your browser.'),
      myAddr, myMemo, helperOut));
  play.append(sec); scrollTo(sec);

  const tx = h('input', { class: 'field mono', placeholder: 'transaction ID (64 hex characters)', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Transaction ID' });
  const result = h('div', { class: 'inspect-out' });
  const inspectBtn = btn('LET THE WATCHER INSPECT ▸', () => {}, 'primary');
  const selfBtn = btn('SKIP CHECK, I DID IT', () => {}, 'ghost');
  const ins = h('section', { class: 'panel inspect' }, label('02 · Show the Watcher'),
    h('div', { class: 'inspect-intro' }, portraitEl('peep', 'peer', 2),
      h('p', { class: 'fine' }, 'In Zodl, open the transaction and copy its ID. This step is optional: your browser asks Blockchair, a public block explorer, about this one ID, so Blockchair learns that someone looked it up. Nothing is sent to us.')),
    tx, h('div', { class: 'row-actions' }, inspectBtn, selfBtn), result);
  play.append(ins);

  return new Promise<boolean>((resolve) => {
    selfBtn.addEventListener('click', () => { sfx.pop(); state.verified = state.verified ?? 'self'; save(); resolve(false); });
    inspectBtn.addEventListener('click', async () => {
      const id = tx.value.trim();
      if (!isTxid(id)) { toast('A transaction ID is 64 characters, 0–9 and a–f.', 'bad'); return; }
      inspectBtn.disabled = true; result.replaceChildren(h('p', { class: 'scanning' }, 'SCANNING CHAIN…'));
      dialog.pose('peep', 'peer');
      try {
        const v = await inspectTx(id);
        inspectBtn.disabled = false;
        if (v === 'not-found') { result.replaceChildren(h('p', { class: 'warn-line' }, 'Not on the explorer yet. New transactions can take a minute or two to show up. Try again shortly.')); dialog.pose('peep', 'read'); return; }
        result.replaceChildren(renderInspect(v));
        if (v.kind === 'fully-shielded') {
          sfx.fanfare(); dialog.pose('peep', 'defeated'); state.verified = 'shielded'; save();
          await dialog.say([
            { who: 'peep', pose: 'defeated', text: 'It exists. There’s a fee. Some shielded actions. Who, how much, what the memo says: nothing. File closed.' },
            { who: 'zee', pose: 'cheer', text: '<b>Fully shielded. Initiation complete.</b> Your identity is ready.' },
          ], 'RENDER IDENTITY');
          resolve(true);
        } else if (v.kind === 'shielding') {
          sfx.ding(); dialog.pose('peep', 'read');
          await dialog.say([{ who: 'zee', pose: 'point', text: 'That one is a <b>shield</b> (t → z): step 4 is done. The Watcher saw the amount go in. Now send 0.001 ZEC inside the pool (step 5) and paste that ID.' }], 'OK');
        } else {
          sfx.buzz(); dialog.pose('peep', 'read');
          await dialog.say([{ who: 'peep', pose: 'read', text: v.kind === 'transparent' ? 'All glass. I can read every field. Try a shielded send from Zodl.' : 'Part of that one is public: a t-address is involved. Send shielded to shielded and try again.' }], 'OK');
        }
      } catch {
        inspectBtn.disabled = false;
        result.replaceChildren(h('p', { class: 'warn-line' }, 'Couldn’t reach the explorer just now. Try again, or use “Skip check”.'));
      }
    });
  });
}

function renderInspect(v: TxView): HTMLElement {
  const rows: [string, string, boolean][] = [
    ['Block', v.height ? `#${v.height.toLocaleString()}` : 'waiting for a block', true],
    ['Fee', v.fee != null ? `${v.fee} ZEC` : '—', true],
    ['Transparent in / out', `${v.tIn} / ${v.tOut}`, true],
    ['Shielded actions', [v.ironwood && `${v.ironwood} Ironwood`, v.orchard && `${v.orchard} Orchard`, v.sapling && `${v.sapling} Sapling`].filter(Boolean).join(' · ') || 'none', true],
    ['Sender', v.tIn ? 'public t-address' : '████████', !v.tIn],
    ['Receiver', v.tOut ? 'public t-address' : '████████', !v.tOut],
    ['Amount', v.publicAmount != null ? `${v.publicAmount} ZEC (public)` : '████', v.publicAmount == null],
    ['Memo', '████ (encrypted)', true],
  ];
  const title = { 'fully-shielded': '✓ FULLY SHIELDED', shielding: 'SHIELD (t → z)', unshielding: 'UNSHIELD (z → t)', transparent: 'TRANSPARENT', mixed: 'PARTLY PUBLIC' }[v.kind];
  return h('div', { class: `inspect-card ${v.kind}` }, h('h4', {}, title),
    h('dl', {}, ...rows.flatMap(([k, val, hidden]) => [h('dt', {}, k), h('dd', { class: hidden && val.includes('█') ? 'redact' : '' }, val)])));
}

