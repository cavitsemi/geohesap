/* Geoteknik hesap motoru — TBDY 2018 Bölüm 16, Tebliğ 2019, literatür.
   Excel aracı v1.3 ile aynı bağıntılar. Birimler: m, kN, kPa, MPa (Es), m²/kN (mv). */
(function (root) {
  'use strict';
  const D2R = Math.PI / 180;
  const r = (x, n = 2) => (x === null || x === undefined || !isFinite(x)) ? '–' : Number(x).toFixed(n);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------------- Gerilmeler ----------------
  function layerAt(layers, z) {
    for (let i = 0; i < layers.length; i++) if (z >= layers[i].top - 1e-9 && z < layers[i].bottom - 1e-9) return i;
    return layers.length - 1;
  }
  function sigmaV(P, z) { // toplam düşey gerilme (doğal zeminden derinlik z)
    let s = 0;
    const yass = P.site.yass;
    for (const L of P.layers) {
      if (z <= L.top) break;
      const zb = Math.min(z, L.bottom);
      const dry = Math.max(0, Math.min(zb, yass) - L.top);
      const wet = Math.max(0, zb - Math.max(L.top, yass));
      s += L.gn * dry + (L.gsat || L.gn) * wet;
    }
    const last = P.layers[P.layers.length - 1];
    if (z > last.bottom) { // profil altını son tabakayla uzat
      const dry = Math.max(0, Math.min(z, yass) - last.bottom), wet = Math.max(0, z - Math.max(last.bottom, yass));
      s += last.gn * dry + (last.gsat || last.gn) * wet;
    }
    return s;
  }
  const uW = (P, z) => P.site.gw * Math.max(0, z - P.site.yass);
  const sigmaEff = (P, z) => sigmaV(P, z) - uW(P, z);

  // ---------------- SPT (TBDY Ek 16B) ----------------
  function crRod(len) { return len < 4 ? 0.75 : len < 6 ? 0.85 : len < 10 ? 0.95 : 1.0; } // L < 3 m: Tablo 16B.1'de yok; Youd vd. (2001) 0.75
  function finesAB(fc) {
    if (fc <= 5) return [0, 1];
    if (fc >= 35) return [5, 1.2];
    return [Math.exp(1.76 - 190 / (fc * fc)), 0.99 + Math.pow(fc, 1.5) / 1000];
  }
  function sptCalc(P) {
    const S = P.spt, eq = S.equip;
    const rows = S.data.filter(d => d.z > 0 && d.N > 0).sort((a, b) => a.z - b.z).map(d => {
      const li = layerAt(P.layers, d.z), L = P.layers[li];
      const sv = sigmaV(P, d.z), u = uW(P, d.z), se = sv - u;
      const CN = Math.min(1.7, 9.78 * Math.sqrt(1 / se));
      const CR = crRod(d.z + eq.rodExtra);
      const N = Math.min(d.N, 50);
      const N60 = N * eq.CE * eq.CB * eq.CS * CR;
      const N160 = CN * N60;
      const [a, b] = finesAB(L.fines || 0);
      return { crOut: d.z + eq.rodExtra < 3, z: d.z, Nraw: d.N, N, layer: li, uscs: L.uscs, sv, u, se, CN, CR, N60, N160, alpha: a, beta: b, N160f: a + b * N160, fines: L.fines || 0, pi: L.pi || 0, beh: L.beh };
    });
    // (N60)30 — temel tabanından 30 m, her SPT komşularına yarı mesafe
    const Df = P.found.Df, zEnd = Df + 30;
    const below = rows.filter(x => x.z >= Df);
    let sumHN = 0;
    below.forEach((x, i) => {
      const top = i === 0 ? Df : (below[i - 1].z + x.z) / 2;
      const bot = i === below.length - 1 ? zEnd : (x.z + below[i + 1].z) / 2;
      x.h30 = Math.max(0, Math.min(bot, zEnd) - Math.max(top, Df));
      sumHN += x.h30 / Math.min(x.N60, 50);
    });
    const N30 = below.length ? 30 / sumHN : null;
    return { rows, N30 };
  }

  // ---------------- Vs30, zemin sınıfı ----------------
  function vs30(P) {
    const Df = P.found.Df, zEnd = Df + 30, V = P.vs.filter(v => v.vs > 0).sort((a, b) => a.top - b.top);
    if (!V.length) return null;
    let t = 0;
    V.forEach((v, i) => {
      const bot = i === V.length - 1 ? Math.max(v.bottom, zEnd) : v.bottom;
      const h = Math.max(0, Math.min(bot, zEnd) - Math.max(v.top, Df));
      t += h / v.vs;
    });
    return 30 / t;
  }
  const classVs = v => v == null ? null : v > 1500 ? 'ZA' : v > 760 ? 'ZB' : v > 360 ? 'ZC' : v > 180 ? 'ZD' : 'ZE';
  const classN = n => n == null ? null : n > 50 ? 'ZC' : n >= 15 ? 'ZD' : 'ZE';

  // ---------------- Spektrum (TBDY Bölüm 2–3) ----------------
  const FS_T = { ZA: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8], ZB: [0.9, 0.9, 0.9, 0.9, 0.9, 0.9], ZC: [1.3, 1.3, 1.2, 1.2, 1.2, 1.2], ZD: [1.6, 1.4, 1.2, 1.1, 1.0, 1.0], ZE: [2.4, 1.7, 1.3, 1.1, 0.9, 0.8] };
  const F1_T = { ZA: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8], ZB: [0.8, 0.8, 0.8, 0.8, 0.8, 0.8], ZC: [1.5, 1.5, 1.5, 1.5, 1.5, 1.4], ZD: [2.4, 2.2, 2.0, 1.9, 1.8, 1.7], ZE: [4.2, 3.3, 2.8, 2.4, 2.2, 2.0] };
  function interp(xs, ys, x) {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    for (let i = 0; i < xs.length - 1; i++) if (x <= xs[i + 1]) return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]);
  }
  function spectrum(Ss, S1, zs, bks, HN) {
    const Fs = interp([0.25, 0.5, 0.75, 1.0, 1.25, 1.5], FS_T[zs], Ss);
    const F1 = interp([0.1, 0.2, 0.3, 0.4, 0.5, 0.6], F1_T[zs], S1);
    const SDS = Ss * Fs, SD1 = S1 * F1, TA = 0.2 * SD1 / SDS, TB = SD1 / SDS, TL = 6;
    const dtsN = SDS < 0.33 ? 4 : SDS < 0.5 ? 3 : SDS < 0.75 ? 2 : 1;
    const DTS = dtsN + (bks === 1 ? 'a' : '');
    const g = dtsN <= 2 ? 0 : dtsN === 3 ? 1 : 2;
    const lim = [[70, 56, 42, 28, 17.5, 10.5, 7], [91, 70, 56, 42, 28, 17.5, 10.5], [105, 91, 56, 42, 28, 17.5, 10.5]][g];
    let BYS = 8;
    for (let i = 0; i < lim.length; i++) if (HN > lim[i]) { BYS = i + 1; break; }
    const Sae = T => T <= TA ? (0.4 + 0.6 * T / TA) * SDS : T <= TB ? SDS : T <= TL ? SD1 / T : SD1 * TL / (T * T);
    const curve = []; for (let T = 0; T <= 3.0001; T += 0.02) curve.push([T, Sae(T)]);
    return { Fs, F1, SDS, SD1, TA, TB, TL, DTS, BYS, curve };
  }

  // ---------------- Taşıma gücü (TBDY 16.8, Denk. 16.8a) ----------------
  function bearingCore(o) {
    // o: {B,L,Df,N,MB,ML,HB,HL,phi,c,q,gam, undrained}
    const eB = o.MB / o.N, eL = o.ML / o.N;
    const b1 = o.B - 2 * Math.abs(eB), l1 = o.L - 2 * Math.abs(eL);
    if (!(o.N > 0) || !(b1 > 0) || !(l1 > 0)) { // etkin alan yok: devrilme / geçersiz yük
      return { invalid: true, eB, eL, Bp: Math.min(b1, l1), Lp: Math.max(b1, l1), Ap: 0, qo: Infinity, H: Math.hypot(o.HB || 0, o.HL || 0), beta: NaN, phi: o.undrained ? 0 : o.phi, c: o.undrained ? o.cu : o.c, Nq: NaN, Nc: NaN, Ng: NaN, sc: NaN, sq: NaN, sg: NaN, k: NaN, dc: NaN, dq: NaN, dg: NaN, ic: NaN, iq: NaN, ig: NaN, t1: 0, t2: 0, t3: 0, qk: 0, qt: 0, ok: false, core: Infinity, qmax: null, qmin: null, contact: null };
    }
    const Bp = Math.min(b1, l1), Lp = Math.max(b1, l1), Ap = Bp * Lp;
    const qo = o.N / Ap, H = Math.hypot(o.HB || 0, o.HL || 0), beta = Math.atan(H / o.N) / D2R;
    const phi = o.undrained ? 0 : o.phi, c = o.undrained ? o.cu : o.c, tp = Math.tan(phi * D2R);
    const Nq = phi === 0 ? 1 : Math.exp(Math.PI * tp) * Math.pow(Math.tan((45 + phi / 2) * D2R), 2);
    const Nc = phi === 0 ? 2 + Math.PI : (Nq - 1) / tp;
    const Ng = 2 * (Nq - 1) * tp;
    const sc = 1 + (Bp / Lp) * Nq / Nc, sq = 1 + (Bp / Lp) * tp, sg = Math.max(0.6, 1 - 0.4 * Bp / Lp);
    const k = o.Df / Bp <= 1 ? o.Df / Bp : Math.atan(o.Df / Bp); // Hansen (1970)
    const dc = 1 + 0.4 * k, dq = 1 + 2 * tp * Math.pow(1 - Math.sin(phi * D2R), 2) * k, dg = 1;
    const ic = Math.pow(1 - beta / 90, 2), iq = ic;
    const ig = phi === 0 ? 0 : beta >= phi ? 0 : Math.pow(1 - beta / phi, 2);
    const t1 = c * Nc * sc * dc * ic, t2 = o.q * Nq * sq * dq * iq, t3 = 0.5 * o.gam * Bp * Ng * sg * dg * ig;
    const qk = t1 + t2 + t3, qt = qk / 1.4;
    // temas kontrolü (CE336 PS1)
    const core = 6 * Math.abs(eB) / o.B + 6 * Math.abs(eL) / o.L;
    let qmax, qmin, contact;
    if (core <= 1 + 1e-9) { qmax = o.N / (o.B * o.L) * (1 + core); qmin = o.N / (o.B * o.L) * (1 - core); contact = 1; }
    else if (Math.abs(eB) < 1e-9) { qmax = 4 * o.N / (3 * o.B * (o.L - 2 * Math.abs(eL))); qmin = 0; contact = Math.min(1, 3 * (o.L / 2 - Math.abs(eL)) / o.L); }
    else if (Math.abs(eL) < 1e-9) { qmax = 4 * o.N / (3 * o.L * (o.B - 2 * Math.abs(eB))); qmin = 0; contact = Math.min(1, 3 * (o.B / 2 - Math.abs(eB)) / o.B); }
    else { qmax = null; qmin = null; contact = null; }
    return { eB, eL, Bp, Lp, Ap, qo, H, beta, phi, c, Nq, Nc, Ng, sc, sq, sg, k, dc, dq, dg, ic, iq, ig, t1, t2, t3, qk, qt, ok: qo <= qt, core, qmax, qmin, contact };
  }

  function gammaForNg(P, Bp) { // TBDY: YASS'a göre γ'
    const Df = P.found.Df, L = P.layers[layerAt(P.layers, Df + 1e-6)], yass = P.site.yass, gw = P.site.gw;
    const gsub = (L.gsat || L.gn) - gw;
    if (yass <= Df) return gsub;
    if (yass >= Df + Bp) return L.gn;
    return gsub + (yass - Df) / Bp * (L.gn - gsub);
  }

  // ---------------- Oturma (Boussinesq köşe çözümü × 4) ----------------
  function Icorner(z, a, b) {
    const m = a / z, n = b / z, v = 1 + m * m + n * n;
    return (1 / (4 * Math.PI)) * (2 * m * n * Math.sqrt(v) / (v + m * m * n * n) * (v + 1) / v + Math.atan2(2 * m * n * Math.sqrt(v), v - m * m * n * n));
  }

  function schmertmannCore(o) {
    // o: {B,L,qnet,q,sz1,t, layers:[{h, Es(kPa)}] (from base) } or Esfun(z)
    const lb = clamp(o.L / o.B, 1, 10);
    const Iz0 = Math.min(0.2, 0.1 + 0.0111 * (lb - 1));
    const z1 = o.B * Math.min(1, 0.5 + 0.0555 * (lb - 1));
    const z2 = o.B * Math.min(4, 2 + 0.222 * (lb - 1));
    const Izm = 0.5 + 0.1 * Math.sqrt(o.qnet / o.sz1);
    const Iz = z => z <= z1 ? Iz0 + (Izm - Iz0) * z / z1 : Math.max(0, Izm * (z2 - z) / (z2 - z1));
    const C1 = Math.max(0.5, 1 - 0.5 * o.q / o.qnet), C2 = 1 + 0.2 * Math.log10(o.t / 0.1);
    let sum = 0; const prof = [];
    if (o.parts) { // açık dilimler (PS1 Q3 doğrulaması)
      o.parts.forEach(p => { sum += Iz(p.zm) * p.dz / p.Es; prof.push([p.zm, Iz(p.zm)]); });
    } else {
      const n = 40, dz = z2 / n;
      for (let i = 0; i < n; i++) { const zm = (i + 0.5) * dz, Es = o.Esfun(zm); if (Es > 0) sum += Iz(zm) * dz / Es; prof.push([zm, Iz(zm)]); }
    }
    return { lb, Iz0, z1, z2, Izm, C1, C2, sum, Se: C1 * C2 * o.qnet * sum * 1000, prof, Iz };
  }

  // ---------------- Ana hesap ----------------
  function compute(P) {
    const R = { steps: {}, checks: [], warn: [] };
    const step = (mod, s) => { (R.steps[mod] = R.steps[mod] || []).push(s); };
    const F = P.found, Df = F.Df, B = Math.min(F.B, F.L), L = Math.max(F.B, F.L);
    const kb = layerAt(P.layers, Df + 1e-6), LB = P.layers[kb];

    // --- SPT, Vs, sınıf
    const spt = sptCalc(P); R.spt = spt;
    const V30 = vs30(P); R.vs30 = V30;
    const cVs = classVs(V30), cN = classN(spt.N30);
    R.zsVs = cVs; R.zsN = cN; R.blockers = [];
    // Vs profilinin kapsaması (16.4.2: temel tabanından 30 m)
    { const V = P.vs.filter(v => v.vs > 0).sort((a, b) => a.top - b.top);
      if (V.length) {
        const gaps = []; for (let i = 1; i < V.length; i++) if (V[i].top - V[i - 1].bottom > 0.05) gaps.push(`${V[i - 1].bottom}–${V[i].top} m`);
        if (V[0].top > Df + 0.05) gaps.unshift(`${Df}–${V[0].top} m`);
        const ext = Math.max(0, Df + 30 - Math.max(...V.map(v => v.bottom)));
        R.vsCover = { gaps, ext };
        if (gaps.length) R.warn.push(`Vs profilinde veri boşluğu var (${gaps.join(', ')}); V<sub>s30</sub> bu aralıklar dışlanarak hesaplanmamalı — profili tamamlayın.`);
        if (ext > 0.05) R.warn.push(`Vs ölçümü D<sub>f</sub> + 30 m'ye ulaşmıyor; son tabakanın hızı ${ext.toFixed(1)} m uzatıldı. Bu kabul raporda gerekçelendirilmelidir.`);
        if (gaps.length) R.blockers.push('Vs profilinde boşluk var');
      } }
    // (cu)30 — üst 30 m'nin tamamı kohezyonlu ve cu tanımlıysa
    { let t = 0, okc = true; P.layers.forEach(Lr => { const h = Math.max(0, Math.min(Lr.bottom, Df + 30) - Math.max(Lr.top, Df)); if (h <= 0) return; if (Lr.beh !== 'Kohezyonlu' || !(Lr.cu > 0)) okc = false; else t += h / Lr.cu; });
      const last = P.layers[P.layers.length - 1]; if (last.bottom < Df + 30) okc = false;
      R.cu30 = okc && t > 0 ? 30 / t : null; }
    const cCu = R.cu30 == null ? null : R.cu30 > 250 ? 'ZC' : R.cu30 >= 70 ? 'ZD' : 'ZE';
    R.zsCu = cCu;
    // ZF ön kontrolü (Tablo 16.1)
    { const thk = f => P.layers.filter(f).reduce((a, Lr) => a + Math.max(0, Math.min(Lr.bottom, Df + 30) - Math.max(Lr.top, Df)), 0);
      const pt = thk(Lr => ['Pt', 'OL', 'OH'].includes(Lr.uscs)), hp = thk(Lr => (Lr.pi || 0) > 50);
      R.zf = []; if (pt > 3) R.zf.push(`toplam ${pt.toFixed(1)} m turba/organik kil`); if (hp > 8) R.zf.push(`toplam ${hp.toFixed(1)} m PI > 50 kil`);
      if (R.zf.length) { R.warn.push(`Tablo 16.1 ZF koşulu olabilir: ${R.zf.join(', ')}. Sahaya özel zemin davranış analizi (16.5) gerekir.`); R.blockers.push('ZF koşulu'); } }
    let zsSug = cVs || cN || cCu || null;
    const rockTop = (P.layers.find(Lr => Lr.beh === 'Kaya') || {}).top, soilT = rockTop == null ? Infinity : rockTop - Df;
    const fix1643 = z => { if ((z === 'ZA' || z === 'ZB') && soilT > 3) { R.warn.push(`TBDY 16.4.3: temel tabanı ile kaya üstü arasında ${soilT === Infinity ? '3 m\'den fazla ' : soilT.toFixed(1) + ' m '}zemin var; ZA/ZB tanımlanamaz, ZC alındı.`); return 'ZC'; } return z; };
    zsSug = fix1643(zsSug);
    let zs = fix1643(P.seis.zsOverride || zsSug);
    if (!zs) { R.blockers.push('Zemin sınıfı belirlenemedi (Vs, SPT veya c<sub>u</sub> verisi yok)'); R.warn.push('Zemin sınıfı için Vs, SPT veya (c<sub>u</sub>)<sub>30</sub> verisi yok. Deprem sayfasından sınıfı gerekçesiyle elle seçin; seçilene kadar sonuçlar geçici olarak ZC ile gösterilir.'); zs = 'ZC'; R.zsUnknown = true; }
    R.zs = zs; R.zsSug = zsSug;
    step('zemin', { t: 'Vs30 (temel tabanından 30 m)', f: 'V<sub>s30</sub> = 30 / Σ (h<sub>i</sub> / V<sub>s,i</sub>)', s: V30 ? `= ${r(V30, 0)} m/s → ${cVs}` : 'Vs verisi yok', v: V30, u: 'm/s', src: 'TBDY 16.4.2, Denk. 16.2; Tablo 16.1', why: 'Harmonik ortalama: dalganın 30 m\'yi kaç saniyede geçtiğini ölçer, yumuşak ince tabakayı kaybetmez.' });
    step('zemin', { t: '(N60)30', f: '(N<sub>60</sub>)<sub>30</sub> = 30 / Σ (h<sub>i</sub> / N<sub>60,i</sub>)', s: spt.N30 ? `= ${r(spt.N30, 1)} → ${cN}` : 'SPT yok', v: spt.N30, u: 'darbe', src: 'TBDY Denk. 16.2', why: 'Ret (R) değerleri 50 ile sınırlanır; bu yüzden kayalı profilde N30 düşük çıkar.' });
    if (cCu) step('zemin', { t: '(cu)30', f: '(c<sub>u</sub>)<sub>30</sub> = 30 / Σ (h<sub>i</sub> / c<sub>u,i</sub>)', s: `= ${r(R.cu30, 0)} kPa → ${cCu}`, v: R.cu30, u: 'kPa', src: 'TBDY Denk. 16.2', why: 'Üst 30 m tamamen kohezyonlu ise kullanılabilir.' });
    if (cVs && cN && cVs !== cN) R.warn.push(`Vs30 ${cVs}, (N60)30 ${cN} veriyor. TBDY 16.3.7 öncelik koymaz; seçimi gerekçelendir ve iki spektrumu karşılaştır.`);

    // --- Deprem
    const sp = spectrum(P.seis.Ss, P.seis.S1, zs, P.proj.bks, P.proj.HN); R.sp = sp;
    const other = zs === 'ZC' ? 'ZD' : zs === 'ZD' ? 'ZC' : null;
    if (other) R.spAlt = Object.assign(spectrum(P.seis.Ss, P.seis.S1, other, P.proj.bks, P.proj.HN), { zs: other });
    step('deprem', { t: 'Kısa periyot yerel zemin katsayısı', f: 'F<sub>s</sub> = f(S<sub>s</sub>, zemin sınıfı)', s: `S<sub>s</sub> = ${r(P.seis.Ss, 3)}, ${zs} → F<sub>s</sub> = ${r(sp.Fs, 3)}`, v: sp.Fs, u: '-', src: 'TBDY Tablo 2.1 (doğrusal ara değer)', why: 'Yumuşak zemin kısa periyotlu titreşimi büyütür.' });
    step('deprem', { t: '1 s yerel zemin katsayısı', f: 'F<sub>1</sub> = f(S<sub>1</sub>, zemin sınıfı)', s: `S<sub>1</sub> = ${r(P.seis.S1, 3)} → F<sub>1</sub> = ${r(sp.F1, 3)}`, v: sp.F1, u: '-', src: 'TBDY Tablo 2.2', why: '' });
    step('deprem', { t: 'Tasarım spektral ivmeleri', f: 'S<sub>DS</sub> = S<sub>s</sub>·F<sub>s</sub> · S<sub>D1</sub> = S<sub>1</sub>·F<sub>1</sub>', s: `= ${r(P.seis.Ss, 3)}·${r(sp.Fs, 3)} = ${r(sp.SDS, 3)} · ${r(P.seis.S1, 3)}·${r(sp.F1, 3)} = ${r(sp.SD1, 3)}`, v: sp.SDS, u: 'g', src: 'TBDY Denk. 2.1', why: 'Statik programa girilen asıl değerler.' });
    step('deprem', { t: 'Köşe periyotları', f: 'T<sub>A</sub> = 0.2·S<sub>D1</sub>/S<sub>DS</sub> · T<sub>B</sub> = S<sub>D1</sub>/S<sub>DS</sub>', s: `T<sub>A</sub> = ${r(sp.TA, 3)} s · T<sub>B</sub> = ${r(sp.TB, 3)} s`, v: sp.TB, u: 's', src: 'TBDY Denk. 2.3', why: '' });
    step('deprem', { t: 'DTS ve BYS', f: 'DTS: Tablo 3.2 (S<sub>DS</sub>, BKS) · BYS: Tablo 3.3 (H<sub>N</sub>, DTS)', s: `DTS = ${sp.DTS} · H<sub>N</sub> = ${r(P.proj.HN, 1)} m → BYS = ${sp.BYS}`, v: sp.BYS, u: '', src: 'TBDY Tablo 3.2, 3.3', why: '' });

    // Zemin hakim periyodu (ilk 30 m, doğal zeminden)
    { let t = 0; const V = P.vs.filter(v => v.vs > 0).sort((a, b) => a.top - b.top); V.forEach((v, i) => { const bot = i === V.length - 1 ? Math.max(v.bottom, 30) : v.bottom; const h = Math.max(0, Math.min(bot, 30) - Math.min(v.top, 30)); t += h / v.vs; }); R.T0 = V.length ? 4 * t : null; }
    // Deprem düzeyleri
    R.dd = [{ name: 'DD-1', ...(P.seis.dd || []).find(d => d.name === 'DD-1') }, { name: 'DD-2', Ss: P.seis.Ss, S1: P.seis.S1, PGA: P.seis.PGA, PGV: P.seis.PGV }, ...['DD-3', 'DD-4'].map(n => ({ name: n, ...(P.seis.dd || []).find(d => d.name === n) }))]
      .filter(d => d.Ss > 0 && d.S1 > 0).map(d => { const s = spectrum(d.Ss, d.S1, zs, P.proj.bks, P.proj.HN); return { ...d, SDS: s.SDS, SD1: s.SD1, DTS: s.DTS }; });
    // --- Temel altı parametreler
    const svDf = sigmaV(P, Df), seDf = sigmaEff(P, Df);
    const des = P.bear;
    const phiD = des.phi != null && des.phi !== '' ? +des.phi : LB.phi;
    const cD = des.c != null && des.c !== '' ? +des.c : LB.c;
    const cuD = des.cu != null && des.cu !== '' ? +des.cu : LB.cu;
    const undr = (des.type || (LB.beh === 'Kohezyonlu' ? 'Drenajsız' : 'Drenajlı')) === 'Drenajsız';
    R.design = { kb, layer: LB, phi: phiD, c: cD, cu: cuD, undr, svDf, seDf };


    // --- Taşıma gücü, kombinasyonlar
    R.bear = P.loads.combos.map((cb, i) => {
      const Bp0 = Math.min(F.B - 2 * Math.abs(cb.MB / cb.N), F.L - 2 * Math.abs(cb.ML / cb.N));
      const o = { B: F.B, L: F.L, Df, N: cb.N, MB: cb.MB, ML: cb.ML, HB: cb.HB, HL: cb.HL, phi: phiD, c: cD, cu: cuD, undrained: undr, q: undr ? svDf : seDf, gam: gammaForNg(P, Bp0) };
      const b = bearingCore(o); b.name = cb.name; b.N = cb.N; b.q = o.q; b.gam = o.gam;
      return b;
    });
    const util = b => b.invalid ? Infinity : b.qo / b.qt;
    const crit = R.bear.reduce((a, b) => (util(b) > util(a) ? b : a), R.bear[0]);
    R.bearCrit = crit;
    const minB = R.bear.reduce((a, b) => (b.qt < a.qt ? b : a), R.bear[0]);
    R.qtMin = minB.qt; R.qtMinName = minB.name;
    R.bear.forEach(b => { if (b.invalid) { R.warn.push(`${b.name}: dışmerkezlik temel boyutunun yarısını aşıyor (B' veya L' ≤ 0); temel devriliyor veya yük girdisi hatalı. Taşıma gücü hesaplanamaz.`); R.blockers.push(`${b.name}: geçersiz dışmerkezlik`); } });
    // 16.8.3.3 — etkili derinlikteki her tabakanın parametreleriyle tarama (kritik kombinasyon)
    { const cb = P.loads.combos[R.bear.indexOf(crit)], Bpc = crit.invalid ? B : crit.Bp;
      const depthEff = Bpc * Math.tan((45 + (undr ? 0 : phiD) / 2) * D2R) * 1.0 + 0.5 * Bpc; // ≈ kırılma yüzeyi derinliği
      R.screen = P.layers.filter(Lr => Lr.bottom > Df + 1e-6 && Lr.top < Df + depthEff).map(Lr => {
        // tabakanın kendi drenaj durumu: drenajsız tasarımda kohezyonlu tabaka c_u ile, kohezyonsuz/kaya tabaka φ', c' ile
        const u = undr && Lr.beh === 'Kohezyonlu' && Lr.cu > 0;
        const o = { B: F.B, L: F.L, Df, N: cb.N, MB: cb.MB, ML: cb.ML, HB: cb.HB, HL: cb.HL, phi: Lr.phi, c: Lr.c, cu: Lr.cu, undrained: u, q: u ? svDf : seDf, gam: gammaForNg(P, Bpc) };
        const b = bearingCore(o); return { uscs: Lr.uscs, top: Lr.top, bottom: Lr.bottom, phi: Lr.phi, c: Lr.c, cu: Lr.cu, undrained: u, qk: b.qk };
      });
      R.screenDepth = depthEff;
      const lowest = R.screen.reduce((a, s) => (!a || s.qk < a.qk ? s : a), null);
      R.screenOk = !lowest || crit.invalid || lowest.qk >= crit.qk * 0.98;
      if (!R.screenOk) { R.warn.push(`TBDY 16.8.3.3: kırılma bölgesindeki ${lowest.uscs} (${lowest.top}–${lowest.bottom} m) parametreleriyle q<sub>k</sub> = ${r(lowest.qk, 0)} kPa, tasarım parametreleriyle ${r(crit.qk, 0)} kPa. Tasarım parametrelerini gözden geçirin veya tabakalı yöntem kullanın.`); }
      R.checks.push({ mod: 'tasima', t: 'Tabaka taraması (16.8.3.3)', ok: R.screenOk ? true : null, v: lowest ? `en düşük q<sub>k</sub> ${r(lowest.qk, 0)} kPa (${lowest.uscs})` : '–' }); }
    const bk = crit;
    step('tasima', { t: 'Dışmerkezlik ve etkin alan', f: "e = M / N · B' = B − 2e · L' = L − 2e · A' = B'·L'", s: `${bk.name}: e<sub>B</sub> = ${r(bk.eB, 3)} m, e<sub>L</sub> = ${r(bk.eL, 3)} m → B' = ${r(bk.Bp)} m, L' = ${r(bk.Lp)} m, A' = ${r(bk.Ap, 1)} m²`, v: bk.Ap, u: 'm²', src: 'TBDY 16.8.3 (Meyerhof etkin alan)', why: 'Moment varsa yük, dışmerkezliğin çevresindeki daraltılmış alana düzgün yayılmış kabul edilir.' });
    step('tasima', { t: 'Taban basıncı (talep)', f: "q<sub>o</sub> = N / A'", s: `= ${r(bk.N, 0)} / ${r(bk.Ap, 1)} = ${r(bk.qo, 1)} kPa`, v: bk.qo, u: 'kPa', src: 'TBDY Denk. 16.6', why: '' });
    step('tasima', { t: 'Yük eğikliği', f: 'β = atan(H / N)', s: `= atan(${r(bk.H, 0)} / ${r(bk.N, 0)}) = ${r(bk.beta, 2)}°`, v: bk.beta, u: '°', src: 'Meyerhof (1963)', why: 'Yatay kuvvet taşıma gücünü düşürür; iγ en hassas katsayıdır.' });
    step('tasima', { t: 'Taşıma gücü katsayıları', f: bk.phi === 0 ? 'φ = 0: N<sub>c</sub> = 2 + π, N<sub>q</sub> = 1, N<sub>γ</sub> = 0' : "N<sub>q</sub> = e<sup>π·tanφ'</sup>·tan²(45 + φ'/2) · N<sub>c</sub> = (N<sub>q</sub> − 1)·cotφ' · N<sub>γ</sub> = 2(N<sub>q</sub> − 1)·tanφ'", s: `φ = ${r(bk.phi, 1)}° → N<sub>q</sub> = ${r(bk.Nq, 3)}, N<sub>c</sub> = ${r(bk.Nc, 3)}, N<sub>γ</sub> = ${r(bk.Ng, 3)}`, v: bk.Nq, u: '-', src: 'TBDY Denk. 16.8b', why: 'Nγ için TBDY ifadesi kullanılır; Vesic\'in 2(Nq+1)tanφ ifadesi daha büyük verir.' });
    step('tasima', { t: 'Şekil katsayıları', f: "s<sub>c</sub> = 1 + (B'/L')(N<sub>q</sub>/N<sub>c</sub>) · s<sub>q</sub> = 1 + (B'/L')tanφ · s<sub>γ</sub> = 1 − 0.4(B'/L') ≥ 0.6", s: `s<sub>c</sub> = ${r(bk.sc, 3)}, s<sub>q</sub> = ${r(bk.sq, 3)}, s<sub>γ</sub> = ${r(bk.sg, 3)}`, v: bk.sc, u: '-', src: 'De Beer (1970), Vesic (1973)', why: 'Kare temelde zemin üç boyutlu kırılır.' });
    step('tasima', { t: 'Derinlik katsayıları', f: "k = D<sub>f</sub>/B' (≤ 1) veya atan(D<sub>f</sub>/B') (> 1) · d<sub>c</sub> = 1 + 0.4k · d<sub>q</sub> = 1 + 2tanφ(1 − sinφ)²k · d<sub>γ</sub> = 1", s: `k = ${r(bk.k, 3)} → d<sub>c</sub> = ${r(bk.dc, 3)}, d<sub>q</sub> = ${r(bk.dq, 3)}`, v: bk.dc, u: '-', src: 'Hansen (1970)', why: '' });
    step('tasima', { t: 'Eğim katsayıları', f: 'i<sub>c</sub> = i<sub>q</sub> = (1 − β/90)² · i<sub>γ</sub> = (1 − β/φ)²', s: `i<sub>c</sub> = i<sub>q</sub> = ${r(bk.ic, 3)}, i<sub>γ</sub> = ${r(bk.ig, 3)}`, v: bk.ig, u: '-', src: 'Meyerhof (1963)', why: '' });
    step('tasima', { t: 'Karakteristik taşıma gücü', f: "q<sub>k</sub> = c·N<sub>c</sub>·s<sub>c</sub>·d<sub>c</sub>·i<sub>c</sub> + q·N<sub>q</sub>·s<sub>q</sub>·d<sub>q</sub>·i<sub>q</sub> + ½·γ'·B'·N<sub>γ</sub>·s<sub>γ</sub>·d<sub>γ</sub>·i<sub>γ</sub>", s: `= ${r(bk.c, 1)}·${r(bk.Nc)}·${r(bk.sc)}·${r(bk.dc)}·${r(bk.ic)} + ${r(bk.q, 1)}·${r(bk.Nq)}·${r(bk.sq)}·${r(bk.dq)}·${r(bk.iq)} + ½·${r(bk.gam, 1)}·${r(bk.Bp)}·${r(bk.Ng)}·${r(bk.sg)}·${r(bk.ig)} = ${r(bk.t1, 0)} + ${r(bk.t2, 0)} + ${r(bk.t3, 0)} = <b>${r(bk.qk, 0)} kPa</b>`, v: bk.qk, u: 'kPa', src: 'TBDY Denk. 16.8a', why: '1. terim kohezyon, 2. terim temel üstündeki örtü, 3. terim kama içindeki zeminin ağırlığı.' });
    step('tasima', { t: 'Tasarım taşıma gücü', f: 'q<sub>t</sub> = q<sub>k</sub> / γ<sub>Rv</sub>, γ<sub>Rv</sub> = 1.4', s: `= ${r(bk.qk, 0)} / 1.4 = <b>${r(bk.qt, 0)} kPa = ${r(bk.qt / 9.81, 1)} t/m²</b> ${bk.ok ? '≥' : '<'} q<sub>o</sub> = ${r(bk.qo, 0)} kPa`, v: bk.qt, u: 'kPa', src: 'TBDY Denk. 16.7, Tablo 16.2', why: 'Faktörlü yükle kıyaslanır; eski FS = 3 yaklaşımının yerini alır.' });
    step('tasima', { t: 'Temas kontrolü (bilgi)', f: '6e<sub>B</sub>/B + 6e<sub>L</sub>/L ≤ 1 → tam temas · e > B/6: q<sub>max</sub> = 4N / [3B(L − 2e)]', s: bk.qmax == null ? 'İki yönlü büyük dışmerkezlik: abak gerekir' : `= ${r(bk.core, 2)} → ${bk.core <= 1 ? 'tam temas' : 'taban kısmen ayrılıyor, temas %' + r(bk.contact * 100, 0)} · q<sub>max</sub> = ${r(bk.qmax, 0)} kPa`, v: bk.qmax, u: 'kPa', src: 'CE336 PS1 Q2 (Case III)', why: 'TBDY tasarımı etkin alanla yapılır; kenar basıncı radye donatısı ve temas için ek bilgidir.' });
    R.bear.forEach(b => R.checks.push({ mod: 'tasima', t: `${b.name}: q<sub>o</sub> ≤ q<sub>t</sub>`, ok: b.ok, v: b.invalid ? 'geçersiz dışmerkezlik' : `${r(b.qo, 0)} / ${r(b.qt, 0)} kPa` }));
    R.bear.forEach(b => { if (b.core > 1) R.checks.push({ mod: 'tasima', t: `${b.name}: temas`, ok: null, v: b.qmax == null ? 'iki yönlü büyük e' : `kısmi, %${r(b.contact * 100, 0)}` }); });

    // --- Kayma (TBDY 16.8.4)
    const tand = P.slide.tand;
    // Pasif direnç (literatür modeli, Rankine): gömülme boyunca ∫Kp(z)·σ'v(z)dz × yatay kuvvete dik temel yüzü genişliği
    const passiveLine = () => { let s = 0; const n = 20; for (let i = 0; i < n; i++) { const z = (i + 0.5) * Df / n, Lr = P.layers[layerAt(P.layers, z)]; const kp = Math.pow(Math.tan((45 + (Lr.phi || 0) / 2) * D2R), 2); s += kp * sigmaEff(P, z) * Df / n; } return s; };
    const pLine = P.slide.usePassive && Df > 0 ? passiveLine() : 0; R.passiveLine = pLine;
    const isQuake = cb => cb.seismic === true || cb.seismic === 'Evet' || (cb.seismic == null && /(^|[^A-Za-zÇĞİÖŞÜçğıöşü])E([^A-Za-z]|$)|deprem|sismik|seismic/i.test(cb.name || ''));
    R.isQuake = isQuake;
    const below = P.site.yass <= Df + 0.01;
    R.slide = R.bear.map((b, i) => {
      const cb = P.loads.combos[i], H = b.H;
      // basınç oluşan alan Ac (16.8.4.4): tam temas → B·L; tek yönlü kısmi → temas oranı; iki yönlü kısmi → A' (güvenli taraf)
      const Ac = b.invalid ? 0 : b.core <= 1 ? F.B * F.L : (b.contact != null ? F.B * F.L * b.contact : b.Ap);
      const AcNote = b.invalid ? 'geçersiz' : b.core <= 1 ? 'B·L' : (b.contact != null ? 'kısmi temas' : "A' (iki yönlü kısmi temas)");
      const useU = undr || (below && isQuake(cb));
      const cuS = undr ? cuD : (LB.cu || 0);
      let Rth = useU ? (cuS > 0 ? Ac * cuS / 1.1 : null) : cb.N * tand / 1.1;
      // pasif: yatay bileşenlere göre yüz genişliği (HB → L yüzü, HL → B yüzü)
      const Rpk = H > 0 ? pLine * (Math.abs(cb.HB || 0) / H * F.L + Math.abs(cb.HL || 0) / H * F.B) : 0;
      const Rpt = Rpk / 1.4, cap = Rth == null ? null : Rth + 0.3 * Rpt;
      const ok = b.invalid ? false : Rth == null ? null : H <= cap;
      return { name: cb.name, Vth: H, Rth, Rpk, Rpt, cap, ok, Ac, AcNote, undrained: useU, note: useU && !undr ? '16.8.4.6: YASS altında, depremde drenajsız' : '' };
    });
    if (below && !undr && R.slide.some(s => s.undrained && s.Rth == null)) { R.warn.push('TBDY 16.8.4.6: temel YASS altında; depremli kombinasyonlarda kayma drenajsız dayanımla kontrol edilmeli. Taban tabakasında c<sub>u</sub> tanımlı olmadığından bu kombinasyonlarda kayma sonucu belirsizdir.'); }
    const su = s => s.cap == null ? Infinity : s.Vth / s.cap;
    const sl = R.slide.reduce((a, b) => (su(b) > su(a) ? b : a), R.slide[0]);
    step('kayma', { t: 'Sürtünme direnci', f: sl.undrained ? 'R<sub>th</sub> = A<sub>c</sub>·c<sub>u</sub> / γ<sub>Rh</sub>, γ<sub>Rh</sub> = 1.1' : 'R<sub>th</sub> = P<sub>tv</sub>·tanδ / γ<sub>Rh</sub>, γ<sub>Rh</sub> = 1.1', s: sl.Rth == null ? `${sl.name}: c<sub>u</sub> tanımlı değil — hesaplanamadı` : `${sl.name}: = ${r(sl.Rth, 0)} kN${sl.undrained ? ` (A<sub>c</sub> = ${r(sl.Ac, 1)} m², ${sl.AcNote})` : ''}`, v: sl.Rth, u: 'kN', src: sl.undrained ? 'TBDY Denk. 16.11 (16.8.4.4, 16.8.4.6)' : 'TBDY Denk. 16.10, Tablo 16.3', why: 'Sürtünme N ile orantılı; en küçük düşey yüklü kombinasyon kritik.' });
    step('kayma', { t: 'Kayma kontrolü', f: 'V<sub>th</sub> ≤ R<sub>th</sub> + 0.3·R<sub>pt</sub>', s: sl.cap == null ? 'belirsiz' : `${r(sl.Vth, 0)} ${sl.ok ? '≤' : '>'} ${r(sl.Rth, 0)} + 0.3·${r(sl.Rpt, 0)} = ${r(sl.cap, 0)} kN`, v: sl.cap, u: 'kN', src: 'TBDY Denk. 16.9', why: 'Pasif direnç büyük yer değiştirmede mobilize olur; sadece %30\'u alınır.' });
    R.slide.forEach(s => R.checks.push({ mod: 'kayma', t: `${s.name}: kayma`, ok: s.ok, v: s.cap == null ? 'belirsiz (c<sub>u</sub> yok)' : `${r(s.Vth, 0)} / ${r(s.cap, 0)} kN` }));

    // --- Oturma (servis yükü)
    const qbr = P.loads.Nserv / (F.B * F.L), qnet = Math.max(0, qbr - svDf);
    const zmax = P.sett.zmaxFactor * B, nz = 30, dz = zmax / nz;
    const prof = []; let Sel = 0, Scon = 0, sDs = 0, sDsE = 0, z10 = null, z10n = null;
    for (let i = 0; i < nz; i++) {
      const zb = (i + 0.5) * dz, z = Df + zb, li = layerAt(P.layers, z), Lr = P.layers[li];
      const se = sigmaEff(P, z), I = Icorner(zb, F.B / 2, F.L / 2), ds = 4 * qnet * I;
      const el = Lr.Es > 0 ? ds * dz / Lr.Es : 0; // mm (kPa·m / MPa)
      let co = 0;
      if (Lr.beh === 'Kohezyonlu') co = Lr.mv > 0 ? Lr.mv * ds * dz * 1000 : (Lr.Cc > 0 ? Lr.Cc / (1 + Lr.e0) * dz * Math.log10((se + ds) / se) * 1000 : 0);
      Sel += el; Scon += co; sDs += ds * dz; if (Lr.Es > 0) sDsE += ds * dz / Lr.Es;
      if (z10 === null && ds / se <= 0.1) z10 = zb;
      prof.push({ zb, z, ds, se, s10: 0.1 * se, el, co, uscs: Lr.uscs, li });
      if (z10n === null && ds <= 0.1 * qnet) z10n = zb;
    }
    // 16A.1.4: Δσ = 0.10σ'vo ve Δσ = 0.10 q_net kesişimi — oturma derinliğinden bağımsız arama
    { const dzz = Math.max(0.05, B / 40); let zb = dzz / 2; z10 = null; z10n = null;
      while (zb < Math.max(30 * B, 200) && (z10 === null || z10n === null)) { const ds = 4 * qnet * Icorner(zb, F.B / 2, F.L / 2), se = sigmaEff(P, Df + zb); if (z10 === null && ds <= 0.1 * se) z10 = zb; if (z10n === null && ds <= 0.1 * qnet) z10n = zb; zb += dzz; }
      if (qnet <= 0) { z10 = 0; z10n = 0; } }
    let cum = 0; prof.forEach(p => { cum += (p.el + p.co) * P.sett.rig; p.cum = cum; });
    Sel *= P.sett.rig; Scon *= P.sett.rig;
    const Stot = Sel + Scon, EsEq = sDsE > 0 ? sDs / sDsE : null;
    R.sett = { qbr, qnet, zmax, prof, Sel, Scon, Stot, EsEq, z10, z10n, ok: Stot <= P.sett.allow };
    step('oturma', { t: 'Net temel basıncı (servis)', f: 'q<sub>net</sub> = N<sub>G+Q</sub> / (B·L) − σ<sub>v</sub>(D<sub>f</sub>)', s: `= ${r(P.loads.Nserv, 0)} / (${r(F.B)}·${r(F.L)}) − ${r(svDf, 1)} = ${r(qnet, 1)} kPa`, v: qnet, u: 'kPa', src: 'Tebliğ 9.1.1b', why: 'Oturma faktörsüz servis yüküyle hesaplanır; kazıyla kalkan zemin zaten oradaydı.' });
    step('oturma', { t: 'Gerilme artışı (Boussinesq)', f: 'Δσ = 4·q<sub>net</sub>·I(m, n), m = (B/2)/z, n = (L/2)/z', s: `${nz} dilim, analiz derinliği ${r(zmax, 1)} m; tabanda Δσ ≈ ${r(prof[0].ds, 1)} kPa`, v: prof[0].ds, u: 'kPa', src: 'Boussinesq (1885), Newmark (1935)', why: 'Merkez altı, esnek temel; rijit radye için düzeltme katsayısı ayrı girilir.' });
    step('oturma', { t: 'Ani (elastik) oturma', f: 'S<sub>e</sub> = Σ Δσ·Δz / E<sub>s</sub>', s: `= ${r(Sel, 1)} mm (E<sub>s,eş</sub> = ${r(EsEq, 1)} MPa)`, v: Sel, u: 'mm', src: 'Elastisite, statik E', why: 'MASW\'den gelen dinamik E kullanılmaz; 5–10 kat büyüktür.' });
    step('oturma', { t: 'Konsolidasyon oturması', f: 'S<sub>c</sub> = Σ m<sub>v</sub>·Δσ·Δz  veya  Σ C<sub>c</sub>/(1+e<sub>0</sub>)·Δz·log[(σ\'+Δσ)/σ\']', s: `= ${r(Scon, 1)} mm`, v: Scon, u: 'mm', src: 'Terzaghi; m<sub>v</sub>: ödometre veya Stroud (1974)', why: 'Sadece kohezyonlu tabakalarda.' });
    step('oturma', { t: 'Toplam oturma', f: 'S = S<sub>e</sub> + S<sub>c</sub>', s: `= ${r(Sel, 1)} + ${r(Scon, 1)} = <b>${r(Stot, 1)} mm</b> ${R.sett.ok ? '≤' : '>'} ${P.sett.allow} mm`, v: Stot, u: 'mm', src: 'Skempton & MacDonald (1956)', why: '' });
    R.checks.push({ mod: 'oturma', t: 'Toplam oturma', ok: R.sett.ok, v: `${r(Stot, 1)} / ${P.sett.allow} mm` });

    // Schmertmann
    const lb = clamp(L / B, 1, 10), z1 = B * Math.min(1, 0.5 + 0.0555 * (lb - 1));
    const sch = schmertmannCore({ B, L, qnet: Math.max(qnet, 1e-6), q: seDf, sz1: sigmaEff(P, Df + z1), t: P.sett.tYear, Esfun: zb => { const Lr = P.layers[layerAt(P.layers, Df + zb)]; return Lr.Es * 1000; } });
    R.sch = sch;
    step('oturma', { t: 'Schmertmann (kum için alternatif)', f: 'S<sub>e</sub> = C<sub>1</sub>·C<sub>2</sub>·(q̄ − q)·Σ (I<sub>z</sub>/E<sub>s</sub>)·Δz', s: `C<sub>1</sub> = ${r(sch.C1, 3)}, C<sub>2</sub> = ${r(sch.C2, 3)}, I<sub>z,max</sub> = ${r(sch.Izm, 3)} (z<sub>1</sub> = ${r(sch.z1)} m, z<sub>2</sub> = ${r(sch.z2)} m) → S<sub>e</sub> = ${r(sch.Se, 1)} mm`, v: sch.Se, u: 'mm', src: 'Schmertmann vd. (1978); CE336 PS1 Q3', why: 'Kumda birim deformasyon z1 derinliğinde en büyüktür.' });

    // --- Yatak katsayısı
    const nuB = LB.nu || 0.3;
    const ks1 = Stot > 0 ? qnet / (Stot / 1000) : null;
    const ks2 = 40 * R.bear[0].qk;
    const ks3 = EsEq ? EsEq * 1000 / (B * (1 - nuB * nuB)) : null;
    R.ks = { ks1, ks2, ks3, lo: Math.min(...[ks1, ks2, ks3].filter(x => x)), hi: Math.max(...[ks1, ks2, ks3].filter(x => x)) };
    R.ks.ratio = R.ks.hi / R.ks.lo;
    step('yatak', { t: 'Oturma uyumlu', f: 'k<sub>s1</sub> = q<sub>net</sub> / S', s: ks1 ? `= ${r(qnet, 1)} / ${r(Stot / 1000, 4)} = ${r(ks1, 0)} kN/m³ (${r(ks1 / 9.81, 0)} t/m³)` : '–', v: ks1, u: 'kN/m³', src: 'Tanım', why: 'Bu radyenin gerçek boyutu ve yükü için en savunulabilir değer.' });
    step('yatak', { t: 'Bowles', f: 'k<sub>s2</sub> ≈ 40·q<sub>ult</sub> (q<sub>ult</sub> = q<sub>k</sub>, kPa)', s: `= 40·${r(R.bear[0].qk, 0)} = ${r(ks2, 0)} kN/m³ (${r(ks2 / 9.81, 0)} t/m³)`, v: ks2, u: 'kN/m³', src: 'Bowles (1996)', why: '25 mm oturmayı varsayar; plaka ölçeğine yakın üst sınır. q<sub>t</sub> ile değil q<sub>k</sub> ile kullanılır.' });
    step('yatak', { t: 'Vesic (sadeleştirilmiş)', f: 'k<sub>s3</sub> = E<sub>s</sub> / [B(1 − ν²)]', s: ks3 ? `= ${r(EsEq * 1000, 0)} / [${r(B)}·(1 − ${r(nuB)}²)] = ${r(ks3, 0)} kN/m³ (${r(ks3 / 9.81, 0)} t/m³)` : '–', v: ks3, u: 'kN/m³', src: 'Vesic (1961)', why: 'Genişlik etkisini doğrudan içerir: k<sub>s</sub> ∝ 1/B.' });
    step('yatak', { t: 'Öneri: zarf analizi', f: 'Radyeyi alt ve üst k<sub>s</sub> ile ayrı çöz, donatıyı zarfa göre seç', s: `Alt ${r(R.ks.lo / 9.81, 0)} t/m³ · Üst ${r(R.ks.hi / 9.81, 0)} t/m³ (oran ${r(R.ks.ratio, 1)})`, v: R.ks.ratio, u: '', src: 'Uygulama kabulü', why: 'Düşük ks açıklık momentlerini, yüksek ks kolon altı basıncını büyütür.' });
    if (R.ks.ratio > 3) R.warn.push(`Yatak katsayısı yöntemleri ${r(R.ks.ratio, 1)} kat farklı: tek değer yerine zarf analizi öner.`);

    // --- Şişme (Seed vd. 1962), aktif zon
    R.swell = P.layers.filter(Lr => Lr.top < Df + P.swell.zone && Lr.bottom > Df && Lr.pi > 0).map(Lr => { const S = 60 * 3.6e-5 * Math.pow(Lr.pi, 2.44); return { uscs: Lr.uscs, pi: Lr.pi, S, cls: S < 1.5 ? 'Düşük' : S < 5 ? 'Orta' : S < 25 ? 'Yüksek' : 'Çok yüksek' }; });
    const smax = R.swell.reduce((a, b) => (b.S > a ? b.S : a), 0);
    step('sisme', { t: 'Şişme potansiyeli', f: 'S (%) = 60·3.6·10<sup>−5</sup>·PI<sup>2.44</sup>', s: R.swell.length ? R.swell.map(x => `${x.uscs}: PI ${r(x.pi, 1)} → %${r(x.S, 1)} ${x.cls}`).join(' · ') : 'Aktif zonda plastik tabaka yok', v: smax, u: '%', src: 'Seed, Woodward, Lundgren (1962)', why: 'Hafif yapılarda taban basıncı şişme basıncını dengeleyemez.' });
    if (smax >= 1.5) { R.warn.push(`Şişme potansiyeli ${smax < 5 ? 'orta' : 'yüksek'} (%${r(smax, 1)}): şişme deneyi, granüler dolgu ve çevre drenajı öner.`); }
    R.checks.push({ mod: 'sisme', t: 'Şişme', ok: smax < 1.5 ? true : null, v: `%${r(smax, 1)}` });

    // --- Yönetmelik uyarıları
    { const dn = parseInt(sp.DTS, 10);
      const liqLayers = P.layers.filter(L => L.bottom > P.site.yass && L.top < 20 && L.beh !== 'Kaya' && (L.beh === 'Kohezyonsuz' || (L.pi || 0) < 12));
      R.liq = { needed: P.site.yass < 20 && liqLayers.length > 0, mandatory: P.site.yass < 20 && liqLayers.length > 0 && dn <= 2 && ['ZD', 'ZE', 'ZF'].includes(zs), layers: liqLayers.map(L => L.uscs) };
      if (R.liq.needed) R.warn.push(`YASS ${P.site.yass} m: yüzeyden 20 m içinde su altında kalan kohezyonsuz/düşük plastisiteli tabaka var (${R.liq.layers.join(', ')}). TBDY 16.6 ve Ek 16B'ye göre sıvılaşma değerlendirmesi yapılmalı${R.liq.mandatory ? ' (16.6.1: zorunlu)' : ''}; bu sürüm sıvılaşma hesabı yapmaz.`);
      if ((sp.BYS === 1 && !['ZA', 'ZB'].includes(zs)) || (dn <= 2 && !['ZA', 'ZB', 'ZC'].includes(zs))) R.warn.push(`TBDY 16.8.3.4(b): ${sp.BYS === 1 ? 'yüksek bina (BYS = 1)' : 'DTS ' + sp.DTS} ve ${zs} zeminde yüzeysel temel altında doğrusal olmayan zemin davranışı ile kalıcı şekil değiştirmeler ayrıca hesaplanmalıdır.`);
    }
    // --- Etüt kontrolü (kısa)
    const area = F.B * F.L;
    const nReq = area <= 300 ? 3 : 2 + Math.ceil(area / 300);
    const dtsN = parseInt(sp.DTS, 10);
    const rule20 = P.site.yass < Df + 10 && !!P.site.loose; // TBDY 16A.1.4(d): DTS 1-2 → yüzeyden ≥ 20 m; Tebliğ 7.2.2.2(b)-11: tabandan ≥ 20 m
    const dReq = Math.max(Df + Math.max(1.5 * B, (z10 != null ? z10 : zmax)), rule20 ? Df + 20 : 0);
    const zs_ = P.spt.data.map(d => d.z).filter(z => z > 0).sort((a, b) => a - b);
    let gap = zs_.length ? zs_[0] : 0; for (let i = 1; i < zs_.length; i++) gap = Math.max(gap, zs_[i] - zs_[i - 1]);
    const geoReq = P.proj.HN > 10.5 || area > 200;
    R.etut = { area, nReq, dReq, rule20, gap, geoReq };
    R.checks.push({ mod: 'etut', t: 'Sondaj sayısı', ok: P.site.nBore >= nReq, v: `${P.site.nBore} / ${nReq} (A = ${r(area, 0)} m²)` });
    R.checks.push({ mod: 'etut', t: 'Sondaj derinliği', ok: P.site.boreDepth >= dReq || !!P.site.rock3m, v: `${r(P.site.boreDepth, 1)} / ${r(dReq, 1)} m${P.site.rock3m ? ' (sağlam tabakaya ≥ 3 m)' : ''}${rule20 ? ' (20 m kuralı)' : ''}` });
    R.checks.push({ mod: 'etut', t: 'SPT aralığı ≤ 1.5 m', ok: zs_.length ? gap <= 1.51 : false, v: zs_.length ? `en büyük ${r(gap, 2)} m` : 'SPT verisi yok' });
    if (spt.rows.some(x => x.crOut)) R.warn.push('Tij boyu 3 m\'den kısa SPT deneyleri var: TBDY Tablo 16B.1 bu aralık için C<sub>R</sub> vermez; Youd vd. (2001) önerisiyle 0,75 alındı.');
    { const lab = ['wn', 'gn', 'gs', 'sieve', 'atterberg', 'shear', 'ucs', 'uu', 'oedo'].reduce((a, k) => a + (+((P.etut || {})[k]) || 0), 0); R.etut.lab = lab;
      R.checks.push({ mod: 'etut', t: 'Laboratuvar deneyleri', ok: lab > 0 ? null : false, v: lab > 0 ? `${lab} deney (kapsam mühendisçe değerlendirilmeli)` : 'deney sayısı girilmemiş' }); }
    R.checks.push({ mod: 'etut', t: 'Jeofizik (Vs) ölçümü', ok: !geoReq || P.vs.some(v => v.vs > 0), v: geoReq ? 'zorunlu' : 'gerekmez' });
    R.warn = [...new Set(R.warn)]; R.blockers = [...new Set(R.blockers)];
    R.blocked = R.blockers.length > 0;
    return R;
  }

  // ---------------- Kendi kendini test ----------------
  function selfTest() {
    const T = [];
    const add = (name, got, exp, tol = 0.01) => T.push({ name, got, exp, ok: Math.abs(got / exp - 1) <= tol });
    // AFAD/İMO Örnek 3 (drenajsız radye)
    const b3 = bearingCore({ B: 12.1, L: 22.25, Df: 4, N: 45306, MB: 0, ML: 0, HB: Math.sqrt(1139 ** 2 + 4283 ** 2), HL: 0, phi: 0, c: 0, cu: 60, undrained: true, q: 64, gam: 0 });
    add('AFAD Örnek 3 · qk (kPa)', b3.qk, 394, 0.01);
    add('AFAD Örnek 3 · qt (kPa)', b3.qt, 281, 0.01);
    add('AFAD Örnek 3 · qo (kPa)', b3.qo, 169, 0.01);
    // PS1 Q1–Q2 temas
    add('CE336 PS1 Q1 · qmax (kPa)', bearingCore({ B: 2, L: 2, Df: 1.5, N: 360, MB: 90, ML: 0, HB: 0, HL: 0, phi: 25, c: 0, q: 25.5, gam: 10 }).qmax, 157.5);
    add('CE336 PS1 Q2 · qmax (kPa)', bearingCore({ B: 2, L: 3, Df: 1.5, N: 606.2, MB: 0, ML: 525, HB: 0, HL: 350, phi: 25, c: 0, q: 20, gam: 11 }).qmax, 318.7);
    // PS1 Q3 Schmertmann
    const s3 = schmertmannCore({ B: 3, L: 3, qnet: 222.22, q: 34, sz1: 59.5, t: 6, parts: [{ zm: 0.75, dz: 1.5, Es: 25000 }, { zm: 1.75, dz: 0.5, Es: 25000 }, { zm: 3, dz: 2, Es: 22500 }, { zm: 5, dz: 2, Es: 21250 }] });
    add('CE336 PS1 Q3 · Schmertmann (mm)', s3.Se, 25.57, 0.01);
    // Sentetik spektrum regresyonu
    const sp = spectrum(1.0, 0.4, 'ZC', 3, 6);
    add('Sentetik spektrum · SDS (ZC)', sp.SDS, 1.2, 0.002);
    add('Sentetik spektrum · SD1 (ZC)', sp.SD1, 0.6, 0.002);
    // Sentetik taşıma gücü regresyonu
    const rb = bearingCore({ B: 3, L: 4, Df: 1.5, N: 1200, MB: 0, ML: 0, HB: 0, HL: 0, phi: 30, c: 0, q: 27, gam: 18 });
    add('Sentetik temel · qt (kPa)', rb.qt, 853.205, 0.002);
    return T;
  }

  root.GEO = { compute, selfTest, sigmaV, sigmaEff, layerAt, spectrum, bearingCore, schmertmannCore, Icorner, r };
})(typeof window !== 'undefined' ? window : globalThis);
