// Zcash helpers that run entirely in the browser.
// Addresses are checked locally (checksum only). Nothing is sent anywhere.
import { bech32, bech32m, createBase58check, base64urlnopad, utf8 } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2.js';

const b58c = createBase58check(sha256);

export type AddrKind = 'unified' | 'sapling' | 'transparent' | 'tex' | 'testnet' | 'unknown';
export type AddrInfo = { kind: AddrKind; valid: boolean; shielded: boolean; label: string; note: string };

export function classify(raw: string): AddrInfo {
  const a = raw.trim();
  const bad = (kind: AddrKind, label: string): AddrInfo => ({ kind, valid: false, shielded: false, label, note: 'The checksum doesn’t match. One character is probably wrong. Copy it again instead of retyping.' });
  if (!a) return { kind: 'unknown', valid: false, shielded: false, label: 'Empty', note: 'Paste an address to check it.' };
  const lower = a.toLowerCase();
  if (/^(utest|ztestsapling|textest|tm)/i.test(a)) return { kind: 'testnet', valid: true, shielded: false, label: 'Testnet address', note: 'This is a testnet address. Testnet coins are free practice money and can’t hold real ZEC.' };
  if (lower.startsWith('u1') || lower.startsWith('zu1') || lower.startsWith('tu1')) {
    try { bech32m.decode(lower as `${string}1${string}`, false); return { kind: 'unified', valid: true, shielded: !lower.startsWith('tu1'), label: 'Unified address (shielded)', note: 'A Unified Address bundles several receivers. The sender’s wallet picks the most private one it supports, which today is the Ironwood pool. Zodl shows a new one each time; they all belong to the same wallet.' }; }
    catch { return bad('unified', 'Unified address?'); }
  }
  if (lower.startsWith('zs1')) {
    try { bech32.decode(lower as `${string}1${string}`, false); return { kind: 'sapling', valid: true, shielded: true, label: 'Sapling address (shielded, older)', note: 'Sapling is an older shielded pool. It is still private, but newer wallets prefer Unified Addresses.' }; }
    catch { return bad('sapling', 'Sapling address?'); }
  }
  if (lower.startsWith('tex1')) {
    try { bech32m.decode(lower as `${string}1${string}`, false); return { kind: 'tex', valid: true, shielded: false, label: 'TEX address (transparent, exchange-only)', note: 'TEX addresses (ZIP-320) are used by exchanges like Binance. They only accept funds that come from a transparent address. Zodl handles this for you by unshielding first, so that amount becomes public.' }; }
    catch { return bad('tex', 'TEX address?'); }
  }
  if (a.startsWith('t1') || a.startsWith('t3')) {
    try {
      const bytes = b58c.decode(a);
      if (bytes.length !== 22) throw new Error('len');
      return { kind: 'transparent', valid: true, shielded: false, label: 'Transparent address (public)', note: 'Like Bitcoin: anyone can see what goes in and out. Use it to receive from exchanges, then tap Shield.' };
    } catch { return bad('transparent', 'Transparent address?'); }
  }
  return { kind: 'unknown', valid: false, shielded: false, label: 'Not a Zcash address', note: 'Zcash addresses start with u1, zs1, t1, t3 or tex1.' };
}

/** ZIP-321 payment request. The memo is base64url without padding; memos only go to shielded addresses. */
export function zip321(addr: string, amount?: number, memo?: string): string {
  const params: string[] = [];
  if (amount && amount > 0) params.push(`amount=${amount.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')}`);
  if (memo) params.push(`memo=${base64urlnopad.encode(utf8.decode(memo))}`);
  return `zcash:${addr.trim()}${params.length ? '?' + params.join('&') : ''}`;
}

export const memoBytes = (s: string) => new TextEncoder().encode(s).length;

// ---------- Peep inspects a real transaction ----------
export type TxView = {
  kind: 'fully-shielded' | 'shielding' | 'unshielding' | 'transparent' | 'mixed';
  height: number | null; time: string | null; fee: number | null;
  tIn: number; tOut: number; sapling: number; orchard: number; ironwood: number;
  publicAmount: number | null;  // ZEC visible crossing the shielded boundary (null when none)
  usd: number | null;
};

type Raw = {
  vin?: unknown[]; vout?: { valueZat?: number }[];
  vShieldedSpend?: unknown[]; vShieldedOutput?: unknown[]; valueBalanceZat?: number;
  orchard?: { actions?: unknown[]; valueBalanceZat?: number }; ironwood?: { actions?: unknown[]; valueBalanceZat?: number };
};

export async function inspectTx(txid: string, signal?: AbortSignal): Promise<TxView | 'not-found'> {
  const id = txid.trim().toLowerCase();
  const base = 'https://api.blockchair.com/zcash';
  const [rawRes, dashRes] = await Promise.all([
    fetch(`${base}/raw/transaction/${id}`, { signal, referrerPolicy: 'no-referrer', credentials: 'omit' }),
    fetch(`${base}/dashboards/transaction/${id}`, { signal, referrerPolicy: 'no-referrer', credentials: 'omit' }),
  ]);
  if (rawRes.status === 404 || dashRes.status === 404) return 'not-found';
  if (!rawRes.ok) throw new Error(`explorer ${rawRes.status}`);
  const rawJson = await rawRes.json();
  const dashJson = dashRes.ok ? await dashRes.json() : null;
  const entry = rawJson?.data?.[id];
  if (!entry || Array.isArray(rawJson?.data)) return 'not-found';
  const x: Raw = entry.decoded_raw_transaction ?? {};
  const tx = dashJson?.data?.[id]?.transaction;
  const tIn = x.vin?.filter((v) => !(v as { coinbase?: string }).coinbase).length ?? 0;
  const tOut = x.vout?.length ?? 0;
  const sapling = (x.vShieldedSpend?.length ?? 0) + (x.vShieldedOutput?.length ?? 0);
  const orchard = x.orchard?.actions?.length ?? 0;
  const ironwood = x.ironwood?.actions?.length ?? 0;
  const shielded = sapling + orchard + ironwood > 0;
  let kind: TxView['kind'];
  if (!shielded) kind = 'transparent';
  else if (tIn === 0 && tOut === 0) kind = 'fully-shielded';
  else if (tIn > 0 && tOut === 0) kind = 'shielding';
  else if (tIn === 0 && tOut > 0) kind = 'unshielding';
  else kind = 'mixed';
  const zat = 1e8;
  // Value balances: positive = value leaving the shielded pools. With the transparent totals they give the fee,
  // which explorers report as 0 when there are no transparent inputs.
  const vb = (x.valueBalanceZat ?? 0) + (x.orchard?.valueBalanceZat ?? 0) + (x.ironwood?.valueBalanceZat ?? 0);
  const tInZat = tx?.input_total ?? 0, tOutZat = tx?.output_total ?? 0;
  const feeZat = tx ? tInZat - tOutZat + vb : null;
  let publicAmount: number | null = null;
  if (kind === 'shielding') publicAmount = -vb / zat;
  if (kind === 'unshielding' || kind === 'transparent') publicAmount = tOutZat / zat;
  return {
    kind, tIn, tOut, sapling, orchard, ironwood, publicAmount,
    height: tx && tx.block_id > 0 ? tx.block_id : null,
    time: tx?.time ?? null,
    fee: feeZat != null && feeZat >= 0 ? feeZat / zat : null,
    usd: rawJson?.context?.market_price_usd ?? null,
  };
}

export const isTxid = (s: string) => /^[0-9a-f]{64}$/i.test(s.trim());
