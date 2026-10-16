/* Dino Aventura · EG Gamer X — prévia v0.1
   História: o Rex acorda com fome, pega o carrinho, encontra o Tri e o Pesco
   e todos lancham no lago até dormir. Para 2 e 3 anos: nunca perde, sem tempo.
   Tudo desenhado no canvas (sem imagens), sons feitos na hora, 100% offline. */
'use strict';
const cv = document.getElementById('cv'), c = cv.getContext('2d');
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2, PI = Math.PI;
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sorteio = n => Math.floor(Math.random() * n);
const suave = (dt, k) => 1 - Math.exp(-dt * k);
function rng(seed) { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
function rgbDe(h) { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
function mix(a, b, t) { const A = rgbDe(a), B = rgbDe(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); }
function rgba(h, a) { const A = rgbDe(h); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }
function rr(x, y, w, h, r, g = c) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

/* ---------- Tela ---------- */
let W, H, U, G, DPR;
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  U = Math.min(H / 10, W / 15); G = H - 1.6 * U;
  $('gire').classList.toggle('on', W < H * .9);
  F = null;
  if (S.cena === 'estrada') { car.x = W * .3; car.y = GR(); }
}
const KC = () => U * 1.4;           // tamanho do carrinho
const GR = () => G + .55 * U;       // meio da estrada de terra

/* ---------- Paletas (amanhecer, dia, fim de tarde, noite) ---------- */
const PAL = {
  aurora: { ceu: ['#3a4a7a', '#d98a8a', '#ffc98a'], sol: '#ffe2b0', solX: .8, solY: .56, nevoa: '#d8a6a6', mont: '#7a6684', colina: '#56705e', arv: '#2f4a30', grama: '#5e7f35', terra: '#80603e', tinta: '#ffe8dc' },
  dia:    { ceu: ['#4f9fdc', '#9fd0f0', '#e4f1e8'], sol: '#fffbe0', solX: .8, solY: .15, nevoa: '#b9d0db', mont: '#7a93a6', colina: '#5b8a66', arv: '#2c5a31', grama: '#6b9b3a', terra: '#9a7349', tinta: null },
  tarde:  { ceu: ['#46508f', '#e98f63', '#ffd38f'], sol: '#ffe6a8', solX: .3, solY: .5, nevoa: '#dcaa8e', mont: '#7c6475', colina: '#5e6b4c', arv: '#34462c', grama: '#71913a', terra: '#8c6a42', tinta: '#ffeedd' },
  noite:  { ceu: ['#060a1e', '#141f45', '#2a3a66'], sol: '#eef3ff', solX: .75, solY: .17, nevoa: '#4a5878', mont: '#34405e', colina: '#2b3a40', arv: '#1c2a24', grama: '#3a5230', terra: '#4a3c30', tinta: '#8796cc', noite: true }
};

/* ---------- Cenário pintado em camadas (paralaxe) ---------- */
let F = null;
function fundo(nome) { if (!F || F.nome !== nome) F = montaFundo(nome); return F; }
function camada(w, h, fn) {
  const k = document.createElement('canvas'); k.width = Math.ceil(w * DPR); k.height = Math.ceil(h * DPR);
  const g = k.getContext('2d'); g.scale(DPR, DPR); g.lineCap = 'round'; g.lineJoin = 'round';
  fn(g, w, h); k.w = w; k.h = h; return k;
}
function faixa(k, off, y) {
  const x = -(((off % k.w) + k.w) % k.w);
  c.drawImage(k, x, y, k.w, k.h); if (x + k.w < W) c.drawImage(k, x + k.w, y, k.w, k.h);
}
function montaFundo(nome) {
  const p = PAL[nome], LW = Math.ceil(Math.max(W * 1.5, 26 * U)), f = { nome, p };
  const onda = (x, w, A) => A.reduce((s, [a, k, fz]) => s + a * Math.sin(TAU * k * x / w + fz), 0);
  const copias = (x, w, m, fn) => { for (const dx of [-w, 0, w]) { const xx = x + dx; if (xx > -m && xx < w + m) fn(xx); } };

  f.l0 = camada(LW, H * .55, (g, w, h) => {           // nuvens
    if (p.noite) return;
    const r = rng(5);
    for (let i = 0; i < 6; i++) { const x = r() * w, y = h * (.15 + r() * .45), s = U * (1 + r() * 1.4), sd = 100 + i; copias(x, w, 4 * U, xx => nuvem(g, xx, y, s, sd, p)); }
  });
  f.l1 = camada(LW, G, (g, w, h) => {                 // montanhas e vulcão
    const r = rng(21);
    const A = [[.7 * U, 2, r() * 7], [.4 * U, 5, r() * 7], [.2 * U, 9, r() * 7], [.1 * U, 19, r() * 7]];
    const B = [[.9 * U, 1, r() * 7], [.5 * U, 3, r() * 7], [.25 * U, 7, r() * 7], [.12 * U, 15, r() * 7], [.06 * U, 31, r() * 7]];
    const vx = w * .62, vH = 3.3 * U, vR = 5.5 * U;
    const vulc = x => { let d = Math.abs(x - vx); d = Math.min(d, w - d); if (d > vR) return 0; if (d < .5 * U) return vH * Math.pow(1 - .5 * U / vR, 1.25) - (.5 * U - d) * .3; return vH * Math.pow(1 - d / vR, 1.25); };
    let gr = g.createLinearGradient(0, h * .3, 0, h); gr.addColorStop(0, mix(p.mont, p.nevoa, .55)); gr.addColorStop(1, p.nevoa);
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 3) g.lineTo(x, h * .47 + onda(x, w, A)); g.lineTo(w, h); g.fill();
    const yN = x => h * .6 + onda(x, w, B) - vulc(x);
    gr = g.createLinearGradient(0, h * .3, 0, h); gr.addColorStop(0, mix(p.mont, p.nevoa, .12)); gr.addColorStop(1, mix(p.mont, p.nevoa, .55));
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 3) g.lineTo(x, yN(x)); g.lineTo(w, h); g.closePath(); g.fill();
    g.save(); g.clip();
    for (let i = 0; i < 70; i++) {                     // sulcos de sombra nas encostas
      const x = 2 * U + r() * (w - 5 * U), y0 = yN(x);
      g.strokeStyle = rgba(mix(p.mont, '#000000', .3), .06); g.lineWidth = U * (.15 + r() * .25);
      g.beginPath(); g.moveTo(x, y0 + 2); g.quadraticCurveTo(x + (r() - .5) * U, y0 + U, x + (r() - .5) * 2 * U, y0 + (1 + r() * 2) * U); g.stroke();
    }
    const ty = yN(vx), lg = g.createRadialGradient(vx, ty, 0, vx, ty, U);
    lg.addColorStop(0, 'rgba(255,150,50,.85)'); lg.addColorStop(1, 'rgba(255,80,0,0)'); g.fillStyle = lg; g.fillRect(vx - U, ty - U, 2 * U, 2 * U);
    g.restore();
    f.vx = vx; f.vy = ty;
  });
  f.l2 = camada(LW, G, (g, w, h) => {                 // colinas com árvores distantes
    const r = rng(33), A = [[.45 * U, 2, r() * 7], [.25 * U, 5, r() * 7], [.12 * U, 11, r() * 7]];
    const yC = x => h * .72 + onda(x, w, A);
    const gr = g.createLinearGradient(0, h * .62, 0, h); gr.addColorStop(0, mix(p.colina, p.nevoa, .35)); gr.addColorStop(1, mix(p.colina, p.nevoa, .1));
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 3) g.lineTo(x, yC(x)); g.lineTo(w, h); g.fill();
    const cor = mix(mix(p.arv, p.nevoa, .38), p.colina, .2), n = Math.floor(w / (.3 * U));
    for (let i = 0; i < n; i++) {
      const x = (i + r() * .8) * w / n, sd = 600 + i, hh = U * (.5 + r() * 1.1), t = r(), y = yC(x) + U * .15;
      copias(x, w, 2 * U, xx => t < .75 ? conifera(g, xx, y, hh, cor, sd) : palma(g, xx, y, hh * .7, cor, sd, { tronco: .45, larg: .08, queda: .35, n: 9, longe: true }));
    }
  });
  f.l3 = camada(LW, G + .4 * U, (g, w, h) => {        // árvores perto
    const r = rng(47), base = G + .2 * U, lista = [];
    for (let x = r() * U; x < w - U; x += U * (1.6 + r() * 2.8)) lista.push([x, r(), 900 + lista.length]);
    for (const [x, t, sd] of lista) {
      const hh = U * (3 + rng(sd)() * 3);
      copias(x, w, 4 * U, xx => {
        if (t < .5) conifera(g, xx, base, hh, p.arv, sd);
        else if (t < .78) palma(g, xx, base, hh * .5, p.arv, sd, { tronco: .45, larg: .09, queda: .35, n: 11 });
        else palma(g, xx, base, hh * .72, p.arv, sd, { tronco: .72, larg: .035, queda: .75, n: 9 });
      });
    }
    for (let i = 0; i < w / (.7 * U); i++) { const x = i * .7 * U + r() * .3 * U, sd = 2000 + i, s = U * (.35 + rng(sd)() * .5); copias(x, w, U, xx => arbusto(g, xx, base, s, p.arv, sd)); }
  });
  f.l4 = camada(LW, H - G + .45 * U, (g, w, h) => {   // estrada de terra
    const r = rng(59), top = .45 * U;
    const gr = g.createLinearGradient(0, top, 0, h); gr.addColorStop(0, mix(p.terra, '#000000', .12)); gr.addColorStop(.3, p.terra); gr.addColorStop(1, mix(p.terra, '#000000', .35));
    g.fillStyle = gr; g.fillRect(0, top, w, h - top);
    g.fillStyle = rgba(mix(p.terra, '#000000', .45), .22); g.fillRect(0, top + .3 * U, w, .16 * U); g.fillRect(0, top + .85 * U, w, .2 * U);
    for (let i = 0; i < w / U * 16; i++) {
      const x = r() * w, y = top + .15 * U + r() * (h - top - .15 * U), s = U * (.015 + r() * .06), cor = mix(p.terra, r() < .5 ? '#ffffff' : '#000000', .15 + r() * .2);
      copias(x, w, U, xx => { g.fillStyle = cor; g.beginPath(); g.ellipse(xx, y, s * 1.4, s, 0, 0, TAU); g.fill(); });
    }
    grama(g, w, top, r, p);
  });
  f.l5 = camada(LW, 1.4 * U, (g, w, h) => {           // samambaias na frente
    const r = rng(71);
    for (let x = r() * 3 * U; x < w - 2 * U; x += U * (5 + r() * 6)) { const sd = 3000 + (x | 0), s = U * (.9 + rng(sd)() * .5); copias(x, w, 2 * U, xx => samambaia(g, xx, h + .1 * U, s, mix(p.grama, '#0a1a05', .45), sd)); }
  });
  f.l6 = camada(LW, H - G + .5 * U, (g, w, h) => {    // gramado (manhã e lago)
    const r = rng(83), top = .5 * U;
    const gr = g.createLinearGradient(0, top, 0, h); gr.addColorStop(0, mix(p.grama, '#000000', .05)); gr.addColorStop(1, mix(p.grama, '#000000', .4));
    g.fillStyle = gr; g.fillRect(0, top, w, h - top);
    for (let i = 0; i < w / U * 40; i++) {
      const x = r() * w, y = top + r() * (h - top), hh = U * (.08 + r() * .14), cor = mix(p.grama, r() < .5 ? '#ffffff' : '#000000', r() * .25);
      g.strokeStyle = cor; g.lineWidth = U * .025; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * .1 * U, y - hh); g.stroke();
    }
    for (let i = 0; i < w / U * 1.2; i++) {
      const x = r() * w, y = top + .2 * U + r() * (h - top - .3 * U), cor = ['#fff5c2', '#ffd1e0', '#e8e0ff', '#ffe08a'][i % 4];
      g.fillStyle = cor; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; g.beginPath(); g.arc(x + Math.cos(a) * .05 * U, y + Math.sin(a) * .05 * U, .04 * U, 0, TAU); g.fill(); }
      g.fillStyle = '#e0a020'; g.beginPath(); g.arc(x, y, .03 * U, 0, TAU); g.fill();
    }
    grama(g, w, top, r, p);
  });
  return f;
}
function grama(g, w, top, r, p) {
  g.fillStyle = mix(p.grama, '#000000', .18); g.fillRect(0, top - .04 * U, w, .16 * U);
  for (let x = 0; x < w; x += .045 * U) {
    const hh = U * (.12 + r() * .34), dx = (r() - .5) * .16 * U, cor = mix(p.grama, r() < .5 ? '#ffffff' : '#000000', r() * .3);
    g.strokeStyle = cor; g.lineWidth = U * .032; g.beginPath(); g.moveTo(x, top + .1 * U); g.quadraticCurveTo(x + dx * .3, top - hh * .5, x + dx, top + .1 * U - hh); g.stroke();
  }
}
function nuvem(g, x, y, s, sd, p) {
  const r = rng(sd), cor = mix('#ffffff', p.sol, .25);
  for (let i = 0; i < 9; i++) {
    const px = x + (i - 4) * s * .32 + (r() - .5) * s * .2, py = y - Math.sin(i / 8 * PI) * s * .35 + (r() - .5) * s * .1, pr = s * (.32 + Math.sin(i / 8 * PI) * .3);
    const gr = g.createRadialGradient(px, py - pr * .3, pr * .1, px, py, pr); gr.addColorStop(0, rgba(cor, .85)); gr.addColorStop(.7, rgba(cor, .5)); gr.addColorStop(1, rgba(cor, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
  }
}
function conifera(g, x, y, h, cor, sd) {
  const r = rng(sd), claro = mix(cor, '#ffffff', .14), escuro = mix(cor, '#000000', .35);
  g.fillStyle = mix(cor, '#2a1a0e', .65); g.fillRect(x - h * .02, y - h * .3, h * .04, h * .3);
  const n = 6 + (r() * 3 | 0);
  for (let i = 0; i < n; i++) {
    const t = i / n, ty = y - h * (.15 + t * .78), wd = h * (.3 * (1 - t) + .05), th = h * .2;
    const gr = g.createLinearGradient(x - wd, 0, x + wd, 0); gr.addColorStop(0, claro); gr.addColorStop(.55, cor); gr.addColorStop(1, escuro);
    g.fillStyle = gr; g.beginPath(); g.moveTo(x + (r() - .5) * wd * .1, ty - th);
    for (let j = 1; j <= 5; j++) { const u = j / 5; g.lineTo(x + wd * u + (r() - .5) * wd * .12, ty - th + th * u + (j % 2 ? -th * .12 : 0)); }
    g.quadraticCurveTo(x, ty + th * .35, x - wd, ty);
    for (let j = 4; j >= 1; j--) { const u = j / 5; g.lineTo(x - wd * u + (r() - .5) * wd * .12, ty - th + th * u + (j % 2 ? -th * .12 : 0)); }
    g.closePath(); g.fill();
  }
}
function palma(g, x, y, h, cor, sd, o) {
  const r = rng(sd), th = h * o.tronco, tw = h * o.larg;
  const tr = g.createLinearGradient(x - tw, 0, x + tw, 0); tr.addColorStop(0, mix(cor, '#7a5a3a', .6)); tr.addColorStop(1, mix(cor, '#1e140a', .7));
  g.fillStyle = tr; g.beginPath(); g.moveTo(x - tw, y); g.quadraticCurveTo(x - tw * .9, y - th * .5, x - tw * .7, y - th); g.lineTo(x + tw * .7, y - th); g.quadraticCurveTo(x + tw * .9, y - th * .5, x + tw, y); g.fill();
  if (!o.longe) { g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = Math.max(1, h * .008); for (let yy = y - th * .08; yy > y - th; yy -= h * .045) { g.beginPath(); g.moveTo(x - tw * .8, yy); g.lineTo(x + tw * .8, yy - h * .02); g.stroke(); } }
  const tx = x, ty = y - th;
  for (let i = 0; i < o.n; i++) {
    const a = -PI / 2 + (i / (o.n - 1) - .5) * 2.9 + (r() - .5) * .2, len = h * (.5 + r() * .15);
    const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * .7 + len * o.queda * Math.abs(Math.cos(a)), cx = tx + Math.cos(a) * len * .55, cy = ty + Math.sin(a) * len * .6 - len * .12;
    const tom = i % 2 ? cor : mix(cor, '#ffffff', .1);
    g.strokeStyle = tom; g.lineWidth = Math.max(1, h * .012); g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
    g.lineWidth = Math.max(1, h * .009); g.beginPath();
    for (let j = 2; j <= 14; j++) {
      const u = j / 14, px = (1 - u) * (1 - u) * tx + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) * (1 - u) * ty + 2 * (1 - u) * u * cy + u * u * ey, ll = h * .09 * (1 - u * .6);
      const dx = 2 * (1 - u) * (cx - tx) + 2 * u * (ex - cx), dy = 2 * (1 - u) * (cy - ty) + 2 * u * (ey - cy), d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
      g.moveTo(px, py); g.lineTo(px + (nx + dx / d * .6) * ll, py + (ny + dy / d * .6) * ll + ll * .3);
      g.moveTo(px, py); g.lineTo(px + (-nx + dx / d * .6) * ll, py + (-ny + dy / d * .6) * ll + ll * .3);
    }
    g.stroke();
  }
}
function arbusto(g, x, y, s, cor, sd) {
  const r = rng(sd);
  for (let i = 0; i < 6; i++) {
    const bx = x + (r() - .5) * s * 1.6, by = y - r() * s * .5, br = s * (.35 + r() * .4);
    const gr = g.createRadialGradient(bx - br * .3, by - br * .4, br * .1, bx, by, br); gr.addColorStop(0, mix(cor, '#ffffff', .2)); gr.addColorStop(1, mix(cor, '#000000', .3));
    g.fillStyle = gr; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill();
  }
}
function samambaia(g, x, y, s, cor, sd) {
  const r = rng(sd), n = 7;
  for (let i = 0; i < n; i++) {
    const a = -PI / 2 + (i / (n - 1) - .5) * 2.4 + (r() - .5) * .3, len = s * (.8 + r() * .4);
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len * .75 + len * .3, cx = x + Math.cos(a) * len * .45, cy = y + Math.sin(a) * len * .95;
    const tom = mix(cor, '#ffffff', r() * .12);
    g.strokeStyle = tom; g.lineWidth = s * .03; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cx, cy, ex, ey); g.stroke();
    g.fillStyle = tom;
    for (let j = 1; j <= 12; j++) {
      const u = j / 13, px = (1 - u) * (1 - u) * x + 2 * (1 - u) * u * cx + u * u * ex, py = (1 - u) * (1 - u) * y + 2 * (1 - u) * u * cy + u * u * ey;
      const dx = 2 * (1 - u) * (cx - x) + 2 * u * (ex - cx), dy = 2 * (1 - u) * (cy - y) + 2 * u * (ey - cy), an = Math.atan2(dy, dx), ls = s * .13 * (1 - u * .65);
      for (const sg of [1, -1]) { g.beginPath(); g.ellipse(px + Math.cos(an + sg * 1.2) * ls * .6, py + Math.sin(an + sg * 1.2) * ls * .6, ls * .65, ls * .22, an + sg * 1.2, 0, TAU); g.fill(); }
    }
  }
}
function desenhaCeu(f) {
  const p = f.p, gr = c.createLinearGradient(0, 0, 0, G);
  gr.addColorStop(0, p.ceu[0]); gr.addColorStop(.62, p.ceu[1]); gr.addColorStop(1, p.ceu[2]);
  c.fillStyle = gr; c.fillRect(0, 0, W, G + 2);
  if (p.noite) { const r = rng(9); c.fillStyle = '#ffffff'; for (let i = 0; i < 140; i++) { const x = r() * W, y = r() * G * .7, s = .6 + r() * 1.6; c.globalAlpha = .4 + .6 * Math.abs(Math.sin(S.t * (.5 + r()) + i)); c.fillRect(x, y, s, s); } c.globalAlpha = 1; }
  const sx = W * p.solX, sy = H * p.solY, rs = U * (p.noite ? .55 : .75);
  const gl = c.createRadialGradient(sx, sy, 0, sx, sy, U * 5); gl.addColorStop(0, rgba(p.sol, .55)); gl.addColorStop(1, rgba(p.sol, 0));
  c.fillStyle = gl; c.fillRect(sx - 5 * U, sy - 5 * U, 10 * U, 10 * U);
  c.fillStyle = p.sol; c.beginPath(); c.arc(sx, sy, rs, 0, TAU); c.fill();
  if (p.noite) { c.fillStyle = 'rgba(150,160,195,.35)'; for (const [dx, dy, r] of [[-.2, -.15, .12], [.18, .1, .09], [-.05, .25, .07]]) { c.beginPath(); c.arc(sx + dx * rs * 2, sy + dy * rs * 2, r * rs * 2, 0, TAU); c.fill(); } }
}
function cenario(f, off, arvores = true) {
  desenhaCeu(f);
  faixa(f.l0, off * .03 + S.t * 6, 0);
  faixa(f.l1, off * .06, 0);
  const x0 = f.vx - (((off * .06) % f.l1.w) + f.l1.w) % f.l1.w;          // fumaça do vulcão
  for (const vx of [x0, x0 + f.l1.w]) {
    if (vx < -4 * U || vx > W + 4 * U) continue;
    for (let i = 0; i < 12; i++) {
      const k = (S.t * .06 + i / 12) % 1, px = vx + k * 3.5 * U + Math.sin(k * 6 + i) * .3 * U, py = f.vy - .2 * U - k * 4.5 * U, pr = U * (.25 + k * 1.3);
      const gr = c.createRadialGradient(px, py, 0, px, py, pr); gr.addColorStop(0, rgba(mix(f.p.nevoa, '#5a5550', .45), .4 * (1 - k))); gr.addColorStop(1, rgba(f.p.nevoa, 0));
      c.fillStyle = gr; c.beginPath(); c.arc(px, py, pr, 0, TAU); c.fill();
    }
  }
  faixa(f.l2, off * .18, 0);
  if (arvores) faixa(f.l3, off * .45, 0);
}
const tinta = f => { if (!f.p.tinta) return; c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = f.p.tinta; c.fillRect(0, 0, W, H); c.restore(); };

/* ---------- Dinossauros: corpo em "tubo" sombreado + cabeça, pernas com IK ---------- */
let PASS = 0, LIN = '#000';
function contorno() { c.fillStyle = LIN; c.fill(); c.lineWidth = .056; c.strokeStyle = LIN; c.stroke(); }
function pinta(cor) { if (PASS === 0) return contorno(); if (PASS === 2) { c.fillStyle = 'rgba(0,0,0,.3)'; return c.fill(); } c.fillStyle = typeof cor === 'function' ? cor() : cor; c.fill(); }
function gradV(y1, y2, ...cores) { const g = c.createLinearGradient(0, y1, 0, y2); cores.forEach((k, i) => g.addColorStop(i / (cores.length - 1), k)); return g; }
function segPath(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy); c.beginPath();
  if (d <= Math.abs(r1 - r2) + 1e-4) { c.arc(x1, y1, Math.max(r1, r2), 0, TAU); return; }
  const a = Math.atan2(dy, dx), o = Math.acos(clamp((r1 - r2) / d, -1, 1));
  c.arc(x1, y1, r1, a + o, a + TAU - o); c.arc(x2, y2, r2, a - o, a + o); c.closePath();
}
function segPinta(x1, y1, r1, x2, y2, r2, cs) {
  segPath(x1, y1, r1, x2, y2, r2);
  if (PASS !== 1) return pinta();
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, d = Math.hypot(x2 - x1, y2 - y1) || 1, r = Math.max(r1, r2);
  let sx = -(y2 - y1) / d, sy = (x2 - x1) / d; if (sy > 0 || (sy === 0 && sx > 0)) { sx = -sx; sy = -sy; }
  const g = c.createLinearGradient(mx + sx * r, my + sy * r, mx - sx * r, my - sy * r);
  g.addColorStop(0, cs.esc); g.addColorStop(.55, cs.med); g.addColorStop(1, cs.bar2); c.fillStyle = g; c.fill();
}
function ik(hx, hy, tx, ty, l1, l2, s) {
  const dx = tx - hx, dy = ty - hy, d = clamp(Math.hypot(dx, dy), 1e-4, l1 + l2 - 1e-4), a = Math.atan2(dy, dx);
  const ang = a + s * Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  return [hx + Math.cos(ang) * l1, hy + Math.sin(ang) * l1];
}
function crPts(P, n) {
  const out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t, f = k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([f(0), f(1), f(2)]);
    }
  }
  out.push(P[P.length - 1]); return out;
}
function tubo(P) {
  const s = crPts(P, 7), L = [], R = [], N = [];
  for (let i = 0; i < s.length; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d, r = Math.max(.005, s[i][2]);
    N.push([nx, ny]); L.push([s[i][0] + nx * r, s[i][1] + ny * r]); R.push([s[i][0] - nx * r, s[i][1] - ny * r]);
  }
  return { s, L, R, N };
}
function tuboPath(T) {
  const { s, L, R } = T, e = s[s.length - 1], p = s[s.length - 2];
  c.beginPath(); c.moveTo(R[0][0], R[0][1]); for (const q of R) c.lineTo(q[0], q[1]);
  const a = Math.atan2(e[1] - p[1], e[0] - p[0]); c.arc(e[0], e[1], e[2], a - PI / 2, a + PI / 2);
  for (let i = L.length - 1; i >= 0; i--) c.lineTo(L[i][0], L[i][1]);
  c.closePath();
}
function tuboPreenche(T, cs) {
  const { L, R, s } = T, n = L.length;
  for (let i = 0; i < n - 1; i++) {
    const j = Math.min(n - 1, i + 2), k = i + 1;
    c.beginPath(); c.moveTo(R[i][0], R[i][1]); c.lineTo(R[j][0], R[j][1]); c.lineTo(L[j][0], L[j][1]); c.lineTo(L[i][0], L[i][1]); c.closePath();
    const g = c.createLinearGradient(R[k][0], R[k][1], L[k][0], L[k][1]);
    g.addColorStop(0, cs.esc); g.addColorStop(.42, cs.med); g.addColorStop(.78, cs.bar); g.addColorStop(1, cs.barS);
    c.fillStyle = g; c.fill();
  }
  const e = s[n - 1]; c.fillStyle = cs.med; c.beginPath(); c.arc(e[0], e[1], e[2], 0, TAU); c.fill();
}
function detalhes(T, sp) {
  const cs = sp.cs, S2 = T.s, n = S2.length, N = T.N;
  tuboPath(T); c.save(); c.clip();
  c.fillStyle = cs.man;
  for (const [u, v, s] of sp.manchas) {
    const i = Math.min(n - 2, (u * (n - 1)) | 0), p = S2[i], q = S2[i + 1];
    c.beginPath(); c.ellipse(p[0] + N[i][0] * p[2] * v, p[1] + N[i][1] * p[2] * v, p[2] * s * 1.5, p[2] * s, Math.atan2(q[1] - p[1], q[0] - p[0]), 0, TAU); c.fill();
  }
  if (sp.listras) {
    c.strokeStyle = cs.man; c.lineCap = 'round';
    for (let u = .1; u < .78; u += .07) {
      const i = (u * (n - 1)) | 0, p = S2[i], r = p[2]; c.lineWidth = r * .16;
      c.beginPath(); c.moveTo(p[0] - N[i][0] * r * 1.05, p[1] - N[i][1] * r * 1.05); c.lineTo(p[0] - N[i][0] * r * .25 - .03, p[1] - N[i][1] * r * .25); c.stroke();
    }
  }
  c.fillStyle = 'rgba(255,255,235,.13)'; c.beginPath();          // brilho de luz nas costas (faixa contínua)
  for (let i = 0; i < n; i++) { const p = S2[i]; c.lineTo(p[0] - N[i][0] * p[2] * .72, p[1] - N[i][1] * p[2] * .72); }
  for (let i = n - 1; i >= 0; i--) { const p = S2[i]; c.lineTo(p[0] - N[i][0] * p[2] * .45, p[1] - N[i][1] * p[2] * .45); }
  c.fill();
  c.restore();
}
function olho(x, y, r, st, lin) {
  const fech = st.dorme > .5 || (st.t % 3.6) < .12;
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, y, r * 1.4, r * 1.2, 0, 0, TAU); c.fill();
  if (fech) { c.strokeStyle = '#1a1208'; c.lineWidth = r * .32; c.beginPath(); c.arc(x, y - r * .3, r * .95, .4, PI - .4); c.stroke(); return; }
  const ir = c.createRadialGradient(x - r * .2, y - r * .2, r * .1, x, y, r); ir.addColorStop(0, '#ffe08a'); ir.addColorStop(.6, '#d9962a'); ir.addColorStop(1, '#6e420c');
  c.fillStyle = ir; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.fillStyle = '#0d0804'; c.beginPath(); c.ellipse(x + r * .12, y + r * .05, r * .45, r * .55, 0, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(x + r * .38, y - r * .35, r * .26, 0, TAU); c.fill(); c.beginPath(); c.arc(x - r * .15, y + r * .38, r * .1, 0, TAU); c.fill();
  c.strokeStyle = rgba(lin, .7); c.lineWidth = r * .35; c.beginPath(); c.arc(x, y, r * 1.08, PI * 1.08, PI * 1.92); c.stroke();
}
function dentes(x1, x2, y, dir, n, h) {
  c.fillStyle = '#f6f0de'; c.strokeStyle = 'rgba(60,40,20,.35)'; c.lineWidth = .008;
  for (let i = 0; i < n; i++) { const x = lerp(x1, x2, i / (n - 1)), hh = h * (.7 + .3 * Math.abs(Math.sin(i * 1.7))); c.beginPath(); c.moveTo(x - .02, y); c.lineTo(x + .02, y); c.lineTo(x + .004, y + dir * hh); c.closePath(); c.fill(); c.stroke(); }
}
const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
function bocaDentro(hx, hy, ux, uy, jx, jy, ang) {
  const [tx, ty] = rot(jx - hx, jy - hy, ang);
  c.beginPath(); c.moveTo(hx, hy); c.lineTo(ux, uy); c.lineTo(hx + tx, hy + ty); c.closePath(); c.fillStyle = '#4a1216'; c.fill();
  c.save(); c.translate(hx, hy); c.rotate(ang * .8); c.beginPath(); c.ellipse((jx - hx) * .45, .04, Math.abs(jx - hx) * .3, .045, 0, 0, TAU); c.fillStyle = '#c85a68'; c.fill(); c.restore();
}

function cabecaRex(cs, st) {
  const ang = st.boca * .55, hx = -.04, hy = .03;
  if (PASS === 1 && st.boca > .03) bocaDentro(hx, hy, .76, .03, .74, .03, ang);
  c.save(); c.translate(hx, hy); c.rotate(ang);                                  // mandíbula
  c.beginPath(); c.moveTo(-.16, -.02); c.lineTo(.78, 0); c.bezierCurveTo(.76, .07, .56, .13, .26, .15); c.bezierCurveTo(.02, .16, -.18, .12, -.2, .02); c.closePath();
  pinta(() => gradV(-.02, .16, cs.med, cs.bar));
  if (PASS === 1) dentes(.16, .7, 0, -1, 9, .035);
  c.restore();
  c.beginPath(); c.moveTo(-.28, .06); c.bezierCurveTo(-.34, -.2, -.12, -.36, .14, -.34); c.bezierCurveTo(.36, -.33, .55, -.24, .72, -.15); c.bezierCurveTo(.81, -.11, .84, -.02, .77, .03); c.lineTo(-.02, .05); c.closePath();
  pinta(() => gradV(-.36, .06, cs.esc, cs.med, cs.bar2));
  if (PASS !== 1) return;
  dentes(.16, .72, .035, 1, 10, .042);
  c.strokeStyle = rgba(cs.lin, .55); c.lineWidth = .02; c.beginPath(); c.moveTo(-.02, .05); c.quadraticCurveTo(.35, .075, .77, .03); c.stroke();
  c.fillStyle = cs.man; for (const [x, y, r] of [[.5, -.2, .03], [.6, -.15, .022], [.38, -.25, .03], [.25, -.29, .025], [.43, -.14, .018], [.66, -.09, .015]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  c.fillStyle = rgba(cs.lin, .85); c.beginPath(); c.ellipse(.71, -.1, .026, .014, -.4, 0, TAU); c.fill();
  c.strokeStyle = rgba(cs.lin, .5); c.lineWidth = .032; c.beginPath(); c.moveTo(.0, -.27); c.quadraticCurveTo(.13, -.32, .26, -.25); c.stroke();
  olho(.13, -.19, .058, st, cs.lin);
}
function chifre(x, y, s) {
  c.beginPath(); c.moveTo(x - .05 * s, y + .02 * s); c.quadraticCurveTo(x + .15 * s, y - .22 * s, x + .48 * s, y - .42 * s); c.quadraticCurveTo(x + .2 * s, y - .15 * s, x + .08 * s, y + .03 * s); c.closePath();
  pinta(() => { const g = c.createLinearGradient(x, y, x + .48 * s, y - .42 * s); g.addColorStop(0, '#9c855c'); g.addColorStop(.5, '#e9dcbb'); g.addColorStop(1, '#fff8e6'); return g; });
}
function cabecaTri(cs, st) {
  const ang = st.boca * .4, hx = .08, hy = .12;
  c.save(); c.translate(-.12, -.28); c.rotate(-.55);                              // babado (frill)
  for (let i = 0; i < 13; i++) { const a = -PI * .95 + i / 12 * PI * 1.25; c.beginPath(); c.arc(Math.cos(a) * .3, Math.sin(a) * .46, .045, 0, TAU); pinta(cs.acc); }
  c.beginPath(); c.ellipse(0, 0, .3, .46, 0, 0, TAU);
  pinta(() => { const g = c.createRadialGradient(.06, .12, .05, 0, 0, .5); g.addColorStop(0, cs.med); g.addColorStop(.7, mix(cs.med, cs.acc, .5)); g.addColorStop(1, cs.acc); return g; });
  if (PASS === 1) { c.strokeStyle = rgba(cs.lin, .25); c.lineWidth = .03; c.beginPath(); c.ellipse(0, 0, .22, .36, 0, 0, TAU); c.stroke(); c.fillStyle = cs.man; for (const [x, y] of [[-.1, -.2], [-.15, .02], [-.08, .22]]) { c.beginPath(); c.ellipse(x, y, .045, .07, 0, 0, TAU); c.fill(); } }
  c.restore();
  if (PASS === 1) { const p = PASS; chifre(.19, -.25, 1); PASS = 2; chifre(.19, -.25, 1); PASS = p; } else chifre(.19, -.25, 1);
  if (PASS === 1 && st.boca > .03) bocaDentro(hx, hy, .58, .16, .45, .13, ang);
  c.save(); c.translate(hx, hy); c.rotate(ang);                                  // mandíbula
  c.beginPath(); c.moveTo(-.15, -.02); c.lineTo(.42, 0); c.bezierCurveTo(.45, .06, .4, .12, .3, .13); c.bezierCurveTo(.1, .15, -.1, .13, -.18, .04); c.closePath();
  pinta(() => gradV(-.02, .14, cs.med, cs.bar));
  if (PASS === 1) { c.beginPath(); c.moveTo(.3, 0); c.lineTo(.42, 0); c.bezierCurveTo(.45, .06, .4, .12, .3, .13); c.closePath(); c.fillStyle = '#3f2e22'; c.fill(); }
  c.restore();
  c.beginPath(); c.moveTo(-.2, -.2); c.bezierCurveTo(.05, -.36, .3, -.22, .48, -.06); c.bezierCurveTo(.6, .02, .66, .1, .6, .2); c.lineTo(.5, .13); c.lineTo(.15, .12); c.bezierCurveTo(-.05, .15, -.2, .12, -.24, 0); c.closePath();
  pinta(() => gradV(-.3, .15, cs.esc, cs.med, cs.bar2));
  if (PASS === 1) { c.beginPath(); c.moveTo(.46, -.07); c.bezierCurveTo(.6, .02, .66, .1, .6, .2); c.lineTo(.5, .13); c.bezierCurveTo(.5, .05, .47, 0, .42, -.03); c.closePath(); c.fillStyle = '#3f2e22'; c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(.54, .02, .03, .06, -.6, 0, TAU); c.fill(); }
  c.beginPath(); c.moveTo(.35, -.13); c.quadraticCurveTo(.4, -.3, .47, -.34); c.quadraticCurveTo(.46, -.2, .47, -.07); c.closePath();
  pinta(() => gradV(-.34, -.07, '#fff8e6', '#b8a378'));
  chifre(.12, -.22, 1);
  if (PASS !== 1) return;
  c.fillStyle = cs.man; for (const [x, y, r] of [[.2, -.2, .025], [.3, -.15, .02], [-.05, -.16, .03]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  olho(.06, -.1, .045, st, cs.lin);
}
function cabecaPesco(cs, st) {
  const ang = st.boca * .45, hx = 0, hy = .05;
  if (PASS === 1 && st.boca > .03) bocaDentro(hx, hy, .36, .05, .34, .05, ang);
  c.save(); c.translate(hx, hy); c.rotate(ang);
  c.beginPath(); c.moveTo(-.04, 0); c.lineTo(.34, 0); c.bezierCurveTo(.33, .05, .25, .08, .12, .08); c.bezierCurveTo(.02, .08, -.05, .05, -.04, 0); c.closePath();
  pinta(() => gradV(0, .08, cs.med, cs.bar));
  c.restore();
  c.beginPath(); c.moveTo(-.1, .05); c.bezierCurveTo(-.14, -.12, -.03, -.25, .1, -.23); c.bezierCurveTo(.18, -.22, .2, -.13, .3, -.09); c.bezierCurveTo(.38, -.06, .41, .02, .36, .05); c.lineTo(.04, .06); c.closePath();
  pinta(() => gradV(-.24, .06, cs.esc, cs.med, cs.bar2));
  if (PASS !== 1) return;
  c.strokeStyle = rgba(cs.lin, .5); c.lineWidth = .014; c.beginPath(); c.moveTo(.04, .055); c.quadraticCurveTo(.2, .07, .36, .05); c.stroke();
  c.fillStyle = rgba(cs.lin, .8); c.beginPath(); c.ellipse(.09, -.21, .022, .012, 0, 0, TAU); c.fill();
  olho(.05, -.09, .036, st, cs.lin);
}

function noTubo(T, u, v) {
  const n = T.s.length, i = clamp(Math.round(u * (n - 1)), 0, n - 1), p = T.s[i], N = T.N[i];
  return { x: p[0] + N[0] * p[2] * v, y: p[1] + N[1] * p[2] * v, nx: N[0], ny: N[1], tx: N[1], ty: -N[0], r: p[2] };
}
function osso(P, h, w, cores) {              // placa ou espinho saindo do corpo (direção: para fora das costas)
  const dx = -P.nx, dy = -P.ny, tx = P.tx, ty = P.ty;
  c.beginPath(); c.moveTo(P.x - tx * w / 2, P.y - ty * w / 2);
  c.quadraticCurveTo(P.x + dx * h * .55 - tx * w * .6, P.y + dy * h * .55 - ty * w * .6, P.x + dx * h, P.y + dy * h);
  c.quadraticCurveTo(P.x + dx * h * .55 + tx * w * .6, P.y + dy * h * .55 + ty * w * .6, P.x + tx * w / 2, P.y + ty * w / 2); c.closePath();
  pinta(() => { const g = c.createLinearGradient(P.x, P.y, P.x + dx * h, P.y + dy * h); cores.forEach((k, i) => g.addColorStop(i / (cores.length - 1), k)); return g; });
}
function placasEstego(T, cs) {
  const pl = [mix(cs.acc, cs.esc, .35), cs.acc, mix(cs.acc, '#ffffff', .3)];
  for (const [u, h] of [[.18, .16], [.27, .23], [.36, .31], [.45, .37], [.54, .39], [.63, .35], [.72, .28], [.8, .2], [.87, .13]]) osso(noTubo(T, u, -.8), h, h * .62, pl);
  const es = ['#9c855c', '#e9dcbb', '#fff8e6'];
  for (const u of [.03, .07]) { const P = noTubo(T, u, -.6); osso({ ...P, nx: P.nx * .7 + P.tx * .7, ny: P.ny * .7 + P.ty * .7 }, .32, .07, es); }
}
function armaduraAnqui(T, cs) {
  const p = T.s[0], q = T.s[2];
  c.beginPath(); c.ellipse(p[0] - .02, p[1], .24, .16, Math.atan2(q[1] - p[1], q[0] - p[0]), 0, TAU);
  pinta(() => { const g = c.createRadialGradient(p[0] - .06, p[1] - .06, .02, p[0], p[1], .25); g.addColorStop(0, '#f1e6c4'); g.addColorStop(1, cs.acc); return g; });
  if (PASS !== 1) return;
  for (let u = .12; u < .92; u += .055) for (const v of [-.88, -.5, -.1]) {
    const P = noTubo(T, u + (v === -.5 ? .027 : 0), v), r = Math.max(.025, P.r * .15);
    const g = c.createRadialGradient(P.x - r * .3, P.y - r * .4, r * .1, P.x, P.y, r); g.addColorStop(0, '#f4ead0'); g.addColorStop(1, mix(cs.acc, cs.esc, .3));
    c.fillStyle = g; c.beginPath(); c.arc(P.x, P.y, r, 0, TAU); c.fill(); c.strokeStyle = rgba(cs.lin, .5); c.lineWidth = .012; c.stroke();
  }
  c.fillStyle = '#efe3c2';
  for (let u = .25; u < .85; u += .09) { const P = noTubo(T, u, .35), d = .13; c.beginPath(); c.moveTo(P.x - P.tx * .05, P.y - P.ty * .05); c.lineTo(P.x + P.nx * d - P.tx * .06, P.y + P.ny * d - P.ty * .06); c.lineTo(P.x + P.tx * .05, P.y + P.ty * .05); c.fill(); }
}
function cabecaEstego(cs, st) {
  const ang = st.boca * .4;
  if (PASS === 1 && st.boca > .03) bocaDentro(0, .05, .4, .04, .36, .04, ang);
  c.save(); c.translate(0, .05); c.rotate(ang);
  c.beginPath(); c.moveTo(-.06, 0); c.lineTo(.36, 0); c.bezierCurveTo(.34, .05, .25, .07, .12, .07); c.bezierCurveTo(.02, .07, -.06, .05, -.06, 0); c.closePath();
  pinta(() => gradV(0, .07, cs.med, cs.bar)); c.restore();
  c.beginPath(); c.moveTo(-.1, .05); c.bezierCurveTo(-.12, -.1, .02, -.17, .16, -.14); c.bezierCurveTo(.28, -.11, .38, -.04, .41, .02); c.lineTo(.36, .05); c.lineTo(.03, .06); c.closePath();
  pinta(() => gradV(-.17, .06, cs.esc, cs.med, cs.bar2));
  if (PASS !== 1) return;
  c.fillStyle = '#3a2e1e'; c.beginPath(); c.moveTo(.34, -.02); c.lineTo(.41, .02); c.lineTo(.36, .05); c.closePath(); c.fill();
  olho(.08, -.06, .03, st, cs.lin);
}
function cabecaAnqui(cs, st) {
  const ang = st.boca * .35;
  if (PASS === 1 && st.boca > .03) bocaDentro(0, .08, .3, .08, .28, .08, ang);
  c.save(); c.translate(0, .08); c.rotate(ang);
  c.beginPath(); c.moveTo(-.08, 0); c.lineTo(.3, 0); c.bezierCurveTo(.3, .05, .22, .07, .1, .07); c.bezierCurveTo(0, .07, -.08, .04, -.08, 0); c.closePath();
  pinta(() => gradV(0, .07, cs.med, cs.bar)); c.restore();
  c.beginPath(); c.moveTo(-.1, .08); c.lineTo(-.14, -.06); c.lineTo(-.24, -.13); c.lineTo(-.06, -.15); c.bezierCurveTo(.08, -.2, .25, -.16, .32, -.06); c.bezierCurveTo(.36, 0, .35, .06, .31, .08); c.lineTo(0, .09); c.closePath();
  pinta(() => gradV(-.2, .09, cs.esc, cs.med, cs.bar2));
  if (PASS !== 1) return;
  c.fillStyle = rgba(cs.acc, .9); for (const [x, y] of [[.05, -.13], [.15, -.14], [.24, -.1]]) { c.beginPath(); c.arc(x, y, .028, 0, TAU); c.fill(); }
  olho(.06, -.07, .03, st, cs.lin);
}
function cabecaPara(cs, st) {
  const crista = { esc: mix(cs.acc, '#000000', .35), med: cs.acc, bar2: mix(cs.acc, '#ffffff', .35) };
  segPinta(.0, -.12, .075, -.72, -.52, .05, crista);
  if (PASS === 1) { c.strokeStyle = rgba(cs.lin, .35); c.lineWidth = .015; c.beginPath(); c.moveTo(-.05, -.1); c.lineTo(-.7, -.5); c.stroke(); }
  const ang = st.boca * .45;
  if (PASS === 1 && st.boca > .03) bocaDentro(.02, .06, .54, .07, .5, .07, ang);
  c.save(); c.translate(.02, .06); c.rotate(ang);
  c.beginPath(); c.moveTo(-.1, 0); c.lineTo(.52, .01); c.bezierCurveTo(.5, .07, .4, .09, .25, .09); c.bezierCurveTo(.05, .1, -.1, .07, -.1, 0); c.closePath();
  pinta(() => gradV(0, .1, cs.med, cs.bar)); c.restore();
  c.beginPath(); c.moveTo(-.14, .06); c.bezierCurveTo(-.17, -.12, -.03, -.22, .12, -.2); c.bezierCurveTo(.28, -.18, .4, -.08, .52, -.05); c.bezierCurveTo(.6, -.03, .62, .05, .56, .07); c.lineTo(.02, .07); c.closePath();
  pinta(() => gradV(-.22, .07, cs.esc, cs.med, cs.bar2));
  if (PASS !== 1) return;
  c.fillStyle = 'rgba(40,20,10,.55)'; c.beginPath(); c.moveTo(.42, -.06); c.bezierCurveTo(.56, -.04, .62, .03, .56, .07); c.lineTo(.44, .06); c.closePath(); c.fill();
  c.fillStyle = rgba(cs.lin, .8); c.beginPath(); c.ellipse(.4, -.06, .022, .012, 0, 0, TAU); c.fill();
  olho(.08, -.1, .042, st, cs.lin);
}
/* Ptera (pteranodonte): voa, desenho próprio com asas batendo */
function desenhaPtera(st, x, y, k) {
  const f = Math.sin(st.t * 7), cs = { esc: '#5a3d2e', med: '#b07a52', bar: '#efd9b8', lin: '#2a1810' };
  c.save(); c.translate(x, y); c.scale(st.vira ? -k : k, k); c.rotate(-.08 + Math.cos(st.t * 7) * .03); c.lineJoin = 'round'; c.lineCap = 'round';
  const asa = (lado) => {                                   // lado 1 = asa de perto, -1 = de longe
    const up = f * (lado > 0 ? 1 : .85), wx = -.05 + (lado > 0 ? 0 : .08), wy = -.55 * up - .05, tx = -.5 + Math.abs(up) * .1, ty = -1.25 * up - .1;
    c.beginPath(); c.moveTo(.18, -.04); c.quadraticCurveTo(.15, wy * .5 - .05, wx, wy); c.lineTo(tx, ty);
    c.quadraticCurveTo(-.3, (ty + .05) * .45, -.42, .04); c.closePath();
    const g = c.createLinearGradient(0, 0, tx, ty); g.addColorStop(0, lado > 0 ? '#c98a5a' : '#8a5a3a'); g.addColorStop(1, lado > 0 ? '#e8b888' : '#a8724a');
    c.fillStyle = g; c.fill(); c.strokeStyle = cs.lin; c.lineWidth = .025; c.stroke();
    c.strokeStyle = 'rgba(80,40,20,.35)'; c.lineWidth = .012; for (const t of [.35, .6, .85]) { c.beginPath(); c.moveTo(wx * t + .1 * (1 - t), wy * t); c.lineTo(lerp(-.42, tx, t), lerp(.04, ty, t) * .8); c.stroke(); }
    c.strokeStyle = mix(cs.esc, '#000000', lado > 0 ? 0 : .3); c.lineWidth = .045; c.beginPath(); c.moveTo(.18, -.04); c.quadraticCurveTo(.15, wy * .5 - .05, wx, wy); c.lineTo(tx, ty); c.stroke();
  };
  asa(-1);
  c.strokeStyle = cs.esc; c.lineWidth = .05; c.beginPath(); c.moveTo(-.35, .04); c.lineTo(-.62, .12); c.stroke();
  c.beginPath(); c.ellipse(0, 0, .42, .13, -.05, 0, TAU); c.fillStyle = gradV(-.13, .13, cs.esc, cs.med, cs.bar); c.fill(); c.strokeStyle = cs.lin; c.lineWidth = .025; c.stroke();
  c.beginPath(); c.moveTo(.3, -.06); c.lineTo(-.02, -.36); c.lineTo(.45, -.16); c.bezierCurveTo(.7, -.1, 1.0, -.05, 1.22, .0); c.lineTo(.62, .06); c.bezierCurveTo(.5, .08, .38, .05, .3, -.06); c.closePath();
  c.fillStyle = gradV(-.36, .08, '#d9442a', cs.med, cs.bar); c.fill(); c.stroke();
  c.strokeStyle = rgba(cs.lin, .5); c.lineWidth = .015; c.beginPath(); c.moveTo(.5, .02); c.lineTo(1.15, .0); c.stroke();
  olho(.45, -.08, .035, st, cs.lin);
  asa(1);
  c.restore();
  st.bocaXY = [x + .5 * k * (st.vira ? -1 : 1), y];
}
function cores(esc, med, bar, lin, man, acc) { return { esc, med, bar, lin, man, acc: acc || med, bar2: mix(med, bar, .45), barS: mix(bar, esc, .35) }; }
const pernaQ = (q, l, r, dobra, fase, longe, passo, alto, tornoz = .09) => ({ q, l, r, pe: .02, calc: 0, tornoz, passo, alto, dobra, tipo: 'q', fase, longe });
const ESP = {
  rex: {
    nome: 'Rex', cs: cores('#33481c', '#6b8f3a', '#ddd2a0', '#18220c', 'rgba(28,38,12,.33)'), quadril: 0, deita: .42, cabDorme: .35,
    spine: [[-2.3, -1.2, .02], [-1.75, -1.22, .09], [-1.15, -1.25, .19], [-.55, -1.23, .33], [0, -1.17, .4], [.42, -1.14, .36], [.72, -1.3, .26], [.88, -1.58, .19], [.95, -1.8, .18]],
    cab: [.02, -.02], cabAng: .05, cabeca: cabecaRex, bocaP: [.62, .08], bracos: true, sombra: [-.2, 1.35], listras: true, seed: 3,
    pernas: [
      { q: [-.02, -1.02], l: [.52, .52], r: [.27, .15, .075], pe: .05, calc: .1, tornoz: .14, passo: .26, alto: .14, dobra: -1, tipo: 'bi', fase: PI, longe: true },
      { q: [-.02, -1.02], l: [.52, .52], r: [.27, .15, .075], pe: .05, calc: .1, tornoz: .14, passo: .26, alto: .14, dobra: -1, tipo: 'bi', fase: 0, longe: false }]
  },
  tri: {
    nome: 'Tri', cs: cores('#6e3418', '#bd6a2c', '#ecca98', '#2e1508', 'rgba(50,22,8,.3)', '#e0a43c'), quadril: -.4, deita: .25, cabDorme: .2, inclina: -.38,
    spine: [[-1.9, -.9, .02], [-1.4, -.95, .1], [-.85, -1.02, .26], [-.3, -1.08, .42], [.3, -1.05, .42], [.75, -.95, .3], [1.0, -.9, .24]],
    cab: [0, 0], cabAng: .15, cabeca: cabecaTri, bocaP: [.5, .16], sombra: [0, 1.35], seed: 7,
    pernas: [
      pernaQ([-.4, -.88], [.4, .38], [.24, .15, .12], -1, PI, true, .2, .1), pernaQ([.55, -.8], [.36, .34], [.17, .12, .1], 1, 0, true, .2, .1),
      pernaQ([-.4, -.88], [.4, .38], [.24, .15, .12], -1, 0, false, .2, .1), pernaQ([.55, -.8], [.36, .34], [.17, .12, .1], 1, PI, false, .2, .1)]
  },
  pesco: {
    nome: 'Pesco', cs: cores('#34506a', '#6d92ad', '#d6dee3', '#16232f', 'rgba(20,35,50,.25)'), quadril: -.4, deita: .3, cabDorme: .3,
    spine: [[-2.4, -1.6, .02], [-1.6, -1.7, .12], [-.8, -1.85, .3], [-.1, -1.97, .5], [.55, -2.1, .48], [.98, -2.5, .3], [1.22, -3.2, .18], [1.38, -3.9, .13], [1.48, -4.4, .11]],
    spine2: [[-2.4, -1.6, .02], [-1.6, -1.7, .12], [-.8, -1.85, .3], [-.1, -1.97, .5], [.55, -2.1, .48], [1.1, -2.35, .3], [1.65, -2.5, .18], [2.15, -2.4, .13], [2.55, -2.15, .11]],
    cab: [.01, -.03], cabAng: .1, cabAng2: .7, cabeca: cabecaPesco, bocaP: [.3, .06], sombra: [.1, 1.9], seed: 11,
    pernas: [
      pernaQ([-.4, -1.8], [.95, .82], [.3, .2, .15], -1, PI, true, .28, .14, .1), pernaQ([.75, -1.95], [1.0, .86], [.25, .17, .14], 1, 0, true, .28, .14, .1),
      pernaQ([-.4, -1.8], [.95, .82], [.3, .2, .15], -1, 0, false, .28, .14, .1), pernaQ([.75, -1.95], [1.0, .86], [.25, .17, .14], 1, PI, false, .28, .14, .1)]
  }
};
ESP.estego = {
  nome: 'Estego', cs: cores('#3f4a22', '#7d8a46', '#e3dcae', '#1c220c', 'rgba(30,40,10,.3)', '#c8622e'), quadril: -.35, deita: .3, cabDorme: .15,
  spine: [[-2.0, -1.05, .03], [-1.5, -1.2, .1], [-.95, -1.38, .25], [-.35, -1.48, .44], [.25, -1.32, .42], [.7, -1.05, .28], [1.0, -.82, .16], [1.15, -.72, .12]],
  cab: [0, 0], cabAng: .3, cabeca: cabecaEstego, bocaP: [.36, .06], sombra: [-.2, 1.4], seed: 13, atras: placasEstego,
  pernas: [
    pernaQ([-.35, -1.2], [.6, .55], [.25, .16, .12], -1, PI, true, .22, .1), pernaQ([.55, -.95], [.45, .42], [.15, .11, .09], 1, 0, true, .2, .1),
    pernaQ([-.35, -1.2], [.6, .55], [.25, .16, .12], -1, 0, false, .22, .1), pernaQ([.55, -.95], [.45, .42], [.15, .11, .09], 1, PI, false, .2, .1)]
};
ESP.anqui = {
  nome: 'Anqui', cs: cores('#4a4128', '#8a7a4a', '#d9cc9a', '#221d10', 'rgba(40,30,10,.3)', '#cdbb88'), quadril: -.3, deita: .18, cabDorme: .12,
  spine: [[-1.9, -.8, .07], [-1.4, -.82, .1], [-.85, -.88, .25], [-.3, -.95, .42], [.3, -.93, .4], [.75, -.8, .26], [1.0, -.68, .18]],
  cab: [0, 0], cabAng: .15, cabeca: cabecaAnqui, bocaP: [.3, .08], sombra: [0, 1.4], seed: 17, frente: armaduraAnqui,
  pernas: [
    pernaQ([-.3, -.68], [.33, .3], [.2, .14, .12], -1, PI, true, .16, .08, .08), pernaQ([.5, -.62], [.3, .28], [.16, .12, .1], 1, 0, true, .16, .08, .08),
    pernaQ([-.3, -.68], [.33, .3], [.2, .14, .12], -1, 0, false, .16, .08, .08), pernaQ([.5, -.62], [.3, .28], [.16, .12, .1], 1, PI, false, .16, .08, .08)]
};
ESP.para = {
  nome: 'Para', cs: cores('#5a1f24', '#9c3b34', '#f0d7a8', '#260b0d', 'rgba(50,10,10,.28)', '#e8a33a'), quadril: 0, deita: .45, cabDorme: .35,
  spine: [[-2.1, -1.35, .02], [-1.55, -1.4, .1], [-1.0, -1.45, .2], [-.45, -1.45, .34], [.05, -1.4, .38], [.45, -1.38, .32], [.75, -1.55, .2], [.9, -1.85, .15], [.98, -2.05, .14]],
  cab: [.02, -.02], cabAng: .1, cabeca: cabecaPara, bocaP: [.5, .09], bracos: true, ombro: [.55, -1.28], bracoL: [.24, .2], sombra: [-.2, 1.35], listras: true, seed: 19,
  pernas: [
    { q: [-.05, -1.2], l: [.6, .58], r: [.27, .15, .075], pe: .05, calc: .1, tornoz: .14, passo: .26, alto: .14, dobra: -1, tipo: 'bi', fase: PI, longe: true },
    { q: [-.05, -1.2], l: [.6, .58], r: [.27, .15, .075], pe: .05, calc: .1, tornoz: .14, passo: .26, alto: .14, dobra: -1, tipo: 'bi', fase: 0, longe: false }]
};
const NOMES = { rex: 'Rex, o tiranossauro!', tri: 'Tri, o tricerátops!', pesco: 'Pesco, o braquiossauro!', estego: 'Estego, o estegossauro!', anqui: 'Anqui, o anquilossauro!', para: 'Para, o parassaurolofo!', bebe: 'Um bebê tricerátops!', ptera: 'Ptera, o pteranodonte!' };
for (const k in ESP) { const sp = ESP[k], r = rng(sp.seed); sp.manchas = []; for (let i = 0; i < 70; i++) sp.manchas.push([r() * .92, -1 + Math.pow(r(), 1.6) * 1.5, .06 + r() * .12]); }

function poseSpine(sp, st, dy) {
  const q = sp.quadril, out = [], lento = st.dorme > .5;
  for (let i = 0; i < sp.spine.length; i++) {
    let [x, y, r] = sp.spine[i];
    if (sp.spine2 && st.abaixa > .001) { const p2 = sp.spine2[i]; x = lerp(x, p2[0], st.abaixa); y = lerp(y, p2[1], st.abaixa); r = lerp(r, p2[2], st.abaixa); }
    const d = Math.max(0, q - x);
    if (st.sentado && d > 0) { x = q - d * .42; y += d * .14; }
    y += Math.sin(st.t * (lento ? 1 : 2.2) - d * 1.3) * .05 * d;
    if (d === 0 && x - q < 1.2) r *= 1 + Math.sin(st.t * (lento ? 1.4 : 2.6)) * .025;
    out.push([x, y + dy, r]);
  }
  return out;
}
function perna(L, st, cs, dy) {
  const hx = L.q[0] + (L.longe ? .1 : 0), hy = L.q[1] + dy, ph = st.fase + L.fase, an = st.anda ? 1 : 0;
  const fx = hx + L.pe + L.passo * an * Math.sin(ph), lift = an * Math.max(0, Math.cos(ph)) * L.alto;
  let ax = fx - L.calc, ay = -L.tornoz - lift;
  const dx = ax - hx, dyy = ay - hy, d = Math.hypot(dx, dyy), m = L.l[0] + L.l[1] - .01;
  if (d > m) { ax = hx + dx / d * m; ay = hy + dyy / d * m; }
  const [kx, ky] = ik(hx, hy, ax, ay, L.l[0], L.l[1], L.dobra);
  segPinta(hx, hy, L.r[0], kx, ky, L.r[1], cs);
  segPinta(kx, ky, L.r[1], ax, ay, L.r[2], cs);
  if (L.tipo === 'bi') {
    const tx = fx + .2, ty = Math.min(-.04 - lift * .6, ay + .1);
    segPinta(ax, ay, L.r[2], tx, ty, .045, cs);
    if (PASS === 1) { c.fillStyle = '#e9dfc4'; for (const o of [-.022, .022]) { c.beginPath(); c.moveTo(tx + .02, ty - .025 + o); c.lineTo(tx + .1, ty + .015 + o * .5); c.lineTo(tx + .02, ty + .025 + o); c.fill(); } }
  } else {
    const w = L.r[2] * 1.15, fb = Math.min(-lift, ay + L.tornoz);
    c.beginPath(); c.moveTo(ax - w, ay); c.lineTo(ax + w, ay); c.quadraticCurveTo(ax + w * 1.3, fb, ax + w * 1.1, fb); c.lineTo(ax - w * 1.05, fb); c.quadraticCurveTo(ax - w * 1.2, fb, ax - w, ay); c.closePath();
    pinta(cs.esc);
    if (PASS === 1) { c.fillStyle = '#d8ccb0'; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(ax - w * .3 + i * w * .55, fb - .02, w * .2, .028, 0, 0, TAU); c.fill(); } }
  }
}
function braco(sp, st, cs, dy, longe) {
  const [ox, oy] = sp.ombro || [.6, -1.14], [b1, b2] = sp.bracoL || [.16, .14];
  const sx = ox - (longe ? .06 : 0), sy = oy + dy - (longe ? .02 : 0), w = Math.sin(st.t * 9 + (longe ? 1 : 0));
  let a1, a2;
  if (st.acena) { a1 = .3 + w * .35; a2 = -1 + w * .4; }
  else if (st.dirige) { a1 = 1.0; a2 = -.1 + Math.sin(st.t * 3 + (longe ? 1 : 0)) * .08; }
  else { a1 = 1.3 + Math.sin(st.t * 2 + (longe ? 1 : 0)) * .08; a2 = .1; }
  const ex = sx + Math.cos(a1) * b1, ey = sy + Math.sin(a1) * b1, hx = ex + Math.cos(a2) * b2, hy = ey + Math.sin(a2) * b2;
  segPinta(sx, sy, .06, ex, ey, .045, cs); segPinta(ex, ey, .045, hx, hy, .035, cs);
  if (PASS === 1) { c.strokeStyle = '#e9dfc4'; c.lineWidth = .016; for (const o of [-.015, .02]) { c.beginPath(); c.moveTo(hx + .02, hy + o); c.quadraticCurveTo(hx + .06, hy + o, hx + .07, hy + o + .03); c.stroke(); } }
}
function desenhaDino(sp, st, x, y, k) {
  const cs = sp.cs; LIN = cs.lin;
  c.save(); c.translate(x, y); c.scale(st.vira ? -k : k, k); c.lineJoin = 'round'; c.lineCap = 'round';
  if (st.sentado && sp.inclina) { c.translate(sp.quadril, -1); c.rotate(sp.inclina); c.translate(-sp.quadril, 1); }
  if (!st.sentado) { c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(sp.sombra[0], 0, sp.sombra[1] * (1 + st.dy * .5), .09, 0, 0, TAU); c.fill(); }
  const dy = (st.anda ? -Math.abs(Math.sin(st.fase)) * .035 : 0) + st.dy + st.dorme * sp.deita;
  const P = poseSpine(sp, st, dy), T = tubo(P), e = P[P.length - 1];
  if (!st.sentado) for (PASS = 0; PASS < 3; PASS++) for (const L of sp.pernas) if (L.longe) perna(L, st, cs, dy);
  if (sp.bracos) for (PASS = 0; PASS < 3; PASS++) braco(sp, st, cs, dy, true);
  const ang = lerp(sp.cabAng, sp.cabAng2 ?? sp.cabAng, st.abaixa) + (st.anda ? Math.sin(st.fase * 2) * .04 : Math.sin(st.t * 1.3) * .03) + st.dorme * sp.cabDorme + st.cabExtra;
  for (PASS = 0; PASS < 2; PASS++) {
    if (sp.atras) sp.atras(T, cs, st);
    if (PASS === 0) { tuboPath(T); contorno(); } else { tuboPreenche(T, cs); detalhes(T, sp); }
    if (sp.frente) sp.frente(T, cs, st);
    c.save(); c.translate(e[0] + sp.cab[0], e[1] + sp.cab[1]); c.rotate(ang); sp.cabeca(cs, st);
    if (PASS === 1) { const m = c.getTransform().transformPoint(new DOMPoint(sp.bocaP[0], sp.bocaP[1])); st.bocaXY = [m.x / DPR, m.y / DPR]; }
    c.restore();
  }
  if (!st.sentado) for (PASS = 0; PASS < 2; PASS++) for (const L of sp.pernas) if (!L.longe) perna(L, st, cs, dy);
  if (sp.bracos) for (PASS = 0; PASS < 2; PASS++) braco(sp, st, cs, dy, false);
  PASS = 1; c.restore();
}
function novoDino() { return { t: Math.random() * 10, fase: 0, anda: false, boca: 0, bocaAlvo: 0, dorme: 0, dormeAlvo: 0, vira: false, sentado: false, abaixa: 0, abaixaAlvo: 0, dy: 0, pulo: 0, acena: false, dirige: false, mastiga: 0, fome: 3, bocaXY: null, cabExtra: 0 }; }
function atualizaDino(st, dt) {
  st.t += dt;
  if (st.mastiga > 0) { st.mastiga -= dt; st.boca = Math.abs(Math.sin(st.mastiga * 13)) * .45; }
  else st.boca = lerp(st.boca, st.bocaAlvo, suave(dt, 10));
  if (st.pulo > 0) { st.pulo = Math.max(0, st.pulo - dt); st.dy = -Math.sin((1 - st.pulo / .6) * PI) * .35; } else st.dy = 0;
  st.abaixa = lerp(st.abaixa, st.abaixaAlvo, suave(dt, 3));
  st.dorme = lerp(st.dorme, st.dormeAlvo, suave(dt, 3));
}
const rex = novoDino(), tri = novoDino(), pesco = novoDino();
const estego = novoDino(), anqui = novoDino(), para = novoDino(), bebe = novoDino(), ptera = novoDino();
const DINOS = [[rex, ESP.rex], [tri, ESP.tri], [pesco, ESP.pesco], [estego, ESP.estego], [anqui, ESP.anqui], [para, ESP.para], [bebe, ESP.tri], [ptera, null]];

/* ---------- Carrinho (jipe) ---------- */
function pneu(x, y, r, ang) {
  c.save(); c.translate(x, y);
  const g = c.createRadialGradient(-r * .25, -r * .25, r * .1, 0, 0, r); g.addColorStop(0, '#3d3d3d'); g.addColorStop(.7, '#1f1f1f'); g.addColorStop(1, '#0e0e0e');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
  c.rotate(ang); c.fillStyle = '#2e2e2e';
  for (let i = 0; i < 14; i++) { c.rotate(TAU / 14); c.fillRect(r * .84, -r * .07, r * .14, r * .14); }
  const a = c.createLinearGradient(-r * .5, -r * .5, r * .5, r * .5); a.addColorStop(0, '#f5f5f5'); a.addColorStop(.5, '#b5bcc2'); a.addColorStop(1, '#5f676e');
  c.fillStyle = a; c.beginPath(); c.arc(0, 0, r * .52, 0, TAU); c.fill();
  c.fillStyle = '#3a4046'; for (let i = 0; i < 5; i++) { c.rotate(TAU / 5); c.beginPath(); c.arc(r * .3, 0, r * .085, 0, TAU); c.fill(); }
  c.fillStyle = '#d6dbe0'; c.beginPath(); c.arc(0, 0, r * .13, 0, TAU); c.fill(); c.fillStyle = '#555'; c.beginPath(); c.arc(0, 0, r * .05, 0, TAU); c.fill();
  c.restore();
}
function banco(x, top) { rr(x, top, .26, -.9 - top, .08); const g = c.createLinearGradient(x, 0, x + .26, 0); g.addColorStop(0, '#6b4429'); g.addColorStop(1, '#3e2614'); c.fillStyle = g; c.fill(); c.strokeStyle = '#24150a'; c.lineWidth = .02; c.stroke(); }
function carroFundo(x, y, k, b) {
  c.save(); c.translate(x, y); c.scale(k, k);
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, .01, 1.6, .1, 0, 0, TAU); c.fill();
  c.translate(0, b);
  pneu(-1.55, -.78, .27, 0);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-1.18, -.93); c.lineTo(-1.08, -1.7); c.quadraticCurveTo(-1.04, -1.82, -.9, -1.82); c.lineTo(-.66, -1.82); c.quadraticCurveTo(-.54, -1.82, -.52, -1.7); c.lineTo(-.46, -.93);
  c.strokeStyle = '#1e2226'; c.lineWidth = .12; c.stroke(); c.strokeStyle = '#4a525a'; c.lineWidth = .08; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = .02; c.stroke();
  banco(-1.32, -1.3); banco(-.44, -1.42);
  c.restore();
}
function carroFrente(x, y, k, b, roda) {
  c.save(); c.translate(x, y); c.scale(k, k); c.lineCap = 'round'; c.lineJoin = 'round';
  c.save(); c.translate(0, b);
  c.strokeStyle = '#1b1b1b'; c.lineWidth = .05; c.beginPath(); c.moveTo(.6, -.96); c.lineTo(.45, -1.12); c.stroke();
  c.lineWidth = .045; c.beginPath(); c.ellipse(.43, -1.15, .05, .15, -.35, 0, TAU); c.stroke();
  c.beginPath(); c.moveTo(-1.42, -.97); c.lineTo(.52, -.97); c.lineTo(.6, -1.02); c.lineTo(1.28, -.93); c.quadraticCurveTo(1.46, -.9, 1.47, -.76); c.lineTo(1.48, -.46); c.lineTo(1.316, -.42);
  c.arc(.85, -.36, .47, -.13, PI + .13, true); c.lineTo(-.384, -.42); c.arc(-.85, -.36, .47, -.13, PI + .13, true); c.lineTo(-1.46, -.42); c.lineTo(-1.47, -.86); c.quadraticCurveTo(-1.47, -.97, -1.42, -.97); c.closePath();
  const gr = c.createLinearGradient(0, -1.02, 0, -.42); gr.addColorStop(0, '#ff9a4d'); gr.addColorStop(.25, '#f06a22'); gr.addColorStop(.75, '#c94812'); gr.addColorStop(1, '#8a2d08');
  c.fillStyle = gr; c.fill(); c.strokeStyle = '#3d1404'; c.lineWidth = .03; c.stroke();
  c.save(); c.clip();
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-1.5, -.93, 3, .05);
  c.fillStyle = '#fff1c9'; c.fillRect(-1.5, -.74, 3.1, .07); c.fillStyle = 'rgba(61,20,4,.5)'; c.fillRect(-1.5, -.67, 3.1, .015);
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-1.5, -.5, 3.1, .1);
  c.restore();
  c.strokeStyle = '#1e1e1e'; c.lineWidth = .05; c.beginPath(); c.moveTo(-1.42, -.97); c.lineTo(.52, -.97); c.stroke();
  c.strokeStyle = 'rgba(60,15,0,.55)'; c.lineWidth = .02; c.beginPath(); c.moveTo(-.3, -.96); c.quadraticCurveTo(-.24, -.72, -.3, -.46); c.moveTo(.4, -.96); c.lineTo(.38, -.46); c.stroke();
  c.fillStyle = '#2a2a2a'; rr(.18, -.86, .12, .035, .015); c.fill();
  c.strokeStyle = '#2a2a2a'; c.lineWidth = .04; c.beginPath(); c.moveTo(.64, -1.06); c.lineTo(1.18, -.98); c.stroke();
  c.strokeStyle = 'rgba(190,230,255,.7)'; c.lineWidth = .025; c.beginPath(); c.moveTo(.66, -1.09); c.lineTo(1.12, -1.02); c.stroke();
  const fg = c.createRadialGradient(1.44, -.76, 0, 1.44, -.76, .1); fg.addColorStop(0, '#fffbe6'); fg.addColorStop(1, '#f2c14e');
  c.fillStyle = fg; c.beginPath(); c.ellipse(1.44, -.76, .05, .09, 0, 0, TAU); c.fill(); c.strokeStyle = '#3d1404'; c.lineWidth = .02; c.stroke();
  c.fillStyle = '#ff3b30'; rr(-1.5, -.9, .06, .13, .02); c.fill();
  c.fillStyle = '#2b2b2b'; rr(1.36, -.53, .22, .13, .05); c.fill(); rr(-1.6, -.53, .22, .13, .05); c.fill();
  c.restore();
  pneu(-.85, -.36, .36, roda); pneu(.85, -.36, .36, roda);
  c.restore();
}

/* ---------- Comidas e objetos ---------- */
function fruta(tipo, x, y, s, a = 0) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  if (tipo === 0) {                                                               // maçã
    c.strokeStyle = '#5a3a1e'; c.lineWidth = .1; c.beginPath(); c.moveTo(0, -.7); c.quadraticCurveTo(.05, -1, .2, -1.15); c.stroke();
    c.save(); c.translate(.38, -.98); c.rotate(-.5); c.beginPath(); c.ellipse(0, 0, .28, .12, 0, 0, TAU); c.fillStyle = gradV(-.12, .12, '#8fd14f', '#3c7d1e'); c.fill(); c.restore();
    c.beginPath(); c.moveTo(0, -.72); c.bezierCurveTo(.5, -1.05, 1.05, -.6, .95, .05); c.bezierCurveTo(.88, .7, .4, 1, 0, .85); c.bezierCurveTo(-.4, 1, -.88, .7, -.95, .05); c.bezierCurveTo(-1.05, -.6, -.5, -1.05, 0, -.72);
    const g = c.createRadialGradient(-.35, -.35, .1, 0, 0, 1.1); g.addColorStop(0, '#ff7a6b'); g.addColorStop(.55, '#d7261e'); g.addColorStop(1, '#7d0f0c');
    c.fillStyle = g; c.fill(); c.strokeStyle = 'rgba(70,0,0,.5)'; c.lineWidth = .05; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-.42, -.32, .15, .28, -.5, 0, TAU); c.fill();
  } else if (tipo === 1) {                                                        // melancia
    c.beginPath(); c.moveTo(-1, -.25); c.lineTo(1, -.25); c.arc(0, -.25, 1, 0, PI); c.closePath(); c.fillStyle = gradV(-.25, .75, '#4caf50', '#1b5e20'); c.fill();
    c.beginPath(); c.moveTo(-.9, -.25); c.lineTo(.9, -.25); c.arc(0, -.25, .9, 0, PI); c.closePath(); c.fillStyle = '#eaf6cf'; c.fill();
    c.beginPath(); c.moveTo(-.82, -.25); c.lineTo(.82, -.25); c.arc(0, -.25, .82, 0, PI); c.closePath();
    const g = c.createRadialGradient(0, -.4, .1, 0, -.25, .85); g.addColorStop(0, '#ff6b7a'); g.addColorStop(1, '#d81b3a'); c.fillStyle = g; c.fill();
    c.fillStyle = '#2a1410'; for (const [sx, sy] of [[-.45, 0], [-.15, .2], [.15, .2], [.45, 0], [0, -.05], [-.3, .35], [.3, .35]]) { c.beginPath(); c.ellipse(sx, sy, .045, .08, sx * .6, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-.8, -.25, 1.6, .05);
  } else if (tipo === 2) {                                                        // uvas
    c.strokeStyle = '#5a3a1e'; c.lineWidth = .08; c.beginPath(); c.moveTo(0, -.75); c.lineTo(.05, -1.05); c.stroke();
    c.save(); c.translate(-.3, -.9); c.rotate(.4); c.beginPath(); c.ellipse(0, 0, .3, .14, 0, 0, TAU); c.fillStyle = gradV(-.14, .14, '#8fd14f', '#3c7d1e'); c.fill(); c.restore();
    for (const [ux, uy] of [[-.35, -.5], [0, -.55], [.35, -.5], [-.5, -.12], [-.17, -.15], [.17, -.15], [.5, -.12], [-.33, .22], [0, .22], [.33, .22], [-.16, .55], [.16, .55], [0, .85]]) {
      const g = c.createRadialGradient(ux - .08, uy - .08, .02, ux, uy, .28); g.addColorStop(0, '#c58ae6'); g.addColorStop(.6, '#6a2a96'); g.addColorStop(1, '#2e0f47');
      c.fillStyle = g; c.beginPath(); c.arc(ux, uy, .27, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(ux - .09, uy - .09, .05, 0, TAU); c.fill();
    }
  } else {                                                                        // banana
    c.beginPath(); c.moveTo(-.9, -.6); c.quadraticCurveTo(-.75, .85, .95, .42); c.lineTo(.92, .26); c.quadraticCurveTo(-.45, .45, -.72, -.58); c.closePath();
    c.fillStyle = gradV(-.6, .8, '#fff59d', '#fbc02d', '#c88a12'); c.fill(); c.strokeStyle = 'rgba(120,80,0,.5)'; c.lineWidth = .05; c.stroke();
    c.strokeStyle = 'rgba(160,110,0,.4)'; c.lineWidth = .04; c.beginPath(); c.moveTo(-.8, -.55); c.quadraticCurveTo(-.6, .62, .92, .34); c.stroke();
    c.fillStyle = '#5a3a1e'; c.beginPath(); c.arc(-.82, -.62, .08, 0, TAU); c.fill(); c.beginPath(); c.arc(.95, .34, .06, 0, TAU); c.fill();
  }
  c.restore();
}
function pedra(x, y, s, sd, a, voa) {
  const r = rng(sd); c.save(); c.translate(x, y); if (voa) { c.translate(0, -.4 * s); c.rotate(a); c.translate(0, .4 * s); }
  c.scale(s, s);
  if (!voa) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, 0, 1.25, .12, 0, 0, TAU); c.fill(); }
  c.beginPath(); c.moveTo(-1.1, 0);
  for (let i = 1; i < 9; i++) { const an = PI + i / 9 * PI, rad = .75 + r() * .3; c.lineTo(Math.cos(an) * rad * 1.15, Math.sin(an) * rad * .9); }
  c.lineTo(1.1, 0); c.closePath();
  c.fillStyle = gradV(-.9, 0, '#b3afa5', '#7d7a72', '#4d4b46'); c.fill(); c.strokeStyle = '#2f2d2a'; c.lineWidth = .05; c.stroke();
  c.save(); c.clip();
  c.fillStyle = 'rgba(110,150,60,.55)'; c.beginPath(); c.ellipse(-.2, -.85, .6, .22, -.1, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-.45, -.55, .25, .12, -.4, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(30,30,30,.4)'; c.lineWidth = .035; c.beginPath(); c.moveTo(.2, -.75); c.lineTo(.35, -.4); c.lineTo(.25, -.15); c.moveTo(.35, -.4); c.lineTo(.6, -.3); c.stroke();
  c.restore(); c.restore();
}
function tronco(x, y, s, a, voa) {
  c.save(); c.translate(x, y - .45 * s); if (voa) c.rotate(a); c.scale(s, s);
  if (!voa) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, .45, 1.4, .1, 0, 0, TAU); c.fill(); }
  rr(-1.3, -.42, 2.4, .84, .4); c.fillStyle = gradV(-.42, .42, '#9a6a3c', '#6a4220', '#3b230f'); c.fill(); c.strokeStyle = '#2a1708'; c.lineWidth = .04; c.stroke();
  c.strokeStyle = 'rgba(30,15,5,.45)'; c.lineWidth = .035;
  for (const yy of [-.25, -.05, .15, .3]) { c.beginPath(); c.moveTo(-1.1, yy); c.bezierCurveTo(-.5, yy - .06, .2, yy + .06, .9, yy); c.stroke(); }
  c.beginPath(); c.ellipse(1.1, 0, .22, .42, 0, 0, TAU); c.fillStyle = '#d9b07a'; c.fill(); c.strokeStyle = '#3b230f'; c.stroke();
  c.strokeStyle = '#a87a46'; c.lineWidth = .025; for (const k of [.7, .45, .2]) { c.beginPath(); c.ellipse(1.1, 0, .22 * k, .42 * k, 0, 0, TAU); c.stroke(); }
  c.fillStyle = '#5a8a2e'; c.beginPath(); c.ellipse(-.4, -.5, .18, .07, -.4, 0, TAU); c.fill();
  c.restore();
}
function placa(x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, 0, .35, .07, 0, 0, TAU); c.fill();
  c.fillStyle = gradV(-2.2, 0, '#8a5a2e', '#5a3a1a'); c.fillRect(-.08, -2.2, .16, 2.2);
  rr(-1, -2.75, 2.1, 1, .12); c.fillStyle = gradV(-2.75, -1.75, '#c08a50', '#8a5a2e'); c.fill(); c.strokeStyle = '#4a2c12'; c.lineWidth = .05; c.stroke();
  c.strokeStyle = 'rgba(70,40,15,.4)'; c.lineWidth = .03; c.beginPath(); c.moveTo(-.95, -2.25); c.lineTo(1.05, -2.25); c.stroke();
  c.strokeStyle = '#2f8fd8'; c.lineWidth = .09;
  for (const yy of [-2.45, -2.2, -1.95]) { c.beginPath(); for (let i = 0; i <= 12; i++) { const xx = -.8 + i * .1; c[i ? 'lineTo' : 'moveTo'](xx, yy + Math.sin(i * 1.3) * .05); } c.stroke(); }
  c.fillStyle = '#ff9f2e'; c.beginPath(); c.ellipse(.25, -2.32, .2, .1, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(.05, -2.32); c.lineTo(-.08, -2.42); c.lineTo(-.08, -2.22); c.fill();
  c.fillStyle = '#fff3d0'; c.beginPath(); c.moveTo(.62, -2.5); c.lineTo(.95, -2.25); c.lineTo(.62, -2); c.lineTo(.62, -2.15); c.lineTo(.48, -2.15); c.lineTo(.48, -2.35); c.lineTo(.62, -2.35); c.fill();
  c.restore();
}
function cesta(x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round';
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0, .32, 1.15, .12, 0, 0, TAU); c.fill();
  c.strokeStyle = '#7a4a1c'; c.lineWidth = .12; c.beginPath(); c.arc(0, -.55, .85, PI, 0); c.stroke(); c.strokeStyle = '#b07a3a'; c.lineWidth = .05; c.stroke();
  fruta(0, -.45, -.7, .32, -.2); fruta(2, .15, -.78, .28, .2); fruta(3, .5, -.68, .3, .3); fruta(1, -.05, -.58, .3, 0);
  c.beginPath(); c.moveTo(-1, -.6); c.lineTo(1, -.6); c.lineTo(.82, .2); c.quadraticCurveTo(.8, .32, .65, .32); c.lineTo(-.65, .32); c.quadraticCurveTo(-.8, .32, -.82, .2); c.closePath();
  c.fillStyle = gradV(-.6, .32, '#e2b066', '#b07a34', '#7a4e1c'); c.fill(); c.strokeStyle = '#5a3412'; c.lineWidth = .04; c.stroke();
  c.save(); c.clip(); c.strokeStyle = 'rgba(90,52,18,.45)'; c.lineWidth = .03;
  for (let yy = -.45; yy < .35; yy += .15) { c.beginPath(); c.moveTo(-1, yy); c.lineTo(1, yy); c.stroke(); }
  for (let xx = -1; xx < 1; xx += .14) { c.beginPath(); c.moveTo(xx, -.6); c.lineTo(xx * .82, .35); c.stroke(); }
  c.restore();
  rr(-1.05, -.68, 2.1, .14, .07); c.fillStyle = '#8a5a24'; c.fill();
  c.restore();
}
function ninho(x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = 'round';
  const r = rng(5);
  c.fillStyle = '#3a2614'; c.beginPath(); c.ellipse(0, -.2, .75, .2, 0, 0, TAU); c.fill();
  casca(.05, -.25, .9, 0);
  for (let i = 0; i < 90; i++) {
    const a = r() * TAU, x0 = Math.cos(a) * .8, y0 = -.15 + Math.sin(a) * .22 + (Math.sin(a) > 0 ? .02 : 0), l = .25 + r() * .2, an = a + PI / 2 + (r() - .5);
    if (Math.sin(a) < -.3 && i % 3) continue;
    c.strokeStyle = mix('#8a5a2e', r() < .5 ? '#2a1a0a' : '#d0a060', r() * .5); c.lineWidth = .03 + r() * .03;
    c.beginPath(); c.moveTo(x0 - Math.cos(an) * l / 2, y0 - Math.sin(an) * l / 2); c.lineTo(x0 + Math.cos(an) * l / 2, y0 + Math.sin(an) * l / 2); c.stroke();
  }
  casca(1.1, -.02, .7, 2.6);
  c.restore();
}
function casca(x, y, s, a) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  c.beginPath(); c.ellipse(0, 0, .3, .38, 0, 0, PI);
  for (let i = 0; i <= 6; i++) c.lineTo(-.3 + i * .1, i % 2 ? -.07 : 0);
  c.closePath(); c.fillStyle = gradV(-.07, .38, '#fffaf0', '#e8dcc0', '#b9a888'); c.fill(); c.strokeStyle = '#8a7a5a'; c.lineWidth = .02; c.stroke();
  c.fillStyle = 'rgba(120,90,50,.45)'; for (const [px, py] of [[-.1, .1], [.12, .18], [.02, .28], [-.18, .22]]) { c.beginPath(); c.arc(px, py, .025, 0, TAU); c.fill(); }
  c.restore();
}
function juncos(x, y, s, sd) {
  const r = rng(sd); c.save(); c.translate(x, y); c.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const bx = (r() - .5) * s, hh = s * (1 + r() * 1.2), sw = Math.sin(S.t * 1.5 + i) * s * .05, tx = bx + (r() - .5) * s * .3 + sw;
    c.strokeStyle = mix('#3c6a24', '#1d3a12', r()); c.lineWidth = s * .04; c.beginPath(); c.moveTo(bx, 0); c.quadraticCurveTo(bx, -hh * .5, tx, -hh); c.stroke();
    if (i % 3 === 0) { c.fillStyle = '#6b3f1c'; c.beginPath(); c.ellipse(tx, -hh * .92, s * .05, s * .16, 0, 0, TAU); c.fill(); }
  }
  c.restore();
}
function lago(f) {
  const p = f.p, y0 = G * .78, y1 = G + .2 * U;
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, mix(p.ceu[2], '#3d7f9a', .45)); g.addColorStop(.4, mix(p.ceu[1], '#2c6b86', .6)); g.addColorStop(1, mix(p.ceu[0], '#173e52', .55));
  c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0);
  c.fillStyle = rgba(mix(p.colina, '#000000', .4), .5); c.fillRect(0, y0, W, U * .06);
  const sx = W * p.solX;
  for (let i = 0; i < 14; i++) { const yy = y0 + (i + .5) / 14 * (y1 - y0) * .9, w = U * (.4 + i * .14) * (.7 + .3 * Math.sin(S.t * 2 + i)); c.fillStyle = rgba(p.sol, .4 - i * .022); c.fillRect(sx - w / 2, yy, w, U * .05); }
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = U * .03; const r = rng(77);
  for (let i = 0; i < 26; i++) { const x = (r() * W + S.t * U * .3 * (r() + .2)) % W, y = y0 + .1 * U + r() * (y1 - y0 - .1 * U), w = U * (.3 + r() * .7); c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.stroke(); }
}

/* ---------- Partículas ---------- */
let parts = [];
function emite(x, y, tipo, n = 1, o = {}) {
  for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * (o.vx ?? 3) * U, vy: -(o.vy ?? 2) * U * (.5 + Math.random()), g: (o.g ?? 4) * U, v: 1, dur: o.dur ?? 1.2, tipo, s: (o.s ?? .25) * U * (.7 + Math.random() * .6), rot: Math.random() * TAU });
}
function atualizaParts(dt) { for (const p of parts) { p.v -= dt / p.dur; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 2; } parts = parts.filter(p => p.v > 0); }
function desenhaParts() {
  for (const p of parts) {
    c.save(); c.globalAlpha = clamp(p.v * 1.5, 0, 1); c.translate(p.x, p.y);
    if (p.tipo === 'brilho') { c.rotate(p.rot); c.fillStyle = '#ffe066'; c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? p.s * .3 : p.s; c.lineTo(Math.cos(i / 8 * TAU) * r, Math.sin(i / 8 * TAU) * r); } c.fill(); }
    else if (p.tipo === 'coracao') { const s = p.s; c.fillStyle = '#ff4d6d'; c.beginPath(); c.moveTo(0, s * .35); c.bezierCurveTo(-s, -s * .3, -s * .5, -s * 1.1, 0, -s * .5); c.bezierCurveTo(s * .5, -s * 1.1, s, -s * .3, 0, s * .35); c.fill(); }
    else if (p.tipo === 'z') { c.font = `900 ${p.s * 2}px sans-serif`; c.textAlign = 'center'; c.lineWidth = p.s * .3; c.strokeStyle = '#2a3560'; c.strokeText('Z', 0, 0); c.fillStyle = '#fff'; c.fillText('Z', 0, 0); }
    else if (p.tipo === 'folha') { c.rotate(p.rot); c.fillStyle = '#4f8a3a'; c.beginPath(); c.ellipse(0, 0, p.s, p.s * .45, 0, 0, TAU); c.fill(); }
    else if (p.tipo === 'poeira') { c.fillStyle = 'rgba(170,140,100,.4)'; c.beginPath(); c.arc(0, 0, p.s * (2.2 - p.v), 0, TAU); c.fill(); }
    c.restore();
  }
}
function dica(x, y) { const b = Math.abs(Math.sin(S.t * 4)) * .35 * U; c.save(); c.font = `${1.3 * U}px serif`; c.textAlign = 'center'; c.textBaseline = 'top'; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 8; c.fillText('👆', x, y + b); c.restore(); }

/* ---------- Sons (sintetizados, sem arquivos) ---------- */
let AC = null, nb = null, mot = null;
function audio() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} }
function tom(f1, f2, dur, tipo = 'sine', vol = .2, atraso = 0) {
  if (!AC) return; const t = AC.currentTime + atraso, o = AC.createOscillator(), g = AC.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .05);
}
function ruido(dur, freq, vol, atraso = 0) {
  if (!AC) return;
  if (!nb) { nb = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = AC.currentTime + atraso, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = nb; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + dur + .05);
}
function rugido(p = 1) {
  if (!AC) return; const t = AC.currentTime, o = AC.createOscillator(), lfo = AC.createOscillator(), lg = AC.createGain(), f = AC.createBiquadFilter(), g = AC.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(260 * p, t); o.frequency.exponentialRampToValueAtTime(130 * p, t + .8);
  lfo.frequency.value = 28; lg.gain.value = 18 * p; lfo.connect(lg).connect(o.frequency);
  f.type = 'lowpass'; f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(500, t + .8); f.Q.value = 4;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.22, t + .08); g.gain.exponentialRampToValueAtTime(.0001, t + .9);
  o.connect(f).connect(g).connect(AC.destination); o.start(t); lfo.start(t); o.stop(t + 1); lfo.stop(t + 1); ruido(.6, 600 * p, .08);
}
const SOM = {
  pulo: () => tom(300, 720, .25, 'sine', .2),
  pega: () => { tom(880, 880, .12, 'triangle', .15); tom(1320, 1320, .2, 'triangle', .15, .08); },
  nhac: () => { ruido(.1, 1000, .35); tom(180, 90, .12, 'sine', .25); ruido(.08, 800, .25, .16); },
  tum: () => { tom(130, 50, .25, 'sine', .4); ruido(.15, 300, .3); },
  buzina: () => { tom(440, 440, .14, 'square', .07); tom(554, 554, .14, 'square', .05); tom(440, 440, .2, 'square', .07, .2); tom(554, 554, .2, 'square', .05, .2); },
  oba: () => [523, 659, 784, 1047].forEach((f, i) => tom(f, f, .2, 'triangle', .14, i * .1)),
  boceja: () => { tom(420, 180, 1.1, 'sine', .14); ruido(1, 500, .05); },
  grito: () => { tom(1300, 700, .35, 'sawtooth', .06); tom(1500, 900, .3, 'triangle', .08, .05); },
  ronco: () => { tom(85, 60, .45, 'sawtooth', .07); tom(95, 55, .5, 'sawtooth', .07, .5); }
};
function motorLiga() {
  if (!AC || mot) return;
  const o = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
  o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = 45; o2.frequency.value = 22; f.type = 'lowpass'; f.frequency.value = 260; g.gain.value = 0;
  o.connect(f); o2.connect(f); f.connect(g).connect(AC.destination); o.start(); o2.start(); mot = { o, o2, g };
}
function motorAtualiza() { if (!mot) return; const k = vel / (3.4 * U), t = AC.currentTime; mot.o.frequency.setTargetAtTime(42 + k * 30, t, .1); mot.o2.frequency.setTargetAtTime(21 + k * 15, t, .1); mot.g.gain.setTargetAtTime(.025 + k * .03, t, .2); }
function motorPara() { if (!mot) return; const m = mot; mot = null; m.g.gain.setTargetAtTime(0, AC.currentTime, .1); setTimeout(() => { try { m.o.stop(); m.o2.stop(); } catch (e) {} }, 600); }

/* ---------- Narrador (voz do aparelho, em português) ---------- */
let voz = null;
function achaVoz() { try { const vs = speechSynthesis.getVoices(); voz = vs.find(v => /pt[-_]BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null; } catch (e) {} }
try { achaVoz(); speechSynthesis.onvoiceschanged = achaVoz; } catch (e) {}
function fala(txt) {
  const el = $('legenda'); el.textContent = txt; el.classList.add('on');
  clearTimeout(fala.tm); fala.tm = setTimeout(() => el.classList.remove('on'), 2200 + txt.length * 55);
  if (window.Android && Android.falar) { try { Android.falar(txt); } catch (e) {} return; }   // no APK: voz do celular
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'pt-BR'; if (voz) u.voice = voz; u.rate = .95; u.pitch = 1.15; speechSynthesis.speak(u); } catch (e) {}
}
function calaTudo() { try { speechSynthesis.cancel(); } catch (e) {} $('legenda').classList.remove('on'); }

/* ---------- Estado e cenas ---------- */
const S = { cena: 'abertura', t: 0, etapa: '', tm: 0, escuro: 0, trans: null };
const car = { x: 0, y: 0, vy: 0, roda: 0, b: 0, tranco: 0 };
let dist = 0, vel = 0, frutas = 0, ents = [], prox = 0, voltas = [], arrasto = null;
const META = 15;
const mostra = (id, on) => $(id).classList.toggle('on', on);
function trocar(fn) { if (S.trans) return; S.trans = { dir: 1, fn }; }
function reinicia() { for (const [st] of DINOS) Object.assign(st, novoDino()); parts = []; ents = []; voltas = []; arrasto = null; }

function vaiTitulo() {
  S.cena = 'titulo'; calaTudo(); motorPara(); reinicia();
  telas('titulo');
  for (const [st] of DINOS) st.anda = true;
}
function vaiAcorda() {
  S.cena = 'acorda'; S.etapa = 'dorme'; S.tm = 0; S.falou = 0; reinicia(); motorPara();
  telas('jogo');
  rex.dorme = rex.dormeAlvo = 1; car.x = -4 * U; car.y = G; car.b = 0; vel = 0;
}
function vaiEstrada() {
  S.cena = 'estrada'; S.etapa = 'rodando'; S.tm = 0; S.triOk = S.pescoOk = S.placaOk = S.triNoCarro = S.pescoJunto = false;
  dist = 0; vel = 0; frutas = 0; ents = []; prox = 3 * U; car.x = W * .3; car.y = GR(); car.vy = 0;
  Object.assign(tri, novoDino()); Object.assign(pesco, novoDino());
  rex.sentado = true; rex.dirige = true; motorLiga(); telas('jogo');
}

/* ----- Cena 1: o Rex acorda ----- */
function posAcorda() { return { rx: W * .36, ry: G, cx: W * .74 }; }
function atualizaAcorda(dt) {
  S.tm += dt; const P = posAcorda();
  if (S.etapa === 'dorme') { if ((S.t % 1.3) < dt && rex.bocaXY) emite(rex.bocaXY[0] - .2 * U, rex.bocaXY[1] - .5 * U, 'z', 1, { vx: .6, vy: .6, g: -.3, dur: 2, s: .25 }); }
  else if (S.etapa === 'boceja') {
    if (S.tm > 1.2) rex.bocaAlvo = 0;
    if (S.tm > 1.5) { SOM.ronco(); fala(NOMES.rex); S.etapa = 'fome'; S.tm = 0; }
  } else if (S.etapa === 'fome') {
    rex.cabExtra = Math.sin(S.tm * 2.5) * .12;
    if (S.tm > 5) { rex.cabExtra = 0; S.etapa = 'chegaCarro'; S.tm = 0; car.x = -3 * U; motorLiga(); vel = 3 * U; }
  } else if (S.etapa === 'chegaCarro') {
    const nx = lerp(car.x, P.cx, suave(dt, 1.6)); vel = (nx - car.x) / dt; car.roda += (nx - car.x) / (.36 * KC()); car.x = nx;
    car.b = Math.sin(S.t * 17) * .012 * clamp(vel / (3 * U), 0, 1);
    if (P.cx - car.x < .05 * U) { vel = 0; motorPara(); SOM.buzina(); S.etapa = 'esperaCarro'; S.tm = 0; }
  } else if (S.etapa === 'entra') {
    const u = clamp(S.tm / .9, 0, 1), kc = KC();
    S.rx = lerp(P.rx, car.x - .15 * kc, u); S.ry = lerp(P.ry, car.y, u) - Math.sin(u * PI) * 2 * U;
    S.rk = lerp(U, kc * KR, u);
    if (u > .6) { rex.sentado = true; rex.dirige = true; }
    if (u >= 1) { SOM.oba(); S.etapa = 'sai'; S.tm = 0; vel = 0; motorLiga(); }
  } else if (S.etapa === 'sai') {
    vel += 3 * U * dt; car.x += vel * dt; car.roda += vel * dt / (.36 * KC()); car.b = Math.sin(S.t * 17) * .012;
    if (car.x > W + 3 * U) trocar(vaiEstrada);
  }
}
function toqueAcorda(x, y) {
  if (S.etapa === 'dorme') { S.etapa = 'boceja'; S.tm = 0; rex.dormeAlvo = 0; rex.bocaAlvo = 1; SOM.boceja(); rex.pulo = 0; }
  else if (S.etapa === 'fome' && S.tm > 1) { rugido(1.3); rex.mastiga = .5; }
  else if (S.etapa === 'esperaCarro') { S.etapa = 'entra'; S.tm = 0; SOM.pulo(); }
}
function desenhaAcorda() {
  const f = fundo('aurora'), P = posAcorda(), kc = KC();
  cenario(f, 1400); faixa(f.l6, 0, G - .5 * U);
  ninho(P.rx - .25 * U, G + .1 * U, U * 1.7);
  const dentro = S.etapa === 'entra' || S.etapa === 'sai';
  const rxp = S.etapa === 'entra' ? S.rx : P.rx, ryp = S.etapa === 'entra' ? S.ry : P.ry, rk = S.etapa === 'entra' ? S.rk : U;
  if (S.etapa !== 'dorme' && S.etapa !== 'boceja' && S.etapa !== 'fome') {
    carroFundo(car.x, car.y, kc, car.b);
    if (S.etapa === 'sai') desenhaDino(ESP.rex, rex, car.x - .15 * kc, car.y + car.b * kc, kc * KR);
    else if (S.etapa === 'entra' && rex.sentado) desenhaDino(ESP.rex, rex, rxp, ryp, rk);
    carroFrente(car.x, car.y, kc, car.b, car.roda);
  }
  if (!dentro || (S.etapa === 'entra' && !rex.sentado)) desenhaDino(ESP.rex, rex, rxp, ryp, rk);
  desenhaParts(); faixa(f.l5, 1400 * 1.3, H - 1.4 * U); tinta(f);
  if (S.etapa === 'dorme' && S.tm > 1.5) dica(P.rx + 1.1 * U, G - .9 * U);
  if (S.etapa === 'esperaCarro') dica(car.x, car.y - 1.2 * U);
}

/* ----- Cena 2: a estrada ----- */
const assentoTri = () => [car.x - 1.12 * KC(), car.y + (-.5 + car.b) * KC()];
const KR = .82, KT = .6;   // tamanho do Rex e do Tri dentro do carrinho
function spawn() {
  const x = W + 2 * U, r = Math.random();
  if (r < .3) ents.push({ tipo: 'pedra', x, y: GR(), s: (.42 + Math.random() * .25) * U, sd: sorteio(1e9), rot: 0 });
  else if (r < .45) ents.push({ tipo: 'tronco', x, y: GR(), s: (.45 + Math.random() * .15) * U, rot: 0 });
  else { const alto = Math.random() < .45; ents.push({ tipo: 'fruta', f: sorteio(4), x, y: alto ? GR() - 4.6 * U : GR() - 1.8 * U, s: .55 * U, alto }); }
}
function limpaFrente() { ents = ents.filter(e => e.x < W + .5 * U || e.pega || e.voa); }
function checaMetas() {
  if (S.etapa !== 'rodando') return;
  if (frutas >= 5 && !S.triOk) { S.triOk = true; S.etapa = 'vaiTri'; limpaFrente(); ents.push({ tipo: 'amigoTri', x: W + 3 * U, y: GR() }); tri.vira = true; }
  else if (frutas >= 10 && !S.pescoOk) { S.pescoOk = true; S.etapa = 'vaiPesco'; limpaFrente(); ents.push({ tipo: 'amigoPesco', x: W + 5 * U, y: G - .1 * U }); }
  else if (frutas >= META && !S.placaOk) { S.placaOk = true; S.etapa = 'chegando'; limpaFrente(); ents.push({ tipo: 'placa', x: W + 3 * U, y: G - .05 * U }); }
}
function atualizaEstrada(dt) {
  S.tm += dt; const E = S.etapa, kc = KC(), VMAX = 3.4 * U;
  let alvo = VMAX;
  if (E === 'vaiTri' || E === 'vaiPesco') {
    const am = ents.find(e => e.tipo === (E === 'vaiTri' ? 'amigoTri' : 'amigoPesco')), stop = car.x + (E === 'vaiTri' ? 4.8 : 4.6) * U;
    vel = clamp((am.x - stop) * 1.4, 0, VMAX);
    if (am.x - stop < .03 * U) { vel = 0; S.etapa = E === 'vaiTri' ? 'oiTri' : 'oiPesco'; S.tm = 0; }
  } else {
    if (E === 'oiTri' || E === 'oiPesco' || E === 'pulaTri' || E === 'parou') alvo = 0;
    vel = lerp(vel, alvo, suave(dt, 1.5));
  }
  const dx = vel * dt; dist += dx; car.roda += dx / (.36 * kc);
  car.vy += 24 * U * dt; car.y += car.vy * dt;
  if (car.y >= GR()) { if (car.vy > 6 * U) emite(car.x, GR(), 'poeira', 6, { vx: 3, vy: .5, g: 0, dur: .6, s: .2 }); car.y = GR(); car.vy = 0; }
  car.tranco *= Math.exp(-dt * 6);
  car.b = Math.sin(S.t * 17) * .012 * (vel / VMAX) + car.tranco * Math.sin(S.t * 30);
  if (vel > .5 * U && Math.random() < dt * 8 && car.y >= GR()) emite(car.x - 1.3 * kc, GR() - .1 * U, 'poeira', 1, { vx: 1, vy: .4, g: 0, dur: .7, s: .15 });
  motorAtualiza();

  for (const e of ents) {
    if (e.voa) { e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 20 * U * dt; e.rot += e.vr * dt; continue; }
    if (e.pega) { e.u += dt / .35; if (e.u >= 1) { e.fora = true; frutas++; rex.mastiga = .7; SOM.nhac(); if (rex.bocaXY) emite(rex.bocaXY[0], rex.bocaXY[1], 'brilho', 6, { vx: 3, vy: 2, g: 3, dur: .8, s: .2 }); } continue; }
    if (e.tipo === 'amigoPesco' && S.pescoJunto) continue;   // o Pesco anda junto, na frente do carrinho
    e.x -= dx;
    if (e.tipo === 'fruta') {
      const top = car.y - 2.3 * kc, L = car.x - 1.5 * kc, R = car.x + 1.7 * kc, fy = e.y + Math.sin(S.t * 3 + e.x * .01) * .12 * U;
      if (e.x > L && e.x < R && fy > top && fy < car.y) { e.pega = true; e.u = 0; e.x0 = e.x; e.y0 = fy; SOM.pega(); }
    } else if ((e.tipo === 'pedra' || e.tipo === 'tronco') && !e.bateu && e.x < car.x + 1.4 * kc && e.x > car.x - .5 * kc) {
      e.bateu = true;
      if (car.y > GR() - .55 * U) { e.voa = true; e.vx = 7 * U; e.vy = -8 * U; e.vr = 7; car.vy = Math.min(car.vy, -4 * U); car.tranco = .05; SOM.tum(); rex.bocaAlvo = .7; setTimeout(() => rex.bocaAlvo = 0, 350); emite(e.x, GR(), 'poeira', 8, { vx: 4, vy: 1, g: 2, dur: .7, s: .25 }); }
    }
  }
  ents = ents.filter(e => !e.fora && e.x > -5 * U && e.y < H + 3 * U);
  if (E === 'rodando' && dist > prox) { spawn(); prox = dist + (3.2 + Math.random() * 2.6) * U; }
  checaMetas();

  if (E === 'oiTri') {
    if (S.tm < dt * 1.5) { fala(NOMES.tri); rugido(1.5); tri.bocaAlvo = 1; rex.acena = true; rex.dirige = false; }
    if (S.tm > .8) tri.bocaAlvo = 0;
    tri.cabExtra = Math.sin(S.tm * 6) * .1 * (S.tm < 2.5);
    if (S.tm > 3.4) { const am = ents.find(e => e.tipo === 'amigoTri'); S.tp0 = [am.x, am.y]; S.etapa = 'pulaTri'; S.tm = 0; SOM.pulo(); tri.cabExtra = 0; }
  } else if (E === 'pulaTri') {
    const u = clamp(S.tm / 1.1, 0, 1), [sx, sy] = assentoTri();
    S.tp = [lerp(S.tp0[0], sx, u), lerp(S.tp0[1], sy, u) - Math.sin(u * PI) * 2.2 * U, lerp(U * .95, KC() * KT, u)];
    if (u > .5) { tri.vira = false; }
    if (u > .75) tri.sentado = true;
    if (u >= 1) { ents = ents.filter(e => e.tipo !== 'amigoTri'); S.triNoCarro = true; SOM.oba(); setTimeout(SOM.buzina, 400); rex.acena = false; rex.dirige = true; S.etapa = 'rodando'; prox = dist + 2 * U; }
  } else if (E === 'oiPesco') {
    if (S.tm < dt * 1.5) { fala(NOMES.pesco); rugido(.6); pesco.bocaAlvo = 1; pesco.abaixaAlvo = .45; rex.acena = true; rex.dirige = false; }
    if (S.tm > 1) pesco.bocaAlvo = 0;
    if (S.tm > 3.5) pesco.abaixaAlvo = 0;
    if (S.tm > 5.2) { S.pescoJunto = true; rex.acena = false; rex.dirige = true; S.etapa = 'rodando'; prox = dist + 2 * U; SOM.buzina(); }
  } else if (E === 'chegando') {
    const pl = ents.find(e => e.tipo === 'placa');
    if (pl && pl.x < car.x + 1.5 * U) { S.etapa = 'parou'; S.tm = 0; SOM.oba(); }
  } else if (E === 'parou') { if (S.tm > 2.2) trocar(vaiFloresta); }

  const pe = ents.find(e => e.tipo === 'amigoPesco');
  if (pe && S.pescoJunto) { pe.x = lerp(pe.x, car.x + 3.4 * U, suave(dt, .5)); pesco.anda = vel > .3 * U; pesco.fase += dt * vel / U * 1.9; }
  for (const e of ents) if (e.pega && rex.bocaXY) { const u = e.u * e.u; e.x = lerp(e.x0, rex.bocaXY[0], u); e.ry = lerp(e.y0, rex.bocaXY[1], u); }
}
function toqueEstrada() {
  if (car.y >= GR() - 1 && ['rodando', 'vaiTri', 'vaiPesco', 'chegando'].includes(S.etapa)) { car.vy = -11 * U; SOM.pulo(); rex.bocaAlvo = .5; setTimeout(() => rex.bocaAlvo = 0, 300); }
  else if (S.etapa === 'oiTri' || S.etapa === 'oiPesco') { rugido(1.2); rex.mastiga = .4; }
}
function hud(n, meta, icone) {
  const w = Math.min(W * .42, 9 * U), x0 = (W - w) / 2, y0 = .85 * U, fr = clamp(n / meta, 0, 1);
  c.save();
  c.fillStyle = 'rgba(0,0,0,.28)'; rr(x0 - .15 * U, y0 - .22 * U, w + .3 * U, .44 * U, .22 * U); c.fill();
  c.fillStyle = '#7ccf4a'; rr(x0, y0 - .1 * U, Math.max(.2 * U, w * fr), .2 * U, .1 * U); c.fill();
  c.fillStyle = '#2f8fd8'; c.beginPath(); c.arc(x0 + w + .2 * U, y0, .42 * U, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = .08 * U; c.stroke();
  c.strokeStyle = '#d6efff'; c.lineWidth = .06 * U; c.beginPath(); for (let i = 0; i <= 8; i++) c[i ? 'lineTo' : 'moveTo'](x0 + w - .05 * U + i * .06 * U, y0 + Math.sin(i * 1.4) * .06 * U); c.stroke();
  icone(x0 + w * fr, y0 - .05 * U, .3 * U);
  icone(W - 2.3 * U, .85 * U, .4 * U);
  c.font = `900 ${.8 * U}px sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineWidth = .14 * U; c.strokeStyle = 'rgba(40,20,0,.7)'; c.strokeText(n, W - 1.7 * U, .9 * U); c.fillStyle = '#fff'; c.fillText(n, W - 1.7 * U, .9 * U);
  c.restore();
}
function desenhaEstrada() {
  const f = fundo('dia'), kc = KC();
  cenario(f, dist); faixa(f.l4, dist, G - .45 * U);
  for (const e of ents) if (e.tipo === 'placa') placa(e.x, e.y, U * .9);
  const pe = ents.find(e => e.tipo === 'amigoPesco'); if (pe) desenhaDino(ESP.pesco, pesco, pe.x, pe.y, U * 1.15);
  for (const e of ents) if ((e.tipo === 'pedra' || e.tipo === 'tronco') && !e.voa) e.tipo === 'pedra' ? pedra(e.x, e.y, e.s, e.sd, 0, false) : tronco(e.x, e.y, e.s, 0, false);
  carroFundo(car.x, car.y, kc, car.b);
  const ta = ents.find(e => e.tipo === 'amigoTri');
  desenhaDino(ESP.rex, rex, car.x - .15 * kc, car.y + car.b * kc, kc * KR);
  if (S.triNoCarro) { const [tx, ty] = assentoTri(); desenhaDino(ESP.tri, tri, tx, ty, kc * KT); }
  else if (S.etapa === 'pulaTri' && S.tp) desenhaDino(ESP.tri, tri, S.tp[0], S.tp[1], S.tp[2]);
  carroFrente(car.x, car.y, kc, car.b, car.roda);
  if (ta && S.etapa !== 'pulaTri') desenhaDino(ESP.tri, tri, ta.x, ta.y, U * .95);
  for (const e of ents) if (e.voa) e.tipo === 'pedra' ? pedra(e.x, e.y, e.s, e.sd, e.rot, true) : tronco(e.x, e.y, e.s, e.rot, true);
  for (const e of ents) if (e.tipo === 'fruta') {
    if (e.pega) fruta(e.f, e.x, e.ry, e.s * (1 - e.u * .6));
    else { const fy = e.y + Math.sin(S.t * 3 + e.x * .01) * .12 * U, gl = c.createRadialGradient(e.x, fy, 0, e.x, fy, e.s * 2); gl.addColorStop(0, 'rgba(255,255,220,.55)'); gl.addColorStop(1, 'rgba(255,255,220,0)'); c.fillStyle = gl; c.fillRect(e.x - e.s * 2, fy - e.s * 2, e.s * 4, e.s * 4); fruta(e.f, e.x, fy, e.s, Math.sin(S.t * 2 + e.x) * .15); }
  }
  desenhaParts(); faixa(f.l5, dist * 1.3, H - 1.4 * U); tinta(f); hud(frutas, META, (x, y, s) => fruta(0, x, y, s));
  if (S.etapa === 'rodando' && frutas < 2 && S.tm > 2) { const al = ents.find(e => e.tipo === 'fruta' && e.alto && !e.pega && e.x > car.x && e.x < W); if (al) dica(car.x + 2 * U, car.y - 3.2 * U); }
}

/* ----- Cena 3: esconde-esconde na floresta ----- */
const ESCONDE = [
  { st: estego, sp: ESP.estego, k: .95, nome: 'estego', som: .9, sd: 501 },
  { st: anqui, sp: ESP.anqui, k: 1.05, nome: 'anqui', som: .7, sd: 502 },
  { st: para, sp: ESP.para, k: .95, nome: 'para', som: 1.3, sd: 503 },
  { st: bebe, sp: ESP.tri, k: .55, nome: 'bebe', som: 2, sd: 504 }];
function vaiFloresta() {
  S.cena = 'floresta'; S.etapa = 'procura'; S.tm = 0; S.ult = 0; S.f1 = false; reinicia(); motorPara(); telas('jogo');
  const lugares = [.14, .38, .62, .86].sort(() => Math.random() - .5);   // cada vez se escondem em lugares diferentes
  ESCONDE.forEach((e, i) => { e.achado = false; e.u = 0; e.mexe = 0; e.px = lugares[i]; e.st.vira = e.px > .5; });
}
function atualizaFloresta(dt) {
  S.tm += dt;
  for (const e of ESCONDE) { e.mexe = Math.max(0, e.mexe - dt); if (e.achado) e.u = Math.min(1, e.u + dt * 1.8); }
  const falta = ESCONDE.filter(e => !e.achado);
  if (falta.length && Math.random() < dt * .7) falta[sorteio(falta.length)].mexe = .7;      // uma moita balança: tem alguém aí!
  if (!falta.length && S.etapa === 'procura') { S.etapa = 'todos'; S.tm = 0; }
  if (S.etapa === 'todos') {
    if (S.tm > 1.2 && !S.f1) { S.f1 = true; for (const e of ESCONDE) e.st.pulo = .6; SOM.oba(); }
    if (S.tm > 3.5) trocar(vaiCeu);
  }
}
function toqueFloresta(x, y) {
  for (const e of ESCONDE) {
    const bx = W * e.px;
    if (Math.abs(x - bx) > 1.9 * U || y < G - 4.5 * U) continue;
    if (!e.achado) {
      e.achado = true; S.ult = S.tm; e.st.pulo = .6; e.st.bocaAlvo = 1; setTimeout(() => e.st.bocaAlvo = 0, 700);
      rugido(e.som); fala(NOMES[e.nome]); emite(bx, G - 1.5 * U, 'folha', 16, { vx: 6, vy: 3, g: 5, dur: 1.3, s: .2 });
    } else { e.st.pulo = .6; rugido(e.som); }
    return;
  }
}
function moita(x, y, s, sd, mexe) {
  const r = rng(sd), sh = Math.sin(S.t * 30) * mexe * .08 * s, cores = ['#2f5a24', '#3d7030', '#4f8a3a', '#2a4d20'];
  c.save(); c.translate(x + sh, y);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, 0, s * 1.15, s * .13, 0, 0, TAU); c.fill();
  for (let i = 0; i < 18; i++) {
    const a = r() * PI, rad = Math.sqrt(r()), bx = Math.cos(a) * s * .85 * rad, by = -Math.sin(a) * s * rad - s * .25 + (i < 6 ? s * .15 : 0), br = s * (.28 + r() * .22), cor = cores[i % 4];
    const g = c.createRadialGradient(bx - br * .3, by - br * .4, br * .1, bx, by, br); g.addColorStop(0, mix(cor, '#ffffff', .22)); g.addColorStop(1, mix(cor, '#000000', .3));
    c.fillStyle = g; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill();
  }
  c.strokeStyle = 'rgba(20,40,10,.35)'; c.lineWidth = s * .02;
  for (let i = 0; i < 28; i++) { const a = r() * PI, rad = .3 + r() * .7, bx = Math.cos(a) * s * .9 * rad, by = -Math.sin(a) * s * 1.1 * rad - s * .2; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + (r() - .5) * s * .12, by - s * .08); c.stroke(); }
  c.restore();
}
function desenhaFloresta() {
  const f = fundo('dia');
  cenario(f, 5200); faixa(f.l6, 0, G - .5 * U);
  for (const e of ESCONDE) {
    const bx = W * e.px, dir = e.px < .5 ? -1 : 1;
    desenhaDino(e.sp, e.st, bx, G, U * e.k);
    moita(bx + dir * e.u * 1.9 * U, G + e.u * .2 * U, 1.5 * U * (1 - e.u * .5), e.sd, e.mexe);
  }
  desenhaParts(); faixa(f.l5, 5200 * 1.3, H - 1.4 * U); tinta(f);
  for (let i = 0; i < ESCONDE.length; i++) {                                     // bolinhas: quantos já achou
    const ok = ESCONDE.filter(e => e.achado).length > i;
    c.beginPath(); c.arc(W / 2 + (i - 1.5) * .95 * U, .85 * U, .3 * U, 0, TAU); c.fillStyle = ok ? '#ffd34d' : 'rgba(255,255,255,.35)'; c.fill(); c.lineWidth = .07 * U; c.strokeStyle = '#fff'; c.stroke();
  }
  if (S.etapa === 'procura' && S.tm - S.ult > 3) { const e = ESCONDE.find(e => !e.achado); if (e) dica(W * e.px, G - 1.4 * U); }
}

/* ----- Cena 4: voando com o Ptera ----- */
let estrelas = 0;
const META_E = 12;
function vaiCeu() {
  S.cena = 'ceu'; S.etapa = 'voa'; S.tm = 0; S.falou = false; reinicia(); motorPara(); telas('jogo');
  dist = 0; estrelas = 0; prox = 3 * U; S.py = H * .45; S.ang = 0; S.alvoY = null; S.dedo = null;
}
function atualizaCeu(dt) {
  S.tm += dt; const v = 4 * U, px = W * .3; dist += v * dt;
  if (S.tm > .6 && !S.falou) { S.falou = true; fala(NOMES.ptera); SOM.grito(); }
  const alvo = clamp(S.alvoY ?? (H * .42 + Math.sin(S.t * .9) * 1.2 * U), 1.6 * U, G - 1.2 * U), antes = S.py;
  S.py = lerp(S.py, alvo, suave(dt, 3.5)); S.ang = lerp(S.ang, clamp((S.py - antes) / dt / (8 * U), -.45, .45), suave(dt, 6));
  if (S.etapa === 'voa' && dist > prox) { ents.push({ tipo: 'estrela', x: W + U, y: 1.8 * U + Math.random() * (G - 3.6 * U), r: Math.random() * 6 }); prox = dist + (2.4 + Math.random() * 1.6) * U; }
  for (const e of ents) {
    if (e.pega) { e.u += dt / .45; continue; }
    e.x -= v * dt;
    if (Math.hypot(e.x - (px + .4 * U), e.y - S.py) < 1.3 * U) { e.pega = true; e.u = 0; estrelas++; SOM.pega(); emite(e.x, e.y, 'brilho', 8, { vx: 4, vy: 2, g: 2, dur: .8, s: .25 }); }
  }
  ents = ents.filter(e => e.x > -2 * U && !(e.pega && e.u >= 1));
  if (estrelas >= META_E && S.etapa === 'voa') { S.etapa = 'fim'; S.tm = 0; SOM.oba(); }
  if (S.etapa === 'fim' && S.tm > 2.5) trocar(vaiLanche);
}
function estrela(x, y, s, a) {
  c.save(); c.translate(x, y); c.rotate(a);
  const gl = c.createRadialGradient(0, 0, 0, 0, 0, s * 1.8); gl.addColorStop(0, 'rgba(255,240,150,.5)'); gl.addColorStop(1, 'rgba(255,240,150,0)'); c.fillStyle = gl; c.fillRect(-s * 1.8, -s * 1.8, s * 3.6, s * 3.6);
  c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .45 : s; c.lineTo(Math.cos(i / 10 * TAU - PI / 2) * r, Math.sin(i / 10 * TAU - PI / 2) * r); } c.closePath();
  const g = c.createRadialGradient(-s * .2, -s * .3, s * .1, 0, 0, s); g.addColorStop(0, '#fff6b0'); g.addColorStop(.6, '#ffd23a'); g.addColorStop(1, '#f0a000');
  c.fillStyle = g; c.fill(); c.strokeStyle = '#b87800'; c.lineWidth = s * .08; c.lineJoin = 'round'; c.stroke();
  c.restore();
}
function desenhaVoo() {
  const f = fundo('dia');
  desenhaCeu(f); faixa(f.l0, dist * .25 + S.t * 6, 0); faixa(f.l1, dist * .05, H * .2); faixa(f.l2, dist * .14, H * .36); faixa(f.l3, dist * .35, H * .56);
  for (const e of ents) {
    if (e.pega) estrela(lerp(e.x, W - 2.3 * U, e.u), lerp(e.y, .85 * U, e.u), .5 * U * (1 - e.u * .4), e.r);
    else estrela(e.x, e.y + Math.sin(S.t * 3 + e.r) * .15 * U, .5 * U, e.r + S.t);
  }
  c.save(); c.translate(W * .3, S.py); c.rotate(S.ang); desenhaPtera(ptera, 0, 0, 1.5 * U); c.restore();
  c.save(); c.globalAlpha = .85; faixa(f.l0, dist * 1.3, H * .55); c.restore();
  desenhaParts(); hud(estrelas, META_E, (x, y, s) => estrela(x, y, s * .9, 0));
  if (S.tm > 2 && S.alvoY == null && estrelas < 3) { const e = ents.find(e => !e.pega && e.x > W * .45 && e.x < W - U); if (e) dica(e.x, e.y + .6 * U); }
}

/* ----- Cena 5: lanche no lago ----- */
const COMEM = [[tri, ESP.tri, .11, .88, 1.5], [estego, ESP.estego, .32, .8, .9], [rex, ESP.rex, .52, .95, 1.2], [pesco, ESP.pesco, .86, .9, .6]];
const LONGE = [[anqui, ESP.anqui, .2, .42], [bebe, ESP.tri, .29, .26], [para, ESP.para, .42, .42]];
const CESTA = () => [W * .69, H - .75 * U];
function vaiLanche() {
  S.cena = 'lanche'; S.etapa = 'come'; S.tm = 0; S.noite = false; S.f3 = false; motorPara(); reinicia(); telas('jogo');
  pesco.vira = true; for (const [d] of LONGE) d.vira = Math.random() < .5;
}
function atualizaLanche(dt) {
  S.tm += dt; const ds = COMEM.map(d => d[0]);
  if (S.etapa === 'come') {
    for (const d of ds) d.bocaAlvo = 0;
    if (arrasto) {
      for (const d of ds) {
        if (d.fome <= 0 || !d.bocaXY) continue;
        const dd = Math.hypot(arrasto.x - d.bocaXY[0], arrasto.y - d.bocaXY[1]);
        d.bocaAlvo = clamp(1.25 - dd / (2.6 * U), 0, 1);
        if (dd < .85 * U) { come(d); break; }
      }
    }
    pesco.abaixaAlvo = arrasto && pesco.fome > 0 && arrasto.x > W * .74 ? 1 : 0;
    if (ds.every(d => d.fome <= 0)) { S.etapa = 'cheios'; S.tm = 0; }
  } else if (S.etapa === 'cheios') {
    if (S.tm > 3) { S.etapa = 'anoitece'; trocar(() => { S.noite = true; for (const [d, sp] of DINOS) if (sp) d.dormeAlvo = 1; pesco.abaixaAlvo = .75; S.etapa = 'dorme'; S.tm = 0; }); }
  } else if (S.etapa === 'dorme') {
    if ((S.t % 1.4) < dt) for (const d of ds) if (d.bocaXY) emite(d.bocaXY[0], d.bocaXY[1] - .6 * U, 'z', 1, { vx: .6, vy: .6, g: -.3, dur: 2, s: .25 });
    if (S.tm > 6 && !S.f3) { S.f3 = true; mostra('fim', true); SOM.oba(); }
  }
  const C = CESTA();
  for (const v of voltas) { v.u += dt / .4; v.x = lerp(v.x, C[0], v.u); v.y = lerp(v.y, C[1] - .5 * U, v.u); }
  voltas = voltas.filter(v => v.u < 1);
}
function come(d) {
  arrasto = null; d.mastiga = 1.3; d.fome--; d.bocaAlvo = 0; SOM.nhac();
  emite(d.bocaXY[0], d.bocaXY[1], 'coracao', 5, { vx: 2, vy: 2.5, g: 1, dur: 1.2, s: .22 });
  if (d.fome === 0) setTimeout(() => { d.pulo = .6; SOM.oba(); }, 900);
}
function toqueLanche(x, y, id) {
  if (S.etapa !== 'come') return;
  for (const [d, , , , som] of COMEM) if (d.fome <= 0 && d.bocaXY && Math.hypot(x - d.bocaXY[0], y - d.bocaXY[1]) < 1.2 * U) { rugido(som); d.pulo = .6; return; }
  arrasto = { id, x, y, tipo: sorteio(4) }; SOM.pega();
}
function largaLanche() { if (arrasto) { voltas.push({ x: arrasto.x, y: arrasto.y, tipo: arrasto.tipo, u: 0 }); arrasto = null; } }
function desenhaLanche() {
  const f = fundo(S.noite ? 'noite' : 'tarde'), C = CESTA();
  cenario(f, 2600, false); lago(f);
  if (!S.noite) { const px = ((S.t * 1.6 * U) % (W + 8 * U)) - 4 * U; desenhaPtera(ptera, px, 2.4 * U + Math.sin(S.t) * .4 * U, .7 * U); }
  for (const [d, sp, x, k] of LONGE) desenhaDino(sp, d, W * x, G * .78 + .05 * U, U * k);
  faixa(f.l6, 0, G - .5 * U);
  juncos(W * .03, G - .1 * U, U * 1.1, 4); juncos(W * .97, G - .2 * U, U * 1.2, 8);
  for (const [d, sp, x, k] of [...COMEM].reverse()) desenhaDino(sp, d, W * x, G, U * k);
  cesta(C[0], C[1], U * .9);
  for (const v of voltas) fruta(v.tipo, v.x, v.y, .45 * U * (1 - v.u * .5));
  if (arrasto) fruta(arrasto.tipo, arrasto.x, arrasto.y, .45 * U, Math.sin(S.t * 6) * .1);
  desenhaParts(); tinta(f);
  if (S.etapa === 'come') for (const [d] of COMEM) if (d.fome > 0 && d.bocaXY) {      // frutinhas que faltam para cada um
    for (let i = 0; i < d.fome; i++) fruta(0, d.bocaXY[0] - (d.fome - 1) * .3 * U + i * .6 * U, d.bocaXY[1] - 1.2 * U, .2 * U);
  }
  if (S.etapa === 'come' && !arrasto) {
    const alvo = COMEM.map(d => d[0]).find(d => d.fome > 0 && d.bocaXY);
    if (alvo) { const k = (S.t * .5) % 1, u = k < .7 ? k / .7 : 1; dica(lerp(C[0], alvo.bocaXY[0], u * u), lerp(C[1] - .6 * U, alvo.bocaXY[1] + .2 * U, u)); }
  }
}

/* ----- Título ----- */
function atualizaTitulo(dt) { dist += 1.5 * U * dt; rex.fase += dt * 5; tri.fase += dt * 5.6; pesco.fase += dt * 3.2; estego.fase += dt * 4.6; }
function desenhaTitulo() {
  const f = fundo('dia');
  cenario(f, dist); faixa(f.l4, dist, G - .45 * U);
  desenhaPtera(ptera, ((S.t * 1.8 * U) % (W + 8 * U)) - 4 * U, 3.3 * U + Math.sin(S.t * .8) * .5 * U, .8 * U);
  desenhaDino(ESP.pesco, pesco, W * .84, G - .45 * U, U * .8);
  desenhaDino(ESP.estego, estego, W * .66, G - .2 * U, U * .7);
  desenhaDino(ESP.tri, tri, W * .15, G, U * .9);
  desenhaDino(ESP.rex, rex, W * .42, G, U);
  desenhaParts(); faixa(f.l5, dist * 1.3, H - 1.4 * U); tinta(f);
}

/* ---------- Telas por cima (título, fases, fim) ---------- */
function telas(qual) { for (const id of ['titulo', 'fases', 'escolhe', 'mundos', 'fimCorrida']) mostra(id, qual === id); mostra('fim', false); mostra('bCasa', qual !== 'titulo'); }
const FASES = { acorda: vaiAcorda, estrada: vaiEstrada, floresta: vaiFloresta, ceu: vaiCeu, lanche: vaiLanche };

/* ---------- Toques ---------- */
cv.addEventListener('pointerdown', e => {
  audio(); const x = e.clientX, y = e.clientY;
  if (S.cena === 'acorda') toqueAcorda(x, y);
  else if (S.cena === 'estrada') toqueEstrada();
  else if (S.cena === 'floresta') toqueFloresta(x, y);
  else if (S.cena === 'ceu') { S.dedo = e.pointerId; S.alvoY = y; }
  else if (S.cena === 'lanche') toqueLanche(x, y, e.pointerId);
  else if (typeof TOQUE3D !== 'undefined' && TOQUE3D[S.cena]) TOQUE3D[S.cena](x, y);
  else if (S.cena === 'titulo') { const [d, sp] = DINOS[sorteio(4)]; rugido(sp === ESP.pesco ? .6 : sp === ESP.tri ? 1.5 : 1.1); d.bocaAlvo = 1; setTimeout(() => d.bocaAlvo = 0, 700); }
});
cv.addEventListener('pointermove', e => {
  if (arrasto && e.pointerId === arrasto.id) { arrasto.x = e.clientX; arrasto.y = e.clientY; }
  if (S.cena === 'ceu' && S.dedo === e.pointerId) S.alvoY = e.clientY;
});
const larga = e => { if (arrasto && e.pointerId === arrasto.id) largaLanche(); if (S.dedo === e.pointerId) { S.dedo = null; S.alvoY = null; } };
cv.addEventListener('pointerup', larga); cv.addEventListener('pointercancel', larga);
$('bJogar').onclick = () => { audio(); SOM.oba(); trocar(vaiAcorda); };
$('bFases').onclick = () => { audio(); SOM.pega(); telas('fases'); };
for (const b of document.querySelectorAll('[data-fase]')) b.onclick = () => { audio(); SOM.oba(); trocar(FASES[b.dataset.fase]); };
$('bCasa').onclick = () => { audio(); trocar(vaiTitulo); };
// botão "voltar" do Android: dentro de uma fase volta ao início; no início, sai do app
window.appVoltar = () => { if (S.cena === 'titulo' && !$('fases').classList.contains('on')) return false; if (S.cena === 'titulo') telas('titulo'); else trocar(vaiTitulo); return true; };
$('bDeNovo').onclick = () => { audio(); mostra('fim', false); trocar(vaiAcorda); };

/* ---------- Laço principal ---------- */
const VER = new URLSearchParams(location.search).get('ver');   // só para testes: ?ver=rex|tri|pesco|estego|anqui|para|ptera
const ATUALIZA = { acorda: atualizaAcorda, estrada: atualizaEstrada, floresta: atualizaFloresta, ceu: atualizaCeu, lanche: atualizaLanche };
const DESENHA = { acorda: desenhaAcorda, estrada: desenhaEstrada, floresta: desenhaFloresta, ceu: desenhaVoo, lanche: desenhaLanche };
let ult = performance.now();
function quadro(agora) {
  const dt = Math.min(.05, (agora - ult) / 1000); ult = agora; S.t += dt;
  if (S.trans) { S.escuro += dt * 2.4 * S.trans.dir; if (S.trans.dir > 0 && S.escuro >= 1) { S.escuro = 1; S.trans.fn(); S.trans.dir = -1; } else if (S.trans.dir < 0 && S.escuro <= 0) { S.escuro = 0; S.trans = null; } }
  for (const [st] of DINOS) atualizaDino(st, dt);
  (ATUALIZA[S.cena] || atualizaTitulo)(dt);
  atualizaParts(dt);
  c.setTransform(DPR, 0, 0, DPR, 0, 0); c.lineJoin = 'round'; c.lineCap = 'round';
  if (VER) {
    c.fillStyle = '#cfe3d0'; c.fillRect(0, 0, W, H);
    if (VER === 'ptera') desenhaPtera(ptera, W * .5, H * .5, H * .35);
    else { const [st, sp] = DINOS[{ rex: 0, tri: 1, pesco: 2, estego: 3, anqui: 4, para: 5 }[VER] ?? 0]; st.anda = /anda/.test(location.search); st.fase += dt * 4; st.bocaAlvo = /boca/.test(location.search) ? 1 : 0; desenhaDino(sp, st, W * .55, H * .92, H * (VER === 'pesco' ? .19 : VER === 'para' ? .3 : .38)); }
  } else (DESENHA[S.cena] || desenhaTitulo)();
  if (S.escuro > 0) { c.fillStyle = `rgba(0,0,0,${S.escuro})`; c.fillRect(0, 0, W, H); }
  requestAnimationFrame(quadro);
}
addEventListener('resize', resize);
resize();
for (const [st] of DINOS) st.anda = true;
setTimeout(() => { mostra('abertura', false); if (!VER) vaiTitulo(); }, VER ? 0 : 1800);
requestAnimationFrame(quadro);
// atalho de teste: ?cena=acorda | estrada | floresta | ceu | lanche
const pedida = new URLSearchParams(location.search).get('cena');
if (pedida) setTimeout(() => FASES[pedida]?.(), 1900);
// guarda o jogo no aparelho (só quando aberto pelo link na internet)
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
