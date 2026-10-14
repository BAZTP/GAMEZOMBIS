import { BASE, WORLD } from './engine.js';

export function drawMinimap(canvas, game, big = false) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, sx = w / WORLD.w, sy = h / WORLD.h;
    c.fillStyle = '#141f20'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#263638'; c.lineWidth = 1;
    for (let x = 0; x < w; x += w / 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 0; y < h; y += h / 6) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (const p of game.props) if (p.type === 'building') { c.fillStyle = '#586057'; c.fillRect(p.x * sx, p.y * sy, p.w * sx, p.h * sy); }
    for (const l of game.loot) if (!l.opened) { c.fillStyle = ({ relay: '#8de1e3', lumber: '#d8a56d', technology: '#b6a0e1' }[l.type] || '#919b64'); const r = l.type === 'relay' ? (big ? 6 : 3) : 1.5; c.fillRect(l.x * sx - r, l.y * sy - r, r * 2, r * 2); }
    c.fillStyle = '#c7f17c24'; c.fillRect((BASE.x - BASE.halfSize) * sx, (BASE.y - BASE.halfSize) * sy, BASE.halfSize * 2 * sx, BASE.halfSize * 2 * sy); c.strokeStyle = '#c7f17c'; c.strokeRect((BASE.x - BASE.halfSize) * sx, (BASE.y - BASE.halfSize) * sy, BASE.halfSize * 2 * sx, BASE.halfSize * 2 * sy);
    for (const e of game.enemies) { c.fillStyle = '#da866b'; c.fillRect(e.x * sx - 1, e.y * sy - 1, 2, 2); }
    const p = game.player; c.save(); c.translate(p.x * sx, p.y * sy); c.rotate(p.angle); c.fillStyle = '#eef5df'; c.beginPath(); c.moveTo(6, 0); c.lineTo(-4, -4); c.lineTo(-2, 0); c.lineTo(-4, 4); c.closePath(); c.fill(); c.restore();
    if (big) { c.font = '11px monospace'; c.textAlign = 'center'; for (const s of game.sites) { c.fillStyle = '#bac8b8'; c.fillText(s.name, s.x * sx, s.y * sy + 42); } c.fillStyle = '#c7f17c'; c.fillText('REFUGIO 07', BASE.x * sx, BASE.y * sy - 18); }
  }
