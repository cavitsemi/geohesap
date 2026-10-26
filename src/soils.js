/* Zemin ve kaya türü kütüphanesi
   Sınıflama, sıkılık/kıvam/ayrışma sınıfları, oranlar ve renkler: Tebliğ (2019) EK-5 Sondaj Logu, EK-6 Lejant;
   TS EN ISO 14688-1/-2, TS EN ISO 14689, TS ISO 710 serisi.
   Tipik parametreler: yönetmelikler sayısal değer vermez; değerler literatürdeki tipik aralıkların ortasıdır
   (Peck-Hanson-Thornburn 1974; Terzaghi & Peck 1967; Bowles 1996 Tablo 5-6/5-7; Carter & Bentley 1991; NAVFAC DM-7;
   kaya için Hoek & Brown 1997 mertebeleri). Ön tahmindir; deney sonuçları her zaman önceliklidir. */
(function (root) {
  'use strict';

  // ---------- Tebliğ EK-5 sınıfları ----------
  const STATES = {
    GR: ['Çok gevşek (N 0–4)', 'Gevşek (N 5–10)', 'Orta sıkı (N 11–30)', 'Sıkı (N 31–50)', 'Çok sıkı (N > 50)'],
    CO: ['Çok yumuşak (N 0–2)', 'Yumuşak (N 3–4)', 'Orta katı (N 5–8)', 'Katı (N 9–15)', 'Çok katı (N 16–30)', 'Sert (N > 30)'],
    RK: ['I – Taze', 'II – Az ayrışmış', 'III – Orta ayrışmış', 'IV – Çok ayrışmış', 'V – Tamamen ayrışmış', 'VI – Kalıntı zemin']
  };
  const N_LIMITS = { GR: [4, 10, 30, 50, Infinity], CO: [2, 4, 8, 15, 30, Infinity] };
  const stateFromN = (fam, N) => { const L = N_LIMITS[fam]; if (!L || !(N >= 0)) return ''; const i = L.findIndex(x => N <= x); return STATES[fam][i]; };

  // ---------- Tebliğ EK-6 renkleri ----------
  const C = {
    sari: '#d4ad00', ksari: '#b07d00', agri: '#767676', gri: '#5e5e5e', kgri: '#3d3d3d', tur: '#e07000', ktur: '#a94f00',
    akah: '#b9844f', kah: '#8b5a2b', kkah: '#5c3a1a', mavi: '#1e7fd8', amavi: '#3fb4e6', kmavi: '#00808f', grimavi: '#5f7f91',
    lac: '#22308f', amor: '#a77de0', mor: '#8e24aa', kmor: '#4a148c', kir: '#cf2a2a', pem: '#e0407a', apem: '#ee8fb0',
    nefti: '#556b2f', knefti: '#2f4f2f', siyah: '#222222', dolgu: '#8d6e63'
  };
  const tint = (hex, k = 0.9) => { const n = parseInt(hex.slice(1), 16), ch = s => Math.round(((n >> s) & 255) * (1 - k) + 255 * k); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };

  // ---------- semboller (x,y merkez; c renk) ----------
  const L = (d, c, w = 1) => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  const dot = (x, y, c, r = 0.95) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  const txt = (x, y, c, t, s = 9) => `<text x="${x}" y="${y + s * 0.35}" font-size="${s}" font-family="Times New Roman, serif" font-weight="700" text-anchor="middle" fill="${c}">${t}</text>`;
  const SYM = {
    k: (x, y, c) => dot(x - 3, y - 1.6, c) + dot(x + 2.6, y - 2, c) + dot(x - 0.2, y + 2.2, c) + dot(x + 4, y + 2.4, c, 0.7),          // kum
    c: (x, y, c) => `<ellipse cx="${x}" cy="${y}" rx="3.1" ry="2.3" fill="none" stroke="${c}" stroke-width="1.1"/>`,                  // çakıl
    s: (x, y, c) => L(`M${x - 5} ${y}h4`, c, 1.1) + dot(x + 1.6, y, c, 0.8) + dot(x + 4.4, y, c, 0.8),                                  // silt
    sH: (x, y, c) => L(`M${x - 5} ${y - 1.2}h4M${x - 5} ${y + 1.2}h4`, c, 1) + dot(x + 1.6, y, c, 0.9) + dot(x + 4.4, y, c, 0.9),     // yüksek plastisiteli silt
    kl: (x, y, c) => L(`M${x - 5} ${y}h10`, c, 1.35),                                                                                       // kil
    klH: (x, y, c) => L(`M${x - 5} ${y - 1.4}h10M${x - 5} ${y + 1.4}h10`, c, 1.1),                                                        // yüksek plastisiteli kil
    o: (x, y, c) => L(`M${x - 3.5} ${y + 2.5}l1.6 -4.5M${x} ${y + 2.5}v-5M${x + 3.5} ${y + 2.5}l-1.6 -4.5M${x - 4.5} ${y + 2.5}h9`, c, 0.9), // bitki/organik
    t: (x, y, c) => `<rect x="${x - 4}" y="${y - 1.6}" width="8" height="3.2" fill="${c}"/>`,                                            // turba
    x: (x, y, c) => L(`M${x - 3} ${y - 3}l6 6M${x + 3} ${y - 3}l-6 6`, c, 1),                                                             // dolgu
    tri: (x, y, c) => `<path d="M${x - 3} ${y + 2.2}L${x} ${y - 2.8}L${x + 3} ${y + 2.2}Z" fill="none" stroke="${c}" stroke-width="1"/>`, // köşeli parça
    triD: (x, y, c) => `<path d="M${x - 3} ${y - 2.2}L${x} ${y + 2.8}L${x + 3} ${y - 2.2}Z" fill="none" stroke="${c}" stroke-width="1"/>`,
    Y: (x, y, c) => L(`M${x - 2.5} ${y - 2.5}L${x} ${y}L${x + 2.5} ${y - 2.5}M${x} ${y}v3`, c, 1),                                         // tebeşir
    cres: (x, y, c) => L(`M${x - 3.5} ${y - 1}q3.5 4.5 7 0`, c, 1.2),                                                                       // jips
    tau: (x, y, c) => L(`M${x - 3} ${y - 2}h6M${x} ${y - 2}v4.5`, c, 1.1) + dot(x - 3, y - 2, c, 0.7),                                    // tüf
    plus: (x, y, c) => L(`M${x - 3} ${y}h6M${x} ${y - 3}v6`, c, 1.2),                                                                     // granit
    alpha: (x, y, c) => txt(x, y, c, '∝', 10),                                                                                             // andezit
    beta: (x, y, c) => txt(x, y, c, 'β', 9),                                                                                               // bazalt
    v: (x, y, c) => L(`M${x - 3} ${y - 2.2}L${x} ${y + 2.2}L${x + 3} ${y - 2.2}`, c, 1.1),                                                // piroklastik / volkanik
    w: (x, y, c) => L(`M${x - 5} ${y}q1.25 -2 2.5 0t2.5 0t2.5 0t2.5 0`, c, 1),                                                            // kısa dalga (şistozite)
    til: (x, y, c) => L(`M${x - 4} ${y + 1}q2 -4 4 -1t4 -1`, c, 1.2),                                                                     // serpantin
    sl: (x, y, c) => L(`M${x - 2.5} ${y + 3}L${x + 2.5} ${y - 3}`, c, 1),                                                                 // dolomit
    ring: (x, y, c) => `<circle cx="${x}" cy="${y}" r="2.4" fill="none" stroke="${c}" stroke-width="1"/>`,
    hook: (x, y, c) => L(`M${x - 1.5} ${y + 3}v-4.5q0 -1.8 1.7 -1.8q1.7 0 1.7 1.6`, c, 1.1),                                               // mika
    eq: (x, y, c) => L(`M${x - 3} ${y - 1.2}h6M${x - 3} ${y + 1.2}h6`, c, 1)
  };
  // 36×24 karo, 6 yuva (iki satır, kaydırmalı)
  const SLOTS = [[6, 6], [18, 6], [30, 6], [12, 18], [24, 18], [0, 18]];
  const put = (sym, i, c) => { const [x, y] = SLOTS[i]; let s = SYM[sym](x, y, c); if (x === 0) s += SYM[sym](36, y, c); return s; };

  // Zemin deseni: ana bileşen + ikincil bileşenler (Tebliğ EK-5 "Oranlar": az/çok/ve)
  function soilBody(p) {
    const col = sym => p.col && p.col[sym] || SCOL[sym];
    const m = p.minors || [];
    let slots;
    if (p.sparse) slots = [[p.main, [0, 2, 4]]];
    else if (!m.length) slots = [[p.main, [0, 1, 2, 3, 4, 5]]];
    else if (m.length === 1) slots = [[p.main, [0, 2, 3, 5]], [m[0], [1, 4]]];
    else slots = [[p.main, [0, 2, 3, 5]], [m[0], [1]], [m[1], [4]]];
    return slots.map(([sym, ix]) => ix.map(i => put(sym, i, col(sym))).join('')).join('');
  }
  const SCOL = { k: C.sari, c: C.ksari, s: C.gri, sH: C.gri, kl: C.agri, klH: C.agri, o: C.siyah, t: C.siyah, x: C.dolgu, tri: C.akah, triD: C.akah };
  // Kaya desenleri
  const bed = c => L('M0 0.5h36M0 12.5h36', c, 0.9);
  const brick = (c, wavy) => (wavy ? L('M0 0.5q4.5 -2 9 0t9 0t9 0t9 0M0 12.5q4.5 -2 9 0t9 0t9 0t9 0', c, 0.9) : L('M0 0.5h36M0 12.5h36', c, 0.9)) + L('M0.5 0.5v12M18.5 0.5v12M9.5 12.5v12M27.5 12.5v12', c, 0.9);
  const rowsOf = (sym, c, pos) => pos.map(([x, y]) => SYM[sym](x, y, c) + (x === 0 ? SYM[sym](36, y, c) : '')).join('');
  const IN_BED = [[6, 6.5], [18, 6.5], [30, 6.5], [0, 18.5], [12, 18.5], [24, 18.5]];
  const IN_BRICK = [[9.5, 6.5], [27.5, 6.5], [0, 18.5], [18.5, 18.5]];
  const IN_FREE = [[6, 6], [18, 6], [30, 6], [0, 18], [12, 18], [24, 18]];
  function rockBody(p) {
    const c = p.c;
    switch (p.r) {
      case 'bed': return bed(c) + (p.f ? (Array.isArray(p.f) ? IN_BED.map(([x, y], i) => SYM[p.f[i % p.f.length]](x, y, c) + (x === 0 ? SYM[p.f[i % p.f.length]](36, y, c) : '')).join('') : rowsOf(p.f, c, IN_BED)) : '');
      case 'shale': return L('M0 0.5h36M0 6.5h36M0 12.5h36M0 18.5h36', c, 0.8) + rowsOf('kl', c, [[9, 3.5], [27, 9.5], [9, 15.5], [27, 21.5]]);
      case 'brick': return brick(c, false) + (p.f ? rowsOf(p.f, c, IN_BRICK) : '');
      case 'marn': return brick(c, true) + (p.f ? rowsOf(p.f, c, IN_BRICK) : '');
      case 'grid': return L('M0 0.5h36M0 6.5h36M0 12.5h36M0 18.5h36', c, 0.6) + L('M0.5 0v24M6.5 0v24M12.5 0v24M18.5 0v24M24.5 0v24M30.5 0v24', c, 0.6);
      case 'meta': return L('M0 6q4.5 -3 9 0t9 0t9 0t9 0M0 18q4.5 -3 9 0t9 0t9 0t9 0', c, 1) + (p.f ? rowsOf(p.f, c, [[18, 12], [0, 0], [0, 24], [36, 0]]) : '');
      case 'free': return rowsOf(p.f, c, IN_FREE) + (p.f2 ? rowsOf(p.f2, p.c2 || c, [[12, 12], [30, 12]]) : '');
      case 'weath': return L('M0 0.5h14M22 0.5h14M0 12.5h6M14 12.5h22M0.5 0.5v8M18.5 4v8M9.5 12.5v7M27.5 16v8', c, 0.9) + dot(18, 18, c) + dot(4, 6, c) + dot(30, 8, c);
    }
    return '';
  }

  // ---------- tipik parametreler ----------
  // İri daneli taban değerleri (temiz kum), sıkılık sınıfına göre (indeks 0..4)
  const GRB = { phi: [27.5, 29.5, 33, 38, 42], Es: [7, 15, 30, 55, 80], gn: [16.5, 17.5, 18.5, 19.5, 20.5], gsat: [18.5, 19, 20, 20.8, 21.5], e0: [0.85, 0.75, 0.62, 0.52, 0.45] };
  // İnce daneli taban değerleri (CL), kıvam sınıfına göre (indeks 0..5)
  const COB = { cu: [10, 18, 38, 75, 150, 250], Es: [3, 6, 12, 25, 45, 80], gn: [16.5, 17.5, 18.5, 19.3, 20, 20.6], dsat: [0.7, 0.6, 0.6, 0.5, 0.4, 0.4], mv: [1.2e-3, 7e-4, 3.5e-4, 1.8e-4, 9e-5, 5e-5], e0: [1.3, 1.1, 0.9, 0.75, 0.65, 0.55], c: [0, 2, 4, 8, 12, 15] };
  // Kaya: III (orta ayrışmış) taban değerleri × ayrışma çarpanları (indeks 0..5)
  const RKM = { E: [4, 2, 1, 0.4, 0.12, 0.05], c: [2.5, 1.6, 1, 0.5, 0.2, 0.1], dphi: [4, 2, 0, -3, -6, -8], dg: [0.6, 0.3, 0, -0.6, -1.5, -2.5], e0: [0.08, 0.12, 0.2, 0.3, 0.45, 0.55] };

  const R1 = (x, d = 1) => Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
  function typical(key, state) {
    const e = BY[key]; if (!e) return null;
    const S = STATES[e.fam], i = Math.max(0, S.indexOf(state) >= 0 ? S.indexOf(state) : S.indexOf(e.def));
    const q = e.q;
    if (e.fam === 'GR') {
      return { beh: 'Kohezyonsuz', gn: R1(GRB.gn[i] + (q.dg || 0)), gsat: R1(GRB.gsat[i] + (q.dg || 0)), phi: Math.round(GRB.phi[i] + (q.dphi || 0)), c: q.c || 0, cu: 0,
        Es: R1(GRB.Es[i] * (q.kE || 1), 0), nu: q.nu || 0.3, mv: 0, Cc: 0, e0: R1(Math.max(0.25, GRB.e0[i] + (q.de || 0)), 2), pi: q.pi || 0, fines: q.fines || 0 };
    }
    if (e.fam === 'CO') {
      const gn = COB.gn[i] + (q.dg || 0);
      return { beh: 'Kohezyonlu', gn: R1(gn), gsat: R1(gn + COB.dsat[i]), phi: q.phi, c: R1(COB.c[i] * (q.kc == null ? 1 : q.kc), 0), cu: R1(COB.cu[i] * (q.kcu || 1), 0),
        Es: R1(COB.Es[i] * (q.kE || 1), 1), nu: q.nu || 0.35, mv: +(COB.mv[i] * (q.kmv || 1)).toPrecision(2), Cc: 0, e0: R1(COB.e0[i] + (q.de || 0), 2), pi: q.pi || 0, fines: q.fines || 0 };
    }
    // kaya
    const soilLike = i >= 4;
    return { beh: soilLike ? 'Kohezyonsuz' : 'Kaya', gn: R1(q.g + RKM.dg[i]), gsat: R1(q.g + RKM.dg[i] + (soilLike ? 1 : 0.3)), phi: Math.round(q.phi + RKM.dphi[i]), c: R1(q.c * RKM.c[i], 0), cu: 0,
      Es: R1(q.E * RKM.E[i], 0), nu: q.nu, mv: 0, Cc: 0, e0: RKM.e0[i], pi: 0, fines: soilLike ? 30 : 0 };
  }
  const PARAM_KEYS = ['beh', 'gn', 'gsat', 'phi', 'c', 'cu', 'Es', 'nu', 'mv', 'Cc', 'e0', 'pi', 'fines'];

  // ---------- katalog ----------
  // [anahtar, ad, grup, simge (USCS / Tebliğ kısaltması), uscs, aile, varsayılan durum indeksi, desen, parametre değiştiricileri]
  const G = 'GR', K = 'CO', Rk = 'RK';
  const so = (main, minors, extra) => Object.assign({ s: 1, main, minors: minors || [] }, extra || {});
  const rk = (r, c, f, extra) => Object.assign({ r, c, f }, extra || {});
  const RAW = [
    // --- çakıllar ---
    ['cakil_gw', 'İyi derecelenmiş çakıl', 'Çakıllar', 'GW', 'GW', G, 2, so('c'), { dphi: 4, kE: 1.9, dg: 1.2, de: -0.18, fines: 3 }],
    ['cakil_gp', 'Kötü derecelenmiş çakıl', 'Çakıllar', 'GP', 'GP', G, 2, so('c', [], { sparse: true }), { dphi: 3, kE: 1.7, dg: 0.8, de: -0.12, fines: 3 }],
    ['kumlu_cakil', 'Kumlu çakıl', 'Çakıllar', 'GW', 'GW', G, 2, so('c', ['k']), { dphi: 3, kE: 1.6, dg: 1, de: -0.14, fines: 4 }],
    ['siltli_cakil', 'Siltli çakıl', 'Çakıllar', 'GM', 'GM', G, 2, so('c', ['s']), { dphi: 1, kE: 1.1, dg: 0.8, de: -0.1, fines: 20 }],
    ['killi_cakil', 'Killi çakıl', 'Çakıllar', 'GC', 'GC', G, 2, so('c', ['kl']), { dphi: -1, kE: 1, dg: 0.8, de: -0.08, c: 3, pi: 12, fines: 20 }],
    ['siltli_killi_cakil', 'Siltli killi çakıl', 'Çakıllar', 'GC-GM', 'GC-GM', G, 2, so('c', ['s', 'kl']), { dphi: 0, kE: 1, dg: 0.8, de: -0.08, c: 2, pi: 6, fines: 18 }],
    ['kumlu_siltli_cakil', 'Kumlu siltli çakıl', 'Çakıllar', 'GM', 'GM', G, 2, so('c', ['k', 's']), { dphi: 1, kE: 1.2, dg: 0.8, de: -0.1, fines: 15 }],
    ['kumlu_killi_cakil', 'Kumlu killi çakıl', 'Çakıllar', 'GC', 'GC', G, 2, so('c', ['k', 'kl']), { dphi: -1, kE: 1.05, dg: 0.8, de: -0.08, c: 3, pi: 12, fines: 15 }],
    // --- kumlar ---
    ['kum_sw', 'İyi derecelenmiş kum', 'Kumlar', 'SW', 'SW', G, 2, so('k'), { dphi: 1, kE: 1.1, dg: 0.3, de: -0.05, fines: 3 }],
    ['kum_sp', 'Kötü derecelenmiş kum', 'Kumlar', 'SP', 'SP', G, 2, so('k', [], { sparse: true }), { fines: 3 }],
    ['cakilli_kum', 'Çakıllı kum', 'Kumlar', 'SW', 'SW', G, 2, so('k', ['c']), { dphi: 2, kE: 1.3, dg: 0.5, de: -0.07, fines: 4 }],
    ['siltli_kum', 'Siltli kum', 'Kumlar', 'SM', 'SM', G, 2, so('k', ['s']), { dphi: -2, kE: 0.7, de: 0.03, fines: 25 }],
    ['killi_kum', 'Killi kum', 'Kumlar', 'SC', 'SC', G, 2, so('k', ['kl']), { dphi: -4, kE: 0.6, dg: 0.3, c: 4, pi: 13, fines: 30, nu: 0.32 }],
    ['siltli_killi_kum', 'Siltli killi kum', 'Kumlar', 'SM-SC', 'SM-SC', G, 2, so('k', ['s', 'kl']), { dphi: -3, kE: 0.65, dg: 0.2, c: 2, pi: 6, fines: 25 }],
    ['cakilli_siltli_kum', 'Çakıllı siltli kum', 'Kumlar', 'SM', 'SM', G, 2, so('k', ['c', 's']), { dphi: -1, kE: 0.85, dg: 0.4, fines: 20 }],
    ['cakilli_killi_kum', 'Çakıllı killi kum', 'Kumlar', 'SC', 'SC', G, 2, so('k', ['c', 'kl']), { dphi: -3, kE: 0.7, dg: 0.5, c: 4, pi: 13, fines: 25, nu: 0.32 }],
    // --- siltler ---
    ['silt', 'Düşük plastisiteli silt', 'Siltler', 'ML', 'ML', K, 3, so('s'), { phi: 30, kc: 0.4, kcu: 0.7, kE: 0.8, dg: -0.3, kmv: 1.1, pi: 6, fines: 85, nu: 0.33 }],
    ['kumlu_silt', 'Kumlu silt', 'Siltler', 'ML', 'ML', K, 3, so('s', ['k']), { phi: 31, kc: 0.3, kcu: 0.6, kE: 1, dg: 0, kmv: 0.9, de: -0.1, pi: 4, fines: 65, nu: 0.32 }],
    ['killi_silt', 'Killi silt', 'Siltler', 'ML', 'ML', K, 3, so('s', ['kl']), { phi: 28, kc: 0.6, kcu: 0.8, kE: 0.9, dg: -0.2, kmv: 1.1, pi: 10, fines: 88, nu: 0.34 }],
    ['silt_mh', 'Yüksek plastisiteli silt', 'Siltler', 'MH', 'MH', K, 3, so('sH'), { phi: 25, kc: 0.8, kE: 0.6, dg: -1, kmv: 1.4, de: 0.4, pi: 25, fines: 90, nu: 0.38 }],
    // --- killer ---
    ['kil_cl', 'Düşük plastisiteli kil', 'Killer', 'CL', 'CL', K, 3, so('kl'), { phi: 26, pi: 18, fines: 85, nu: 0.35 }],
    ['kil_ch', 'Yüksek plastisiteli kil', 'Killer', 'CH', 'CH', K, 3, so('klH'), { phi: 21, kc: 1.1, kE: 0.8, dg: -0.5, kmv: 1.3, de: 0.25, pi: 38, fines: 92, nu: 0.4 }],
    ['siltli_kil', 'Siltli kil', 'Killer', 'CL-ML', 'CL-ML', K, 3, so('kl', ['s']), { phi: 28, kc: 0.7, pi: 7, fines: 85, nu: 0.35 }],
    ['kumlu_kil', 'Kumlu kil', 'Killer', 'CL', 'CL', K, 3, so('kl', ['k']), { phi: 27, kc: 0.9, kE: 1.3, dg: 0.3, kmv: 0.8, de: -0.1, pi: 16, fines: 60, nu: 0.33 }],
    ['cakilli_kil', 'Çakıllı kil', 'Killer', 'CL', 'CL', K, 3, so('kl', ['c']), { phi: 28, kc: 0.9, kE: 1.5, dg: 0.5, kmv: 0.7, de: -0.15, pi: 16, fines: 55, nu: 0.33 }],
    ['kumlu_kil_ch', 'Kumlu yüksek plastisiteli kil', 'Killer', 'CH', 'CH', K, 3, so('klH', ['k']), { phi: 22, kc: 1, kE: 1, dg: -0.2, kmv: 1.1, de: 0.15, pi: 30, fines: 70, nu: 0.38 }],
    ['siltli_kil_ch', 'Siltli yüksek plastisiteli kil', 'Killer', 'CH', 'CH', K, 3, so('klH', ['s']), { phi: 21, kc: 1, kE: 0.8, dg: -0.5, kmv: 1.3, de: 0.25, pi: 32, fines: 92, nu: 0.4 }],
    ['kumlu_siltli_kil', 'Kumlu siltli kil', 'Killer', 'CL-ML', 'CL-ML', K, 3, so('kl', ['k', 's']), { phi: 28, kc: 0.7, kE: 1.2, dg: 0.2, kmv: 0.9, de: -0.1, pi: 7, fines: 60, nu: 0.33 }],
    // --- organik ---
    ['org_silt', 'Organik silt / düşük plastisiteli organik kil', 'Organik zeminler', 'OL', 'OL', K, 1, so('s', ['o']), { phi: 22, kc: 0.4, kcu: 0.6, kE: 0.5, dg: -2, kmv: 2, de: 0.6, pi: 12, fines: 85, nu: 0.4 }],
    ['org_kil', 'Yüksek plastisiteli organik kil', 'Organik zeminler', 'OH', 'OH', K, 1, so('klH', ['o']), { phi: 18, kc: 0.4, kcu: 0.5, kE: 0.4, dg: -3, kmv: 3, de: 1, pi: 30, fines: 90, nu: 0.42 }],
    ['turba', 'Turba', 'Organik zeminler', 'Pt', 'Pt', K, 1, so('t', [], { sparse: false }), { phi: 20, kc: 0.3, kcu: 0.3, kE: 0.15, dg: -6, kmv: 5, de: 4, pi: 0, fines: 0, nu: 0.4 }],
    ['bitkisel', 'Bitkisel toprak', 'Organik zeminler', 'bt', 'OL', K, 1, so('o'), { phi: 22, kc: 0.3, kcu: 0.6, kE: 0.4, dg: -2, kmv: 2, de: 0.5, pi: 10, fines: 60, nu: 0.38 }],
    // --- yapay / diğer ---
    ['dolgu', 'Dolgu (kontrolsüz)', 'Dolgu ve örtü birimleri', 'Dolgu', 'FILL', G, 1, so('x'), { dphi: -3, kE: 0.5, dg: -0.5, fines: 20 }],
    ['dolgu_k', 'Dolgu (kontrollü, sıkıştırılmış)', 'Dolgu ve örtü birimleri', 'Dolgu', 'FILL', G, 3, so('x', ['k']), { dphi: 0, kE: 1.1, dg: 0.3, fines: 12 }],
    ['yamac_molozu', 'Yamaç molozu', 'Dolgu ve örtü birimleri', 'ym', 'GM', G, 2, so('tri', ['triD', 'k'], { col: { tri: C.akah, triD: C.akah, k: C.akah } }), { dphi: 0, kE: 0.9, dg: 0.5, de: -0.05, fines: 20 }],
    // --- tortul kayaçlar ---
    ['kiltasi', 'Kiltaşı', 'Tortul kayaçlar', 'kit', 'ROCK', Rk, 2, rk('bed', C.kgri, ['kl', 's']), { g: 22, phi: 28, c: 60, E: 200, nu: 0.3 }],
    ['seyl', 'Şeyl', 'Tortul kayaçlar', 'şy', 'ROCK', Rk, 2, rk('shale', C.kgri), { g: 23, phi: 27, c: 60, E: 250, nu: 0.3 }],
    ['silttasi', 'Silttaşı', 'Tortul kayaçlar', 'st', 'ROCK', Rk, 2, rk('bed', C.tur, 's'), { g: 23, phi: 30, c: 80, E: 300, nu: 0.28 }],
    ['camurtasi', 'Çamurtaşı', 'Tortul kayaçlar', 'çmt', 'ROCK', Rk, 2, rk('bed', C.tur, ['s', 'kl']), { g: 22, phi: 27, c: 50, E: 180, nu: 0.3 }],
    ['kumtasi', 'Kumtaşı', 'Tortul kayaçlar', 'kt', 'ROCK', Rk, 2, rk('bed', C.tur, 'k'), { g: 23.5, phi: 34, c: 120, E: 600, nu: 0.25 }],
    ['konglomera', 'Çakıltaşı (konglomera)', 'Tortul kayaçlar', 'çt', 'ROCK', Rk, 2, rk('bed', C.ktur, 'c'), { g: 24, phi: 36, c: 120, E: 700, nu: 0.25 }],
    ['bres', 'Breş', 'Tortul kayaçlar', 'brş', 'ROCK', Rk, 2, rk('bed', C.ktur, ['tri', 'triD']), { g: 24, phi: 36, c: 120, E: 700, nu: 0.25 }],
    ['grovak', 'Grovak', 'Tortul kayaçlar', 'grv', 'ROCK', Rk, 2, rk('bed', C.kah, ['sl', 'k']), { g: 25, phi: 35, c: 150, E: 1000, nu: 0.25 }],
    ['marn', 'Marn', 'Tortul kayaçlar', 'mrn', 'ROCK', Rk, 2, rk('marn', C.kgri), { g: 22, phi: 28, c: 70, E: 250, nu: 0.3 }],
    ['kumlu_marn', 'Kumlu marn', 'Tortul kayaçlar', 'kmrn', 'ROCK', Rk, 2, rk('marn', C.kgri, 'k'), { g: 22.5, phi: 30, c: 80, E: 300, nu: 0.3 }],
    ['killi_marn', 'Killi marn', 'Tortul kayaçlar', 'klmr', 'ROCK', Rk, 2, rk('marn', C.kgri, 'w'), { g: 21.5, phi: 26, c: 60, E: 200, nu: 0.3 }],
    ['kirectasi', 'Kireçtaşı', 'Tortul kayaçlar', 'kçt', 'ROCK', Rk, 2, rk('brick', C.mavi), { g: 25.5, phi: 38, c: 250, E: 2500, nu: 0.25 }],
    ['kirectasi_kumlu', 'Kireçtaşı (kumlu)', 'Tortul kayaçlar', 'kçt', 'ROCK', Rk, 2, rk('brick', C.mavi, 'k'), { g: 25, phi: 36, c: 200, E: 2000, nu: 0.25 }],
    ['kirectasi_marnli', 'Kireçtaşı (marnlı)', 'Tortul kayaçlar', 'kçt', 'ROCK', Rk, 2, rk('brick', C.amavi, 'kl'), { g: 24.5, phi: 34, c: 150, E: 1200, nu: 0.27 }],
    ['dolomit', 'Dolomit', 'Tortul kayaçlar', 'dol', 'ROCK', Rk, 2, rk('brick', C.grimavi, 'sl'), { g: 26.5, phi: 38, c: 250, E: 2500, nu: 0.25 }],
    ['tebesir', 'Tebeşir', 'Tortul kayaçlar', 'tbş', 'ROCK', Rk, 2, rk('free', C.amavi, 'Y'), { g: 19, phi: 30, c: 60, E: 300, nu: 0.3 }],
    ['traverten', 'Traverten', 'Tortul kayaçlar', 'trv', 'ROCK', Rk, 2, rk('grid', C.amavi), { g: 23.5, phi: 35, c: 150, E: 1500, nu: 0.25 }],
    ['kalici', 'Kaliçi', 'Tortul kayaçlar', 'klç', 'ROCK', Rk, 2, rk('brick', C.amavi, 'k'), { g: 21, phi: 33, c: 80, E: 400, nu: 0.28 }],
    ['jips', 'Jips', 'Tortul kayaçlar', 'Jps', 'ROCK', Rk, 2, rk('free', C.agri, 'cres'), { g: 22.5, phi: 32, c: 120, E: 800, nu: 0.3 }],
    // --- magmatik / volkanik ---
    ['tuf', 'Tüf', 'Magmatik kayaçlar', 'tf', 'ROCK', Rk, 2, rk('free', C.pem, 'tau'), { g: 17, phi: 30, c: 70, E: 300, nu: 0.25 }],
    ['aglomera', 'Aglomera', 'Magmatik kayaçlar', 'agl', 'ROCK', Rk, 2, rk('free', C.apem, 'ring', { f2: 'k', c2: C.pem }), { g: 22, phi: 34, c: 100, E: 600, nu: 0.25 }],
    ['piroklastik', 'Piroklastik kayaçlar (volkanik kül vb.)', 'Magmatik kayaçlar', 'prkl', 'ROCK', Rk, 2, rk('free', C.mor, 'v'), { g: 17, phi: 30, c: 50, E: 250, nu: 0.25 }],
    ['andezit', 'Andezit', 'Magmatik kayaçlar', 'adz', 'ROCK', Rk, 2, rk('free', C.mor, 'alpha'), { g: 25, phi: 40, c: 300, E: 3000, nu: 0.25 }],
    ['bazalt', 'Bazalt', 'Magmatik kayaçlar', 'bz', 'ROCK', Rk, 2, rk('free', C.kmor, 'beta'), { g: 27, phi: 42, c: 350, E: 4000, nu: 0.25 }],
    ['granit', 'Granit', 'Magmatik kayaçlar', 'grn', 'ROCK', Rk, 2, rk('free', C.kir, 'plus'), { g: 26, phi: 42, c: 350, E: 4000, nu: 0.25 }],
    ['diyabaz', 'Diyabaz', 'Magmatik kayaçlar', 'dyb', 'ROCK', Rk, 2, rk('free', C.nefti, 'v', { f2: 'plus', c2: C.nefti }), { g: 27, phi: 40, c: 300, E: 3000, nu: 0.25 }],
    ['serpantinit', 'Serpantinit (yeşiltaş)', 'Magmatik kayaçlar', 'S', 'ROCK', Rk, 2, rk('free', C.knefti, 'til'), { g: 25, phi: 30, c: 120, E: 800, nu: 0.3 }],
    ['ofiyolit', 'Ofiyolit', 'Magmatik kayaçlar', 'of', 'ROCK', Rk, 2, rk('free', C.nefti, 'ring', { f2: 'eq', c2: C.nefti }), { g: 26, phi: 33, c: 150, E: 1200, nu: 0.28 }],
    // --- metamorfik ---
    ['gnays', 'Gnays', 'Metamorfik kayaçlar', 'gny', 'ROCK', Rk, 2, rk('meta', C.akah), { g: 26, phi: 38, c: 250, E: 3000, nu: 0.25 }],
    ['mikasist', 'Mikaşist', 'Metamorfik kayaçlar', 'mşst', 'ROCK', Rk, 2, rk('free', C.kah, 'hook'), { g: 26, phi: 32, c: 150, E: 1200, nu: 0.28 }],
    ['klorit_sist', 'Klorit şist (yeşil şist)', 'Metamorfik kayaçlar', 'kşst', 'ROCK', Rk, 2, rk('free', C.kah, 'hook', { f2: 'kl', c2: C.kah }), { g: 26, phi: 30, c: 120, E: 1000, nu: 0.28 }],
    ['fillit', 'Fillit (killi şist)', 'Metamorfik kayaçlar', 'klşsr', 'ROCK', Rk, 2, rk('meta', C.kkah, 'kl'), { g: 25, phi: 28, c: 100, E: 600, nu: 0.3 }],
    ['kayrak', 'Kayrak (arduvaz)', 'Metamorfik kayaçlar', 'kyr', 'ROCK', Rk, 2, rk('meta', C.kkah, 'eq'), { g: 26.5, phi: 32, c: 150, E: 1500, nu: 0.27 }],
    ['kuvarsit', 'Kuvarsit', 'Metamorfik kayaçlar', 'kvt', 'ROCK', Rk, 2, rk('meta', C.akah, 'k'), { g: 26, phi: 45, c: 400, E: 5000, nu: 0.2 }],
    ['mermer', 'Mermer', 'Metamorfik kayaçlar', 'mr', 'ROCK', Rk, 2, rk('brick', C.lac), { g: 27, phi: 40, c: 300, E: 3500, nu: 0.25 }],
    ['kalksist', 'Kalkşist', 'Metamorfik kayaçlar', 'kşst', 'ROCK', Rk, 2, rk('brick', C.lac, 'w'), { g: 26.5, phi: 34, c: 200, E: 2000, nu: 0.27 }],
    // --- genel ---
    ['kaya', 'Kaya (genel)', 'Genel', 'Kaya', 'ROCK', Rk, 2, rk('bed', C.gri, ['tri', 'k']), { g: 23, phi: 32, c: 100, E: 500, nu: 0.28 }],
    ['ayrisik_kaya', 'Ayrışmış kaya / kaya – zemin geçişi', 'Genel', 'Kaya', 'ROCK', Rk, 3, rk('weath', C.gri), { g: 22, phi: 30, c: 60, E: 300, nu: 0.3 }]
  ];
  const LIST = RAW.map(([key, ad, grp, code, uscs, fam, di, pat, q]) => ({ key, ad, grp, code, uscs, fam, def: STATES[fam][di], pat, q }));
  const BY = {}; LIST.forEach(e => { BY[e.key] = e; });
  const GROUPS = [...new Set(LIST.map(e => e.grp))];

  function patternDef(key, id) {
    const e = BY[key] || BY.kaya;
    const base = e.pat.s ? (e.pat.col && e.pat.col[e.pat.main]) || SCOL[e.pat.main] : e.pat.c;
    const body = e.pat.s ? soilBody(e.pat) : rockBody(e.pat);
    return `<pattern id="${id || 'h-' + e.key}" width="36" height="24" patternUnits="userSpaceOnUse"><rect width="36" height="24" fill="${tint(base, e.fam === 'RK' ? 0.9 : 0.86)}"/>${body}</pattern>`;
  }

  // Eski projeler: USCS koduna / tanıma göre katalog anahtarı
  const USCS_MAP = { GW: 'cakil_gw', GP: 'cakil_gp', GM: 'siltli_cakil', GC: 'killi_cakil', 'GC-GM': 'siltli_killi_cakil', 'GW-GM': 'siltli_cakil', 'GP-GM': 'siltli_cakil', 'GW-GC': 'killi_cakil', 'GP-GC': 'killi_cakil',
    SW: 'kum_sw', SP: 'kum_sp', SM: 'siltli_kum', SC: 'killi_kum', 'SM-SC': 'siltli_killi_kum', 'SW-SM': 'siltli_kum', 'SP-SM': 'siltli_kum', 'SW-SC': 'killi_kum', 'SP-SC': 'killi_kum',
    ML: 'silt', MH: 'silt_mh', CL: 'kil_cl', CH: 'kil_ch', 'CL-ML': 'siltli_kil', OL: 'org_silt', OH: 'org_kil', Pt: 'turba', ROCK: 'kaya', FILL: 'dolgu' };
  const norm = s => String(s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
  function keyOf(Lr) {
    if (!Lr) return 'kaya';
    if (typeof Lr === 'string') return BY[Lr] ? Lr : USCS_MAP[Lr] || 'dolgu';
    if (Lr.zt && BY[Lr.zt]) return Lr.zt;
    const d = norm(Lr.desc);
    if (d) { const hit = LIST.find(e => norm(e.ad) === d) || LIST.find(e => e.fam === 'RK' && d.includes(norm(e.ad).split(' ')[0])); if (hit && (hit.uscs === Lr.uscs || !USCS_MAP[Lr.uscs] || Lr.uscs === 'ROCK')) return hit.key; }
    return USCS_MAP[Lr.uscs] || (Lr.beh === 'Kaya' ? 'kaya' : 'dolgu');
  }
  const famOf = key => (BY[key] || BY.kaya).fam;
  const statesFor = key => STATES[famOf(key)];

  // Seçilen tür + durum için tabakaya tipik değerleri uygula; hangi alanların değiştiğini döndürür
  function apply(Lr) {
    const key = keyOf(Lr), e = BY[key];
    if (!statesFor(key).includes(Lr.durum)) Lr.durum = e.def;
    const t = typical(key, Lr.durum);
    const auto = e.ad + (e.fam === 'RK' ? ' (' + Lr.durum.split(' – ')[1].toLocaleLowerCase('tr-TR') + ')' : ', ' + Lr.durum.replace(/\s*\(.*\)/, '').toLocaleLowerCase('tr-TR'));
    Lr.zt = key; Lr.uscs = e.uscs;
    if (!Lr.desc || Lr.desc === Lr.descAuto || LIST.some(x => norm(x.ad) === norm(Lr.desc))) { Lr.desc = auto; Lr.descAuto = auto; }
    PARAM_KEYS.forEach(k => { Lr[k] = t[k]; });
    Lr.tip = PARAM_KEYS.filter(k => k !== 'beh');
    return Lr.tip;
  }

  const SOURCES = [
    'Sınıflama, sıkılık / kıvam sınıfları (SPT N), oran ifadeleri ve ayrışma derecesi: Zemin ve Temel Etüdü Uygulama Esasları Tebliği (2019) EK-5 Sondaj Logu.',
    'Tarama sembolleri ve renkleri: Tebliğ (2019) EK-6 Lejant; TS ISO 710 serisi; TS EN ISO 14688-1/-2 (zemin), TS EN ISO 14689 (kaya).',
    "φ' (iri daneli, SPT sıkılık sınıfı): Peck, Hanson & Thornburn (1974). c<sub>u</sub> – kıvam: Terzaghi & Peck (1967).",
    'E<sub>s</sub>, ν: Bowles (1996) Foundation Analysis and Design, Tablo 5-6 ve 5-7 aralıkları. m<sub>v</sub>: Carter & Bentley (1991) sıkışabilirlik sınıfları. γ, e<sub>0</sub>: Das, Principles of Geotechnical Engineering.',
    'Kaya kütlesi değerleri: Hoek & Brown (1997) mertebeleri; ayrışma derecesine göre azaltma GeoHesap ön tahminidir. Kaya tasarım parametreleri karot, RQD, nokta yükleme / tek eksenli basınç deneyleri ve GSI ile belirlenmelidir.'
  ];

  root.GSOIL = { STATES, LIST, BY, GROUPS, SOURCES, PARAM_KEYS, typical, apply, keyOf, famOf, statesFor, stateFromN, patternDef, label: Lr => (BY[keyOf(Lr)] || {}).code, nameOf: Lr => (BY[keyOf(Lr)] || {}).ad };
})(typeof window !== 'undefined' ? window : globalThis);
