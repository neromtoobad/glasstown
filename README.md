# GLASSTOWN · learn Zcash privacy

**Learn to use Zcash privately, in about 10 minutes.** Play it at **https://neromtoobad.github.io/glasstown/**

Glasstown is a short, beginner-friendly learning game. It takes someone who knows nothing about Zcash to their **first private (shielded) payment**. Each level is a few cards: a character says one thing, you do one small action, then you continue. One level is a real arcade game.

Built for the ZECATHON Wildcard onboarding bounty (@zksnarks_).

It uses one picture throughout: **public = glass** (anyone can see) and **private = dark** (only you can see). *Shield* means public → private. *Unshield* means private → public.

## Levels
| # | Level | What you do |
|---|---|---|
| 1 | Why privacy | Tap a public wallet’s payments and watch the Watcher learn your job, home and name. Then try again with a shielded wallet: nothing. |
| 2 | Get a wallet | Pick your device and get Zodl (or Zingo! on a computer). Find the safe places for your 24 words. Block a fake “support” message. |
| 3 | Get ZEC | Your two addresses (private u…, public t…). Two easy ways to buy: swap in the app, or use an exchange and tap Shield. |
| 4 | Go private | **Dark Pool**, an arcade game. Pick up coins and carry them into the dark pool before the Watcher’s drones catch you. |
| 5 | Send & receive | Send with a secret note. See what the Watcher sees next to what your friend sees. Receive with a QR code. |
| 6 | Cash out | Unshield without giving yourself away: a different amount, at a later time. |
| 7 | Your first private payment | A 4-step checklist in your real wallet. Then paste the transaction ID and the Watcher tries, and fails, to read it. |

Each level ends with one quiz question and a “You learned” recap, and unlocks a piece of your 26×26 pixel identity in the zkSNARKs portrait style. The finish is a share card that shows nothing private.

## Cast
All four are 26×26 pixel identities drawn in the browser.
- **ZERO**: your guide.
- **WATCHER**: reads anything public.
- **KEEPER**: guards your 24 words.
- **SUPPORT ✓**: the scammer.

## Privacy
- No wallet connection, no keys, and it **never asks for your seed**.
- No analytics, no cookies, no third-party scripts, and self-hosted fonts.
- Level 7’s check is **optional**. It asks the public Blockchair API about one txid, directly from your browser, and the page says so first.
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
