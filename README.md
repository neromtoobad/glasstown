# Glasstown

**Everyone can see your money. Let's fix that.**

Glasstown is a character-driven learning game. It takes a total beginner from zero to their **first real shielded Zcash transaction** in eight short levels, about 10 minutes of play.

It was built for the ZECATHON Wildcard onboarding bounty (@zksnarks_).

| # | Level | Covers | What you do |
|---|---|---|---|
| 1 | Peep's Desk | Why privacy | **Play the chain watcher.** Dox a transparent wallet in 60 seconds, then fail when it goes shielded. |
| 2 | Moss's Vault | Wallet setup | Pick a wallet for your device (Zodl or Zingo!), sort seed-storage habits, block a fake "support" DM. |
| 3 | The Market | Getting ZEC | Swap in Zodl, use an exchange, or get it from a friend, and see what each route leaks. |
| 4 | Glass or Fog | Addresses | Sort t1 / u1 / zs1 / tex1 addresses, then use a real in-browser address checker (checksum only). |
| 5 | The Shield | Shielding | Move coins from a glass jar into the Ironwood pool and watch what Peep can still see. |
| 6 | Moth Mail | Send & receive | Type a memo and see ciphertext on the public chain next to plaintext in the recipient's wallet. Make a ZIP-321 payment QR. |
| 7 | The Exit | Unshielding | Beat Peep's round-trip trap (same amount, too soon), then learn TEX addresses and good habits. |
| 8 | Your First Shield | The real thing | Follow a checklist in your own wallet, paste the txid, and **Peep inspects the real transaction and finds nothing.** |

At the end you get a 26×26 pixel "shielded identity" card. Like a Wordle grid, it brags without spoiling anything: no txid, no address, no amount.

## Privacy
- No wallet connection, no keys, and it **never asks for your seed**.
- No analytics, no cookies and no third-party scripts. Fonts are self-hosted.
- Address checks run in your browser and only verify the checksum.
- Level 8's transaction check is **optional**. It asks the public Blockchair API about one txid, directly from your browser. The page says so before you use it.
- Progress is stored only in your browser's `localStorage`.

## Accuracy
Facts were checked on 3 Oct 2026 against Zodl's help center, the ZIPs and Zcash community sources. Sources are listed in the game at `#/sources`. Key points:
- Zashi is now **Zodl**.
- **Ironwood** (NU6.3) is the active shielded pool, and Orchard is exit-only.
- Zodl recovery phrases are 24 words plus a birthday height.
- Zodl needs 10 confirmations before funds are spendable.
- The minimum fee is 0.0001 ZEC (ZIP-317).
- Memos are up to 512 bytes.
- Binance uses TEX addresses (ZIP-320).

## Run it
```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # static site in dist/
```
Built with Vite and vanilla TypeScript. Dependencies: `@scure/base` and `@noble/hashes` (address checksums, base64url), `qrcode-generator`, and `@fontsource` fonts.

## Credits
- Characters and town art are generated images (Higgsfield), cut into sprites locally with `tools/cut.cjs`.
- Sound is synthesized live with Web Audio.
- Independent community entry, not affiliated with Zodl, ECC, the Zcash Foundation or zkSNARKs. Not financial advice.

MIT licensed.
