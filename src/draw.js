/* SVG çizimleri: tarama desenleri, zemin kesiti, kırılma kaması, plan, grafikler */
(function (root) {
  'use strict';
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const f1 = x => (Math.round(x * 10) / 10).toString();

  // ---------------- Tarama desenleri (TS ISO 710 / USCS mantığı) ----------------
  const USCS = ['GW', 'GP', 'GM', 'GC', 'SW', 'SP', 'SM', 'SC', 'ML', 'CL', 'OL', 'MH', 'CH', 'OH', 'Pt', 'CL-ML', 'SM-SC', 'GC-GM', 'ROCK', 'FILL'];
  const COLOR = { G: '#f0c08c', S: '#f7e39c', M: '#dcd6c4', C: '#bfcf9f', O: '#9fb27a', P: '#8a9a63', R: '#b9bdc4', F: '#e8c0cc' };
  const NAME = { GW: 'İyi derecelenmiş çakıl', GP: 'Kötü derecelenmiş çakıl', GM: 'Siltli çakıl', GC: 'Killi çakıl', SW: 'İyi derecelenmiş kum', SP: 'Kötü derecelenmiş kum', SM: 'Siltli kum', SC: 'Killi kum', ML: 'Düşük plastisiteli silt', CL: 'Düşük plastisiteli kil', OL: 'Organik silt/kil (düşük)', MH: 'Yüksek plastisiteli silt', CH: 'Yüksek plastisiteli kil', OH: 'Organik kil (yüksek)', Pt: 'Turba', 'CL-ML': 'Siltli kil', 'SM-SC': 'Siltli-killi kum', 'GC-GM': 'Siltli-killi çakıl', ROCK: 'Kaya', FILL: 'Dolgu' };
  const ink = '#3a3a3a';
  function prim(t, x, y, heavy) {
    const sw = heavy ? 1.4 : 0.9;
    switch (t) {
      case 'G': return `<circle cx="${x}" cy="${y}" r="3.1" fill="none" stroke="${ink}" stroke-width="0.9"/>`;
      case 'S': return `<circle cx="${x - 2.5}" cy="${y - 1.5}" r="0.9" fill="${ink}"/><circle cx="${x + 2.5}" cy="${y - 1}" r="0.9" fill="${ink}"/><circle cx="${x}" cy="${y + 2.2}" r="0.9" fill="${ink}"/>`;
      case 'M': return `<path d="M${x - 2} ${y - 3}v6M${x + 2} ${y - 3}v6" stroke="${ink}" stroke-width="${sw}"/>`;
      case 'C': return `<path d="M${x - 4} ${y - 1.6}h8M${x - 4} ${y + 1.6}h8" stroke="${ink}" stroke-width="${sw}"/>`;
      case 'O': case 'P': return `<path d="M${x - 3} ${y + 2}l1.5 -4l1.5 4M${x} ${y + 2}l1.5 -4l1.5 4" fill="none" stroke="${ink}" stroke-width="0.8"/><path d="M${x - 4} ${y + 2}h8" stroke="${ink}" stroke-width="0.8"/>`;
    }
    return '';
  }
  function patternFor(code) {
    const id = 'h-' + code.replace(/[^A-Za-z]/g, '');
    const P1 = [[6, 6], [18, 18]], P2 = [[18, 6], [6, 18]];
    let body = '', bg;
    if (code === 'ROCK') {
      bg = COLOR.R;
      body = `<path d="M0 0.5h24M0 12.5h24M0.5 0v12M12.5 12v12" stroke="${ink}" stroke-width="0.9" fill="none"/>`;
    } else if (code === 'FILL') {
      bg = COLOR.F;
      body = [[6, 6], [18, 18], [18, 6], [6, 18]].map(([x, y]) => `<path d="M${x - 3} ${y - 3}l6 6M${x + 3} ${y - 3}l-6 6" stroke="${ink}" stroke-width="0.9"/>`).join('');
    } else if (code === 'Pt') {
      bg = COLOR.P; body = [...P1, ...P2].map(([x, y]) => prim('O', x, y)).join('');
    } else if (code.includes('-')) {
      const [a, b] = code.split('-');
      bg = COLOR[a[0]];
      body = P1.map(([x, y]) => prim(a[0], x, y)).join('') + prim(a[1], 18, 6) + prim(b[1], 6, 18);
    } else {
      const a = code[0], b = code[1];
      bg = COLOR[a];
      if (b === 'W' || b === 'P' || b === 'L' || b === 'H') {
        const heavy = b === 'H';
        const pos = b === 'P' ? P1 : [...P1, ...P2];
        body = pos.map(([x, y]) => prim(a, x, y, heavy)).join('');
        if (a === 'O') body = P1.map(([x, y]) => prim('O', x, y)).join('') + P2.map(([x, y]) => prim(b === 'H' ? 'C' : 'M', x, y)).join('');
      } else {
        body = P1.map(([x, y]) => prim(a, x, y)).join('') + P2.map(([x, y]) => prim(b, x, y)).join('');
      }
    }
    return `<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${bg}"/>${body}</pattern>`;
  }
  const hatchId = code => 'url(#h-' + String(USCS.includes(code) ? code : 'FILL').replace(/[^A-Za-z]/g, '') + ')';
  const DEFS = '<defs>' + USCS.map(patternFor).join('') +
    `<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1f4e79"/></marker>` +
    `<marker id="arrR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#b03a2e"/></marker>` +
    `<pattern id="h-conc" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#d5d8dc"/><path d="M0 10L10 0" stroke="#7f8c8d" stroke-width="0.7"/></pattern>` +
    `<pattern id="h-eff" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#fbe3d2"/><path d="M0 8L8 0" stroke="#d35400" stroke-width="0.8"/></pattern></defs>`;
  const svgOpen = (w, h, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="Segoe UI, Arial, sans-serif" font-size="11" ${extra}><rect width="${w}" height="${h}" fill="#fff"/>${DEFS}`;

  // ---------------- Desen lejantı ----------------
  function legend(codes) {
    const cols = 4, cw = 170, rh = 26, rows = Math.ceil(codes.length / cols);
    let s = svgOpen(cols * cw, rows * rh + 6);
    codes.forEach((c, i) => {
      const x = (i % cols) * cw + 4, y = Math.floor(i / cols) * rh + 4;
      s += `<rect x="${x}" y="${y}" width="34" height="20" fill="${hatchId(c)}" stroke="${ink}" stroke-width="0.6"/><text x="${x + 40}" y="${y + 9}" font-weight="600">${esc(c)}</text><text x="${x + 40}" y="${y + 20}" font-size="9.5" fill="#555">${esc(NAME[c] || '')}</text>`;
    });
    return s + '</svg>';
  }

  // ---------------- Zemin profili (sondaj logu tarzı) ----------------
  function soilColumn(P, R, opt = {}) {
    const W = opt.w || 640, H = opt.h || 560, top = 34, bot = 20;
    const Df = P.found.Df, B = Math.min(P.found.B, P.found.L);
    const maxSpt = Math.max(0, ...P.spt.data.map(d => d.z));
    const lastB = P.layers[P.layers.length - 1].bottom;
    const dmax = Math.min(lastB, Math.ceil(Math.max(P.site.boreDepth, Df + 1.5 * B, maxSpt) + 1));
    const ky = (H - top - bot) / dmax, Y = z => top + Math.min(z, dmax) * ky;
    const x0 = 46, cw = 120, xN = x0 + cw + 210, nw = W - xN - 20;
    let s = svgOpen(W, H);
    s += `<text x="${x0}" y="16" font-weight="700">Zemin kolonu</text><text x="${x0 + cw + 8}" y="16" font-weight="700">Tanım · tasarım parametreleri</text><text x="${xN}" y="16" font-weight="700">SPT N (ham ○, N60 ●)</text>`;
    // derinlik ekseni
    const step = dmax > 25 ? 5 : dmax > 12 ? 2 : 1;
    for (let z = 0; z <= dmax + 1e-9; z += step) s += `<path d="M${x0 - 5} ${Y(z)}h5" stroke="#555"/><text x="${x0 - 8}" y="${Y(z) + 4}" text-anchor="end" fill="#555">${z}</text>`;
    s += `<text transform="translate(12 ${(top + H - bot) / 2}) rotate(-90)" text-anchor="middle" fill="#555">Derinlik (m)</text>`;
    P.layers.forEach(L => {
      if (L.top >= dmax) return;
      const y1 = Y(L.top), y2 = Y(L.bottom);
      s += `<rect x="${x0}" y="${y1}" width="${cw}" height="${y2 - y1}" fill="${hatchId(L.uscs)}" stroke="${ink}" stroke-width="0.8"/>`;
      const mid = (y1 + y2) / 2, hh = y2 - y1;
      s += `<path d="M${x0 + cw} ${y2}h210" stroke="#bbb" stroke-dasharray="3 3"/>`;
      s += `<text x="${x0 + cw + 8}" y="${mid - (hh > 34 ? 8 : 0)}" font-weight="700">${esc(L.uscs)} <tspan font-weight="400">${esc(L.desc || NAME[L.uscs] || '')}</tspan></text>`;
      if (hh > 22) {
        const prm = L.beh === 'Kohezyonlu' ? `γ ${L.gn} · c<tspan font-size="8" dy="2">u</tspan><tspan dy="-2"> ${L.cu}</tspan> · φ' ${L.phi}° · E ${L.Es} MPa` : `γ ${L.gn} · φ' ${L.phi}° · c' ${L.c} · E ${L.Es} MPa`;
        s += `<text x="${x0 + cw + 8}" y="${mid + (hh > 34 ? 7 : 12)}" font-size="10" fill="#444">${prm}</text>`;
      }
    });
    s += `<rect x="${x0}" y="${top}" width="${cw}" height="${Y(dmax) - top}" fill="none" stroke="${ink}" stroke-width="1.2"/>`;
    // temel tabanı
    s += `<path d="M${x0 - 4} ${Y(Df)}H${x0 + cw + 210}" stroke="#c0392b" stroke-width="1.6"/><text x="${x0 + cw + 206}" y="${Y(Df) - 3}" text-anchor="end" fill="#c0392b" font-size="10">Temel tabanı D<tspan font-size="8" dy="2">f</tspan><tspan dy="-2"> = ${Df} m</tspan></text>`;
    // YASS
    if (P.site.yass < dmax) { const y = Y(P.site.yass); s += `<path d="M${x0} ${y}h${cw}" stroke="#2471a3" stroke-width="1.5" stroke-dasharray="6 3"/><path d="M${x0 + cw - 18} ${y - 9}l6 8l6 -8z" fill="#2471a3"/><text x="${x0 + 4}" y="${y - 3}" fill="#2471a3" font-size="10">YASS ${P.site.yass} m</text>`; }
    // sondaj sonu
    if (P.site.boreDepth < dmax) s += `<path d="M${x0 - 10} ${Y(P.site.boreDepth)}h${cw + 20}" stroke="#555" stroke-dasharray="2 2"/><text x="${x0 + cw / 2}" y="${Y(P.site.boreDepth) + 12}" text-anchor="middle" font-size="9.5" fill="#333">sondaj sonu ${P.site.boreDepth} m</text>`;
    // SPT grafiği
    const nx = n => xN + Math.min(n, 60) / 60 * nw;
    for (let n = 0; n <= 60; n += 10) s += `<path d="M${nx(n)} ${top}V${Y(dmax)}" stroke="#eee"/><text x="${nx(n)}" y="${top - 4}" text-anchor="middle" font-size="9.5" fill="#666">${n}</text>`;
    [15, 50].forEach(n => s += `<path d="M${nx(n)} ${top}V${Y(dmax)}" stroke="#e67e22" stroke-dasharray="3 3"/>`);
    s += `<rect x="${xN}" y="${top}" width="${nw}" height="${Y(dmax) - top}" fill="none" stroke="#999"/>`;
    const rows = (R && R.spt && R.spt.rows) || [];
    rows.forEach(d => {
      s += `<circle cx="${nx(d.Nraw)}" cy="${Y(d.z)}" r="4" fill="#fff" stroke="#1f4e79" stroke-width="1.3"/>`;
      s += `<circle cx="${nx(d.N60)}" cy="${Y(d.z)}" r="3.4" fill="#1f4e79"/>`;
      s += `<text x="${nx(Math.max(d.Nraw, d.N60)) + 7}" y="${Y(d.z) + 4}" font-size="10">${d.Nraw >= 50 ? 'R' : d.Nraw}</text>`;
    });
    if (rows.length > 1) s += `<path d="${rows.map((d, i) => (i ? 'L' : 'M') + nx(d.N60) + ' ' + Y(d.z)).join('')}" fill="none" stroke="#1f4e79" stroke-width="1"/>`;
    s += `<text x="${nx(15) + 3}" y="${Y(dmax) - 4}" font-size="9" fill="#e67e22">15</text><text x="${nx(50) + 3}" y="${Y(dmax) - 4}" font-size="9" fill="#e67e22">50</text>`;
    return s + '</svg>';
  }

  // ---------------- Temel kesiti + kırılma kaması (Prandtl) ----------------
  function bearingSection(P, R, opt = {}) {
    const W = opt.w || 720, H = opt.h || 400, F = P.found, Df = F.Df, bk = R.bearCrit;
    const D2R = Math.PI / 180, phi = Math.max(bk.phi, 0.5), tp = Math.tan(phi * D2R);
    const Bp = bk.Bp, a1 = (45 + phi / 2) * D2R, a2 = (45 - phi / 2) * D2R;
    const r0 = (Bp / 2) / Math.cos(a1), r1 = r0 * Math.exp((Math.PI / 2) * tp), apex = (Bp / 2) * Math.tan(a1);
    const alongB = Math.abs(bk.eB) >= Math.abs(bk.eL);
    const Bfull = alongB ? F.B : F.L, e = alongB ? bk.eB : bk.eL;
    // yarım mekanizma (sağ taraf, sgn=1); merkez = etkin alan ortası
    const half = sgn => {
      const p = [[0, apex]];
      for (let i = 0; i <= 36; i++) { const t = (Math.PI / 2) * i / 36, rr = r0 * Math.exp(t * tp), th = Math.PI - a1 - t; p.push([sgn * (Bp / 2 + rr * Math.cos(th)), rr * Math.sin(th)]); }
      p.push([sgn * (Bp / 2 + 2 * r1 * Math.cos(a2)), 0]);
      return p;
    };
    const hR = half(1), hL = half(-1);
    const deep = Math.max(...hR.map(q => q[1]));
    const xp = hR[hR.length - 1][0];
    const spanX = Math.max(Math.abs(e) + xp, Bfull / 2) * 1.08, spanZ = Df + deep * 1.2 + 0.5;
    const sc = Math.min((W - 60) / (2 * spanX), (H - 160) / (spanZ + 0.3));
    const cx = W / 2, gy = 118;
    const X = x => cx + x * sc, Y = z => gy + z * sc;
    let s = svgOpen(W, H);
    P.layers.forEach(L => {
      if (L.top > spanZ) return;
      const y1 = Y(L.top), y2 = Math.min(Y(L.bottom), H - 30);
      s += `<rect x="20" y="${y1}" width="${W - 40}" height="${Math.max(0, y2 - y1)}" fill="${hatchId(L.uscs)}" opacity="0.5"/>`;
      s += `<path d="M20 ${y1}H${W - 20}" stroke="#999" stroke-width="0.6"/><text x="${W - 26}" y="${y1 + 13}" text-anchor="end" font-size="10" font-weight="700" fill="#333">${esc(L.uscs)}</text>`;
    });
    s += `<path d="M20 ${gy}H${W - 20}" stroke="${ink}" stroke-width="1.5"/>`;
    if (P.site.yass < spanZ) s += `<path d="M20 ${Y(P.site.yass)}H${W - 20}" stroke="#2471a3" stroke-dasharray="6 3" stroke-width="1.3"/><text x="26" y="${Y(P.site.yass) - 3}" fill="#2471a3" font-size="10">YASS</text>`;
    // kazı + temel
    const tf = Math.min(Math.max(F.t || 0.6, 0.3), Df || 0.6);
    const fx1 = X(-Bfull / 2), fx2 = X(Bfull / 2);
    if (Df > 0) s += `<rect x="${fx1}" y="${gy}" width="${fx2 - fx1}" height="${Df * sc}" fill="#fff"/>`;
    s += `<rect x="${fx1}" y="${Y(Df - tf)}" width="${fx2 - fx1}" height="${tf * sc}" fill="url(#h-conc)" stroke="${ink}" stroke-width="1.2"/>`;
    const ox = e; // etkin alan merkezi = yükün etki noktası
    const path = arr => arr.map((q, i) => (i ? 'L' : 'M') + X(q[0] + ox) + ' ' + Y(Df + q[1])).join('');
    s += `<path d="M${X(-Bp / 2 + ox)} ${Y(Df)}L${X(ox)} ${Y(Df + apex)}L${X(Bp / 2 + ox)} ${Y(Df)}Z" fill="#f5b7b1" opacity="0.7" stroke="#b03a2e" stroke-width="1.2"/>`;
    [hR, hL].forEach(h => {
      s += `<path d="${path(h)}" fill="none" stroke="#b03a2e" stroke-width="1.8"/>`;
      const sg = h === hR ? 1 : -1, e2 = h[h.length - 2];
      s += `<path d="M${X(sg * Bp / 2 + ox)} ${Y(Df)}L${X(e2[0] + ox)} ${Y(Df + e2[1])}" stroke="#b03a2e" stroke-width="0.8" stroke-dasharray="4 3"/>`;
    });
    s += `<text x="${X(ox)}" y="${Y(Df + apex * 0.45)}" text-anchor="middle" font-size="10" fill="#7b241c" font-weight="600">I</text>`;
    const mR = hR[18]; s += `<text x="${X((Bp / 2 + mR[0]) / 2 + ox)}" y="${Y(Df + mR[1] * 0.6)}" text-anchor="middle" font-size="10" fill="#7b241c" font-weight="600">II</text>`;
    const eR = hR[hR.length - 2]; s += `<text x="${X((Bp / 2 + eR[0] + xp) / 3 + ox)}" y="${Y(Df + eR[1] / 3) + 4}" text-anchor="middle" font-size="10" fill="#7b241c" font-weight="600">III</text>`;
    // örtü yükü q (kazı dışında)
    const nArr = 6;
    for (let i = 0; i < nArr; i++) {
      const xx = Bfull / 2 + 0.3 + (spanX - Bfull / 2 - 0.3) * (i + 0.5) / nArr;
      [xx, -xx].forEach(x => { if (bk.H > 0 && X(x) > fx1 - 80 && X(x) < fx1) return; s += `<path d="M${X(x)} ${gy - 24}V${gy - 3}" stroke="#1f4e79" marker-end="url(#arr)"/>`; });
    }
    s += `<text x="${W - 22}" y="${gy - 30}" text-anchor="end" paint-order="stroke" stroke="#fff" stroke-width="3" fill="#1f4e79" font-size="10.5">q = σ'(D<tspan font-size="8" dy="2">f</tspan><tspan dy="-2">) = ${f1(bk.q)} kPa (örtü)</tspan></text>`;
    // yükler
    const ytop = Y(Df - tf);
    s += `<path d="M${X(ox)} ${ytop - 48}V${ytop - 2}" stroke="#b03a2e" stroke-width="2.4" marker-end="url(#arrR)"/><text x="${X(ox) + 7}" y="${ytop - 36}" fill="#b03a2e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3">N = ${Math.round(bk.N)} kN</text>`;
    if (bk.H > 0) s += `<path d="M${fx1 - 60} ${ytop + tf * sc / 2}H${fx1 - 3}" stroke="#b03a2e" stroke-width="2.2" marker-end="url(#arrR)"/><text x="${fx1 - 32}" y="${ytop + tf * sc / 2 - 7}" text-anchor="middle" fill="#b03a2e" font-weight="700" paint-order="stroke" stroke="#fff" stroke-width="3">H = ${Math.round(bk.H)} kN</text>`;
    if (Math.abs(e) > 1e-6) s += `<path d="M${X(0)} ${ytop - 8}V${ytop}" stroke="${ink}"/><text x="${X(ox) + 8}" y="${ytop - 18}" font-size="10" paint-order="stroke" stroke="#fff" stroke-width="3">e = ${Math.abs(e).toFixed(2)} m</text>`;
    // ölçüler
    const dimY = Math.min(Y(Df + deep) + 22, H - 34);
    s += `<path d="M${X(-Bp / 2 + ox)} ${Y(Df) + 2}V${dimY + 4}M${X(Bp / 2 + ox)} ${Y(Df) + 2}V${dimY + 4}" stroke="#888" stroke-dasharray="2 2"/>`;
    s += `<path d="M${X(-Bp / 2 + ox)} ${dimY}H${X(Bp / 2 + ox)}" stroke="#1f4e79" marker-start="url(#arr)" marker-end="url(#arr)"/><text x="${X(ox)}" y="${dimY - 4}" text-anchor="middle" fill="#1f4e79" font-weight="700">B' = ${Bp.toFixed(2)} m</text>`;
    if (Df > 0) s += `<path d="M${fx2 + 16} ${gy}V${Y(Df)}" stroke="#1f4e79" marker-start="url(#arr)" marker-end="url(#arr)"/><text x="${fx2 + 22}" y="${(gy + Y(Df)) / 2 + 4}" fill="#1f4e79">D<tspan font-size="8" dy="2">f</tspan><tspan dy="-2"> = ${Df} m</tspan></text>`;
    s += `<text x="20" y="20" font-weight="700">${esc(bk.name)} — kırılma mekanizması (Prandtl), φ = ${f1(bk.phi)}°</text>`;
    s += `<text x="20" y="36" font-size="10" fill="#555">I aktif kama (45 + φ/2 = ${f1(45 + phi / 2)}°) · II radyal kesme bölgesi (log-spiral) · III pasif kama (45 − φ/2 = ${f1(45 - phi / 2)}°)</text>`;
    s += `<text x="20" y="${H - 10}" font-size="10" fill="#555">Kırılma yüzeyi tabandan ≈ ${f1(deep)} m derine, yanlara ≈ ${f1(xp)} m uzanır. Bu bölgedeki en zayıf tabaka tasarımı yönetir.${bk.phi < 1 ? ' (φ = 0: drenajsız durumda şematik.)' : ''}</text>`;
    return s + '</svg>';
  }

  // ---------------- Plan: etkin alan + taban basıncı ----------------
  function planEffective(P, b, opt = {}) {
    const W = opt.w || 360, H = opt.h || 300, F = P.found;
    const sc = Math.min((W - 70) / F.L, (H - 80) / F.B);
    const x0 = (W - F.L * sc) / 2, y0 = 40;
    const X = x => x0 + (x + F.L / 2) * sc, Y = y => y0 + (F.B / 2 - y) * sc;
    let s = svgOpen(W, H);
    s += `<text x="10" y="18" font-weight="700">${esc(b.name)} · etkin alan</text>`;
    s += `<rect x="${X(-F.L / 2)}" y="${Y(F.B / 2)}" width="${F.L * sc}" height="${F.B * sc}" fill="#f4f6f7" stroke="${ink}" stroke-width="1.2"/>`;
    const lp = F.L - 2 * Math.abs(b.eL), bp = F.B - 2 * Math.abs(b.eB);
    const cxL = b.eL, cyB = b.eB;
    s += `<rect x="${X(cxL - lp / 2)}" y="${Y(cyB + bp / 2)}" width="${lp * sc}" height="${bp * sc}" fill="url(#h-eff)" stroke="#d35400" stroke-width="1.2"/>`;
    s += `<path d="M${X(0) - 5} ${Y(0)}h10M${X(0)} ${Y(0) - 5}v10" stroke="${ink}"/>`;
    s += `<circle cx="${X(cxL)}" cy="${Y(cyB)}" r="4" fill="#b03a2e"/>`;
    s += `<text x="${X(-F.L / 2)}" y="${Y(-F.B / 2) + 16}" font-size="10">L = ${F.L} m · L' = ${f1(lp * 100) / 100} m</text>`;
    s += `<text transform="translate(${X(-F.L / 2) - 8} ${Y(0)}) rotate(-90)" text-anchor="middle" font-size="10">B = ${F.B} m · B' = ${f1(bp * 100) / 100} m</text>`;
    s += `<text x="${X(-F.L / 2)}" y="${Y(-F.B / 2) + 31}" font-size="10" fill="#b03a2e">e<tspan font-size="8" dy="2">B</tspan><tspan dy="-2"> = ${b.eB.toFixed(3)} m, e</tspan><tspan font-size="8" dy="2">L</tspan><tspan dy="-2"> = ${b.eL.toFixed(3)} m · A' = ${b.Ap.toFixed(1)} m²</tspan></text>`;
    return s + '</svg>';
  }

  // ---------------- Genel grafik ----------------
  function nice(min, max, n = 6) {
    const span = max - min || 1, raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const st = [1, 2, 2.5, 5, 10].map(k => k * mag).find(k => span / k <= n) || 10 * mag;
    return { lo: Math.floor(min / st) * st, hi: Math.ceil(max / st) * st, st };
  }
  function chart(o) {
    const W = o.w || 520, H = o.h || 320, m = { l: 56, r: 16, t: o.title ? 30 : 14, b: 42 };
    const all = o.series.flatMap(s => s.pts);
    const xs = all.map(p => p[0]).concat(o.xExtra || []), ys = all.map(p => p[1]).concat(o.yExtra || []);
    const nx = nice(o.xmin != null ? o.xmin : Math.min(...xs), o.xmax != null ? o.xmax : Math.max(...xs));
    const ny = nice(o.ymin != null ? o.ymin : Math.min(...ys), o.ymax != null ? o.ymax : Math.max(...ys));
    if (o.xmin != null) nx.lo = o.xmin; if (o.xmax != null) nx.hi = o.xmax;
    if (o.ymin != null) ny.lo = o.ymin; if (o.ymax != null) ny.hi = o.ymax;
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const X = x => m.l + (x - nx.lo) / (nx.hi - nx.lo) * pw;
    const Y = y => o.invertY ? m.t + (y - ny.lo) / (ny.hi - ny.lo) * ph : m.t + ph - (y - ny.lo) / (ny.hi - ny.lo) * ph;
    let s = svgOpen(W, H);
    if (o.title) s += `<text x="${m.l}" y="18" font-weight="700">${o.title}</text>`;
    for (let v = nx.lo; v <= nx.hi + 1e-9; v += nx.st) s += `<path d="M${X(v)} ${m.t}V${m.t + ph}" stroke="#eceff1"/><text x="${X(v)}" y="${o.invertY ? m.t - 3 : m.t + ph + 14}" text-anchor="middle" font-size="10" fill="#555">${+v.toFixed(3)}</text>`;
    for (let v = ny.lo; v <= ny.hi + 1e-9; v += ny.st) s += `<path d="M${m.l} ${Y(v)}H${m.l + pw}" stroke="#eceff1"/><text x="${m.l - 5}" y="${Y(v) + 4}" text-anchor="end" font-size="10" fill="#555">${+v.toFixed(3)}</text>`;
    (o.bands || []).forEach(b => s += `<rect x="${m.l}" y="${Math.min(Y(b.y1), Y(b.y2))}" width="${pw}" height="${Math.abs(Y(b.y2) - Y(b.y1))}" fill="${b.fill}" opacity="0.35"/>${b.label ? `<text x="${m.l + pw - 4}" y="${Math.min(Y(b.y1), Y(b.y2)) + 12}" text-anchor="end" font-size="9.5" fill="#555">${b.label}</text>` : ''}`);
    (o.vlines || []).forEach(v => s += `<path d="M${X(v.x)} ${m.t}V${m.t + ph}" stroke="${v.color || '#999'}" stroke-dasharray="4 3"/>${v.label ? `<text x="${X(v.x) + 3}" y="${m.t + 12}" font-size="10" fill="${v.color || '#555'}">${v.label}</text>` : ''}`);
    (o.hlines || []).forEach(v => s += `<path d="M${m.l} ${Y(v.y)}H${m.l + pw}" stroke="${v.color || '#999'}" stroke-dasharray="4 3"/>${v.label ? `<text x="${m.l + pw - 3}" y="${Y(v.y) - 3}" text-anchor="end" font-size="10" fill="${v.color || '#555'}">${v.label}</text>` : ''}`);
    s += `<rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="none" stroke="#90a4ae"/>`;
    o.series.forEach(se => {
      if (!se.pts.length) return;
      let d = '';
      se.pts.forEach((p, i) => {
        if (se.step && i) d += `V${Y(p[1])}H${X(p[0])}`; else d += (i ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1]);
      });
      if (se.stepV) { d = ''; se.pts.forEach((p, i) => { d += (i ? `L${X(p[0])} ${Y(p[1])}` : `M${X(p[0])} ${Y(p[1])}`); }); }
      if (!se.noLine) s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="${se.width || 2}" ${se.dash ? `stroke-dasharray="${se.dash}"` : ''}/>`;
      if (se.marker) se.pts.forEach(p => s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.4" fill="${se.hollow ? '#fff' : se.color}" stroke="${se.color}" stroke-width="1.3"/>`);
      (se.labels || []).forEach((t, i) => t && (s += `<text x="${X(se.pts[i][0]) + 6}" y="${Y(se.pts[i][1]) - 5}" font-size="10" fill="${se.color}">${t}</text>`));
    });
    (o.points || []).forEach(p => s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4.5" fill="${p.color}"/><text x="${X(p.x) + 7}" y="${Y(p.y) - 6}" font-size="10" fill="${p.color}" font-weight="600">${p.label || ''}</text>`);
    s += `<text x="${m.l + pw / 2}" y="${H - 8}" text-anchor="middle" fill="#333">${o.xlabel || ''}</text>`;
    s += `<text transform="translate(14 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle" fill="#333">${o.ylabel || ''}</text>`;
    // lejant
    const lg = o.series.filter(x => x.name);
    lg.forEach((x, i) => { const lx = m.l + 10 + (o.legendX || 0), ly = m.t + 14 + i * 15 + (o.legendY || 0); s += `<rect x="${lx - 4}" y="${ly - 10}" width="${Math.max(120, x.name.length * 6.3 + 30)}" height="15" fill="#fff" opacity="0.85"/><path d="M${lx} ${ly - 3}h18" stroke="${x.color}" stroke-width="2.2" ${x.dash ? `stroke-dasharray="${x.dash}"` : ''}/><text x="${lx + 24}" y="${ly + 1}" font-size="10">${x.name}</text>`; });
    return s + '</svg>';
  }

  function spectrumChart(R, opt = {}) {
    const se = [{ pts: R.sp.curve, color: '#1f4e79', name: `S<tspan font-size="8" dy="2">ae</tspan><tspan dy="-2">(T), ${R.zs}</tspan>`.replace(/<[^>]+>/g, '') }];
    se[0].name = `Sae(T) — ${R.zs} (seçilen)`;
    if (R.spAlt) se.push({ pts: R.spAlt.curve, color: '#e67e22', dash: '6 4', name: `Sae(T) — ${R.spAlt.zs} (karşılaştırma)` });
    return chart({ w: opt.w || 560, h: opt.h || 320, series: se, xmin: 0, xmax: 3, ymin: 0, xlabel: 'Periyot T (s)', ylabel: 'Spektral ivme Sae (g)', title: 'Yatay elastik tasarım spektrumu (DD-2)',
      vlines: [{ x: R.sp.TA, label: 'T<tspan font-size="8">A</tspan>'.replace(/<[^>]+>/g, '') && 'TA', color: '#7f8c8d' }, { x: R.sp.TB, label: 'TB', color: '#7f8c8d' }],
      points: [{ x: 0.2, y: R.sp.SDS, color: '#1f4e79', label: `SDS = ${R.sp.SDS.toFixed(3)}` }, { x: 1, y: R.sp.SD1, color: '#1f4e79', label: `SD1 = ${R.sp.SD1.toFixed(3)}` }], legendX: 230 });
  }

  function vsChart(P, R, opt = {}) {
    const V = P.vs.filter(v => v.vs > 0).sort((a, b) => a.top - b.top); if (!V.length) return '';
    const pts = []; V.forEach(v => { pts.push([v.vs, v.top]); pts.push([v.vs, v.bottom]); });
    const zmax = Math.max(...V.map(v => v.bottom), P.found.Df + 30);
    return chart({ w: opt.w || 380, h: opt.h || 420, invertY: true, series: [{ pts, color: '#1f4e79', name: 'Vs (MASW)', width: 2.2 }], xmin: 0, ymin: 0, ymax: Math.ceil(zmax / 5) * 5, xlabel: 'Vs (m/s)', ylabel: 'Derinlik (m)', title: 'Kayma dalgası hızı profili',
      vlines: [{ x: 180, color: '#c0392b', label: '180' }, { x: 360, color: '#e67e22', label: '360' }, { x: 760, color: '#27ae60', label: '760' }].filter(v => v.x < Math.max(...V.map(q => q.vs)) * 1.3),
      hlines: [{ y: P.found.Df, color: '#c0392b', label: 'Df' }, { y: P.found.Df + 30, color: '#555', label: 'Df + 30 m' }], legendY: 260 });
  }

  function sptChart(R, opt = {}) {
    const rows = R.spt.rows; if (!rows.length) return '';
    return chart({ w: opt.w || 400, h: opt.h || 380, invertY: true, xmin: 0, ymin: 0, xlabel: 'Darbe sayısı', ylabel: 'Derinlik (m)', title: 'SPT düzeltmeleri',
      series: [
        { pts: rows.map(d => [d.Nraw, d.z]), color: '#7f8c8d', marker: true, hollow: true, name: 'N (arazi)', dash: '2 3' },
        { pts: rows.map(d => [d.N60, d.z]), color: '#1f4e79', marker: true, name: 'N60' },
        { pts: rows.map(d => [d.N160, d.z]), color: '#e67e22', marker: true, name: 'N1,60' },
        { pts: rows.map(d => [d.N160f, d.z]), color: '#27ae60', marker: true, name: 'N1,60f', dash: '5 3' }],
      vlines: [{ x: 15, color: '#c0392b' }, { x: 50, color: '#c0392b' }], legendX: 150, legendY: 200 });
  }

  function settChart(R, P, opt = {}) {
    const pr = R.sett.prof;
    return chart({ w: opt.w || 420, h: opt.h || 400, invertY: true, xmin: 0, ymin: 0, ymax: R.sett.zmax, xlabel: 'Gerilme (kPa)', ylabel: 'Temel tabanından derinlik (m)', title: 'Gerilme artışı ve etki derinliği',
      series: [{ pts: [[R.sett.qnet, 0], ...pr.map(p => [p.ds, p.zb])], color: '#b03a2e', name: 'Δσ (Boussinesq, merkez)' }, { pts: pr.map(p => [p.s10, p.zb]), color: '#1f4e79', dash: '6 4', name: "0.1·σ'v" }],
      hlines: R.sett.z10 != null ? [{ y: R.sett.z10, color: '#555', label: `Δσ = 0.1σ'v → z ≈ ${R.sett.z10.toFixed(1)} m` }] : [], legendX: 120, legendY: 250 });
  }

  function cumSettChart(R, opt = {}) {
    const pr = R.sett.prof;
    return chart({ w: opt.w || 360, h: opt.h || 400, invertY: true, xmin: 0, ymin: 0, ymax: R.sett.zmax, xlabel: 'Birikimli oturma (mm)', ylabel: 'Derinlik (m)', title: 'Oturmanın derinlikle birikimi',
      series: [{ pts: [[0, 0], ...pr.map(p => [p.cum, p.zb])], color: '#6c3483', name: 'S (yukarıdan aşağı)' }], legendX: 60, legendY: 280 });
  }

  function izChart(R, opt = {}) {
    const s = R.sch; const pts = []; for (let i = 0; i <= 60; i++) { const z = s.z2 * i / 60; pts.push([s.Iz(z), z]); }
    return chart({ w: opt.w || 300, h: opt.h || 360, invertY: true, xmin: 0, xmax: Math.ceil(s.Izm * 10 + 1) / 10, ymin: 0, xlabel: 'Iz', ylabel: 'Temel tabanından z (m)', title: 'Schmertmann Iz diyagramı',
      series: [{ pts, color: '#117a65', name: 'Iz(z)' }], hlines: [{ y: s.z1, color: '#555', label: `z1 = ${s.z1.toFixed(2)}` }, { y: s.z2, color: '#555', label: `z2 = ${s.z2.toFixed(2)}` }], legendX: 60, legendY: 240 });
  }

  function ksBars(R, opt = {}) {
    const W = opt.w || 520, H = opt.h || 220, items = [['qnet / S', R.ks.ks1, '#117a65'], ['Bowles 40·qk', R.ks.ks2, '#b03a2e'], ['Vesic Es/B(1−ν²)', R.ks.ks3, '#1f4e79']].filter(i => i[1]);
    const mx = Math.max(...items.map(i => i[1])) / 9.81, bw = W - 200;
    let s = svgOpen(W, H) + `<text x="10" y="18" font-weight="700">Yatak katsayısı karşılaştırması (t/m³)</text>`;
    items.forEach((it, i) => { const y = 40 + i * 50, v = it[1] / 9.81; s += `<text x="10" y="${y + 18}">${it[0]}</text><rect x="150" y="${y}" width="${Math.max(2, v / mx * bw)}" height="28" fill="${it[2]}" opacity="0.85"/><text x="${156 + v / mx * bw}" y="${y + 18}" font-weight="600">${Math.round(v)}</text>`; });
    s += `<text x="10" y="${H - 10}" font-size="10" fill="#555">Oran üst/alt = ${R.ks.ratio.toFixed(1)}. Radyeyi iki sınır değerle çözüp zarf alın.</text>`;
    return s + '</svg>';
  }

  function pressureDiagram(P, b, opt = {}) {
    const W = opt.w || 360, H = opt.h || 200;
    const along = Math.abs(b.eB) >= Math.abs(b.eL) ? 'B' : 'L', Ldim = along === 'B' ? P.found.B : P.found.L, e = along === 'B' ? b.eB : b.eL;
    const sc = (W - 60) / Ldim, x0 = 30, y0 = 60, ps = 90 / Math.max(b.qmax || b.qo, 1);
    let s = svgOpen(W, H) + `<text x="10" y="18" font-weight="700">${esc(b.name)} · taban basıncı (${along} yönü)</text>`;
    s += `<rect x="${x0}" y="${y0 - 14}" width="${Ldim * sc}" height="14" fill="url(#h-conc)" stroke="${ink}"/>`;
    let poly;
    if (b.core <= 1) poly = `M${x0} ${y0}L${x0} ${y0 + b.qmin * ps}L${x0 + Ldim * sc} ${y0 + b.qmax * ps}L${x0 + Ldim * sc} ${y0}Z`;
    else { const c = Math.min(1, b.contact) * Ldim; poly = `M${x0 + (Ldim - c) * sc} ${y0}L${x0 + Ldim * sc} ${y0 + b.qmax * ps}L${x0 + Ldim * sc} ${y0}Z`; }
    if (e < 0) s += `<g transform="translate(${2 * x0 + Ldim * sc} 0) scale(-1 1)">`; else s += '<g>';
    s += `<path d="${poly}" fill="#fadbd8" stroke="#b03a2e"/></g>`;
    s += `<text x="${x0}" y="${y0 + 120}" font-size="10">q<tspan font-size="8" dy="2">max</tspan><tspan dy="-2"> = ${Math.round(b.qmax)} kPa · q</tspan><tspan font-size="8" dy="2">min</tspan><tspan dy="-2"> = ${Math.round(b.qmin)} kPa · e = ${Math.abs(e).toFixed(3)} m ${Math.abs(e) <= Ldim / 6 ? '≤' : '>'} ${along}/6 = ${(Ldim / 6).toFixed(2)} m</tspan></text>`;
    return s + '</svg>';
  }


  // ---------------- Temel geometrisi şeması (plan + kesit) ----------------
  function foundationSchematic(P, opt = {}) {
    const W = opt.w || 700, H = opt.h || 280, F = P.found;
    let s = svgOpen(W, H);
    // plan
    const pw = 260, sc = Math.min(pw / F.L, 170 / F.B), x0 = 40, y0 = 55, Lw = F.L * sc, Bw = F.B * sc;
    s += `<text x="${x0 + Lw / 2}" y="22" text-anchor="middle" font-weight="700">TEMEL PLANI</text>`;
    s += `<rect x="${x0}" y="${y0}" width="${Lw}" height="${Bw}" fill="url(#h-conc)" stroke="${ink}" stroke-width="1.4"/>`;
    s += `<path d="M${x0} ${y0 + Bw + 18}H${x0 + Lw}" stroke="#1f4e79" marker-start="url(#arr)" marker-end="url(#arr)"/><text x="${x0 + Lw / 2}" y="${y0 + Bw + 34}" text-anchor="middle" fill="#1f4e79">L<tspan font-size="8" dy="2">y</tspan><tspan dy="-2"> = ${F.L} m</tspan></text>`;
    s += `<path d="M${x0 - 16} ${y0}V${y0 + Bw}" stroke="#1f4e79" marker-start="url(#arr)" marker-end="url(#arr)"/><text transform="translate(${x0 - 22} ${y0 + Bw / 2}) rotate(-90)" text-anchor="middle" fill="#1f4e79">L<tspan font-size="8" dy="2">x</tspan><tspan dy="-2"> = ${F.B} m</tspan></text>`;
    s += `<path d="M${x0 + Lw / 2 - 30} ${y0 + Bw / 2}h60M${x0 + Lw / 2} ${y0 + Bw / 2 - 30}v60" stroke="#888" stroke-dasharray="6 3"/><text x="${x0 + Lw / 2 + 34}" y="${y0 + Bw / 2 + 4}" font-size="10">y</text><text x="${x0 + Lw / 2 + 4}" y="${y0 + Bw / 2 - 34}" font-size="10">x</text>`;
    // kesit
    const sx = 380, sw = 280, gy = 70, ssc = sw / (F.B * 1.5), fw = F.B * ssc, Df = F.Df * ssc, t = (F.t || 0.6) * ssc, fx = sx + (sw - fw) / 2;
    s += `<text x="${sx + sw / 2}" y="22" text-anchor="middle" font-weight="700">TEMEL KESİTİ</text>`;
    s += `<rect x="${sx}" y="${gy}" width="${sw}" height="${H - gy - 20}" fill="${hatchId(P.layers[0].uscs)}" opacity="0.45"/>`;
    s += `<rect x="${fx}" y="${gy}" width="${fw}" height="${Df}" fill="#fff"/>`;
    s += `<path d="M${sx} ${gy}H${fx}M${fx + fw} ${gy}H${sx + sw}" stroke="${ink}" stroke-width="1.4"/>`;
    s += `<rect x="${fx}" y="${gy + Df - t}" width="${fw}" height="${t}" fill="url(#h-conc)" stroke="${ink}" stroke-width="1.3"/>`;
    s += `<path d="M${fx + fw + 14} ${gy}V${gy + Df}" stroke="#1f4e79" marker-start="url(#arr)" marker-end="url(#arr)"/><text x="${fx + fw + 20}" y="${gy + Df / 2 + 4}" fill="#1f4e79">D<tspan font-size="8" dy="2">f</tspan><tspan dy="-2"> = ${F.Df} m</tspan></text>`;
    s += `<path d="M${fx - 12} ${gy + Df - t}V${gy + Df}" stroke="#1f4e79" marker-start="url(#arr)" marker-end="url(#arr)"/><text x="${fx - 16}" y="${gy + Df - t / 2 + 4}" text-anchor="end" fill="#1f4e79">h = ${F.t || 0.6} m</text>`;
    s += `<path d="M${fx} ${gy + Df + 22}H${fx + fw}" stroke="#1f4e79" marker-start="url(#arr)" marker-end="url(#arr)"/><text x="${fx + fw / 2}" y="${gy + Df + 38}" text-anchor="middle" fill="#1f4e79">L<tspan font-size="8" dy="2">x</tspan><tspan dy="-2"> = ${F.B} m</tspan></text>`;
    if (P.site.yass < F.Df + 6) { const y = gy + P.site.yass * ssc; if (y < H - 24) s += `<path d="M${sx} ${y}H${sx + sw}" stroke="#2471a3" stroke-dasharray="6 3"/><text x="${sx + 4}" y="${y - 3}" fill="#2471a3" font-size="10">YASS</text>`; }
    return s + '</svg>';
  }

  // ---------------- Yük şeması ----------------
  function loadSchematic(P, opt = {}) {
    const W = opt.w || 520, H = opt.h || 260;
    let s = svgOpen(W, H);
    const fx = 150, fw = 220, fy = 140, ft = 34;
    s += `<rect x="40" y="${fy + ft}" width="${W - 80}" height="${H - fy - ft - 10}" fill="${hatchId(P.layers[0].uscs)}" opacity="0.4"/>`;
    s += `<rect x="${fx}" y="${fy}" width="${fw}" height="${ft}" fill="url(#h-conc)" stroke="${ink}" stroke-width="1.4"/>`;
    s += `<text x="${fx + fw / 2}" y="${fy + 22}" text-anchor="middle" font-weight="700">W<tspan font-size="8" dy="2">t</tspan></text>`;
    s += `<path d="M${fx + fw / 2} ${fy - 80}V${fy - 2}" stroke="#b03a2e" stroke-width="2.4" marker-end="url(#arrR)"/><text x="${fx + fw / 2 + 8}" y="${fy - 62}" fill="#b03a2e" font-weight="700">N (P<tspan font-size="8" dy="2">tv</tspan><tspan dy="-2">)</tspan></text>`;
    s += `<path d="M${fx - 70} ${fy + ft / 2}H${fx - 2}" stroke="#b03a2e" stroke-width="2.2" marker-end="url(#arrR)"/><text x="${fx - 70}" y="${fy + ft / 2 - 8}" fill="#b03a2e" font-weight="700">V<tspan font-size="8" dy="2">t</tspan><tspan dy="-2"> (H)</tspan></text>`;
    s += `<path d="M${fx + fw / 2 - 40} ${fy - 30} A 44 30 0 0 1 ${fx + fw / 2 + 40} ${fy - 30}" fill="none" stroke="#1f4e79" stroke-width="2" marker-end="url(#arr)"/><text x="${fx + fw / 2 + 48}" y="${fy - 30}" fill="#1f4e79" font-weight="700">M</text>`;
    for (let i = 0; i <= 10; i++) { const x = fx + fw * i / 10; s += `<path d="M${x} ${fy + ft + 34}V${fy + ft + 4}" stroke="#117a65" marker-end="url(#arr)"/>`; }
    s += `<text x="${fx + fw + 10}" y="${fy + ft + 26}" fill="#117a65" font-weight="700">q<tspan font-size="8" dy="2">o</tspan><tspan dy="-2"> (taban basıncı)</tspan></text>`;
    return s + '</svg>';
  }

  root.GDRAW = { DEFS, USCS, NAME, legend, soilColumn, bearingSection, planEffective, chart, spectrumChart, vsChart, sptChart, settChart, cumSettChart, izChart, ksBars, pressureDiagram, hatchId, foundationSchematic, loadSchematic };
})(typeof window !== 'undefined' ? window : globalThis);
