// Cut a white-background pose sheet into transparent sprites.
//   node cut.cjs sheet.png outDir name1,name2,...
// White that touches the border is background; big enclosed white patches (the gap between an
// arm and a torso) are background too. Small white areas (eyes, highlights) are kept.
const sharp = require("sharp");
const fs = require("fs");

const [, , input, outDir, namesArg] = process.argv;
const names = (namesArg || "").split(",").filter(Boolean);
const WHITE = 232; // every channel above this counts as background-white
const ENCLOSED_MIN = 1200; // enclosed white blobs bigger than this are holes, not highlights
const MIN_SPRITE = 20000; // opaque components smaller than this are specks
const PAD = 10;

(async () => {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
  const isWhite = (i) => { const [r, g, b] = px(i); return r > WHITE && g > WHITE && b > WHITE; };

  // Label every near-white component; remove the ones on the border or big enough to be holes.
  const label = new Int32Array(W * H).fill(-1);
  const stack = [];
  let comp = 0;
  for (let s = 0; s < W * H; s++) {
    if (label[s] !== -1 || !isWhite(s)) continue;
    const members = [];
    let border = false;
    label[s] = comp; stack.push(s);
    while (stack.length) {
      const i = stack.pop(); members.push(i);
      const x = i % W, y = (i / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
      for (const j of [i - 1, i + 1, i - W, i + W]) {
        if (j < 0 || j >= W * H) continue;
        if (Math.abs((j % W) - x) > 1) continue;
        if (label[j] === -1 && isWhite(j)) { label[j] = comp; stack.push(j); }
      }
    }
    if (border || members.length > ENCLOSED_MIN) for (const i of members) data[i * 4 + 3] = 0;
    comp++;
  }

  // Soften the fringe: near-white pixels next to transparency fade with their whiteness.
  for (let i = 0; i < W * H; i++) {
    if (data[i * 4 + 3] === 0) continue;
    const [r, g, b] = px(i);
    const m = Math.min(r, g, b);
    if (m > 200) {
      const x = i % W;
      const nearClear = [i - 1, i + 1, i - W, i + W].some((j) => j >= 0 && j < W * H && Math.abs((j % W) - x) <= 1 && data[j * 4 + 3] === 0);
      if (nearClear) data[i * 4 + 3] = Math.round(255 * (1 - (m - 200) / 55));
    }
  }

  // Find opaque components = sprites.
  const seen = new Uint8Array(W * H);
  const boxes = [];
  for (let s = 0; s < W * H; s++) {
    if (seen[s] || data[s * 4 + 3] < 40) continue;
    let minX = W, minY = H, maxX = 0, maxY = 0, n = 0;
    seen[s] = 1; stack.push(s);
    while (stack.length) {
      const i = stack.pop(); n++;
      const x = i % W, y = (i / W) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (const j of [i - 1, i + 1, i - W, i + W, i - W - 1, i - W + 1, i + W - 1, i + W + 1]) {
        if (j < 0 || j >= W * H || seen[j]) continue;
        if (Math.abs((j % W) - x) > 1) continue;
        if (data[j * 4 + 3] >= 40) { seen[j] = 1; stack.push(j); }
      }
    }
    if (n > MIN_SPRITE) boxes.push({ minX, minY, maxX, maxY, n });
  }
  // Reading order: rows first (by vertical centre), then left to right.
  const rowH = H / 2;
  boxes.sort((a, b) => (Math.floor(((a.minY + a.maxY) / 2) / rowH) - Math.floor(((b.minY + b.maxY) / 2) / rowH)) || a.minX - b.minX);
  console.log(`${W}x${H}, ${boxes.length} sprites`);

  fs.mkdirSync(outDir, { recursive: true });
  const full = sharp(data, { raw: { width: W, height: H, channels: 4 } });
  await full.clone().png().toFile(`${outDir}/_sheet-cut.png`);
  for (let k = 0; k < boxes.length; k++) {
    const b = boxes[k];
    const left = Math.max(0, b.minX - PAD), top = Math.max(0, b.minY - PAD);
    const w = Math.min(W - left, b.maxX - b.minX + 1 + PAD * 2), h = Math.min(H - top, b.maxY - b.minY + 1 + PAD * 2);
    const name = names[k] || `sprite${k}`;
    await full.clone().extract({ left, top, width: w, height: h }).png().toFile(`${outDir}/${name}.png`);
    console.log(name, `${w}x${h}`, "at", left, top, "px", b.n);
  }
})();
