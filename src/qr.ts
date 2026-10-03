import qrcode from 'qrcode-generator';
import { h } from './ui';

/** A QR code as inline SVG (generated locally, no network). */
export function qr(text: string, cell = 4): HTMLElement {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  const wrap = h('div', { class: 'qr', role: 'img', 'aria-label': `QR code for ${text.slice(0, 60)}` });
  wrap.innerHTML = q.createSvgTag({ cellSize: cell, margin: 2, scalable: true });
  return wrap;
}
