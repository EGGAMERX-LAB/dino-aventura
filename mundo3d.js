/* Dino Aventura · EG Gamer X — Aventura 3D
   Corrida "para dentro da tela" (estilo Crash/Banjo) em 4 mundos: floresta, deserto, vulcão e gelo.
   6 dinossauros para escolher e 4 jeitos de correr (a pé, jipe, moto, skate). Nunca perde: bater só faz tropeçar.
   Motor 3D simples: esferas e polígonos projetados em perspectiva, desenhados do fundo para a frente. */
'use strict';

/* ---------- Câmera e projeção ---------- */
const CAM = { x: 0, y: 3, z: -6, p: .26, f: 600, cy: 300, cp: 1, sp: 0 };
function preparaCam() { CAM.cp = Math.cos(CAM.p); CAM.sp = Math.sin(CAM.p); }
function proj(x, y, z) {
  const dx = x - CAM.x, dy = y - CAM.y, dz = z - CAM.z, zc = dz * CAM.cp - dy * CAM.sp;
  if (zc < .15) return null;
  const yc = dy * CAM.cp + dz * CAM.sp, k = CAM.f / zc;
  return [W / 2 + dx * k, CAM.cy - yc * k, zc, k];
}
const horizonte = () => CAM.cy - CAM.f * Math.tan(CAM.p);

/* ---------- Primitivas (juntadas e desenhadas por distância) ---------- */
let PR = [];
const CORES3 = new Map();
function t3(cor) { let v = CORES3.get(cor); if (!v) { v = [mix(cor, '#ffffff', .3), cor, mix(cor, '#000000', .2)]; CORES3.set(cor, v); } return v; }
function esf(x, y, z, r, cor, bias = 0) { const p = proj(x, y, z); if (p && r * p[3] > .4) PR.push({ t: 0, d: p[2] + bias, x: p[0], y: p[1], r: r * p[3], cor }); }
function pol(pts, cor, bias = 0) {
  const q = []; let d = 0;
  for (const [x, y, z] of pts) { const p = proj(x, y, z); if (!p) return; q.push(p); d += p[2]; }
  PR.push({ t: 1, d: d / q.length + bias, q, cor });
}
function fnp(x, y, z, fn, bias = 0) { const p = proj(x, y, z); if (p) PR.push({ t: 2, d: p[2] + bias, p, fn }); }
function polS(pts, dentro, cor, bias = 0) {      // polígono de um sólido: só aparece se estiver virado para a câmera
  let cx = 0, cy = 0, cz = 0; for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2]; } cx /= pts.length; cy /= pts.length; cz /= pts.length;
  if ((cx - dentro[0]) * (CAM.x - cx) + (cy - dentro[1]) * (CAM.y - cy) + (cz - dentro[2]) * (CAM.z - cz) > 0) pol(pts, cor, bias);
}
function desenhaPR() {
  PR.sort((a, b) => b.d - a.d);
  for (const o of PR) {
    if (o.t === 0) {
      const r = o.r, g = c.createRadialGradient(o.x - r * .35, o.y - r * .4, r * .08, o.x, o.y, r);
      g.addColorStop(0, o.cor[0]); g.addColorStop(.55, o.cor[1]); g.addColorStop(1, o.cor[2]);
      c.fillStyle = g; c.beginPath(); c.arc(o.x, o.y, r, 0, TAU); c.fill();
    } else if (o.t === 1) { c.beginPath(); for (const p of o.q) c.lineTo(p[0], p[1]); c.closePath(); c.fillStyle = o.cor; c.fill(); }
    else o.fn(o.p);
  }
  PR = [];
}

/* ---------- Modelo: posição, giro (yaw) e tamanho ---------- */
function mod(x, y, z, yaw, s) { return { x, y, z, s, c: Math.cos(yaw), si: Math.sin(yaw) }; }
function W3(M, lx, ly, lz) { return [M.x + M.s * (lx * M.c + lz * M.si), M.y + M.s * ly, M.z + M.s * (-lx * M.si + lz * M.c)]; }
function mEsf(M, lx, ly, lz, r, cor, bias) { const [x, y, z] = W3(M, lx, ly, lz); esf(x, y, z, r * M.s, cor, bias); }
function mCadeia(M, a, b, ra, rb, cor) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.ceil(d / (Math.min(ra, rb) * .6)));
  for (let i = 0; i <= n; i++) { const u = i / n; mEsf(M, lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(ra, rb, u), cor); }
}
function mCone(M, base, ponta, r, cor) {
  const b = proj(...W3(M, ...base)), t = proj(...W3(M, ...ponta)); if (!b || !t) return;
  const dx = t[0] - b[0], dy = t[1] - b[1], d = Math.hypot(dx, dy) || 1, rs = r * M.s * b[3], nx = -dy / d * rs, ny = dx / d * rs;
  PR.push({ t: 1, d: (b[2] + t[2]) / 2, q: [[b[0] + nx, b[1] + ny], [t[0], t[1]], [b[0] - nx, b[1] - ny]], cor });
}
function mDisco(M, cen, e1, e2, R, cor, n = 18, bias = 0) {
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, ca = Math.cos(a) * R, sa = Math.sin(a) * R; pts.push(W3(M, cen[0] + e1[0] * ca + e2[0] * sa, cen[1] + e1[1] * ca + e2[1] * sa, cen[2] + e1[2] * ca + e2[2] * sa)); }
  pol(pts, cor, bias);
}
function caixa(M, x0, x1, y0, y1, z0, z1, cor, faces = 'tdfblr') {
  const P = (x, y, z) => W3(M, x, y, z), dentro = P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const claro = mix(cor, '#ffffff', .22), escuro = mix(cor, '#000000', .22);
  const F = {
    t: [[P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], claro], d: [[P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], escuro],
    f: [[P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], cor], b: [[P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], cor],
    l: [[P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], escuro], r: [[P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], escuro]
  };
  for (const k of faces) polS(F[k][0], dentro, F[k][1]);
}
function roda(M, x, y, z, r, w, ang, cor = '#1c1c1c') {    // pneu = cilindro de verdade (aparece certo de trás e de lado)
  const n = 12, A = [], B = [], cen = W3(M, x, y, z);
  for (let i = 0; i < n; i++) { const a = ang + i / n * TAU; A.push(W3(M, x - w, y + Math.cos(a) * r, z + Math.sin(a) * r)); B.push(W3(M, x + w, y + Math.cos(a) * r, z + Math.sin(a) * r)); }
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; polS([A[i], A[j], B[j], B[i]], cen, i % 2 ? cor : mix(cor, '#ffffff', .12)); }
  const lado = x >= 0 ? 1 : -1, cap = lado > 0 ? B : A, cc = W3(M, x + lado * w, y, z);
  polS(cap, cen, '#2a2a2a');
  const v = [CAM.x - cc[0], CAM.y - cc[1], CAM.z - cc[2]], nrm = [cc[0] - cen[0], cc[1] - cen[1], cc[2] - cen[2]];
  if (v[0] * nrm[0] + v[1] * nrm[1] + v[2] * nrm[2] > 0) mDisco(M, [x + lado * (w + .005), y, z], [0, 1, 0], [0, 0, 1], r * .5, '#b9c1c7', 10, -.001);
}

/* ---------- Dinossauros em 3D (usam os mesmos dados dos desenhos 2D) ---------- */
// cabeças: esferas [frente, baixo, lado, raio] no espaço da cabeça; boca gira na dobradiça
const CAB3 = {
  rex: { esf: [[-.12, -.1, 0, .2], [.12, -.15, 0, .17], [.34, -.12, 0, .135], [.54, -.08, 0, .1], [.7, -.05, 0, .075], [-.02, -.04, .1, .13], [-.02, -.04, -.1, .13]],
    boca: [[0, .05, 0, .12], [.24, .07, 0, .095], [.47, .07, 0, .07], [.65, .04, 0, .05]], dob: [-.04, .03], olho: [.12, -.2, .12, .05] },
  tri: { esf: [[-.08, -.08, 0, .2], [.18, -.08, 0, .16], [.38, -.03, 0, .11]], bico: [[.55, .07, 0, .075]],
    boca: [[.08, .1, 0, .11], [.32, .12, 0, .07]], dob: [.08, .12], olho: [.06, -.12, .14, .04], babado: true },
  estego: { esf: [[-.06, -.05, 0, .12], [.14, -.05, 0, .1], [.3, -.01, 0, .075]], boca: [[.06, .05, 0, .08], [.26, .06, 0, .05]], dob: [0, .05], olho: [.07, -.08, .08, .03] },
  anqui: { esf: [[-.06, -.06, 0, .16], [.14, -.07, 0, .15], [.28, -.03, 0, .11], [-.12, -.1, .12, .08], [-.12, -.1, -.12, .08]],
    boca: [[.06, .08, 0, .1], [.24, .08, 0, .07]], dob: [0, .08], olho: [.06, -.09, .13, .03] },
  para: { esf: [[-.06, -.08, 0, .16], [.16, -.09, 0, .14], [.36, -.05, 0, .11], [.52, -.02, 0, .085]],
    boca: [[.06, .06, 0, .1], [.3, .07, 0, .08], [.5, .06, 0, .06]], dob: [.02, .06], olho: [.08, -.12, .13, .04], crista: true },
  pesco: { esf: [[-.04, -.06, 0, .12], [.14, -.06, 0, .1], [.3, -.02, 0, .07], [.06, -.17, 0, .08]],
    boca: [[.04, .05, 0, .08], [.24, .05, 0, .05]], dob: [0, .05], olho: [.05, -.09, .09, .035] }
};
const LARG3 = { anqui: .2, tri: .08, pesco: .1 };
function raioEm(P, x) { let m = P[0]; for (const p of P) if (Math.abs(p[0] - x) < Math.abs(m[0] - x)) m = p; return m[2]; }
function dino3d(chave, st, M) {
  const sp = ESP[chave], cs = sp.cs, cC = t3(cs.med), cE = t3(cs.esc), cB = t3(cs.bar), cA = t3(cs.acc);
  const dy = (st.anda ? -Math.abs(Math.sin(st.fase)) * .05 : 0) + st.dy + st.dorme * sp.deita;
  const P = poseSpine(sp, st, dy), S = crPts(P, 4), larg = LARG3[chave] || 0;
  for (let i = 0; i < S.length; i++) {                                           // corpo liso: esferas bem juntinhas
    const p = S[i], q = S[Math.min(S.length - 1, i + 1)], d = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.ceil(d / Math.max(.045, Math.min(p[2], q[2]) * .45)));
    for (let j = 0; j < n; j++) { const u = j / n, x = lerp(p[0], q[0], u), y = lerp(p[1], q[1], u), r = Math.max(.025, lerp(p[2], q[2], u)); mEsf(M, 0, -y, x, r, cC); if (larg && r > .15) { mEsf(M, larg, -y + .02, x, r * .82, cC); mEsf(M, -larg, -y + .02, x, r * .82, cC); } }
  }
  if (chave === 'estego') {                                                      // placas e espinhos da cauda
    [[.18, .16], [.27, .23], [.36, .31], [.45, .37], [.54, .39], [.63, .35], [.72, .28], [.8, .2], [.87, .13]].forEach(([u, h], i) => {
      const p = S[Math.round(u * (S.length - 1))], s = i % 2 ? 1 : -1, b = -p[1] + p[2] * .72, f = p[0], w = h * .62;
      const pts = [[0, b, f - w / 2], [s * h * .15, b + h * .55, f - w * .45], [s * h * .32, b + h, f], [s * h * .15, b + h * .55, f + w * .45], [0, b, f + w / 2]];
      const q = pts.map(v => W3(M, ...v)); pol(q, s > 0 ? cs.acc : mix(cs.acc, '#000000', .2));
    });
    const t = S[2]; for (const s of [-1, 1]) for (const o of [0, .12]) mCone(M, [s * .05, -t[1] + .05, t[0] + o], [s * .38, -t[1] + .3, t[0] + o - .22], .04, '#efe3c2');
  }
  if (chave === 'anqui') {                                                       // armadura e marreta
    for (let i = 2; i < S.length - 2; i += 2) { const p = S[i]; if (p[2] < .14) continue; for (const a of [-1, -.5, 0, .5, 1]) mEsf(M, Math.sin(a) * (p[2] * .95 + larg * Math.abs(Math.sign(a))), -p[1] + Math.cos(a) * p[2] * .95, p[0], p[2] * .17, cA); }
    const t = S[0]; mEsf(M, 0, -t[1], t[0], .22, cA); mEsf(M, .14, -t[1], t[0] + .02, .15, cA); mEsf(M, -.14, -t[1], t[0] + .02, .15, cA);
  }
  // pernas
  if (!st.sentado) for (const L of sp.pernas) {
    const lat = (L.longe ? 1 : -1) * Math.max(.12, raioEm(P, L.q[0]) * .62 + (larg ? larg * .6 : 0));
    const hx = L.q[0], hy = L.q[1] + dy, ph = st.fase + L.fase, an = st.anda ? 1 : 0;
    const fx = hx + L.pe + L.passo * an * Math.sin(ph), lift = an * Math.max(0, Math.cos(ph)) * L.alto;
    let ax = fx - L.calc, ay = -L.tornoz - lift;
    const dx = ax - hx, dyy = ay - hy, d = Math.hypot(dx, dyy), m = L.l[0] + L.l[1] - .01;
    if (d > m) { ax = hx + dx / d * m; ay = hy + dyy / d * m; }
    const [kx, ky] = ik(hx, hy, ax, ay, L.l[0], L.l[1], L.dobra);
    mCadeia(M, [lat, -hy, hx], [lat, -ky, kx], L.r[0], L.r[1], cC);
    mCadeia(M, [lat, -ky, kx], [lat, -ay, ax], L.r[1], L.r[2], cC);
    if (L.tipo === 'bi') mCadeia(M, [lat, -ay, ax], [lat, .045 + lift * .6, fx + .2], L.r[2], .05, cE);
    else mEsf(M, lat, lift + L.r[2] * 1.05, ax, L.r[2] * 1.18, cE);
  }
  // braços
  if (sp.bracos) for (const s of [-1, 1]) {
    const [ox, oy] = sp.ombro || [.6, -1.14], [b1, b2] = sp.bracoL || [.16, .14], w = Math.sin(st.t * 9 + s);
    const a1 = st.acena ? .3 + w * .35 : st.dirige ? 1.0 : 1.3 + Math.sin(st.t * 2 + s) * .08, a2 = st.acena ? -1 + w * .4 : st.dirige ? -.1 : .1;
    const sx = ox, sy = oy + dy, ex = sx + Math.cos(a1) * b1, ey = sy + Math.sin(a1) * b1, hx = ex + Math.cos(a2) * b2, hy = ey + Math.sin(a2) * b2, lat = s * Math.max(.14, raioEm(P, ox) * .75);
    mCadeia(M, [lat, -sy, sx], [lat * 1.1, -ey, ex], .06, .045, cC); mCadeia(M, [lat * 1.1, -ey, ex], [lat * 1.1, -hy, hx], .045, .035, cC);
  }
  // cabeça
  const e = P[P.length - 1], ox = e[0] + sp.cab[0], oy = e[1] + sp.cab[1], h = CAB3[chave];
  const ang = lerp(sp.cabAng, sp.cabAng2 ?? sp.cabAng, st.abaixa) + (st.anda ? Math.sin(st.fase * 2) * .04 : Math.sin(st.t * 1.3) * .03) + st.dorme * sp.cabDorme + st.cabExtra;
  const ca = Math.cos(ang), sa = Math.sin(ang), H2 = (x, y) => [ox + x * ca - y * sa, oy + x * sa + y * ca];
  const ponto = (x, y, z, r, cor) => { const [fx, fy] = H2(x, y); mEsf(M, z, -fy, fx, r, cor); };
  const liga = (lista, cor, gira) => {                                           // esferas do centro ligadas em corrente (cabeça lisa)
    const pos = lista.map(([x, y, z, r]) => { const [a, b] = gira ? gira(x, y) : [x, y]; return [a, b, z, r]; });
    const meio = pos.filter(p => p[2] === 0);
    for (let i = 0; i < meio.length - 1; i++) { const [x1, y1, , r1] = meio[i], [x2, y2, , r2] = meio[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / (Math.min(r1, r2) * .4))); for (let j = 0; j <= n; j++) { const u = j / n; ponto(lerp(x1, x2, u), lerp(y1, y2, u), 0, lerp(r1, r2, u), cor); } }
    for (const p of pos) if (p[2] !== 0 || meio.length < 2) ponto(p[0], p[1], p[2], p[3], cor);
  };
  liga(h.esf, cC);
  for (const [x, y, z, r] of h.bico || []) ponto(x, y, z, r, t3('#3f2e22'));
  const ba = st.boca * .5, [hx0, hy0] = h.dob;
  liga(h.boca, cB, (x, y) => { const rx = x - hx0, ry = y - hy0; return [hx0 + rx * Math.cos(ba) - ry * Math.sin(ba), hy0 + rx * Math.sin(ba) + ry * Math.cos(ba)]; });
  const [ex, ey, ez, er] = h.olho, fecha = st.dorme > .5 || (st.t % 3.6) < .12;
  for (const s of [-1, 1]) {
    ponto(ex, ey, s * ez, er, fecha ? cC : t3('#e8b04a'));
    if (!fecha) ponto(ex + er * .45, ey, s * (ez + er * .55), er * .5, t3('#1a1008'));
  }
  if (h.crista) { const a = H2(0, -.12), b = H2(-.72, -.52); mCadeia(M, [0, -a[1], a[0]], [0, -b[1], b[0]], .075, .05, cA); }
  if (h.babado) {
    const cen = H2(-.15, -.32), dir = H2(-.15 - .45, -.32 - .9), dd = Math.hypot(dir[0] - cen[0], dir[1] - cen[1]);
    const e2 = [0, -(dir[1] - cen[1]) / dd, (dir[0] - cen[0]) / dd];
    mDisco(M, [0, -cen[1], cen[0]], [1, 0, 0], e2, .46, cs.acc, 20, -.02);
    for (let i = 0; i < 12; i++) { const a = -PI * .1 + i / 11 * PI * 1.2, x = Math.cos(a) * .46, y = Math.sin(a) * .46; mEsf(M, x, -cen[1] + e2[1] * y, cen[0] + e2[2] * y, .05, t3(mix(cs.acc, '#000000', .15))); }
    for (const s of [-1, 1]) { const b = H2(.14, -.24), t = H2(.55, -.68); mCone(M, [s * .09, -b[1], b[0]], [s * .13, -t[1], t[0]], .055, '#efe3c2'); }
    const b = H2(.38, -.12), t = H2(.46, -.32); mCone(M, [0, -b[1], b[0]], [0, -t[1], t[0]], .04, '#efe3c2');
  }
}
const ESCALA3 = { rex: .9, tri: 1.05, estego: .95, anqui: 1.05, para: .88, pesco: .6 };
const ALTURA_QUADRIL = k => -ESP[k].pernas[0].q[1];

/* ---------- Veículos ---------- */
const VEIC = {
  pe: { ic: '🦶', vel: 9 },
  jipe: { ic: '🚙', vel: 12, senta: .62, desenha(M, r) {
    const cor = '#e8641e';
    roda(M, -.86, .36, -.95, .36, .16, r); roda(M, .86, .36, -.95, .36, .16, r); roda(M, -.86, .36, 1.25, .36, .16, r); roda(M, .86, .36, 1.25, .36, .16, r);
    caixa(M, -.8, .8, .3, .8, -1.35, 1.0, cor, 'dfblr');
    caixa(M, -.78, .78, .3, .72, 1.0, 1.85, cor);
    caixa(M, -.86, .86, .24, .42, -1.5, -1.35, '#2b2b2b'); caixa(M, -.86, .86, .24, .42, 1.85, 2.0, '#2b2b2b');
    caixa(M, -.72, -.62, .8, 1.62, -1.0, -.9, '#333'); caixa(M, .62, .72, .8, 1.62, -1.0, -.9, '#333'); caixa(M, -.72, .72, 1.52, 1.62, -1.0, -.9, '#333');
    caixa(M, -.7, -.5, .62, .72, -1.36, -1.35, '#ff3b30', 'b'); caixa(M, .5, .7, .62, .72, -1.36, -1.35, '#ff3b30', 'b');
  } },
  moto: { ic: '🏍️', vel: 13, senta: .78, desenha(M, r) {
    roda(M, 0, .38, -.85, .38, .12, r, '#202020'); roda(M, 0, .38, .95, .38, .12, r, '#202020');
    caixa(M, -.16, .16, .42, .72, -.7, .75, '#1e6fd9'); caixa(M, -.2, .2, .62, .85, .2, .7, '#2a86f0');
    caixa(M, -.18, .18, .72, .8, -.75, .15, '#222'); caixa(M, -.5, .5, 1.05, 1.12, .78, .86, '#333'); caixa(M, -.05, .05, .6, 1.08, .8, .86, '#555');
    caixa(M, .18, .3, .35, .45, -.95, -.3, '#9aa3aa');
  } },
  skate: { ic: '🛹', vel: 11, pe: .24, desenha(M, r) {
    for (const x of [-.24, .24]) for (const z of [-.55, .55]) roda(M, x, .07, z, .07, .04, r, '#f2d24b');
    caixa(M, -.33, .33, .13, .21, -.85, .85, '#8e44ad'); caixa(M, -.3, .3, .215, .225, -.8, .8, '#2b2b2b', 't');
  } }
};
function personagem(chave, st, vk, x, y, z, yaw, roda) {        // dino + veículo, já no mundo
  const s = ESCALA3[chave], V = VEIC[vk];
  if (V.desenha) V.desenha(mod(x, y, z, yaw, 1), roda);
  const py = V.senta ? y + V.senta - ALTURA_QUADRIL(chave) * s * .92 : y + (V.pe || 0);
  st.sentado = !!V.senta; st.dirige = !!V.senta;
  dino3d(chave, st, mod(x, py, z + (V.senta ? -.25 : 0), yaw, s));
}

/* ---------- Mundos ---------- */
const MUNDOS = {
  floresta: { ceu: ['#4f9fdc', '#a9d8f2', '#e6f3e2'], neb: '#d4e8da', chao: ['#5f8f3a', '#557f33'], pista: ['#a07a4a', '#94703f'], borda: '#6b4a2a', deco: ['pinheiro', 'palma', 'arbusto', 'pinheiro', 'samambaia'], obst: ['pedra', 'tronco'], serra: ['#7f97a8', '#5d8a66'] },
  deserto: { ceu: ['#5fa7d9', '#bfe0f0', '#f6e7c4'], neb: '#f2dcae', chao: ['#e2c07a', '#d9b56c'], pista: ['#efd59a', '#e6ca88'], borda: '#c79a52', deco: ['cacto', 'mesa', 'cacto', 'seco', 'rochaVermelha'], obst: ['cactinho', 'pedra'], serra: ['#c98a5a', '#b5643a'] },
  vulcao: { ceu: ['#1e0a0e', '#6a2014', '#d9602a'], neb: '#7a3420', chao: ['#3a2a26', '#33241f'], pista: ['#4f3d36', '#45352f'], borda: '#ff7a1a', deco: ['arvoreSeca', 'rochaLava', 'vulcaozinho', 'rochaLava'], obst: ['rochaLava'], serra: ['#3a1e1a', '#24120f'], lava: true, part: 'brasa' },
  gelo: { ceu: ['#6fa8d8', '#cfe6f6', '#f2f8fc'], neb: '#e9f2fa', chao: ['#eef5fb', '#e3edf6'], pista: ['#bfe0f4', '#b0d6ee'], borda: '#7fb6dc', deco: ['pinheiroNeve', 'cristal', 'monteNeve', 'pinheiroNeve'], obst: ['blocoGelo', 'bolaNeve'], serra: ['#b8cfe4', '#dfeaf5'], part: 'neve' }
};
const ORDEM_MUNDOS = ['floresta', 'deserto', 'vulcao', 'gelo'];
const PISTA = 2.8, FAIXA = 1.9, COMPR = 320;

/* ----- Enfeites desenhados uma vez (como figurinhas) ----- */
const SPR = {};
function figurinha(nome, wm, hm, fn) {
  const k = document.createElement('canvas'), px = 70; k.width = Math.ceil(wm * px); k.height = Math.ceil(hm * px);
  const g = k.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round'; fn(g, k.width, k.height); SPR[nome] = { img: k, w: wm, h: hm };
}
function cacto(g, x, y, h, sd) {
  const r = rng(sd), w = h * .14, cor = '#4f8a3a';
  const tubo = (x0, y0, x1, y1, ww) => { const gr = g.createLinearGradient(x0 - ww, 0, x0 + ww, 0); gr.addColorStop(0, '#7fbf5a'); gr.addColorStop(.5, cor); gr.addColorStop(1, '#2c5a22'); g.strokeStyle = gr; g.lineWidth = ww * 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const bx = x - w * 1.8, by = y - h * (.35 + r() * .15), cx = x + w * 1.8, cy = y - h * (.45 + r() * .15);
  tubo(bx, by, bx, by - h * .25, w * .7); g.strokeStyle = cor; g.lineWidth = w * 1.4; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx, by + w * .9, x, by + w * .9); g.stroke();
  tubo(cx, cy, cx, cy - h * .22, w * .7); g.beginPath(); g.strokeStyle = cor; g.moveTo(cx, cy); g.quadraticCurveTo(cx, cy + w * .9, x, cy + w * .9); g.stroke();
  tubo(x, y, x, y - h + w, w);
  g.strokeStyle = 'rgba(20,50,15,.35)'; g.lineWidth = Math.max(1, w * .12); for (const o of [-.45, 0, .45]) { g.beginPath(); g.moveTo(x + o * w, y); g.lineTo(x + o * w, y - h + w * 1.2); g.stroke(); }
}
function prepFiguras() {
  if (SPR.pronto) return;
  figurinha('pinheiro', 3, 6.5, (g, w, h) => conifera(g, w / 2, h, h * .98, '#2c5a31', 7));
  figurinha('palma', 4, 5.5, (g, w, h) => palma(g, w / 2, h, h * .95, '#2f5e2a', 9, { tronco: .55, larg: .06, queda: .45, n: 11 }));
  figurinha('arbusto', 2.6, 1.6, (g, w, h) => arbusto(g, w / 2, h * .92, h * .5, '#3a6e2c', 11));
  figurinha('samambaia', 2.4, 1.6, (g, w, h) => samambaia(g, w / 2, h, h * .9, '#3d7030', 13));
  figurinha('cacto', 1.8, 3.4, (g, w, h) => cacto(g, w / 2, h, h * .98, 5));
  figurinha('mesa', 7, 4.5, (g, w, h) => {
    g.beginPath(); g.moveTo(w * .05, h); g.lineTo(w * .2, h * .12); g.lineTo(w * .8, h * .1); g.lineTo(w * .95, h); g.closePath();
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#e08a52'); gr.addColorStop(.6, '#c0643a'); gr.addColorStop(1, '#8a3f22'); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(120,50,20,.35)'; g.lineWidth = h * .025; for (const t of [.3, .5, .7]) { g.beginPath(); g.moveTo(w * (.2 - t * .14 + .02), h * (.12 + t * .88)); g.lineTo(w * (.8 + t * .14 - .02), h * (.1 + t * .9)); g.stroke(); }
  });
  figurinha('seco', 1.6, 1.2, (g, w, h) => { const r = rng(3); g.strokeStyle = '#a07a40'; g.lineWidth = 2; for (let i = 0; i < 60; i++) { const a = r() * TAU, b = r() * TAU, rr = h * .42; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * rr, h * .55 + Math.sin(a) * rr); g.quadraticCurveTo(w / 2, h * .55, w / 2 + Math.cos(b) * rr, h * .55 + Math.sin(b) * rr); g.stroke(); } });
  figurinha('rochaVermelha', 2.4, 1.6, (g, w, h) => { g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(w * .05, h * .2, w * .45, h * .08); g.quadraticCurveTo(w * .95, h * .1, w, h); g.closePath(); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e59a62'); gr.addColorStop(1, '#8a4224'); g.fillStyle = gr; g.fill(); });
  figurinha('arvoreSeca', 3, 4.5, (g, w, h) => {
    g.strokeStyle = '#1e1412'; const galho = (x, y, a, l, e) => { if (e < 1) return; const x2 = x + Math.cos(a) * l, y2 = y + Math.sin(a) * l; g.lineWidth = e; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); galho(x2, y2, a - .5, l * .7, e * .65); galho(x2, y2, a + .45, l * .65, e * .6); };
    galho(w / 2, h, -PI / 2, h * .38, w * .07);
  });
  figurinha('rochaLava', 2.2, 2.2, (g, w, h) => {
    const gl = g.createRadialGradient(w / 2, h * .9, 0, w / 2, h * .9, w * .6); gl.addColorStop(0, 'rgba(255,120,30,.6)'); gl.addColorStop(1, 'rgba(255,80,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, h);
    g.beginPath(); g.moveTo(w * .08, h); g.lineTo(w * .2, h * .45); g.lineTo(w * .38, h * .5); g.lineTo(w * .5, h * .08); g.lineTo(w * .66, h * .42); g.lineTo(w * .82, h * .35); g.lineTo(w * .92, h); g.closePath();
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#4a3632'); gr.addColorStop(1, '#1c1210'); g.fillStyle = gr; g.fill();
    g.strokeStyle = '#ff8a1e'; g.lineWidth = w * .025; g.beginPath(); g.moveTo(w * .5, h * .2); g.lineTo(w * .45, h * .55); g.lineTo(w * .55, h * .75); g.lineTo(w * .48, h); g.moveTo(w * .3, h * .6); g.lineTo(w * .35, h * .85); g.stroke();
  });
  figurinha('vulcaozinho', 8, 4.5, (g, w, h) => {
    g.beginPath(); g.moveTo(0, h); g.lineTo(w * .42, h * .12); g.lineTo(w * .58, h * .12); g.lineTo(w, h); g.closePath();
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#5a3a30'); gr.addColorStop(1, '#22140f'); g.fillStyle = gr; g.fill();
    g.strokeStyle = '#ff7a1a'; g.lineWidth = w * .02; for (const o of [-.06, .03, .1]) { g.beginPath(); g.moveTo(w * (.5 + o * .3), h * .13); g.quadraticCurveTo(w * (.5 + o), h * .5, w * (.5 + o * 2), h * .9); g.stroke(); }
    const gl = g.createRadialGradient(w / 2, h * .12, 0, w / 2, h * .12, w * .15); gl.addColorStop(0, 'rgba(255,200,60,.9)'); gl.addColorStop(1, 'rgba(255,90,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, h * .4);
  });
  figurinha('pinheiroNeve', 3, 6.5, (g, w, h) => {
    conifera(g, w / 2, h, h * .98, '#2f5a4e', 21);
    g.globalCompositeOperation = 'source-atop'; const r = rng(4);
    for (let i = 0; i < 40; i++) { const y = h * (.05 + r() * .75); g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.ellipse(w / 2 + (r() - .5) * w * .6 * (y / h + .2), y, w * (.08 + r() * .08), h * .018, 0, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  });
  figurinha('cristal', 2.2, 2.6, (g, w, h) => {
    for (const [x, a, l, wd] of [[.5, 0, .95, .16], [.35, -.35, .65, .12], [.66, .4, .7, .12], [.22, -.6, .4, .09], [.8, .6, .45, .09]]) {
      g.save(); g.translate(w * x, h); g.rotate(a); const L = h * l, ww = w * wd;
      g.beginPath(); g.moveTo(-ww, 0); g.lineTo(-ww, -L * .8); g.lineTo(0, -L); g.lineTo(ww, -L * .8); g.lineTo(ww, 0); g.closePath();
      const gr = g.createLinearGradient(-ww, 0, ww, 0); gr.addColorStop(0, '#e8f7ff'); gr.addColorStop(.5, '#9fd4f2'); gr.addColorStop(1, '#5aa6d6'); g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -L); g.lineTo(0, 0); g.stroke(); g.restore();
    }
  });
  figurinha('monteNeve', 3, 1.2, (g, w, h) => { g.beginPath(); g.ellipse(w / 2, h, w / 2, h * .95, 0, PI, TAU); const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#c9dcec'); g.fillStyle = gr; g.fill(); });
  SPR.pronto = true;
}
/* ----- Serra do fundo (uma por mundo) ----- */
const SERRAS = {};
function serra(nome) {
  const chave = nome + W + 'x' + H; if (SERRAS[chave]) return SERRAS[chave];
  const M = MUNDOS[nome], w = Math.ceil(W * 2), h = Math.ceil(H * .32), k = document.createElement('canvas'); k.width = w; k.height = h;
  const g = k.getContext('2d'), r = rng(nome.length * 7 + 3);
  const onda = (x, A) => A.reduce((s, [a, f, fz]) => s + a * Math.sin(TAU * f * x / w + fz), 0);
  const camadaS = (base, A, cor, picos) => { g.fillStyle = cor; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 4) { let y = base + onda(x, A); if (picos) y -= Math.max(0, Math.sin(x / w * TAU * 3 + 1)) ** 6 * h * .35; g.lineTo(x, y); } g.lineTo(w, h); g.fill(); };
  camadaS(h * .35, [[h * .14, 2, r() * 7], [h * .07, 5, r() * 7], [h * .03, 13, r() * 7]], mix(M.serra[0], M.neb, .45), nome === 'gelo');
  if (nome === 'deserto') { g.fillStyle = mix(M.serra[1], M.neb, .25); for (const [x, wd, ht] of [[.1, .12, .45], [.32, .08, .35], [.6, .15, .5], [.84, .1, .38]]) { g.beginPath(); g.moveTo(w * (x - wd * .6), h); g.lineTo(w * (x - wd * .4), h * (1 - ht)); g.lineTo(w * (x + wd * .4), h * (1 - ht)); g.lineTo(w * (x + wd * .6), h); g.fill(); } }
  else camadaS(h * .62, [[h * .1, 3, r() * 7], [h * .05, 7, r() * 7], [h * .02, 17, r() * 7]], mix(M.serra[1], M.neb, .2), nome === 'gelo');
  if (nome === 'vulcao') {
    const vx = w * .5; g.fillStyle = '#2a1410'; g.beginPath(); g.moveTo(vx - h * 1.4, h); g.lineTo(vx - h * .18, h * .08); g.lineTo(vx + h * .18, h * .08); g.lineTo(vx + h * 1.4, h); g.fill();
    g.strokeStyle = '#ff6a10'; g.lineWidth = h * .025; for (const o of [-.1, .05]) { g.beginPath(); g.moveTo(vx + o * h, h * .1); g.quadraticCurveTo(vx + o * h * 3, h * .5, vx + o * h * 5, h); g.stroke(); }
    const gl = g.createRadialGradient(vx, h * .08, 0, vx, h * .08, h * .5); gl.addColorStop(0, 'rgba(255,190,60,.9)'); gl.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gl; g.fillRect(vx - h * .5, 0, h, h * .6);
  }
  if (nome === 'gelo') { g.fillStyle = 'rgba(255,255,255,.55)'; for (let x = 0; x < w; x += 3) { const y = h * .35 + onda(x, [[h * .14, 2, 0]]); } }
  return (SERRAS[chave] = k);
}

/* ---------- Estado da corrida ---------- */
const J3 = { dino: 'rex', veic: 'pe', mundo: 'floresta', z: 0, x: 0, faixa: 0, y: 0, vy: 0, vel: 0, roda: 0, trop: 0, frutas: 0, fim: false, yaw: 0, tf: 0 };
let objs = [], flocos = [];
const DINOS3 = ['rex', 'tri', 'estego', 'anqui', 'para', 'pesco'];
const ESTADO = { rex, tri, estego, anqui, para, pesco };
function geraFase(nome) {
  const M = MUNDOS[nome], r = rng(nome.length * 31 + Date.now() % 1000); objs = [];
  for (let z = 22; z < COMPR - 25;) {
    const t = r();
    if (t < .5) { const f = (r() * 3 | 0) - 1, n = 3 + (r() * 4 | 0), alto = r() < .25; for (let i = 0; i < n; i++) objs.push({ k: 'fruta', x: f * FAIXA, y: alto ? 2 : .8, z: z + i * 2.4, f: r() * 4 | 0 }); z += n * 2.4 + 7; }
    else if (t < .88) {
      const f = (r() * 3 | 0) - 1, tipo = M.obst[r() * M.obst.length | 0];
      objs.push({ k: 'obst', tipo, x: f * FAIXA, y: 0, z, sd: r() * 1e6 | 0 }); objs.push({ k: 'estrela', x: f * FAIXA, y: 2.3, z });
      if (r() < .35) { const f2 = f === 1 ? -1 : f + 1; objs.push({ k: 'obst', tipo: M.obst[r() * M.obst.length | 0], x: f2 * FAIXA, y: 0, z: z + 1.5, sd: r() * 1e6 | 0 }); }
      z += 13;
    } else { objs.push({ k: 'estrela', x: ((r() * 3 | 0) - 1) * FAIXA, y: .9, z }); z += 6; }
  }
  for (let z = -10; z < COMPR + 60; z += 3 + r() * 4) for (const lado of [-1, 1]) if (r() < .8) objs.push({ k: 'deco', x: lado * (PISTA + 1.5 + r() * 14), z: z + r() * 2, s: M.deco[r() * M.deco.length | 0], esc: .8 + r() * .5 });
  objs.push({ k: 'chegada', x: 0, z: COMPR });
  objs.sort((a, b) => a.z - b.z);
}
function vaiCorrida(nome) {
  prepFiguras(); J3.mundo = nome; geraFase(nome);
  Object.assign(J3, { z: 0, x: 0, faixa: 0, y: 0, vy: 0, vel: 0, trop: 0, frutas: 0, fim: false, yaw: 0, tf: 0, falou: false });
  reinicia(); motorPara(); telas('jogo'); S.cena = 'corrida'; S.tm = 0; flocos = [];
  const st = ESTADO[J3.dino]; st.anda = J3.veic === 'pe';
  if (J3.veic === 'jipe' || J3.veic === 'moto') motorLiga();
}
function pula3() { if (J3.y <= .001 && !J3.fim) { J3.vy = 8.2; SOM.pulo(); } }
function anda3(d) { if (J3.fim) return; J3.faixa = clamp(J3.faixa + d, -1, 1); SOM.pega(); }
function toqueCorrida(x, y) { if (x < W * .33) anda3(-1); else if (x > W * .67) anda3(1); else pula3(); }
function atualizaCorrida(dt) {
  S.tm += dt; const V = VEIC[J3.veic], st = ESTADO[J3.dino];
  if (S.tm > .5 && !J3.falou) { J3.falou = true; fala(NOMES[J3.dino]); }
  const alvo = J3.fim ? 0 : V.vel * (J3.trop > 0 ? .55 : 1) * clamp(S.tm / 1.2, 0, 1);
  J3.vel = lerp(J3.vel, alvo, suave(dt, J3.fim ? 2 : 3)); J3.z += J3.vel * dt; J3.roda += J3.vel * dt / .36;
  J3.trop = Math.max(0, J3.trop - dt);
  const ax = J3.faixa * FAIXA; J3.x = lerp(J3.x, ax, suave(dt, 9));
  J3.vy -= 22 * dt; J3.y = Math.max(0, J3.y + J3.vy * dt); if (J3.y === 0) J3.vy = Math.max(0, J3.vy);
  st.fase += dt * J3.vel * (J3.veic === 'pe' ? 1.25 : 0); st.anda = J3.veic === 'pe' && J3.vel > .5 && J3.y === 0;
  st.cabExtra = J3.trop > 0 ? Math.sin(J3.trop * 20) * .15 : 0;
  if (!J3.fim) J3.yaw = clamp((ax - J3.x) * .35, -.4, .4);
  if (mot) { vel = J3.vel / 13 * 3.4 * U; motorAtualiza(); }
  for (const o of objs) {
    if (o.z < J3.z - 2) continue; if (o.z > J3.z + 1.2) break;
    if (o.pega || o.voa || Math.abs(o.x - J3.x) > 1) continue;
    if (o.k === 'fruta' || o.k === 'estrela') {
      if (o.y >= J3.y - .2 && o.y <= J3.y + 1.9) { o.pega = true; J3.frutas += o.k === 'estrela' ? 3 : 1; SOM.pega(); const p = proj(o.x, o.y, o.z); if (p) emite(p[0], p[1], 'brilho', o.k === 'estrela' ? 12 : 6, { vx: 4, vy: 2, g: 3, dur: .8, s: .22 }); st.mastiga = .5; }
    } else if (o.k === 'obst' && Math.abs(o.z - J3.z) < .7) {
      if (J3.y < .75) { o.voa = true; o.vx = (o.x >= J3.x ? 1 : -1) * 6; o.vy = 7; o.vz = 6; o.giro = 0; J3.trop = .8; SOM.tum(); rugido(1.5); const p = proj(o.x, .5, o.z); if (p) emite(p[0], p[1], 'poeira', 10, { vx: 5, vy: 1.5, g: 2, dur: .7, s: .3 }); }
    }
  }
  for (const o of objs) if (o.voa) { o.x += o.vx * dt; o.vy -= 20 * dt; o.y += o.vy * dt; o.z += o.vz * dt; o.giro += dt * 8; }
  if (!J3.fim && J3.z >= COMPR) { J3.fim = true; J3.tf = 0; SOM.oba(); setTimeout(() => SOM.buzina(), 300); }
  if (J3.fim) {
    J3.tf += dt; J3.yaw = lerp(J3.yaw, PI, suave(dt, 2.5));
    if (J3.tf > 1.4 && (S.t % .9) < dt) { st.pulo = .6; emite(W / 2 + (Math.random() - .5) * W * .5, H * .3, 'brilho', 14, { vx: 6, vy: 3, g: 4, dur: 1.2, s: .3 }); }
    if (J3.tf > 1.6 && J3.tf - dt <= 1.6) { rugido(1.2); st.bocaAlvo = 1; setTimeout(() => st.bocaAlvo = 0, 800); }
    if (J3.tf > 2.6 && !$('fimCorrida').classList.contains('on')) { mostra('fimCorrida', true); motorPara(); }
  }
  // neve e brasas
  const M = MUNDOS[J3.mundo];
  if (M.part && flocos.length < (M.part === 'neve' ? 90 : 45)) flocos.push({ x: Math.random() * W, y: M.part === 'neve' ? -10 : H + 10, v: (.5 + Math.random()) * U * (M.part === 'neve' ? 1.2 : 1.6), s: (.03 + Math.random() * .06) * U, f: Math.random() * 7 });
  for (const p of flocos) { p.f += dt; if (M.part === 'neve') { p.y += p.v * dt; p.x += Math.sin(p.f * 2) * U * .3 * dt - J3.vel * .02; } else { p.y -= p.v * dt; p.x += Math.sin(p.f * 3) * U * .4 * dt; } }
  flocos = flocos.filter(p => p.y < H + 20 && p.y > -20);
}

/* ---------- Desenho do mundo 3D ---------- */
function desenhaChao3d(M, zMin, zMax) {
  const hz = horizonte();
  const g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, M.ceu[0]); g.addColorStop(.7, M.ceu[1]); g.addColorStop(1, M.ceu[2]);
  c.fillStyle = g; c.fillRect(0, 0, W, hz + 2);
  if (J3.mundo === 'vulcao') { const gl = c.createRadialGradient(W / 2, hz, 0, W / 2, hz, W * .6); gl.addColorStop(0, 'rgba(255,120,40,.35)'); gl.addColorStop(1, 'rgba(255,80,0,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, hz); }
  else { c.fillStyle = 'rgba(255,255,240,.85)'; c.beginPath(); c.arc(W * .78, hz * .3, U * .7, 0, TAU); c.fill(); }
  const sr = serra(J3.mundo), off = ((CAM.x * U * .3) % (sr.width / 2) + sr.width / 2) % (sr.width / 2);
  c.drawImage(sr, -sr.width / 4 - off, hz - sr.height + 2, sr.width, sr.height);
  c.fillStyle = mix(M.chao[0], M.neb, .55); c.fillRect(0, hz, W, H - hz);
  const passo = 2.5, z0 = Math.floor(zMax / passo) * passo;
  for (let z = z0; z >= zMin; z -= passo) {
    const za = Math.max(z, CAM.z + 1.2), zb = z + passo; if (zb <= za) continue;
    const nebl = clamp((zb - CAM.z - 40) / 100, 0, .55), par = ((Math.floor(z / passo) % 2) + 2) % 2;
    const q = (x0, x1, cor) => { const a = proj(x0, 0, za), b = proj(x1, 0, za), cc = proj(x1, 0, zb), d = proj(x0, 0, zb); if (!a || !b || !cc || !d) return; c.fillStyle = nebl > 0 ? mix(cor, M.neb, nebl) : cor; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fill(); };
    let lado = M.chao[par];
    if (M.lava && ((Math.floor(z / 14) % 3) + 3) % 3 === 0) lado = mix('#ff6a10', '#ffc23a', .5 + .5 * Math.sin(S.t * 3 + z * .3));
    q(-70, -PISTA - .45, lado); q(PISTA + .45, 70, lado);
    q(-PISTA - .45, -PISTA, M.borda); q(PISTA, PISTA + .45, M.borda);
    q(-PISTA, PISTA, M.pista[par]);
    if (par) for (const x of [-FAIXA / 2, FAIXA / 2]) q(x - .05, x + .05, mix(M.pista[0], '#ffffff', .35));
  }
}
function desenhaObj(o) {
  const M = MUNDOS[J3.mundo];
  if (o.k === 'deco') {
    const S2 = SPR[o.s]; if (!S2) return;
    fnp(o.x, 0, o.z, p => { const hh = S2.h * o.esc * p[3], ww = S2.w * o.esc * p[3], nb = clamp((p[2] - 45) / 50, 0, 1); c.globalAlpha = 1 - nb * .85; c.drawImage(S2.img, p[0] - ww / 2, p[1] - hh, ww, hh); c.globalAlpha = 1; });
  } else if (o.k === 'fruta') {
    fnp(o.x, o.y + Math.sin(S.t * 3 + o.z) * .1, o.z, p => { const s = .3 * p[3]; const gl = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], s * 2); gl.addColorStop(0, 'rgba(255,255,220,.5)'); gl.addColorStop(1, 'rgba(255,255,220,0)'); c.fillStyle = gl; c.fillRect(p[0] - s * 2, p[1] - s * 2, s * 4, s * 4); fruta(o.f, p[0], p[1], s, Math.sin(S.t * 2 + o.z) * .3); });
  } else if (o.k === 'estrela') {
    fnp(o.x, o.y + Math.sin(S.t * 3 + o.z) * .12, o.z, p => estrela(p[0], p[1], .38 * p[3], S.t * 2 + o.z));
  } else if (o.k === 'obst') {
    const m = mod(o.x, o.y, o.z, o.voa ? o.giro : 0, 1), cor = { pedra: '#8f8a80', rochaLava: '#3a2c28', bolaNeve: '#f4f8fc' }[o.tipo];
    if (o.tipo === 'pedra' || o.tipo === 'rochaLava') {
      mEsf(m, 0, .45, 0, .5, t3(cor)); mEsf(m, -.38, .28, .1, .32, t3(cor)); mEsf(m, .36, .3, -.05, .34, t3(mix(cor, '#000000', .1)));
      if (o.tipo === 'pedra') mEsf(m, -.1, .82, 0, .18, t3('#6f9a40'));
      else fnp(o.x, .3, o.z - .4, p => { const r = 1.1 * p[3], gl = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); gl.addColorStop(0, 'rgba(255,140,30,.55)'); gl.addColorStop(1, 'rgba(255,90,0,0)'); c.fillStyle = gl; c.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); });
    } else if (o.tipo === 'tronco') { mCadeia(m, [-.95, .3, 0], [.95, .3, 0], .3, .3, t3('#7a4e28')); mDisco(m, [.96, .3, 0], [0, 1, 0], [0, 0, 1], .28, '#d9b07a', 12); }
    else if (o.tipo === 'cactinho') { mCadeia(m, [0, .1, 0], [0, 1.1, 0], .2, .17, t3('#4f8a3a')); mCadeia(m, [0, .55, 0], [.35, .6, 0], .1, .1, t3('#4f8a3a')); mCadeia(m, [.35, .6, 0], [.35, .9, 0], .1, .09, t3('#4f8a3a')); }
    else if (o.tipo === 'blocoGelo') caixa(m, -.6, .6, 0, .95, -.45, .45, '#a9dcf5');
    else if (o.tipo === 'bolaNeve') { mEsf(m, 0, .55, 0, .55, t3(cor)); }
  } else if (o.k === 'chegada') {
    const m = mod(0, 0, o.z, 0, 1);
    caixa(m, -PISTA - .6, -PISTA - .3, 0, 3.6, -.15, .15, '#f2f2f2'); caixa(m, PISTA + .3, PISTA + .6, 0, 3.6, -.15, .15, '#f2f2f2');
    for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) { const x0 = -PISTA - .3 + i * (PISTA * 2 + .6) / 10, x1 = x0 + (PISTA * 2 + .6) / 10, y0 = 2.9 + j * .35; pol([W3(m, x0, y0, 0), W3(m, x1, y0, 0), W3(m, x1, y0 + .35, 0), W3(m, x0, y0 + .35, 0)].map(v => v), (i + j) % 2 ? '#111111' : '#ffffff', .01); }
  }
}
function sombra3(x, z, r) { const a = proj(x - r, 0, z), b = proj(x + r, 0, z), cc = proj(x, 0, z - r * .8), d = proj(x, 0, z + r * .8); if (!a || !b || !cc || !d) return; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse((a[0] + b[0]) / 2, (cc[1] + d[1]) / 2, Math.abs(b[0] - a[0]) / 2, Math.max(1, Math.abs(cc[1] - d[1]) / 2), 0, 0, TAU); c.fill(); }
function desenhaCorrida() {
  const M = MUNDOS[J3.mundo];
  CAM.f = H * 1.05; CAM.cy = H * .5; CAM.p = .27;
  CAM.x = lerp(CAM.x, J3.x * .55, .2); CAM.y = 2.9 + J3.y * .35; CAM.z = J3.z - 6.2 - (J3.fim ? Math.min(2, J3.tf) : 0); preparaCam();
  desenhaChao3d(M, J3.z - 6, J3.z + 130);
  sombra3(J3.x, J3.z, .75);
  for (const o of objs) { if (o.z < J3.z - 7) continue; if (o.z > J3.z + 95) break; if (!o.pega) desenhaObj(o); }
  personagem(J3.dino, ESTADO[J3.dino], J3.veic, J3.x, J3.y, J3.z, J3.yaw, J3.roda);
  desenhaPR();
  if (M.part) { c.fillStyle = M.part === 'neve' ? 'rgba(255,255,255,.9)' : 'rgba(255,150,40,.9)'; for (const p of flocos) { c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.fill(); } }
  desenhaParts();
  // barra: quanto falta até a chegada, e frutas pegas
  const w = Math.min(W * .4, 9 * U), x0 = (W - w) / 2, y0 = .85 * U, fr = clamp(J3.z / COMPR, 0, 1);
  c.fillStyle = 'rgba(0,0,0,.28)'; rr(x0 - .15 * U, y0 - .22 * U, w + .3 * U, .44 * U, .22 * U); c.fill();
  c.fillStyle = '#7ccf4a'; rr(x0, y0 - .1 * U, Math.max(.2 * U, w * fr), .2 * U, .1 * U); c.fill();
  c.font = `${.75 * U}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏁', x0 + w + .35 * U, y0); c.fillText(VEIC[J3.veic].ic, x0 + w * fr, y0 - .1 * U);
  fruta(0, W - 2.3 * U, .85 * U, .4 * U);
  c.font = `900 ${.8 * U}px sans-serif`; c.textAlign = 'left'; c.lineWidth = .14 * U; c.strokeStyle = 'rgba(40,20,0,.7)'; c.strokeText(J3.frutas, W - 1.7 * U, .9 * U); c.fillStyle = '#fff'; c.fillText(J3.frutas, W - 1.7 * U, .9 * U);
  if (S.tm < 6 && !J3.fim) { c.globalAlpha = .55 + .3 * Math.sin(S.t * 5); c.font = `${1.3 * U}px serif`; c.textAlign = 'center'; c.fillText('👈', W * .12, H * .72); c.fillText('👉', W * .88, H * .72); c.fillText('👆', W * .5, H * .86); c.globalAlpha = 1; }
}

/* ---------- Escolher dino e veículo (dino girando no pedestal) ---------- */
let escolhaI = 0;
function vaiEscolhe() {
  prepFiguras(); reinicia(); motorPara(); S.cena = 'escolhe'; S.tm = 0; telas('escolhe'); J3.dino = DINOS3[escolhaI]; montaVeiculos();
  setTimeout(() => fala(NOMES[J3.dino]), 400);
}
function trocaDino(d) { escolhaI = (escolhaI + d + DINOS3.length) % DINOS3.length; J3.dino = DINOS3[escolhaI]; SOM.pega(); fala(NOMES[J3.dino]); const st = ESTADO[J3.dino]; st.pulo = .6; }
function montaVeiculos() {
  const box = $('veiculos'); box.innerHTML = '';
  for (const k in VEIC) { const b = document.createElement('button'); b.textContent = VEIC[k].ic; b.className = 'veic' + (J3.veic === k ? ' on' : ''); b.onclick = () => { audio(); J3.veic = k; SOM.buzina(); montaVeiculos(); }; box.appendChild(b); }
}
function atualizaEscolhe(dt) { S.tm += dt; const st = ESTADO[J3.dino]; st.anda = J3.veic === 'pe'; st.fase += dt * 5; J3.roda += dt * 4; }
function desenhaEscolhe() {
  CAM.f = H * 1.25; CAM.cy = H * .46; CAM.p = .16; CAM.x = 0; CAM.y = 1.8; CAM.z = -6.2; preparaCam();
  const hz = horizonte(), g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3f8fd0'); g.addColorStop(.55, '#bfe3f5'); g.addColorStop(.56, '#7cbf5a'); g.addColorStop(1, '#3f7a2c');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const sr = serra('floresta'); c.drawImage(sr, -sr.width / 4, hz - sr.height + 2, sr.width, sr.height);
  c.fillStyle = '#5f9f3a'; c.fillRect(0, hz, W, H - hz);
  const yaw = PI / 2 + Math.sin(S.t * .6) * 1.1 + S.t * .25;
  mDisco(mod(0, 0, 0, 0, 1), [0, -.01, 0], [1, 0, 0], [0, 0, 1], 2.3, '#e9d9b0', 32, 50);
  mDisco(mod(0, 0, 0, 0, 1), [0, 0, 0], [1, 0, 0], [0, 0, 1], 2.0, '#f6ead0', 32, 49);
  personagem(J3.dino, ESTADO[J3.dino], J3.veic, 0, 0, 0, yaw, J3.roda);
  desenhaPR(); desenhaParts();
}

/* ---------- Ligações com o resto do jogo ---------- */
ATUALIZA.corrida = atualizaCorrida; DESENHA.corrida = desenhaCorrida;
ATUALIZA.escolhe = atualizaEscolhe; DESENHA.escolhe = desenhaEscolhe;
const TOQUE3D = { corrida: toqueCorrida };
FASES.corrida = () => vaiCorrida('floresta');
addEventListener('keydown', e => {
  if (S.cena === 'corrida') { if (e.key === 'ArrowLeft') anda3(-1); else if (e.key === 'ArrowRight') anda3(1); else if (e.key === ' ' || e.key === 'ArrowUp') pula3(); }
  else if (S.cena === 'escolhe' && !$('mundos').classList.contains('on')) { if (e.key === 'ArrowLeft') trocaDino(-1); if (e.key === 'ArrowRight') trocaDino(1); }
});
$('bAnt').onclick = () => { audio(); trocaDino(-1); };
$('bProx').onclick = () => { audio(); trocaDino(1); };
$('bOk').onclick = () => { audio(); SOM.oba(); mostra('mundos', true); };
for (const b of document.querySelectorAll('[data-mundo]')) b.onclick = () => { audio(); SOM.oba(); trocar(() => vaiCorrida(b.dataset.mundo)); };
$('bDeNovo3').onclick = () => { audio(); trocar(() => vaiCorrida(J3.mundo)); };
$('bProxMundo').onclick = () => { audio(); SOM.oba(); trocar(() => vaiCorrida(ORDEM_MUNDOS[(ORDEM_MUNDOS.indexOf(J3.mundo) + 1) % ORDEM_MUNDOS.length])); };
$('bMundos').onclick = () => { audio(); trocar(() => { vaiEscolhe(); mostra('mundos', true); }); };
$('bJogar').onclick = () => { audio(); SOM.oba(); trocar(vaiEscolhe); };
const pedida3 = new URLSearchParams(location.search);
if (pedida3.get('mundo')) setTimeout(() => { J3.dino = pedida3.get('dino') || 'rex'; J3.veic = pedida3.get('veic') || 'pe'; vaiCorrida(pedida3.get('mundo')); }, 1950);
if (pedida3.get('cena') === 'escolhe') setTimeout(vaiEscolhe, 1950);
