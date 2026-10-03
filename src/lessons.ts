import { h, btn, sfx, toast, fakeT, fakeU, short, hex } from './ui';
import { state, save } from './state';
import { inspectTx, isTxid, memoBytes, type TxView } from './zcash';
import { qr } from './qr';
import { darkPool } from './game';
import { choices, type LessonDef } from './lesson';

// ---------- small visual helpers ----------
const wallet = (kind: 'glass' | 'dark', rows: [string, string][]) =>
  h('div', { class: `wallet ${kind}` },
    h('div', { class: 'wallet-head' }, kind === 'glass' ? 'PUBLIC WALLET · anyone can look' : 'PRIVATE WALLET · only you can look'),
    ...rows.map(([k, v]) => h('div', { class: 'wallet-row' }, h('span', {}, k), h('b', {}, kind === 'dark' ? '████████' : v))));
const note = (html: string, cls = '') => h('p', { class: `note ${cls}`, html });

// =====================================================================================
export const LESSONS: LessonDef[] = [
  // ---------------------------------------------------------------- 1 · WHY PRIVACY
  {
    n: 1, title: 'Why privacy', blurb: 'See what a public wallet gives away.',
    steps: [
      { who: 'zee', pose: 'wave', text: 'Hi, I’m <b>Zero</b>. In 7 short levels you’ll learn to use Zcash privately. You don’t need to know anything yet.' },
      { who: 'zee', pose: 'point', text: 'Most crypto wallets are like <b>glass</b>: anyone can look inside and see every payment.',
        widget: ({ area }) => area.append(wallet('glass', [['Balance', '3.20 ZEC'], ['Paid', 'Bean There Café'], ['Received', 'ACME Corp salary']])) },
      { who: 'peep', pose: 'peer', text: 'I’m the <b>Watcher</b>. I look into glass wallets. Tap each payment and see what I learn about its owner.', wait: true,
        widget: ({ area, done, say }) => {
          const rows: [string, string, string][] = [
            ['Bean There Café', '−0.004 ZEC', 'Buys coffee there every morning'],
            ['ACME Corp', '+2.10 ZEC', 'Works at ACME. Salary: 2.1 ZEC'],
            ['Oak St Rentals', '−1.20 ZEC', 'Lives on Oak Street'],
            ['CoinMart exchange', '+0.50 ZEC', 'Real name: Alex Rivera'],
          ];
          let seen = 0;
          const list = h('div', { class: 'pay-list' });
          for (const [who, amt, fact] of rows) {
            const factEl = h('span', { class: 'pay-fact' }, 'Tap to look');
            const b = h('button', { class: 'pay', type: 'button' }, h('span', { class: 'pay-who' }, who), h('span', { class: 'pay-amt' }, amt), factEl);
            b.addEventListener('click', () => {
              if (b.classList.contains('seen')) return;
              b.classList.add('seen'); factEl.textContent = `Watcher learns: ${fact}`; sfx.ding();
              if (++seen === rows.length) { say('peep', 'read', 'Job, salary, home and real name, from <b>one wallet</b>. Easy, because it’s glass.'); done(); }
            });
            list.append(b);
          }
          area.append(list);
        } },
      { who: 'zee', pose: 'shield', text: 'Zcash can make a wallet <b>private</b>. We call that <b>shielded</b>. Now the same payments are hidden. Try tapping them.', wait: true,
        widget: ({ area, done, say }) => {
          let taps = 0;
          const list = h('div', { class: 'pay-list dark' });
          for (let i = 0; i < 4; i++) {
            const factEl = h('span', { class: 'pay-fact' }, 'Tap to look');
            const b = h('button', { class: 'pay', type: 'button' }, h('span', { class: 'pay-who' }, '██████████'), h('span', { class: 'pay-amt' }, '████ ZEC'), factEl);
            b.addEventListener('click', () => {
              if (b.classList.contains('seen')) return;
              b.classList.add('seen'); factEl.textContent = 'Hidden. Nothing to learn.'; sfx.buzz();
              if (++taps === 2) { say('peep', 'furious', 'I can’t see <b>who</b>, <b>how much</b>, or <b>what for</b>. Nothing!'); done(); }
            });
            list.append(b);
          }
          area.append(list);
        } },
      { who: 'zee', pose: 'cheer', text: 'That’s the whole idea. <b>Transparent</b> = public, like glass. <b>Shielded</b> = private. Let’s get you a private wallet.',
        widget: ({ area }) => area.append(h('div', { class: 'compare' }, wallet('glass', [['Who', 'Alex Rivera'], ['Amount', '1.20 ZEC'], ['To', 'Oak St Rentals']]), wallet('dark', [['Who', ''], ['Amount', ''], ['To', '']]))) },
    ],
    quiz: { q: 'What does “shielded” mean in Zcash?', options: ['Private: only you can see it', 'Public: anyone can see it', 'Deleted'], answer: 0, why: 'Shielded money is private. Transparent money is public.' },
    learned: ['Most crypto is <b>public</b>, like glass.', 'Zcash can make money <b>private</b>. That’s called <b>shielded</b>.'],
  },

  // ---------------------------------------------------------------- 2 · GET A WALLET
  {
    n: 2, title: 'Get a wallet', blurb: 'Pick an app and protect your 24 words.',
    steps: [
      { who: 'moss', pose: 'key', text: 'I’m the <b>Keeper</b>. First you need a wallet app that can keep money private. What do you use?', wait: true,
        widget: ({ area, done }) => {
          const out = h('div', { class: 'app-out' });
          area.append(choices(['iPhone', 'Android', 'Computer'], (i, b) => {
            b.parentElement!.querySelectorAll('.choice').forEach((x) => x.classList.remove('on')); b.classList.add('on');
            state.choices.device = (['ios', 'android', 'desktop'] as const)[i]; save();
            const desktop = i === 2;
            out.replaceChildren(h('div', { class: 'app-card' },
              h('div', {},
                h('div', { class: 'app-name' }, desktop ? 'Zingo!' : 'Zodl'),
                h('p', {}, desktop ? 'A free Zcash wallet for Windows, Mac and Linux.' : 'A free Zcash wallet that is private by default. (It used to be called Zashi.)'),
                h('a', { class: 'btn primary', href: desktop ? 'https://zingolabs.org/zingo/download/' : 'https://zodl.com', target: '_blank', rel: 'noopener noreferrer' }, desktop ? 'Get Zingo! ↗' : 'Get Zodl ↗'),
                h('p', { class: 'fine' }, desktop ? 'Only download it from zingolabs.org.' : `Only install it from the ${i === 0 ? 'App Store' : 'Play Store'}, using the link on zodl.com.`)),
              desktop ? null : h('div', { class: 'qr-card' }, qr('https://zodl.com', 4), h('small', {}, 'On a computer? Scan with your phone'))));
            done();
          }), out);
        } },
      { who: 'moss', pose: 'scroll', text: 'When you set up the app, it shows you <b>24 secret words</b>. Those words <b>are</b> your money. Anyone who has them can take it.' },
      { who: 'moss', pose: 'notebook', text: 'Where should you keep your 24 words? <b>Tap the two safe places.</b>', wait: true,
        widget: ({ area, done, say }) => {
          const opts: [string, boolean, string][] = [
            ['Written on paper, kept at home', true, 'Safe. Paper can’t be hacked.'],
            ['A screenshot on my phone', false, 'Not safe. Photos get synced and can leak.'],
            ['Emailed to myself', false, 'Not safe. Anyone who gets into your email gets your money.'],
            ['Stamped on a metal backup card', true, 'Safe. It even survives fire and water.'],
          ];
          let found = 0;
          const grid = h('div', { class: 'safe-grid' });
          for (const [t, safe, why] of opts) {
            const whyEl = h('small', {}, '');
            const b = h('button', { class: 'safe-opt', type: 'button' }, h('span', {}, t), whyEl);
            b.addEventListener('click', () => {
              if (b.classList.contains('ok') || b.classList.contains('bad')) return;
              whyEl.textContent = why;
              if (safe) { b.classList.add('ok'); sfx.ding(); if (++found === 2) { say('moss', 'thumbs', 'Exactly. Keep them <b>offline</b>, written down, somewhere safe.'); done(); } }
              else { b.classList.add('bad'); sfx.buzz(); say('moss', 'no', 'No. Anything online can leak. Try another.'); }
            });
            grid.append(b);
          }
          area.append(grid);
        } },
      { who: 'gus', pose: 'ask', text: 'Hi! I’m from <b>Support</b>. There’s a problem with your wallet. Just send me your 24 words and I’ll fix it.', wait: true,
        widget: ({ area, done, say }) => {
          const msg = h('div', { class: 'dm' }, h('div', { class: 'dm-from' }, 'Message from “Zodl Support ✓”'), h('p', {}, 'Your wallet is at risk. Reply with your 24 words within 15 minutes to keep your funds.'));
          const row = h('div', { class: 'row-actions' });
          row.append(
            btn('Send my 24 words', () => { sfx.buzz(); say('gus', 'run', 'Thanks! …and your money is gone. <b>(Practice only. Try again.)</b>'); }, 'danger'),
            btn('Block them', () => { sfx.ding(); msg.classList.add('blocked'); row.remove(); say('moss', 'no', 'Right. <b>Nobody real will ever ask for your 24 words.</b> Not Zodl, not an exchange, nobody.'); done(); }, 'primary'));
          area.append(msg, row);
        } },
    ],
    quiz: { q: 'Someone says they’re “support” and asks for your 24 words. What do you do?', options: ['Send them, they seem helpful', 'Block them', 'Send only half'], answer: 1, why: 'It’s always a scam. Never share your 24 words.' },
    learned: ['Use <b>Zodl</b> on your phone, or <b>Zingo!</b> on a computer.', 'Your <b>24 words</b> are your money. Write them on paper and never share them.'],
  },

  // ---------------------------------------------------------------- 3 · GET ZEC
  {
    n: 3, title: 'Get ZEC', blurb: 'Your two addresses, and two easy ways to buy.',
    steps: [
      { who: 'zee', pose: 'point', text: 'Your wallet has <b>two addresses</b>, like two mailboxes: a private one and a public one.',
        widget: ({ area }) => area.append(h('div', { class: 'compare' },
          h('div', { class: 'mailbox dark' }, h('div', { class: 'mb-title' }, 'Private address'), h('code', {}, short(fakeU())), h('p', {}, 'Starts with u.'), h('p', { class: 'mb-use' }, 'Use this one for friends and payments.')),
          h('div', { class: 'mailbox glass' }, h('div', { class: 'mb-title' }, 'Public address'), h('code', {}, short(fakeT())), h('p', {}, 'Starts with t.'), h('p', { class: 'mb-use' }, 'Only for exchanges that need it.')))) },
      { who: 'zee', pose: 'think', text: 'There are two easy ways to get your first ZEC. <b>Pick one</b> to see how it works.', wait: true,
        widget: ({ area, done, say }) => {
          const out = h('div', { class: 'route-out' });
          area.append(choices(['Swap inside the app', 'Buy on an exchange'], (i, b) => {
            b.parentElement!.querySelectorAll('.choice').forEach((x) => x.classList.remove('on')); b.classList.add('on');
            state.choices.route = i === 0 ? 'swap' : 'exchange'; save();
            out.replaceChildren(i === 0
              ? h('div', {}, h('ol', { class: 'steps' }, h('li', { html: 'In Zodl, tap <b>Swap</b>.' }), h('li', { html: 'Pay with another coin, like BTC or USDC.' }), h('li', { html: 'Your ZEC arrives <b>already private</b>.' })),
                note('⚠ Check the coin and network before you send. Mistakes on small swaps can’t be refunded.', 'warn'))
              : h('div', {}, h('ol', { class: 'steps' }, h('li', { html: 'Buy ZEC on an exchange (Coinbase, Kraken, Gemini…).' }), h('li', { html: 'Withdraw it to your <b>public (t) address</b>.' }), h('li', { html: 'In Zodl, tap <b>Shield</b> to make it private.' }))));
            say('zee', 'point', i === 0 ? 'Swapping in the app is the simplest: your ZEC lands private straight away.' : 'Exchanges usually send to your <b>public</b> address. One tap on <b>Shield</b> fixes that.');
            done();
          }), out);
        } },
    ],
    quiz: { q: 'Your ZEC from an exchange arrived on your public address. What next?', options: ['Tap Shield to make it private', 'Nothing, it’s already private', 'Send it back'], answer: 0, why: 'Public money is visible to everyone. Shield it to make it private.' },
    learned: ['Your wallet has a <b>private address (u…)</b> and a <b>public address (t…)</b>.', 'Get ZEC by <b>swapping in the app</b>, or <b>buying on an exchange</b> and then tapping <b>Shield</b>.'],
  },

  // ---------------------------------------------------------------- 4 · GO PRIVATE (GAME)
  {
    n: 4, title: 'Go private', blurb: 'Shielding, as a game.',
    steps: [
      { who: 'zee', pose: 'shield', text: '<b>Shielding</b> moves your coins from <b>public</b> to <b>private</b>. Let’s practise with a game.' },
      { who: 'zee', pose: 'point', text: 'Pick up the gold coins, then carry them into the <b>dark pool</b> on the right. Coins in the pool are private. Avoid the <b>red-eyed drones</b>.', wait: true,
        widget: ({ area, done, say }) => {
          const host = h('div', { class: 'game-host' });
          area.append(host);
          darkPool(host, { seconds: 45, onEnd: (r) => {
            say('peep', r.shielded > 0 ? 'defeated' : 'read', r.shielded > 0 ? `You hid <b>${r.shielded.toFixed(2)} ZEC</b> in the pool. I lost track of all of it.` : 'Nothing made it into the pool, so I could see all of it. Play again, or continue.');
            done();
          } });
        } },
      { who: 'zee', pose: 'think', text: 'In the real app it’s just one tap: <b>Shield</b>. Then wait about 12 minutes until your coins are ready to spend.' },
    ],
    quiz: { q: 'What does shielding do?', options: ['Moves coins from public to private', 'Sends coins to a friend', 'Deletes coins'], answer: 0, why: 'Shielding makes your coins private.' },
    learned: ['<b>Shield</b> = move coins from <b>public</b> to <b>private</b>.', 'In Zodl it’s <b>one tap</b>. Then wait about 12 minutes.'],
  },

  // ---------------------------------------------------------------- 5 · SEND & RECEIVE
  {
    n: 5, title: 'Send & receive', blurb: 'Private payments, with a secret note.',
    steps: [
      { who: 'zee', pose: 'cheer', text: 'Sending from <b>private to private</b> hides everything: who, how much, and the note you attach. Try it: send the Keeper a thank-you.', wait: true,
        widget: ({ area, done, say }) => {
          const memo = h('input', { class: 'field', value: 'Thanks for the help!', maxlength: 120, 'aria-label': 'Note' }) as HTMLInputElement;
          const out = h('div', { class: 'send-out' });
          const send = btn('Send 0.001 ZEC privately →', () => {
            if (memoBytes(memo.value) > 512) { toast('Notes can be up to 512 bytes.', 'bad'); return; }
            sfx.whoosh(); send.disabled = true; state.choices.memo = memo.value.slice(0, 60); save();
            out.replaceChildren(h('div', { class: 'compare' },
              h('div', { class: 'view watcher' }, h('div', { class: 'view-title' }, 'What the Watcher sees'),
                h('dl', {}, h('dt', {}, 'From'), h('dd', {}, '████████'), h('dt', {}, 'To'), h('dd', {}, '████████'), h('dt', {}, 'Amount'), h('dd', {}, '████'), h('dt', {}, 'Note'), h('dd', { class: 'cipher' }, hex(48)))),
              h('div', { class: 'view friend' }, h('div', { class: 'view-title' }, 'What the Keeper sees'),
                h('dl', {}, h('dt', {}, 'Amount'), h('dd', {}, '0.001 ZEC'), h('dt', {}, 'Note'), h('dd', {}, memo.value || '(no note)')))));
            say('peep', 'furious', 'A payment happened. That’s all I get. No names, no amount, no note.');
            done();
          }, 'primary');
          area.append(h('label', { class: 'field-label' }, 'Your secret note (only the Keeper can read it)', memo), h('div', { class: 'row-actions' }, send), out);
        } },
      { who: 'zee', pose: 'point', text: 'To <b>receive</b> money, open the app, tap <b>Receive</b>, and share your private address or its QR code.',
        widget: ({ area }) => area.append(h('div', { class: 'receive' }, h('div', { class: 'qr-card' }, qr(`zcash:${fakeU()}example`, 3), h('small', {}, 'Example QR. Not a real address.')),
          h('ul', { class: 'tips' }, h('li', {}, 'Your app shows a new private address each time. They all work, and they’re all yours.'), h('li', {}, 'Notes only work between private addresses.')))) },
    ],
    quiz: { q: 'You send ZEC privately to a friend. What can the public see?', options: ['Your name and the amount', 'Only that a payment happened', 'Your secret note'], answer: 1, why: 'Who, how much and the note are all hidden.' },
    learned: ['Private → private payments hide <b>who</b>, <b>how much</b> and your <b>note</b>.', 'To get paid, tap <b>Receive</b> and share your private address.'],
  },

  // ---------------------------------------------------------------- 6 · CASH OUT
  {
    n: 6, title: 'Cash out', blurb: 'Unshielding, without giving yourself away.',
    steps: [
      { who: 'zee', pose: 'think', text: '<b>Unshielding</b> is the opposite of shielding: it moves coins from private back to public. You need it to sell on most exchanges.' },
      { who: 'peep', pose: 'read', text: 'This morning you shielded <b>1.2345 ZEC</b>. I saw that amount go in. Now you want to sell some. What do you do?', wait: true,
        widget: ({ area, done, say }) => {
          area.append(choices(['Unshield 1.2345 ZEC right away', 'Unshield a different amount, a few days later'], (i, b) => {
            if (i === 0) { sfx.buzz(); b.classList.add('wrong'); say('peep', 'read', 'Gotcha. Same amount in and out, minutes apart: I can tell it’s you. Try the other one.'); }
            else { sfx.ding(); b.classList.add('on'); say('peep', 'defeated', 'Different amount, different day… I can’t link it to you.'); state.choices.exit = 'clean'; save(); done(); }
          }, 'stack'));
        } },
      { who: 'zee', pose: 'shield', text: 'Simple rules: keep your money <b>private by default</b>, only unshield what you need, and never move the <b>same amount</b> in and straight back out.' },
    ],
    quiz: { q: 'You shielded 2.5 ZEC this morning. Best way to cash out 1 ZEC?', options: ['Unshield 2.5 ZEC right now', 'Unshield 1 ZEC later, keep the rest private'], answer: 1, why: 'A different amount at a later time can’t be matched to you.' },
    learned: ['<b>Unshield</b> = move coins from <b>private</b> to <b>public</b>.', 'Keep money private by default, and don’t move the <b>same amount</b> in and out.'],
  },

  // ---------------------------------------------------------------- 7 · FIRST PRIVATE PAYMENT
  {
    n: 7, title: 'Your first private payment', blurb: 'Do it for real, then let the Watcher try to read it.',
    steps: [
      { who: 'zee', pose: 'cheer', text: 'Now the real thing: one private payment. Sending 0.001 ZEC costs about $1.30, plus a fee of about 13 cents.' },
      { who: 'zee', pose: 'point', text: 'Do these steps in your wallet app. Tick each one as you go.',
        widget: ({ area }) => {
          const steps = [
            'Install <b>Zodl</b> (or <b>Zingo!</b> on a computer).',
            'Write your <b>24 words</b> on paper.',
            'Get a little ZEC. If it arrives on your public address, tap <b>Shield</b>.',
            'Send <b>0.001 ZEC</b> to a private address, yours or a friend’s, <b>with a note</b>.',
          ];
          const list = h('ol', { class: 'checklist' });
          steps.forEach((s, i) => {
            const cb = h('input', { type: 'checkbox', id: `ck${i}` }) as HTMLInputElement;
            cb.checked = !!state.checklist[i];
            cb.addEventListener('change', () => { state.checklist[i] = cb.checked; save(); if (cb.checked) sfx.ding(); });
            list.append(h('li', {}, cb, h('label', { for: `ck${i}`, html: s })));
          });
          area.append(list, note('Tip: to send to yourself, tap <b>Receive</b>, copy your address, then <b>Send</b> to it.'));
        } },
      { who: 'peep', pose: 'peer', text: 'Done? Paste your <b>transaction ID</b> (in Zodl, open the payment and copy it). I’ll try to read it. You can also skip this.',
        cta: 'Finish →',
        widget: ({ area, say }) => {
          const tx = h('input', { class: 'field mono', placeholder: 'Paste transaction ID', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Transaction ID' }) as HTMLInputElement;
          const out = h('div', { class: 'inspect-out' });
          const go = btn('Let the Watcher look', async () => {
            const id = tx.value.trim();
            if (!isTxid(id)) { toast('A transaction ID is 64 letters and numbers.', 'bad'); return; }
            go.disabled = true; out.replaceChildren(h('p', { class: 'scanning' }, 'Looking…'));
            try {
              const v = await inspectTx(id);
              go.disabled = false;
              if (v === 'not-found') { out.replaceChildren(note('Not found yet. New payments can take a minute to show up. Try again soon.', 'warn')); return; }
              out.replaceChildren(inspectCard(v));
              if (v.kind === 'fully-shielded') { sfx.fanfare(); state.verified = 'shielded'; save(); say('peep', 'defeated', 'I can see that a payment happened, and the fee. Who, how much, the note: <b>nothing</b>. You did it.'); }
              else if (v.kind === 'shielding') { say('zee', 'point', 'That one is a <b>Shield</b>. Good, now send 0.001 ZEC privately and paste that ID.'); }
              else { say('peep', 'read', 'I can read part of that one, so it isn’t fully private. Send from private to private and try again.'); }
            } catch { go.disabled = false; out.replaceChildren(note('Couldn’t check right now. Try again, or just tap Finish.', 'warn')); }
          }, 'primary');
          area.append(tx, h('div', { class: 'row-actions' }, go), out,
            note('Optional. Your browser asks a public block explorer (Blockchair) about this one ID, so Blockchair sees the request. Nothing is sent to us.', 'fine'));
          if (!state.verified) state.verified = 'self';
          save();
        } },
    ],
    quiz: { q: 'Which payment is fully private?', options: ['Public address → public address', 'Private address → private address', 'Private address → exchange'], answer: 1, why: 'Private to private hides who, how much and the note.' },
    learned: ['You made (or know how to make) a <b>private Zcash payment</b>.', 'Share the game with a friend. The more people use private payments, the more private everyone is.'],
  },
];

function inspectCard(v: TxView): HTMLElement {
  const full = v.kind === 'fully-shielded';
  const rows: [string, string][] = [
    ['Payment happened', v.height ? `Yes, in block #${v.height.toLocaleString()}` : 'Yes (waiting for a block)'],
    ['Fee', v.fee != null ? `${v.fee} ZEC` : '—'],
    ['Who sent it', v.tIn ? 'Visible (public address)' : '████████ hidden'],
    ['Who got it', v.tOut ? 'Visible (public address)' : '████████ hidden'],
    ['Amount', v.publicAmount != null ? `${v.publicAmount} ZEC (visible)` : '████ hidden'],
    ['Note', '████ hidden'],
  ];
  return h('div', { class: `inspect-card ${full ? 'ok' : ''}` }, h('div', { class: 'view-title' }, full ? '✓ Fully private payment' : 'Partly public payment'),
    h('dl', {}, ...rows.flatMap(([k, val]) => [h('dt', {}, k), h('dd', {}, val)])));
}
