import { h, btn, sfx, sleep, quiz, toast, scrollTo, fakeT, fakeU, short, hex, reduced } from './ui';
import { state, save } from './state';
import { classify, zip321, memoBytes, inspectTx, isTxid, type TxView } from './zcash';
import { qr } from './qr';
import type { Ctx } from './levels-a';

// =====================================================================================
// LEVEL 5 · THE SHIELD: t → z into the Ironwood pool
// =====================================================================================
export async function level5({ dialog, play }: Ctx): Promise<void> {
  const tAddr = fakeT();
  await dialog.say([
    { who: 'zee', pose: 'point', text: 'Say your ZEC just arrived on your <b>t1 address</b> from an exchange. It’s sitting in a glass jar. Peep can see every coin.' },
    { who: 'peep', pose: 'read', text: `Mm-hm. ${short(tAddr)}: 0.05 ZEC. Noted.` },
    { who: 'zee', pose: 'shield', text: 'Let’s <b>shield</b> it: move it from the glass jar into the fog. Tap the coins, or hit <b>Shield all</b>, just like the Shield button in Zodl.' },
  ], 'Let’s shield');

  const log = h('ol', { class: 'peeplog' });
  const jar = h('div', { class: 'jar' });
  const pool = h('div', { class: 'pool' }, h('span', { class: 'pool-label' }, '🌫 Ironwood shielded pool'));
  const confirms = h('div', { class: 'confirms', hidden: true });
  const sec = h('section', { class: 'panel shield-stage' },
    h('div', { class: 'shield-row' },
      h('div', { class: 'jar-wrap' }, h('span', { class: 'chip glass-chip' }, `🔍 ${short(tAddr)}`), jar),
      h('div', { class: 'arrow' }, '→'),
      pool),
    confirms,
    h('div', { class: 'peep-sees' }, h('img', { src: '/chars/peep/read.webp', alt: '' }), h('div', {}, h('b', {}, 'Peep’s notebook'), log)));
  play.append(sec); scrollTo(sec);

  const coins: HTMLButtonElement[] = [];
  let shielded = 0;
  const allIn = new Promise<void>((resolve) => {
    const send = (c: HTMLButtonElement) => {
      if (c.classList.contains('gone')) return;
      c.classList.add('gone'); sfx.whoosh(); shielded++;
      const ghost = h('span', { class: 'coin in-pool' }); pool.append(ghost);
      if (shielded === 1) log.append(h('li', {}, `${short(tAddr)} → shielded pool · amount visible as it goes in`));
      if (shielded === coins.length) {
        log.append(h('li', {}, 'Total shielded: 0.05 ZEC (public, because it came from a t-address)'));
        log.append(h('li', { class: 'redact' }, 'Where it goes next: ████████'));
        allBtn.remove(); resolve();
      }
    };
    for (let i = 0; i < 5; i++) {
      const c = h('button', { class: 'coin', type: 'button', 'aria-label': 'Shield 0.01 ZEC' }, 'Z');
      c.addEventListener('click', () => send(c)); coins.push(c); jar.append(c);
    }
    var allBtn = btn('🛡 Shield all', async () => { for (const c of coins) { send(c); await sleep(reduced() ? 0 : 160); } }, 'primary');
    sec.append(h('div', { class: 'row-actions' }, allBtn));
  });
  await allIn;
  dialog.pose('peep', 'fog');

  confirms.hidden = false;
  const bar = h('div', { class: 'bar' }, h('i', {}));
  const label = h('span', {}, 'Confirmations: 0 / 10');
  confirms.append(label, bar, h('small', {}, 'Zodl waits for 10 confirmations before incoming funds are spendable: about 12 minutes today, faster after November’s planned upgrade. We fast-forwarded. Fee ≈ 0.00015 ZEC.'));
  for (let i = 1; i <= 10; i++) { await sleep(reduced() ? 0 : 260); label.textContent = `Confirmations: ${i} / 10`; (bar.firstChild as HTMLElement).style.width = `${i * 10}%`; sfx.tick(); }
  sfx.ding();

  await dialog.say([
    { who: 'peep', pose: 'fog', text: 'I saw <b>0.05 ZEC go in</b>, from that t1 address. But inside the fog? Where it goes, who gets it, what’s left… nothing.' },
    { who: 'zee', pose: 'think', text: 'Right: <b>shielding is visible on the way in</b>, because the coins came from a public address. Everything after that is private.' },
    { who: 'zee', pose: 'shield', text: 'Fun fact: since July 2026 Zcash’s main shielded pool is called <b>Ironwood</b>. It replaced the old Orchard pool after a bug fix. Your address stays the same; Zodl handles it.' },
  ]);
  await quiz(play, [
    { q: 'You shield 0.05 ZEC from your t1 address. What can Peep still see?', options: ['Nothing at all', 'The t1 address and the amount going in', 'Who you pay next'], answer: 1, why: 'Shielding from a transparent address shows the source and amount. After that, your spending is private.' },
    { q: 'What is Zcash’s current main shielded pool called?', options: ['Orchard', 'Ironwood', 'Lighthouse'], answer: 1, why: 'Ironwood (NU6.3) went live on 28 July 2026. Orchard is now exit-only.' },
  ]);
}

// =====================================================================================
// LEVEL 6 · MOTH MAIL: shielded send + memo, and receiving
// =====================================================================================
export async function level6({ dialog, play }: Ctx): Promise<void> {
  const mossAddr = fakeU();
  await dialog.say([
    { who: 'zee', pose: 'cheer', text: 'Now the fun part: <b>sending inside the fog</b>. Pay Moss back for the vault tour, and leave a note in the <b>memo</b>.' },
    { who: 'zee', pose: 'point', text: 'Type a memo and watch both screens: what <b>Peep</b> sees on the public chain, and what <b>Moss</b> sees in his wallet.' },
  ], 'Write a memo');

  const amt = h('input', { class: 'field', type: 'number', min: '0.0001', step: '0.0001', value: '0.001', 'aria-label': 'Amount in ZEC' });
  const memo = h('textarea', { class: 'field', rows: 3, maxlength: 512, placeholder: 'Thanks for the vault tour! 🦓' }) as HTMLTextAreaElement;
  const bytes = h('small', { class: 'bytes' }, '0 / 512 bytes');
  const cipher = h('code', { class: 'cipher mono' });
  const plain = h('p', { class: 'plain' });
  const plainAmt = h('b', {}, '0.001 ZEC');
  const update = () => {
    const n = memoBytes(memo.value);
    bytes.textContent = `${n} / 512 bytes`; bytes.classList.toggle('over', n > 512);
    cipher.textContent = hex(180);
    plain.textContent = memo.value || '…';
    plainAmt.textContent = `${Number(amt.value || 0)} ZEC`;
  };
  memo.addEventListener('input', update); amt.addEventListener('input', update);
  const sendBtn = btn('📨 Send shielded', () => {}, 'primary');
  const sec = h('section', { class: 'panel' },
    h('h3', {}, 'Send to Moss'),
    h('div', { class: 'compose' },
      h('label', {}, 'To', h('code', { class: 'mono field ro' }, short(mossAddr) + ' (shielded)')),
      h('label', {}, 'Amount (ZEC)', amt),
      h('label', { class: 'grow' }, 'Memo (optional, encrypted)', memo, bytes)),
    h('div', { class: 'split two' },
      h('div', { class: 'view public' }, h('h4', {}, '🔍 Public chain (Peep)'),
        h('dl', {}, h('dt', {}, 'From'), h('dd', {}, '████████'), h('dt', {}, 'To'), h('dd', {}, '████████'), h('dt', {}, 'Amount'), h('dd', {}, '████'),
          h('dt', {}, 'Memo'), h('dd', {}, cipher), h('dt', {}, 'Fee'), h('dd', {}, '0.0001 ZEC (public)'))),
      h('div', { class: 'view private' }, h('h4', {}, '🔑 Moss’s wallet'),
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
    { who: 'moss', pose: 'smile', text: memo.value ? `Got it. “${memo.value.slice(0, 80)}${memo.value.length > 80 ? '…' : ''}” Lovely. Only I can read that.` : 'Got it, thank you! (Next time leave a memo. Only I could read it.)' },
    { who: 'peep', pose: 'furious', text: 'A transaction happened. Fee: 0.0001. That’s all I get?!' },
    { who: 'zee', pose: 'point', text: '<b>Receiving</b> is just as easy: in Zodl tap <b>Receive</b> and share your address or QR code. Some apps make a <b>payment link</b> with the amount and memo filled in (ZIP-321). Try one.' },
  ], 'Make a payment QR');

  const ex = fakeU() + 'example';
  const qrBox = h('div', { class: 'qr-card' });
  const uri = h('code', { class: 'mono uri' });
  const rAmt = h('input', { class: 'field', type: 'number', step: '0.001', value: '0.01', 'aria-label': 'Amount' });
  const rMemo = h('input', { class: 'field', value: 'pizza night 🍕', 'aria-label': 'Memo' });
  const redraw = () => { const u = zip321(ex, Number(rAmt.value), rMemo.value); uri.textContent = u; qrBox.replaceChildren(qr(u, 3), h('small', {}, 'Example only. This address is fake.')); };
  rAmt.addEventListener('input', redraw); rMemo.addEventListener('input', redraw);
  const recv = h('section', { class: 'panel' }, h('h3', {}, 'Ask to be paid'),
    h('div', { class: 'rec' }, h('div', { class: 'compose' }, h('label', {}, 'Amount (ZEC)', rAmt), h('label', {}, 'Memo', rMemo), uri), qrBox),
    h('p', { class: 'fine' }, 'Memos only work with shielded addresses. Sending to a t1 address can’t carry one.'));
  play.append(recv); scrollTo(recv); redraw();
  const cont = h('div', { class: 'row-actions' });
  await new Promise<void>((r) => { cont.append(btn('Continue →', r, 'primary')); recv.append(cont); });
  cont.remove();
  await quiz(play, [
    { q: 'How long can a Zcash memo be?', options: ['140 characters', 'Up to 512 bytes', 'Unlimited'], answer: 1, why: 'Up to 512 bytes, encrypted so only the recipient can read it. Emoji use more than one byte.' },
    { q: 'You pay a friend shielded-to-shielded. What does the public see?', options: ['Your names', 'The amount', 'Only that a transaction happened, and the fee'], answer: 2, why: 'Sender, receiver, amount and memo are all encrypted.' },
  ]);
}

// =====================================================================================
// LEVEL 7 · THE EXIT: unshielding without getting linked, and good habits
// =====================================================================================
export async function level7({ dialog, play }: Ctx): Promise<void> {
  const tAddr = fakeT(), exAddr = fakeT();
  await dialog.say([
    { who: 'zee', pose: 'think', text: 'Sometimes you need to leave the fog, for example to sell on an exchange. That’s <b>unshielding</b>: the amount and the destination address become public.' },
    { who: 'peep', pose: 'read', text: `And I remember things. This morning, 09:02: ${short(tAddr)} shielded <b>1.2345 ZEC</b>. Let’s see you cash out without me matching it.` },
  ], 'Plan my exit');

  let amount: 'same' | 'diff' | null = null, when: 'now' | 'later' | null = null;
  const verdict = h('div', { class: 'verdict' });
  const mk = (label: string, onPick: () => void, group: HTMLElement) => {
    const b = h('button', { class: 'choice small', type: 'button' }, label);
    b.addEventListener('click', () => { sfx.pop(); group.querySelectorAll('.choice').forEach((x) => x.classList.remove('on')); b.classList.add('on'); onPick(); });
    return b;
  };
  const gA = h('div', { class: 'choice-row' }), gB = h('div', { class: 'choice-row' });
  gA.append(mk('Unshield 1.2345 ZEC (all of it)', () => (amount = 'same'), gA), mk('Unshield 0.8 ZEC, keep the rest shielded', () => (amount = 'diff'), gA));
  gB.append(mk('Right now (09:15)', () => (when = 'now'), gB), mk('A few days later', () => (when = 'later'), gB));
  const goBtn = btn('🚪 Unshield to exchange', () => {}, 'primary');
  const sec = h('section', { class: 'panel' }, h('h3', {}, 'Beat Peep’s round-trip trap'),
    h('p', { class: 'fine' }, `Destination: your exchange deposit address ${short(exAddr)} (transparent).`),
    h('h4', {}, 'How much?'), gA, h('h4', {}, 'When?'), gB, h('div', { class: 'row-actions' }, goBtn), verdict);
  play.append(sec); scrollTo(sec);

  await new Promise<void>((resolve) => goBtn.addEventListener('click', async () => {
    if (!amount || !when) { toast('Pick an amount and a time first.', 'info'); return; }
    sfx.whoosh();
    if (amount === 'same') {
      sfx.buzz(); dialog.pose('peep', 'read');
      verdict.className = 'verdict bad';
      verdict.innerHTML = `<b>MATCHED.</b> 1.2345 in, 1.2345 out${when === 'now' ? ' 13 minutes later' : ''}. Exact amounts are like fingerprints. Peep links you to ${short(tAddr)}. Try again.`;
      state.choices.exit = 'linked';
    } else if (when === 'now') {
      sfx.buzz(); dialog.pose('peep', 'peer');
      verdict.className = 'verdict meh';
      verdict.innerHTML = '<b>Suspicious…</b> A shield and an unshield 13 minutes apart, with nothing else in between? Peep can’t prove it, but he’s guessing. Give it time.';
    } else {
      sfx.fanfare(); dialog.pose('peep', 'defeated');
      verdict.className = 'verdict good';
      verdict.innerHTML = '<b>Clean exit.</b> A different amount, days later, while the rest stays shielded. Peep can’t link it to your morning shield.';
      state.choices.exit = 'clean'; save(); goBtn.disabled = true; resolve();
    }
  }));

  await dialog.say([
    { who: 'zee', pose: 'point', text: 'Heads up: some exchanges, like Binance, give you a <b>tex1…</b> deposit address. It only accepts coins that come from a transparent address. Zodl handles it by unshielding first, so remember that the amount becomes public.' },
    { who: 'zee', pose: 'shield', text: 'Last stop: flip the cards. These habits are what keep you private for real.' },
  ], 'Flip the cards');
  const habits: [string, string][] = [
    ['🌫 Stay shielded', 'Keep your balance in the shielded pool. Only unshield when you must.'],
    ['🔁 No round trips', 'Don’t shield and then unshield the same amount soon after.'],
    ['✨ Fresh addresses', 'Give each person or service its own address. Zodl rotates them for you.'],
    ['🗝 Words stay offline', 'Never type your 24 words into a website, chat or “support” form.'],
    ['👀 Check addresses', 'Copy-paste, then compare the first and last characters before you send.'],
    ['🔍 Viewing keys', 'Need to show your history to an accountant? Share a viewing key. It can see, but it can’t spend.'],
  ];
  const deck = h('div', { class: 'habit-deck' });
  const hs = h('section', { class: 'panel' }, h('h3', {}, 'Habits that keep you private'), deck);
  play.append(hs); scrollTo(hs);
  let flipped = 0;
  await new Promise<void>((resolve) => {
    for (const [front, back] of habits) {
      const c = h('button', { class: 'habit', type: 'button' }, h('span', { class: 'front' }, front), h('span', { class: 'back' }, back));
      c.addEventListener('click', () => { if (c.classList.contains('flip')) return; c.classList.add('flip'); sfx.pop(); if (++flipped === habits.length) resolve(); });
      deck.append(c);
    }
  });
  await quiz(play, [
    { q: 'You shielded 2.5 ZEC this morning. Best way to cash out 1 ZEC?', options: ['Unshield 2.5 ZEC right now', 'Unshield 1 ZEC later and keep the rest shielded', 'Send it to a t1 address and back'], answer: 1, why: 'Different amounts and some time between them break the link. Keep the rest in the fog.' },
  ]);
}

// =====================================================================================
// LEVEL 8 · YOUR FIRST SHIELD: the real transaction, then Peep inspects it
// =====================================================================================
export async function level8({ dialog, play }: Ctx): Promise<boolean> {
  await dialog.say([
    { who: 'zee', pose: 'cheer', text: 'Graduation! Time for a <b>real</b> shielded transaction. Sending 0.001 ZEC (about $1.30) costs a fee of around 0.0001 ZEC, roughly 13 cents.' },
    { who: 'zee', pose: 'point', text: 'Tick each step as you do it. When you’re done, paste the transaction ID and Peep will try to read it.' },
  ], 'Show the checklist');

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

  // ZIP-321 helper for the self-send
  const myAddr = h('input', { class: 'field mono', placeholder: 'Paste your own shielded address (Zodl → Receive)', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Your shielded address' });
  const myMemo = h('input', { class: 'field', value: 'my first shielded tx 🦓 via Glasstown', 'aria-label': 'Memo' });
  const helperOut = h('div', { class: 'helper-out' });
  const redraw = () => {
    const info = classify(myAddr.value);
    if (!myAddr.value.trim()) { helperOut.replaceChildren(); return; }
    if (!info.valid || !info.shielded) { helperOut.replaceChildren(h('p', { class: 'warn-line' }, info.valid ? `That’s a ${info.label}. Use a shielded u1… or zs1… address so it stays private and can carry a memo.` : info.note)); return; }
    const u = zip321(myAddr.value, 0.001, myMemo.value);
    helperOut.replaceChildren(h('div', { class: 'rec' }, h('div', {}, h('p', {}, '✓ Shielded address. Scan this with Zodl, or open it on your phone:'), h('a', { class: 'mono uri', href: u }, u)), h('div', { class: 'qr-card' }, qr(u, 3))));
  };
  myAddr.addEventListener('input', redraw); myMemo.addEventListener('input', redraw);

  const sec = h('section', { class: 'panel' }, h('h3', {}, 'Your mission'), list,
    h('details', { class: 'helper' }, h('summary', {}, 'Optional: make a payment QR for step 5 (send to yourself)'),
      h('p', { class: 'fine' }, 'Zodl gives you a fresh address every time you open Receive, so sending to your own new address works fine. Everything here stays in your browser.'),
      myAddr, myMemo, helperOut));
  play.append(sec); scrollTo(sec);

  // Peep inspects
  const tx = h('input', { class: 'field mono', placeholder: 'Transaction ID (64 characters)', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Transaction ID' });
  const result = h('div', { class: 'inspect-out' });
  const inspectBtn = btn('🔍 Let Peep inspect it', () => {}, 'primary');
  const selfBtn = btn('Skip the check, I did it', () => {}, 'ghost');
  const ins = h('section', { class: 'panel inspect' }, h('h3', {}, 'Show Peep your transaction'),
    h('p', { class: 'fine' }, 'In Zodl, open the transaction and copy its ID. This step is optional: your browser asks Blockchair, a public block explorer, about this ID, so Blockchair learns that someone looked it up. Nothing is sent to us. Skip it if you’d rather not.'),
    tx, h('div', { class: 'row-actions' }, inspectBtn, selfBtn), result);
  play.append(ins);

  return new Promise<boolean>((resolve) => {
    selfBtn.addEventListener('click', () => { sfx.pop(); state.verified = state.verified ?? 'self'; save(); resolve(false); });
    inspectBtn.addEventListener('click', async () => {
      const id = tx.value.trim();
      if (!isTxid(id)) { toast('A transaction ID is 64 letters and numbers (0–9, a–f).', 'bad'); return; }
      inspectBtn.disabled = true; result.replaceChildren(h('p', { class: 'scanning' }, 'Peep is squinting at the chain…'));
      dialog.pose('peep', 'peer');
      try {
        const v = await inspectTx(id);
        inspectBtn.disabled = false;
        if (v === 'not-found') { result.replaceChildren(h('p', { class: 'warn-line' }, 'Peep can’t find it yet. New transactions can take a minute or two to reach the explorer. Try again shortly.')); dialog.pose('peep', 'read'); return; }
        result.replaceChildren(renderInspect(v));
        if (v.kind === 'fully-shielded') {
          sfx.fanfare(); dialog.pose('peep', 'defeated'); state.verified = 'shielded'; save();
          await dialog.say([
            { who: 'peep', pose: 'defeated', text: 'I… I can see it exists. The fee. Some shielded actions. Who, how much, what the memo says? Nothing. You’re a ghost.' },
            { who: 'zee', pose: 'cheer', text: '🎉 <b>That’s a fully shielded transaction.</b> Welcome to the fog!' },
          ], 'Get my card');
          resolve(true);
        } else if (v.kind === 'shielding') {
          sfx.ding(); dialog.pose('peep', 'read');
          await dialog.say([{ who: 'zee', pose: 'point', text: 'That’s a <b>shield</b> (t → z). Nice, step 4 done! Peep saw the amount go in. Now send 0.001 ZEC inside the fog (step 5) and paste that one.' }], 'OK');
        } else {
          sfx.buzz(); dialog.pose('peep', 'read');
          await dialog.say([{ who: 'peep', pose: 'read', text: v.kind === 'transparent' ? 'All glass! I can read every detail of that one. Try a shielded send from Zodl.' : 'Part of that one is public: a t-address is involved. Send shielded to shielded and try again.' }], 'OK');
        }
      } catch {
        inspectBtn.disabled = false;
        result.replaceChildren(h('p', { class: 'warn-line' }, 'Couldn’t reach the explorer just now. Try again, or use “Skip the check”.'));
      }
    });
  });
}

function renderInspect(v: TxView): HTMLElement {
  const rows: [string, string, boolean][] = [
    ['Block', v.height ? `#${v.height.toLocaleString()}` : 'waiting for a block', true],
    ['Fee', v.fee != null ? `${v.fee} ZEC` : '—', true],
    ['Transparent inputs / outputs', `${v.tIn} / ${v.tOut}`, true],
    ['Shielded actions', [v.ironwood && `${v.ironwood} Ironwood`, v.orchard && `${v.orchard} Orchard`, v.sapling && `${v.sapling} Sapling`].filter(Boolean).join(' · ') || 'none', true],
    ['Sender', v.tIn ? 'public t-address' : '████████', !v.tIn],
    ['Receiver', v.tOut ? 'public t-address' : '████████', !v.tOut],
    ['Amount', v.publicAmount != null ? `${v.publicAmount} ZEC (public)` : '████', v.publicAmount == null],
    ['Memo', '████ (encrypted)', true],
  ];
  const title = { 'fully-shielded': '✓ Fully shielded', shielding: 'Shield (t → z)', unshielding: 'Unshield (z → t)', transparent: 'Transparent', mixed: 'Partly public' }[v.kind];
  return h('div', { class: `inspect-card ${v.kind}` }, h('h4', {}, title),
    h('dl', {}, ...rows.flatMap(([k, val, hidden]) => [h('dt', {}, k), h('dd', { class: hidden && val.includes('█') ? 'redact' : '' }, val)])));
}
