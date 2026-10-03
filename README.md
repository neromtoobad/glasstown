# GLASSTOWN · a Zcash initiation

**Every wallet is glass. Get out.**

Glasstown is a terminal-style learning game. It takes a total beginner from zero to their **first real shielded Zcash transaction** in eight nodes, and one of those nodes is a playable arcade game.

Built for the ZECATHON Wildcard onboarding bounty (@zksnarks_).

## The cast
All characters are 26×26 pixel identities: hooded, a void where the face would be, glowing eyes, pixels dissolving off the back edge. They are drawn procedurally in the browser.
- **ZERO**: your guide out of Glasstown.
- **WATCHER**: chain analytics. A glass head with a red lens that reads anything transparent.
- **KEEPER**: guards the vault and is strict about your 24 words.
- **SUPPORT ✓**: a verified badge, very helpful. Do not trust.

## Nodes
| # | Node | Covers | What you do |
|---|---|---|---|
| 01 | Watcher's Desk | Why privacy | **Sit in the Watcher's chair.** Profile a transparent wallet in 60 seconds, then watch the trail vanish when the subject goes shielded. |
| 02 | The Vault | Wallet setup | Pick a wallet for your device (Zodl or Zingo!), sort seed-storage habits, block a fake support DM. |
| 03 | The Market | Getting ZEC | Swap in Zodl, an exchange, or a friend: see what each route leaks. |
| 04 | Glass or Dark | Addresses | Sort t1 / u1 / zs1 / tex1 addresses, then use a real in-browser address checker (checksum only). |
| 05 | **Dark Pool** | Shielding | **Arcade game.** Grab ZEC in the lit glass district while the Watcher's drones hunt you. Carrying coins makes you visible from further away. Reach the dark pool (Ironwood) to shield. |
| 06 | Sealed Mail | Send & receive | Type a memo and see ciphertext on the public chain next to plaintext in the recipient's wallet. Build a ZIP-321 payment QR. |
| 07 | The Exit | Unshielding | Beat the round-trip match (same amount, too soon), learn TEX addresses, and decrypt six habits. |
| 08 | Initiation | The real thing | Work through a checklist in your own wallet, paste the txid, and **the Watcher inspects the real transaction and finds nothing.** |

Your own 26×26 identity renders one trait per node. It ends as a share card: identity, traits, and a redacted receipt (Amount ████ · To ████ · Memo ████). Like a Wordle grid, it brags without leaking anything: no txid, no address, no amount.

## Privacy
- No wallet connection, no keys, and it **never asks for your seed**.
- No analytics, no cookies, no third-party scripts, and self-hosted fonts.
- Address checks run in your browser and only verify the checksum.
- Node 08's check is **optional**. It asks the public Blockchair API about one txid, directly from your browser, and the page says so first.
- Progress and your identity seed stay in your browser's `localStorage`.

## Accuracy
Facts were checked on 3 Oct 2026 against Zodl's help center, the ZIPs and Zcash community sources. Sources are listed in-game at `#/sources`.
- Zashi is now **Zodl**.
- **Ironwood** (NU6.3) is the active shielded pool, and Orchard is exit-only.
- A recovery phrase is 24 words plus the wallet birthday height.
- Zodl waits for 10 confirmations before new funds are spendable.
- The minimum fee is 0.0001 ZEC (ZIP-317).
- Memos are up to 512 bytes.
- TEX addresses (ZIP-320) are used by exchanges such as Binance.

## Run it
```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # static site in dist/
```
Built with Vite and vanilla TypeScript, with canvas for the portraits and the arcade game and Web Audio for sound. Dependencies:
- `@scure/base` and `@noble/hashes`: address checksums and base64url
- `qrcode-generator`
- `@fontsource/jetbrains-mono`

Independent community entry. Not affiliated with Zodl, ECC, the Zcash Foundation or zkSNARKs. Not financial advice. MIT licensed.
