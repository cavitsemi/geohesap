/* Arayüz: sayfalar, girdiler, çıktı kartları, kaydet/aç, Word raporu */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const r = GEO.r;
  const clone = o => JSON.parse(JSON.stringify(o));
  const LS = 'geohesap.v1';
  let P, R;

  const BLANK = () => {
    const p = clone(GEO_EXAMPLE);
    p.proj = { name: 'Yeni proje', owner: '', location: '', ada: '', parsel: '', engineer: '', date: '', HN: 10, bks: 3, usage: 'Konut' };
    p.layers = [GSOIL.apply({ top: 0, bottom: 3, zt: 'kil_cl', durum: '' }), GSOIL.apply({ top: 3, bottom: 30, zt: 'siltli_kum', durum: '' })];
    p.spt.data = [{ z: 1.5, N: 12 }]; p.vs = [{ top: 0, bottom: 30, vs: 300 }];
    p.seis = { Ss: 0.5, S1: 0.15, PGA: 0.2, PGV: 10, zsOverride: '' };
    p.found = { type: 'Radye', B: 10, L: 15, Df: 1.0, t: 0.6 };
    p.loads = { Nserv: 6000, combos: [{ name: '1.4G+1.6Q', N: 8000, MB: 0, ML: 0, HB: 0, HL: 0 }, { name: 'G+Q+E', N: 6000, MB: 0, ML: 0, HB: 0, HL: 0 }, { name: '0.9G+E', N: 4500, MB: 0, ML: 0, HB: 0, HL: 0 }] };
    p.bear = { type: '', phi: '', c: '', cu: '' };
    p.site = { yass: 99, gw: 9.81, nBore: 3, boreDepth: 15, rock3m: false };
    return p;
  };

  // eski kayıtlarda olmayan alanları örnekten tamamla
  function normalize(p) {
    const fillIn = (dst, src) => { for (const k in src) { if (dst[k] === undefined) dst[k] = clone(src[k]); else if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dst[k] && typeof dst[k] === 'object') fillIn(dst[k], src[k]); } };
    const tpl = clone(GEO_EXAMPLE);
    ['proj', 'team', 'etut'].forEach(k => { if (tpl[k] && typeof tpl[k] === 'object') Object.keys(tpl[k]).forEach(j => { if (typeof tpl[k][j] === 'string' || typeof tpl[k][j] === 'number') tpl[k][j] = (k === 'proj' && ['HN', 'bks', 'nFloors'].includes(j)) ? tpl[k][j] : (typeof tpl[k][j] === 'number' ? 0 : ''); }); });
    tpl.coords = []; tpl.seis.dd = [];
    fillIn(p, tpl);
    (p.layers || []).forEach(Lr => { if (!Lr.zt || !GSOIL.BY[Lr.zt]) Lr.zt = GSOIL.keyOf(Lr); if (Lr.durum == null) Lr.durum = ''; if (!Array.isArray(Lr.tip)) Lr.tip = []; });
    (p.loads.combos || []).forEach(c => { if (c.seismic == null || c.seismic === '') c.seismic = /(^|[^A-Za-z])E([^A-Za-z]|$)|deprem|sismik/i.test(c.name || '') ? 'Evet' : 'Hayır'; });
    return p;
  }
  // ---------- yol ile erişim ----------
  const get = (o, path) => path.split('.').reduce((a, k) => a == null ? a : a[k], o);
  const set = (o, path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
  const num = v => { if (v === '' || v == null) return ''; const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : ''; };

  // ---------- sayfalar ----------
  const PAGES = [
    { id: 'proje', n: 1, t: 'Proje', mods: ['etut'] },
    { id: 'profil', n: 2, t: 'Zemin profili', mods: [] },
    { id: 'spt', n: 3, t: 'SPT düzeltmeleri', mods: [] },
    { id: 'zemin', n: 4, t: 'Zemin sınıfı (Vs, N)', mods: ['zemin'] },
    { id: 'deprem', n: 5, t: 'Deprem parametreleri', mods: ['deprem'] },
    { id: 'temel', n: 6, t: 'Temel ve yükler', mods: [] },
    { id: 'tasima', n: 7, t: 'Taşıma gücü', mods: ['tasima'] },
    { id: 'kayma', n: 8, t: 'Kayma', mods: ['kayma'] },
    { id: 'oturma', n: 9, t: 'Oturma', mods: ['oturma'] },
    { id: 'yatak', n: 10, t: 'Yatak katsayısı', mods: ['yatak'] },
    { id: 'sisme', n: 11, t: 'Şişme ve etüt yeterliliği', mods: ['sisme', 'etut'] },
    { id: 'ozet', n: 12, t: 'Özet ve Word raporu', mods: [] },
    { id: 'test', n: 13, t: 'Doğrulama', mods: [] }
  ];
  let page = 'proje';

  // ---------- girdi bileşenleri ----------
  function field(path, label, unit = '', o = {}) {
    const v = get(P, path), cls = o.over ? 'in over' : 'in';
    let inp;
    if (o.opts) inp = `<select class="${cls}" data-p="${path}" ${o.numSel ? 'data-num="1"' : ''}>${o.opts.map(x => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${val}" ${String(val) === String(v) ? 'selected' : ''}>${lab}</option>`; }).join('')}</select>`;
    else if (o.check) inp = `<input type="checkbox" class="${cls}" data-p="${path}" data-bool="1" ${v ? 'checked' : ''}>`;
    else inp = `<input class="${cls}" data-p="${path}" ${o.text ? '' : 'data-num="1" inputmode="decimal"'} value="${v == null ? '' : String(v).replace(/"/g, '&quot;')}" ${o.ph ? `placeholder="${o.ph}"` : ''}>`;
    return `<label class="fld${o.wide ? ' wide' : ''}"><span class="lb">${label}${o.tip ? ` <i class="tip" title="${o.tip}">?</i>` : ''}</span>${inp}<span class="un">${unit}</span></label>`;
  }
  function grid(title, html, note) { if (Array.isArray(html)) html = html.join(''); return `<div class="card"><h3>${title}</h3><div class="grid">${html}</div>${note ? `<p class="hint">${note}</p>` : ''}</div>`; }
  function tableEditor(key, cols, rows, o = {}) {
    let h = `<div class="tblwrap"><table class="ed" data-t="${key}"><thead><tr>${cols.map(c => `<th title="${c.tip || ''}">${c.l}${c.u ? `<br><small>${c.u}</small>` : ''}</th>`).join('')}<th></th></tr></thead><tbody>`;
    rows.forEach((row, i) => {
      h += '<tr>' + cols.map(c => {
        const v = row[c.k];
        if (c.sel) return `<td><select class="in" style="${c.w ? 'width:' + c.w + 'px' : ''}" data-p="${key}.${i}.${c.k}">${c.sel(row)}</select></td>`;
        if (c.opts) return `<td><select class="in" data-p="${key}.${i}.${c.k}">${c.opts.map(x => `<option ${x === v ? 'selected' : ''}>${x}</option>`).join('')}</select></td>`;
        return `<td><input class="in" style="width:${c.w || 56}px" data-p="${key}.${i}.${c.k}" ${c.text ? '' : 'data-num="1" inputmode="decimal"'} value="${v == null ? '' : v}"${Array.isArray(row.tip) && row.tip.includes(c.k) ? ' data-typ="1" title="Tipik değer (kütüphaneden) — deney sonucuyla değiştirin"' : ''}></td>`;
      }).join('') + `<td><button class="x" data-del="${key}" data-i="${i}" title="Satırı sil">×</button></td></tr>`;
    });
    h += `</tbody></table></div><button class="add" data-add="${key}">+ satır ekle</button>`;
    return h;
  }

  // ---------- çıktı bileşenleri ----------
  const stepCard = (s, i) => `<div class="step"><div class="sh"><span class="no">${i + 1}</span>${s.t}</div><div class="f">${s.f}</div><div class="s">${s.s}</div><div class="src">${s.src || ''}</div>${s.why ? `<details><summary>Neden?</summary><p>${s.why}</p></details>` : ''}</div>`;
  const steps = mod => (R.steps[mod] || []).map(stepCard).join('');
  const fig = (svg, cap) => svg ? `<figure>${svg}<figcaption>${cap || ''}</figcaption></figure>` : '';
  const okb = ok => ok === true ? '<b class="ok">✔ uygun</b>' : ok === false ? '<b class="no">✘ yetersiz</b>' : '<b class="na">! bilgi</b>';
  function htable(head, rows, cls = '') { return `<div class="tblwrap"><table class="out ${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(rw => `<tr>${rw.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }

  // SPT açıklama adımları (ilk uygun satırla)
  function sptSteps() {
    const d = R.spt.rows[0]; if (!d) return '';
    const eq = P.spt.equip;
    const S = [
      { t: 'Efektif düşey gerilme', f: "σ'<sub>v</sub> = Σ γ<sub>i</sub>·h<sub>i</sub> − u", s: `z = ${d.z} m: σ<sub>v</sub> = ${r(d.sv, 1)} kPa, u = ${r(d.u, 1)} kPa → σ'<sub>v</sub> = ${r(d.se, 1)} kPa`, src: 'Efektif gerilme ilkesi (Terzaghi)', why: 'YASS altında su basıncı tanelerin taşıdığı gerilmeyi azaltır.' },
      { t: 'Enerji ve ekipman düzeltmesi', f: 'N<sub>60</sub> = N·C<sub>E</sub>·C<sub>B</sub>·C<sub>S</sub>·C<sub>R</sub>', s: `= ${d.N}·${eq.CE}·${eq.CB}·${eq.CS}·${r(d.CR, 2)} = ${r(d.N60, 1)}  (tij boyu ${r(d.z + eq.rodExtra, 1)} m → C<sub>R</sub> = ${d.CR})`, src: 'TBDY Denk. 16B.1, Tablo 16B.1; Skempton (1986)', why: 'Türkiye\'de halat-makara şahmerdanı ile enerji oranı ≈ %45–50 (C<sub>E</sub> ≈ 0.75–0.83). Kısa tijde enerji kaybı fazladır.' },
      { t: 'Örtü gerilmesi düzeltmesi', f: "C<sub>N</sub> = 9.78·√(1/σ'<sub>v</sub>) ≤ 1.7 · N<sub>1,60</sub> = C<sub>N</sub>·N<sub>60</sub>", s: `C<sub>N</sub> = ${r(d.CN, 3)} → N<sub>1,60</sub> = ${r(d.N160, 1)}`, src: 'TBDY Denk. 16B.2 (Liao & Whitman 1986)', why: 'Aynı kum derinde daha çok darbe verir; 100 kPa\'ya normalize edilir. Sıvılaşma için kullanılır, zemin sınıfı için kullanılmaz.' },
      { t: 'İnce dane düzeltmesi', f: 'N<sub>1,60f</sub> = α + β·N<sub>1,60</sub>', s: `İDO = %${r(d.fines, 1)} → α = ${r(d.alpha, 3)}, β = ${r(d.beta, 3)} → N<sub>1,60f</sub> = ${r(d.N160f, 1)}`, src: 'TBDY Denk. 16B.3a, 16B.3b', why: 'Siltli kum aynı direnç için daha az darbe verir.' }
    ];
    return S.map(stepCard).join('');
  }

  // ---------- sayfa içerikleri ----------
  const LAYER_COLS = [
    { k: 'top', l: 'Üst', u: 'm', w: 46 }, { k: 'bottom', l: 'Alt', u: 'm', w: 46 }, { k: 'zt', l: 'Zemin / kaya türü', w: 178, sel: row => { const cur = GSOIL.keyOf(row); return GSOIL.GROUPS.map(g => `<optgroup label="${g}">${GSOIL.LIST.filter(e => e.grp === g).map(e => `<option value="${e.key}" ${e.key === cur ? 'selected' : ''}>${e.ad} (${e.code})</option>`).join('')}</optgroup>`).join(''); } },
    { k: 'durum', l: 'Sıkılık / kıvam / ayrışma', w: 150, tip: 'Tebliğ (2019) EK-5 sınıfları (SPT N). Seçilince tipik parametreler yüklenir.', sel: row => { const st = GSOIL.statesFor(GSOIL.keyOf(row)); return `<option value="" ${st.includes(row.durum) ? '' : 'selected'}>— seçin —</option>` + st.map(x => `<option ${x === row.durum ? 'selected' : ''}>${x}</option>`).join(''); } },
    { k: 'uscs', l: 'USCS', opts: GDRAW.USCS }, { k: 'desc', l: 'Tanım', text: true, w: 150 },
    { k: 'beh', l: 'Davranış', opts: ['Kohezyonsuz', 'Kohezyonlu', 'Kaya'] }, { k: 'gn', l: 'γn', u: 'kN/m³', w: 46 }, { k: 'gsat', l: 'γsat', u: 'kN/m³', w: 46 },
    { k: 'phi', l: "φ'", u: '°', w: 40 }, { k: 'c', l: "c'", u: 'kPa', w: 40 }, { k: 'cu', l: 'cu', u: 'kPa', w: 46 }, { k: 'Es', l: 'Es', u: 'MPa', w: 46, tip: 'Statik elastisite modülü (dinamik değil)' },
    { k: 'nu', l: 'ν', w: 40 }, { k: 'mv', l: 'mv', u: 'm²/kN', w: 62 }, { k: 'Cc', l: 'Cc', w: 40 }, { k: 'e0', l: 'e0', w: 40 }, { k: 'pi', l: 'PI', u: '%', w: 40 }, { k: 'fines', l: 'İDO', u: '%', w: 40, tip: 'İnce dane oranı (#200 geçen)' }
  ];

  // Zemin türü kütüphanesi kartı
  let libKey = null;
  function libCard() {
    const key = libKey || GSOIL.keyOf(P.layers[0]), e = GSOIL.BY[key], st = GSOIL.statesFor(key);
    const rows = st.map(x => { const t = GSOIL.typical(key, x); return [x, t.beh, t.gn, t.gsat, t.phi, t.c, t.cu || '–', t.Es, t.nu, t.mv ? t.mv.toExponential(1) : '–', t.e0]; });
    // SPT'ye göre öneri
    const sug = P.layers.map((Lr, i) => {
      const fam = GSOIL.famOf(GSOIL.keyOf(Lr)); if (fam === 'RK' || !R || !R.spt) return null;
      const ns = R.spt.rows.filter(d => d.z >= Lr.top && d.z < Lr.bottom && d.Nraw < 50).map(d => d.Nraw); if (!ns.length) return null;
      const m = ns.reduce((a, b) => a + b, 0) / ns.length, sg = GSOIL.stateFromN(fam, m);
      return [i + 1, GSOIL.label(Lr) + ' ' + Lr.top + '–' + Lr.bottom + ' m', ns.length, r(m, 1), sg, Lr.durum === sg ? '✔' : (Lr.durum ? 'seçilen: ' + Lr.durum.replace(/\s*\(.*\)/, '') : '–')];
    }).filter(Boolean);
    return `<div class="card"><h3>Zemin ve kaya türü kütüphanesi</h3><p class="hint">Tarama ve sınıflar Tebliğ (2019) EK-5 / EK-6 ve TS ISO 710'a göredir. Yönetmelikler sayısal parametre vermez; tablodaki değerler literatürdeki tipik aralıkların ortasıdır ve yalnızca ön tahmindir.</p>
      <div class="libhead"><select class="in" id="libSel">${GSOIL.GROUPS.map(g => `<optgroup label="${g}">${GSOIL.LIST.filter(x => x.grp === g).map(x => `<option value="${x.key}" ${x.key === key ? 'selected' : ''}>${x.ad} (${x.code})</option>`).join('')}</optgroup>`).join('')}</select>${GDRAW.swatch(key)}<span><b>${e.code}</b> · ${e.ad}<br><small>${e.grp} · varsayılan durum: ${e.def}</small></span></div>
      ${htable(['Durum', 'Davranış', 'γ<sub>n</sub>', 'γ<sub>doy</sub>', "φ' (°)", "c' (kPa)", 'c<sub>u</sub> (kPa)', 'E<sub>s</sub> (MPa)', 'ν', 'm<sub>v</sub> (m²/kN)', 'e<sub>0</sub>'], rows)}
      ${sug.length ? `<h4>SPT'ye göre durum önerisi (Tebliğ EK-5, arazi N ortalaması)</h4>${htable(['No', 'Tabaka', 'SPT sayısı', 'Ort. N (arazi)', 'Öneri', 'Durum'], sug)}` : ''}
      <details><summary>Kaynaklar</summary><ul class="src">${GSOIL.SOURCES.map(x => `<li>${x}</li>`).join('')}</ul></details></div>`;
  }

  function inputs() {
    const F = P.found;
    switch (page) {
      case 'proje': return grid('Proje ve rapor', [
        field('proj.name', 'Proje adı (üst bilgi)', '', { text: true, wide: true }), field('proj.owner', 'Mal sahibi', '', { text: true, wide: true }),
        field('proj.reportNo', 'Rapor no', '', { text: true }), field('proj.date', 'Rapor tarihi', '', { text: true, ph: 'gg.aa.yyyy' })]) +
        grid('İnşaat sahası (imar bilgileri)', [field('proj.il', 'İl', '', { text: true }), field('proj.ilce', 'İlçe', '', { text: true }), field('proj.mahalle', 'Mahalle', '', { text: true }), field('proj.mevki', 'Mevkii', '', { text: true }),
          field('proj.nitelik', 'Nitelik', '', { text: true }), field('proj.pafta', 'Pafta', '', { text: true }), field('proj.ada', 'Ada', '', { text: true }), field('proj.parsel', 'Parsel', '', { text: true }),
          field('proj.parselArea', 'Parsel alanı', 'm²'), field('proj.slope', 'Arazi eğimi', '%', { text: true }), field('proj.lat', 'Enlem', '°', { text: true }), field('proj.lon', 'Boylam', '°', { text: true }), field('proj.faultDist', 'En yakın diri fay', 'km', { text: true })]) +
        `<div class="card"><h3>Parsel köşe koordinatları (isteğe bağlı)</h3>${tableEditor('coords', [{ k: 'lat', l: 'Enlem', text: true, w: 110 }, { k: 'lon', l: 'Boylam', text: true, w: 110 }], P.coords.length ? P.coords : [])}</div>` +
        grid('Yapı', [field('proj.storeys', 'Kat açıklaması', '', { text: true, ph: 'Bodrum + Zemin + 4 NK' }), field('proj.nFloors', 'Kat sayısı', ''), field('proj.usage', 'Kullanım amacı', '', { text: true }), field('proj.system', 'Taşıyıcı sistem', '', { text: true }),
          field('proj.HN', 'Bina yüksekliği H<sub>N</sub>', 'm', { tip: 'TBDY Tablo 3.3 için temel üstünden yükseklik' }), field('proj.bks', 'Bina kullanım sınıfı BKS', '', { opts: [1, 2, 3], numSel: true }), field('proj.footprint', 'Oturum alanı', 'm²'), field('proj.totalArea', 'Toplam inşaat alanı', 'm²'), field('proj.foundLevel', 'Temel kotu', 'm')]) +
        grid('Müellifler ve imza', [field('team.geo.name', 'Geoteknik rapor (İnş. Müh.)', '', { text: true }), field('team.geo.sicil', 'Oda sicil no', '', { text: true }), field('team.geo.tc', 'T.C. kimlik no', '', { text: true }),
          field('team.jeo.name', 'Jeoloji mühendisi', '', { text: true }), field('team.jeo.sicil', 'Oda sicil no', '', { text: true }), field('team.jeo.tc', 'T.C. kimlik no', '', { text: true }),
          field('team.jfz.name', 'Jeofizik mühendisi', '', { text: true }), field('team.jfz.sicil', 'Oda sicil no', '', { text: true }), field('team.jfz.tc', 'T.C. kimlik no', '', { text: true }),
          field('team.statik', 'Statik proje müellifi', '', { text: true }), field('team.mimari', 'Mimari proje müellifi', '', { text: true })], 'Jeoloji/jeofizik alanları veri raporunu hazırlayanlardır; rapor kapağındaki imza tablosuna yazılır.') +
        grid('Zemin etüdü (veri raporu)', [field('etut.cat', 'Etüt kategorisi', '', { text: true }), field('etut.date', 'Veri raporu tarihi', '', { text: true }), field('site.nBore', 'Sondaj sayısı', 'adet'), field('site.boreDepth', 'En sığ sondaj derinliği', 'm'), field('etut.depths', 'Sondaj derinlikleri (metin)', '', { text: true, ph: '10,00 - 10,00 - 10,00' }),
          field('site.rock3m', 'Sağlam tabakaya ≥ 3 m girildi', '', { check: true }), field('site.loose', 'Gevşek iri daneli zemin var', '', { check: true, tip: 'TBDY 16A.1.4(d) / Tebliğ 7.2.2.2(b)-11: YASS tabandan 10 m içinde ve gevşek veya sıvılaşabilir zemin varsa sondaj tabandan ≥ 20 m' }),
          field('site.yass', 'Yeraltı su seviyesi (YASS)', 'm', { tip: 'Su yoksa 99 girin' }), field('site.gw', 'γ<sub>w</sub>', 'kN/m³'),
          field('etut.masw', 'MASW/ReMi ölçüm', 'adet'), field('etut.hydro', 'Hidrojeoloji', 'adet'), field('etut.wn', 'Su muhtevası deneyi', 'adet'), field('etut.gn', 'Birim hacim ağırlık deneyi', 'adet'), field('etut.gs', 'Özgül ağırlık deneyi', 'adet'),
          field('etut.sieve', 'Elek analizi', 'adet'), field('etut.atterberg', 'Kıvam limitleri', 'adet'), field('etut.shear', 'Kesme kutusu', 'adet'), field('etut.ucs', 'Serbest basınç', 'adet'), field('etut.uu', 'Üç eksenli (UU)', 'adet'), field('etut.oedo', 'Ödometre', 'adet')],
          'Mavi kutular girdi, turuncu kutular varsayılanı ezen tasarım kararı. Her değişiklikte tüm hesap yeniden yapılır. Bu sayfadaki bilgiler Word raporunun kapak, giriş, saha, yapı ve etüt bölümlerine yazılır.');
      case 'profil': return `<div class="card"><h3>İdealize zemin profili</h3><p class="hint">Sondaj loguna ve laboratuvara göre tasarım tabakaları. Es statik modüldür; MASW'den gelen dinamik E kullanmayın. Kohezyonlu tabakada oturma için m<sub>v</sub> veya C<sub>c</sub>/e<sub>0</sub> girin.</p>${tableEditor('layers', LAYER_COLS, P.layers)}<p class="hint">Zemin / kaya türü ve sıkılık–kıvam–ayrışma seçildiğinde tipik parametreler otomatik yüklenir (<span class="typ">sarı</span> hücreler). Deney sonucunu yazdığınız hücre tipik değer olmaktan çıkar.</p></div>${libCard()}`;
      case 'spt': return grid('SPT ekipmanı', [field('spt.equip.CE', 'Enerji C<sub>E</sub>', '', { tip: 'Halat-makara ≈ 0.75–0.83, otomatik ≈ 1.0–1.3' }), field('spt.equip.CB', 'Kuyu çapı C<sub>B</sub>', '', { tip: '65–115 mm: 1.0; 150 mm: 1.05; 200 mm: 1.15' }), field('spt.equip.CS', 'Numune alıcı C<sub>S</sub>', ''), field('spt.equip.rodExtra', 'Yüzey üstü tij', 'm', { tip: 'Tij boyu = derinlik + bu değer' })]) +
        `<div class="card"><h3>SPT verisi</h3><p class="hint">Ret (R) için 50 girin. Arazi N değeri (son 30 cm).</p>${tableEditor('spt.data', [{ k: 'z', l: 'Derinlik', u: 'm' }, { k: 'N', l: 'N', u: 'darbe' }], P.spt.data)}</div>`;
      case 'zemin': return `<div class="card"><h3>Vs profili (MASW / kuyu içi)</h3>${tableEditor('vs', [{ k: 'top', l: 'Üst', u: 'm' }, { k: 'bottom', l: 'Alt', u: 'm' }, { k: 'vs', l: 'Vs', u: 'm/s' }], P.vs)}<p class="hint">Son tabaka Df + 30 m'ye kadar uzatılır.</p></div>`;
      case 'deprem': return grid('AFAD TDTH (DD-2, %10 / 50 yıl)', [field('seis.Ss', 'S<sub>s</sub>', 'g'), field('seis.S1', 'S<sub>1</sub>', 'g'), field('seis.PGA', 'PGA', 'g'), field('seis.PGV', 'PGV', 'cm/s'),
        field('seis.zsOverride', 'Zemin sınıfı (seçim)', '', { opts: [['', 'Otomatik (' + (R ? R.zsSug : '') + ')'], 'ZA', 'ZB', 'ZC', 'ZD', 'ZE'], over: true, tip: 'Boş bırakılırsa Vs30, yoksa (N60)30 kullanılır' })], 'Koordinatla https://tdth.afad.gov.tr adresinden alınır.') +
        `<div class="card"><h3>Diğer deprem düzeyleri (rapor tablosu için, isteğe bağlı)</h3>${tableEditor('seis.dd', [{ k: 'name', l: 'Düzey', text: true, w: 60 }, { k: 'Ss', l: 'S<sub>s</sub>' }, { k: 'S1', l: 'S<sub>1</sub>' }, { k: 'PGA', l: 'PGA' }, { k: 'PGV', l: 'PGV' }], P.seis.dd)}<p class="hint">DD-1, DD-3, DD-4. DD-2 yukarıdaki değerlerden alınır.</p></div>`;
      case 'temel': return grid('Temel geometrisi', [field('found.type', 'Temel tipi', '', { opts: ['Radye', 'Sürekli', 'Tekil'] }), field('found.B', 'B (kısa kenar)', 'm'), field('found.L', 'L (uzun kenar)', 'm'), field('found.Df', 'Temel derinliği D<sub>f</sub>', 'm', { tip: 'Doğal zeminden temel tabanına; bodrum varsa kazı tabanı' }), field('found.t', 'Temel kalınlığı', 'm')]) +
        `<div class="card"><h3>Yük kombinasyonları (temel tabanında)</h3><p class="hint">Statik analizden: N düşey, M<sub>B</sub> B yönünde dışmerkezlik yaratan moment (e<sub>B</sub> = M<sub>B</sub>/N), H yatay kuvvet.</p>${tableEditor('loads.combos', [{ k: 'name', l: 'Kombinasyon', text: true, w: 100 }, { k: 'seismic', l: 'Depremli', opts: ['Hayır', 'Evet'] }, { k: 'N', l: 'N', u: 'kN', w: 70 }, { k: 'MB', l: 'M<sub>B</sub>', u: 'kNm', w: 70 }, { k: 'ML', l: 'M<sub>L</sub>', u: 'kNm', w: 70 }, { k: 'HB', l: 'H<sub>B</sub>', u: 'kN', w: 60 }, { k: 'HL', l: 'H<sub>L</sub>', u: 'kN', w: 60 }], P.loads.combos)}<div class="grid">${field('loads.Nserv', 'Servis yükü N<sub>G+Q</sub> (oturma için)', 'kN', { wide: true })}</div></div>`;
      case 'tasima': return grid('Tasarım parametresi seçimi', [field('bear.type', 'Analiz', '', { opts: [['', 'Otomatik (taban tabakasına göre)'], 'Drenajlı', 'Drenajsız'], over: true }), field('bear.phi', "φ' (tasarım)", '°', { over: true, ph: 'tabaka: ' + R.design.layer.phi }), field('bear.c', "c' (tasarım)", 'kPa', { over: true, ph: 'tabaka: ' + R.design.layer.c }), field('bear.cu', 'c<sub>u</sub> (tasarım)', 'kPa', { over: true, ph: 'tabaka: ' + R.design.layer.cu })],
        `Boş bırakılırsa temel tabanındaki tabakanın (${GSOIL.label(R.design.layer)}) değeri alınır. Kırılma kaması daha zayıf bir tabakaya giriyorsa onun değerini girin.`);
      case 'kayma': return grid('Kayma parametreleri', [field('slide.tand', 'tanδ (taban–zemin)', '', { tip: 'TBDY Tablo 16.3 (üst sınır): yerinde dökme beton – sıkıştırılmış taban 0.6; önüretimli beton 0.4; beton – beton 0.5; beton – taban kayası 0.5' }), field('slide.usePassive', 'Pasif direnci kullan (0.3·R<sub>pt</sub>)', '', { check: true })]);
      case 'oturma': return grid('Oturma parametreleri', [field('sett.zmaxFactor', 'Analiz derinliği', '× B'), field('sett.rig', 'Rijitlik düzeltmesi', '', { tip: 'Esnek merkez = 1.0; rijit radye ≈ 0.8' }), field('sett.allow', 'İzin verilen oturma', 'mm'), field('sett.tYear', 'Schmertmann süre t', 'yıl')]);
      case 'sisme': return grid('Şişme', [field('swell.zone', 'Aktif zon (tabandan)', 'm', { tip: 'Ankara için tipik 2–3 m' })]);
      default: return '';
    }
  }

  function outputs() {
    const F = P.found;
    switch (page) {
      case 'proje': return `<div class="card"><h3>Proje özeti</h3>${htable(['Büyüklük', 'Değer'], [['Temel alanı', r(R.etut.area, 1) + ' m²'], ['Gereken sondaj sayısı (≥)', R.etut.nReq], ['Gereken sondaj derinliği (≥)', r(R.etut.dReq, 1) + ' m (doğal zeminden)'], ['Zemin sınıfı', R.zs], ['S<sub>DS</sub> / S<sub>D1</sub>', r(R.sp.SDS, 3) + ' / ' + r(R.sp.SD1, 3)]])}<p class="hint">Ayrıntı: 11. sayfa (TBDY Ek 16A, Tebliğ 7.2.2).</p></div>`;
      case 'profil': {
        const used = P.layers;
        return `<div class="card">${fig(GDRAW.soilColumn(P, R, { w: 700, h: 560 }), 'Şekil — İdealize zemin profili, temel tabanı ve SPT değerleri. Taramalar Tebliğ (2019) EK-6 lejantına göre.')}</div><div class="card"><h3>Tarama lejantı</h3>${GDRAW.legend(used)}<details><summary>Tüm desenler (${GSOIL.LIST.length})</summary>${GSOIL.GROUPS.map(g => `<h4>${g}</h4>` + GDRAW.legend(GSOIL.LIST.filter(e => e.grp === g).map(e => e.key))).join('')}</details></div>`;
      }
      case 'spt': return `<div class="card two"><div>${fig(GDRAW.sptChart(R, { w: 420, h: 400 }), 'N, N60, N1,60 ve N1,60f')}</div><div>${sptSteps()}</div></div><div class="card"><h3>Düzeltme tablosu</h3>${htable(['z (m)', 'Tabaka', 'N', "σ'v (kPa)", 'C<sub>R</sub>', 'N<sub>60</sub>', 'C<sub>N</sub>', 'N<sub>1,60</sub>', 'İDO %', 'N<sub>1,60f</sub>', 'h<sub>30</sub> (m)'], R.spt.rows.map(d => [d.z, d.uscs, d.Nraw >= 50 ? '50 (R)' : d.Nraw, r(d.se, 1), d.CR, r(d.N60, 1), r(d.CN, 3), r(d.N160, 1), r(d.fines, 0), r(d.N160f, 1), d.h30 != null ? r(d.h30, 2) : '–']))}<p class="hint">(N60)30 = ${r(R.spt.N30, 1)} — her SPT, komşu deney noktalarının ortasına kadar temsil eder; son değer Df + 30 m'ye uzatılır.</p></div>`;
      case 'zemin': {
        const cls = [['ZA', '> 1500', '–', '–'], ['ZB', '760–1500', '–', '–'], ['ZC', '360–760', '> 50', '> 250'], ['ZD', '180–360', '15–50', '70–250'], ['ZE', '< 180', '< 15', '< 70']];
        return `<div class="card two"><div>${fig(GDRAW.vsChart(P, R, { w: 380, h: 440 }), 'Vs profili; Df ve Df + 30 m sınırları')}</div><div>${steps('zemin')}<h4>TBDY Tablo 16.1</h4>${htable(['Sınıf', 'Vs30 (m/s)', '(N60)30', '(cu)30 (kPa)'], cls.map(c => c.map((x, i) => i === 0 ? (c[0] === R.zsVs || c[0] === R.zsN ? `<b class="hl">${x}${c[0] === R.zsVs ? ' ← Vs' : ''}${c[0] === R.zsN ? ' ← N' : ''}</b>` : x) : x)))}<p class="hint">Seçilen: <b>${R.zs}</b>${P.seis.zsOverride ? ' (elle seçildi)' : ' (otomatik)'}. Değiştirmek için Deprem sayfası.</p></div></div>`;
      }
      case 'deprem': return `<div class="card two"><div>${fig(GDRAW.spectrumChart(R, { w: 560, h: 330 }), 'Yatay elastik tasarım spektrumu')}${R.spAlt ? htable(['Sınıf', 'F<sub>s</sub>', 'F<sub>1</sub>', 'S<sub>DS</sub>', 'S<sub>D1</sub>', 'T<sub>B</sub>', 'DTS'], [[R.zs + ' (seçilen)', r(R.sp.Fs, 3), r(R.sp.F1, 3), r(R.sp.SDS, 3), r(R.sp.SD1, 3), r(R.sp.TB, 3), R.sp.DTS], [R.spAlt.zs, r(R.spAlt.Fs, 3), r(R.spAlt.F1, 3), r(R.spAlt.SDS, 3), r(R.spAlt.SD1, 3), r(R.spAlt.TB, 3), R.spAlt.DTS]]) : ''}</div><div>${steps('deprem')}</div></div>`;
      case 'temel': return `<div class="card"><h3>Etkin alan ve taban basıncı</h3><div class="row">${R.bear.map(b => fig(GDRAW.planEffective(P, b, { w: 340, h: 260 }), '') + fig(GDRAW.pressureDiagram(P, b, { w: 340, h: 200 }), '')).join('')}</div></div>`;
      case 'tasima': return `<div class="card">${fig(GDRAW.bearingSection(P, R, { w: 820, h: 420 }), 'Kritik kombinasyonda kırılma mekanizması ve tasarım büyüklükleri')}</div><div class="card"><h3>Kombinasyonlar</h3>${htable(['Kombinasyon', "B' × L' (m)", 'β (°)', 'q<sub>k</sub> (kPa)', 'q<sub>t</sub> (kPa)', 'q<sub>o</sub> (kPa)', 'q<sub>o</sub>/q<sub>t</sub>', 'Sonuç'], R.bear.map(b => [b.name, r(b.Bp) + ' × ' + r(b.Lp), r(b.beta, 2), r(b.qk, 0), r(b.qt, 0) + ' <small>(' + r(b.qt / 9.81, 1) + ' t/m²)</small>', r(b.qo, 0), r(b.qo / b.qt, 2), okb(b.ok)]))}</div><div class="card"><h3>Kritik kombinasyon adım adım: ${R.bearCrit.name}</h3>${steps('tasima')}</div>`;
      case 'kayma': return `<div class="card">${htable(['Kombinasyon', 'V<sub>th</sub> (kN)', 'R<sub>th</sub> (kN)', 'R<sub>pt</sub> (kN)', 'Kapasite (kN)', 'Sonuç'], R.slide.map(s => [s.name + (s.note ? `<br><small>${s.note}</small>` : ''), r(s.Vth, 0), r(s.Rth, 0), r(s.Rpt, 0), r(s.cap, 0), okb(s.ok)]))}${steps('kayma')}</div>`;
      case 'oturma': {
        const S = R.sett;
        return `<div class="card row">${fig(GDRAW.settChart(R, P, { w: 420, h: 420 }), 'Δσ ve 0.1σ\'v')}${fig(GDRAW.cumSettChart(R, { w: 340, h: 420 }), 'Birikimli oturma')}${fig(GDRAW.izChart(R, { w: 300, h: 420 }), 'Schmertmann Iz')}</div><div class="card"><h3>Adım adım</h3>${steps('oturma')}</div><div class="card"><h3>Dilim tablosu (her 3. dilim)</h3>${htable(['z tabandan (m)', 'Tabaka', 'Δσ (kPa)', "σ'v (kPa)", 'Δσ/σ\'v', 'ΔS<sub>e</sub> (mm)', 'ΔS<sub>c</sub> (mm)', 'ΣS (mm)'], S.prof.filter((_, i) => i % 3 === 0).map(p => [r(p.zb, 2), p.uscs, r(p.ds, 1), r(p.se, 1), r(p.ds / p.se, 3), r(p.el, 2), r(p.co, 2), r(p.cum, 1)]))}</div>`;
      }
      case 'yatak': return `<div class="card">${fig(GDRAW.ksBars(R, { w: 560, h: 220 }), '')}${steps('yatak')}</div>`;
      case 'sisme': return `<div class="card">${steps('sisme')}${htable(['Kontrol', 'Durum', 'Değer'], R.checks.filter(c => c.mod === 'etut').map(c => [c.t, okb(c.ok), c.v]))}<p class="hint">Sayı: A ≤ 300 m² → 3, her +300 m² için +1, > 1000 m² → ≥ 5 (Tebliğ 7.2.2.2a; TBDY 16A.1.2). Derinlik: D<sub>f</sub> + max(1.5B, Δσ = 0.1σ'<sub>v</sub> derinliği); YASS tabandan 10 m içinde ve gevşek/sıvılaşabilir zeminde tabandan ≥ 20 m (Tebliğ 7.2.2.2b-11; TBDY 16A.1.4d). Sağlam tabakaya ≥ 3 m girildiyse sağlanmış sayılır. Jeofizik: H<sub>N</sub> > 10.5 m veya A > 200 m² ise zorunlu (Tebliğ 7.2.2.3).</p></div>`;
      case 'ozet': return summaryHTML() + `<div class="card"><h3>Çıktılar</h3><button class="big" id="btnDocx">Word raporu oluştur (.docx)</button> <button id="btnSave2">Projeyi kaydet (.json)</button><p class="hint">Rapor; formüller, yerine konmuş sayılar, kaynaklar ve tüm çizimlerle birlikte oluşturulur. Word'de düzenleyip imzaya hazırlayabilirsiniz.</p><div id="docxMsg"></div></div>`;
      case 'test': {
        const T = GEO.selfTest();
        return `<div class="card"><h3>Hesap motoru doğrulaması</h3><p class="hint">Bilinen çözümlerle karşılaştırma (tolerans %1–2). Excel aracı v1.3 ile aynı bağıntılar kullanılır.</p>${htable(['Örnek', 'Hesap', 'Beklenen', 'Sapma', 'Sonuç'], T.map(t => [t.name, r(t.got, 3), t.exp, r((t.got / t.exp - 1) * 100, 2) + ' %', okb(t.ok)]))}<p><b>${T.filter(t => t.ok).length} / ${T.length}</b> test geçti.</p></div>`;
      }
    }
    return '';
  }

  function summaryRows() {
    const bc = R.bearCrit, sl = R.slide.reduce((a, b) => ((b.cap == null ? Infinity : b.Vth / b.cap) > (a.cap == null ? Infinity : a.Vth / a.cap) ? b : a));
    return [
      ['Yerel zemin sınıfı', R.zs, `Vs30 = ${r(R.vs30, 0)} m/s → ${R.zsVs || '–'}; (N60)30 = ${r(R.spt.N30, 1)} → ${R.zsN || '–'}`],
      ['S<sub>DS</sub> / S<sub>D1</sub>', `${r(R.sp.SDS, 3)} / ${r(R.sp.SD1, 3)}`, `F<sub>s</sub> = ${r(R.sp.Fs, 3)}, F<sub>1</sub> = ${r(R.sp.F1, 3)}`],
      ['T<sub>A</sub> / T<sub>B</sub>', `${r(R.sp.TA, 3)} / ${r(R.sp.TB, 3)} s`, `DTS = ${R.sp.DTS}, BYS = ${R.sp.BYS}`],
      ['Tasarım taşıma gücü (en küçük)', `${r(R.qtMin, 0)} kPa (${r(R.qtMin / 9.81, 1)} t/m²)`, `${R.qtMinName}; en yüksek kullanım: ${bc.name}, q<sub>o</sub>/q<sub>t</sub> = ${r(bc.qo / bc.qt, 2)}`],
      ['Statik q<sub>t</sub>', `${r(R.bear[0].qt, 0)} kPa (${r(R.bear[0].qt / 9.81, 1)} t/m²)`, `q<sub>k</sub> = ${r(R.bear[0].qk, 0)} kPa`],
      ['Kayma', sl.cap == null ? 'belirsiz' : `${r(sl.Vth, 0)} / ${r(sl.cap, 0)} kN`, sl.name],
      ['Toplam oturma', `${r(R.sett.Stot, 1)} mm`, `elastik ${r(R.sett.Sel, 1)} + konsolidasyon ${r(R.sett.Scon, 1)}; Schmertmann ${r(R.sch.Se, 1)} mm`],
      ['Yatak katsayısı (öneri zarf)', `${r(R.ks.lo / 9.81, 0)} – ${r(R.ks.hi / 9.81, 0)} t/m³`, `q/S ${r(R.ks.ks1 / 9.81, 0)} · Bowles ${r(R.ks.ks2 / 9.81, 0)} · Vesic ${r(R.ks.ks3 / 9.81, 0)}`],
      ['PGA / PGV', `${P.seis.PGA} g / ${P.seis.PGV} cm/s`, '']
    ];
  }
  function summaryHTML() {
    return `<div class="card"><h3>Sonuç tablosu</h3>${htable(['Parametre', 'Değer', 'Not'], summaryRows())}</div><div class="card"><h3>Kontroller</h3>${htable(['Kontrol', 'Durum', 'Değer'], R.checks.map(c => [c.t, okb(c.ok), c.v]))}${R.warn.length ? '<h4>Uyarılar</h4><ul class="warn">' + R.warn.map(w => `<li>${w}</li>`).join('') + '</ul>' : ''}</div>`;
  }

  // ---------- yan panel ----------
  function side() {
    const bc = R.bearCrit;
    const k = [['Zemin sınıfı', R.zs], ['S<sub>DS</sub>', r(R.sp.SDS, 3)], ['S<sub>D1</sub>', r(R.sp.SD1, 3)], ['DTS / BYS', R.sp.DTS + ' / ' + R.sp.BYS], ['q<sub>t,min</sub>', r(R.qtMin / 9.81, 1) + ' t/m²'], ['q<sub>o</sub>/q<sub>t</sub>', r(bc.qo / bc.qt, 2)], ['Oturma', r(R.sett.Stot, 1) + ' mm'], ['k<sub>s</sub>', r(R.ks.lo / 9.81, 0) + '–' + r(R.ks.hi / 9.81, 0) + ' t/m³']];
    $('#side').innerHTML = `${R.blocked ? `<div class="block"><b>Çözülmemiş sorun</b><ul>${R.blockers.map(b => `<li>${b}</li>`).join('')}</ul></div>` : ''}<h3>Anahtar sonuçlar</h3><dl>${k.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl><h3>Kontroller</h3><ul class="chk">${R.checks.map(c => `<li class="${c.ok === true ? 'ok' : c.ok === false ? 'no' : 'na'}"><span>${c.ok === true ? '✔' : c.ok === false ? '✘' : '!'}</span><span class="t">${c.t}</span><small>${c.v}</small></li>`).join('')}</ul>${R.warn.length ? `<h3>Uyarılar</h3><ul class="warn">${R.warn.map(w => `<li>${w}</li>`).join('')}</ul>` : ''}`;
    // gezinme durum noktaları
    PAGES.forEach(pg => {
      const cs = R.checks.filter(c => pg.mods.includes(c.mod));
      const st = cs.some(c => c.ok === false) ? 'no' : cs.some(c => c.ok === null) ? 'na' : cs.length ? 'ok' : '';
      const el = document.querySelector(`#nav [data-pg="${pg.id}"] .dot`); if (el) el.className = 'dot ' + st;
    });
  }

  // ---------- çiz / hesapla ----------
  function recompute() {
    try { R = GEO.compute(P); $('#err').textContent = ''; }
    catch (e) { $('#err').textContent = 'Hesap hatası: ' + e.message; console.error(e); return false; }
    try { localStorage.setItem(LS, JSON.stringify(P)); } catch (e) { }
    $('#pname').textContent = P.proj.name || 'Adsız proje';
    return true;
  }
  function renderOutputs() {
    const sy = window.scrollY;
    $('#outputs').innerHTML = outputs();
    side();
    window.scrollTo(0, sy);
    const b = $('#btnDocx'); if (b) b.onclick = makeDocx;
    const b2 = $('#btnSave2'); if (b2) b2.onclick = saveJSON;
  }
  function renderPage() {
    const pg = PAGES.find(x => x.id === page);
    $('#ptitle').innerHTML = `<span class="pn">${pg.n}</span>${pg.t}`;
    document.querySelectorAll('#nav li').forEach(li => li.classList.toggle('act', li.dataset.pg === page));
    $('#inputs').innerHTML = inputs();
    renderOutputs();
  }
  function onChange(e) {
    const el = e.target; if (!el.dataset || !el.dataset.p) return;
    let v = el.dataset.bool ? el.checked : el.dataset.num ? num(el.value) : el.value;
    if (el.tagName === 'SELECT' && el.dataset.num) v = +v;
    if (el.id === 'libSel') return;
    const mz = el.dataset.p.match(/^layers\.(\d+)\.(zt|durum)$/);
    if (mz) {
      const Lr = P.layers[+mz[1]], before = clone(Lr);
      set(P, el.dataset.p, v);
      if (mz[2] === 'zt' && !GSOIL.statesFor(v).includes(Lr.durum)) Lr.durum = '';
      if (Lr.durum || mz[2] === 'zt') { GSOIL.apply(Lr); toast(`Tabaka ${+mz[1] + 1}: ${GSOIL.nameOf(Lr)} – ${Lr.durum} için tipik değerler yüklendi.`, () => { P.layers[+mz[1]] = before; recompute(); renderPage(); }); }
      libKey = Lr.zt; recompute(); renderPage(); return;
    }
    set(P, el.dataset.p, v);
    const mt = el.dataset.p.match(/^layers\.(\d+)\.(\w+)$/);
    if (mt && Array.isArray(P.layers[+mt[1]].tip) && P.layers[+mt[1]].tip.includes(mt[2])) { P.layers[+mt[1]].tip = P.layers[+mt[1]].tip.filter(k => k !== mt[2]); el.removeAttribute('data-typ'); el.removeAttribute('title'); }
    // tabaka sınırlarını bağla
    const m = el.dataset.p.match(/^layers\.(\d+)\.bottom$/); if (m && P.layers[+m[1] + 1]) { P.layers[+m[1] + 1].top = v; const n = document.querySelector(`[data-p="layers.${+m[1] + 1}.top"]`); if (n) n.value = v; }
    const m2 = el.dataset.p.match(/^vs\.(\d+)\.bottom$/); if (m2 && P.vs[+m2[1] + 1]) { P.vs[+m2[1] + 1].top = v; const n = document.querySelector(`[data-p="vs.${+m2[1] + 1}.top"]`); if (n) n.value = v; }
    if (recompute()) { if (page === 'tasima' || page === 'deprem') { const a = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.p : null; $('#inputs').innerHTML = inputs(); if (a) { const n = document.querySelector(`[data-p="${a}"]`); if (n) n.focus(); } } renderOutputs(); }
  }
  function toast(msg, undo) {
    let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.innerHTML = `<span>${msg}</span>${undo ? '<button>Geri al</button>' : ''}`; t.className = 'show';
    if (undo) t.querySelector('button').onclick = () => { undo(); t.className = ''; };
    clearTimeout(toast.h); toast.h = setTimeout(() => { t.className = ''; }, 7000);
  }
  function onClick(e) {
    const t = e.target;
    if (t.dataset.add) { const arr = get(P, t.dataset.add); const last = arr[arr.length - 1]; const n = last ? clone(last) : (t.dataset.add === 'coords' ? { lat: '', lon: '' } : {}); if ('top' in n && 'bottom' in n) { n.top = last.bottom; n.bottom = last.bottom + 2; } if ('z' in n) n.z = +(last.z + 1.5).toFixed(2); arr.push(n); recompute(); renderPage(); }
    if (t.dataset.del) { const arr = get(P, t.dataset.del); if (arr.length > 1 || t.dataset.del === 'coords' || t.dataset.del === 'seis.dd') { arr.splice(+t.dataset.i, 1); recompute(); renderPage(); } }
  }

  // ---------- dosya işlemleri ----------
  function download(name, data, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  const fname = ext => (P.proj.name || 'proje').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_') + ext;
  function saveJSON() { download(fname('.geo.json'), JSON.stringify(P, null, 1), 'application/json'); }
  function openJSON() {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.json,application/json';
    i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then(t => { try { const q = JSON.parse(t); if (!q.layers || !q.found) throw new Error('Geçersiz proje dosyası'); P = normalize(q); recompute(); renderPage(); } catch (e) { alert('Dosya açılamadı: ' + e.message); } }); };
    i.click();
  }

  // ---------- SVG → PNG ----------
  function svgToPng(svg, scale = 2) {
    return new Promise((res, rej) => {
      const m = svg.match(/width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/); const w = +m[1], h = +m[2];
      const img = new Image();
      img.onload = () => { const c = document.createElement('canvas'); c.width = w * scale; c.height = h * scale; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); c.toBlob(b => b.arrayBuffer().then(ab => res({ png: new Uint8Array(ab), w, h })), 'image/png'); };
      img.onerror = () => rej(new Error('SVG görüntüye çevrilemedi'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  // ---------- Word raporu ----------
  async function buildDocx() { return GREPORT.build(P, R, svgToPng); }
  const F = () => P.found;
  async function makeDocx() {
    if (R.blocked && !confirm('Çözülmemiş sorunlar var:\n- ' + R.blockers.map(b => b.replace(/<[^>]+>/g, '')).join('\n- ') + '\n\nTASLAK olarak işaretli rapor oluşturulsun mu?')) return;
    const msg = $('#docxMsg'); if (msg) msg.textContent = 'Rapor hazırlanıyor…';
    try { const bytes = await buildDocx(); download(fname('_geoteknik_rapor.docx'), new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })); if (msg) msg.innerHTML = '<b class="ok">✔ Rapor indirildi.</b>'; }
    catch (e) { console.error(e); if (msg) msg.innerHTML = '<b class="no">Rapor oluşturulamadı: ' + e.message + '</b>'; }
  }
  window.GEO_UI = { buildDocx, get P() { return P; }, get R() { return R; } };

  // ---------- başlat ----------
  function init() {
    let saved = null; try { saved = JSON.parse(localStorage.getItem(LS)); } catch (e) { }
    P = saved && saved.layers ? normalize(saved) : clone(GEO_EXAMPLE);
    $('#nav').innerHTML = PAGES.map(p => `<li data-pg="${p.id}"><span class="pn">${p.n}</span>${p.t}<span class="dot"></span></li>`).join('');
    $('#nav').onclick = e => { const li = e.target.closest('li'); if (li) { page = li.dataset.pg; renderPage(); window.scrollTo(0, 0); } };
    $('#main').addEventListener('change', onChange);
    $('#main').addEventListener('change', e => { if (e.target.id === 'libSel') { libKey = e.target.value; const c = e.target.closest('.card'); if (c) c.outerHTML = libCard(); } });
    $('#main').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.dispatchEvent(new Event('change', { bubbles: true })); });
    $('#main').addEventListener('click', onClick);
    $('#bNew').onclick = () => { if (confirm('Yeni boş proje açılsın mı? Kaydedilmemiş değişiklikler kaybolur.')) { P = normalize(BLANK()); recompute(); page = 'proje'; renderPage(); } };
    $('#bEx').onclick = () => { P = clone(GEO_EXAMPLE); recompute(); renderPage(); };
    $('#bOpen').onclick = openJSON; $('#bSave').onclick = saveJSON;
    $('#bDocx').onclick = () => { page = 'ozet'; renderPage(); makeDocx(); };
    $('#bPrint').onclick = () => window.print();
    recompute(); renderPage();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
