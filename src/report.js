/* Word raporu — TEKŞAHLAR / GEOTEKNİKPRO rapor düzeni (EK-12 bölüm sırası) */
(function (root) {
  'use strict';
  const n = (x, d = 2) => (x === null || x === undefined || x === '' || !isFinite(x)) ? '–' : Number(x).toFixed(d).replace('.', ',');
  const t = v => (v === null || v === undefined || v === '') ? '–' : String(v);
  const OK = ok => ok === null || ok === undefined ? { v: 'Belirsiz', b: true, fill: 'FCE4C4' } : ok ? { v: 'Yeterli', b: true } : { v: 'Yetersiz', b: true, fill: 'F4CCCC' };

  async function build(P, R, svgToPng) {
    const F = P.found, pr = P.proj, tm = P.team || {}, et = P.etut || {};
    const imar = `${t(pr.il)} ili, ${t(pr.ilce)} ilçesi, ${t(pr.mahalle)} Mahallesi, ${t(pr.pafta)} pafta, ${t(pr.ada)} Ada, ${t(pr.parsel)} Parsel`;
    const D = new GDOCX.Doc({ title: 'Geoteknik Rapor — ' + pr.name, author: (tm.geo && tm.geo.name) || '', header: pr.name, headerRight: imar,
      annexes: ['Araştırma Noktaları Vaziyet Planı', 'Sondaj Logları', 'Laboratuvar Deney Sonuçları Özet Tabloları', 'Jeofizik (MASW) Ölçüm Sonuçları'] });
    const img = async (svg, cm, cap) => { if (!svg) return; const { png, w, h } = await svgToPng(svg); D.image(png, w, h, cm, cap); };
    const ADB = (title, rows, o = {}) => D.table([['Açıklama', 'Simge', 'Değer', 'Birim'], ...rows], Object.assign({ title, widths: [4.4, 1.4, 2.4, 1.3], align: [null, 'center', 'center', 'center'] }, o));
    const ADg = (title, rows, o = {}) => D.table([['Açıklama', 'Değer', 'Birim'], ...rows], Object.assign({ title, widths: [4, 4.5, 1], align: [null, null, 'center'] }, o));
    const date = pr.date || new Date().toLocaleDateString('tr-TR');
    const bc = R.bearCrit, des = R.design;
    const cmb = P.loads.combos;

    // ================= KAPAK =================
    for (let i = 0; i < 3; i++) D.p('');
    D.para(`${(pr.owner || pr.name).toLocaleUpperCase('tr-TR')} SAHASI`, { style: 'CoverTitle' });
    D.para('PARSEL BAZINDA ZEMİN VE TEMEL ETÜDÜ', { style: 'CoverTitle', spacing: [360, 120] });
    D.para('GEOTEKNİK RAPORU', { style: 'CoverTitle', spacing: [240, 240] });
    D.para(`Rapor No: ${t(pr.reportNo)}`, { style: 'CoverSub' });
    D.para(`Tarih: ${date}`, { style: 'CoverSub' });
    for (let i = 0; i < 14; i++) D.p('');
    const sig = () => {
      const g = tm.geo || {}, j = tm.jeo || {}, f = tm.jfz || {};
      D.table([
        ['Sorumlu', 'İnşaat Mühendisi', 'Sorumlu', 'Jeoloji Mühendisi', 'Sorumlu', 'Jeofizik Mühendisi'],
        ['Adı-Soyadı', t(g.name), 'Adı-Soyadı', t(j.name || tm.dataJeo), 'Adı-Soyadı', t(f.name || tm.dataJfz)],
        ['Oda Sicil No', t(g.sicil), 'Oda Sicil No', t(j.sicil), 'Oda Sicil No', t(f.sicil)],
        ['T.C. Kimlik No', t(g.tc), 'T.C. Kimlik No', t(j.tc), 'T.C. Kimlik No', t(f.tc)],
        ['Tarih', date, 'Tarih', date, 'Tarih', date],
        ['İmza', '', 'İmza', '', 'İmza', '']
      ], { widths: [1.1, 1.6, 1.1, 1.6, 1.1, 1.6], small: true });
    };
    sig();
    D.pageBreak();
    D.placeholder('toc');
    if (R.blocked) D.para(`<b>TASLAK — çözülmemiş sorunlar: ${R.blockers.join('; ')}. Bu sorunlar giderilmeden rapor imzalanmamalıdır.</b>`, { style: 'Body', shade: 'F4CCCC' });

    // ================= 1. GİRİŞ =================
    D.h1('1. GİRİŞ');
    D.p('İnşası planlanan yapının temel zemininin statik ve dinamik deprem etkileri dikkate alınarak yapılan zemin araştırmalarından üretilen arazi zemin modeli ve temel zeminini oluşturan tabakaların geoteknik tasarım parametreleri ile temel tasarımına ilişkin değerlendirmeler bu raporda sunulmuştur.');
    D.p(`İnşaat alanı ${imar.replace(' Ada', ' ada').replace(' Parsel', ' nolu parselde')} yer almaktadır.`);
    D.p('Üst yapı mimari proje, statik proje müellifi firmaları ve veri raporunu hazırlayanların bilgileri aşağıda verilmiştir.');
    D.table([['Proje', 'Müellif'], ['Geoteknik Rapor', t(tm.geo && tm.geo.name)], ['Veri Raporu (Jeoloji)', t(tm.dataJeo || (tm.jeo && tm.jeo.name))], ['Veri Raporu (Jeofizik)', t(tm.dataJfz || (tm.jfz && tm.jfz.name))], ['Statik Proje', t(tm.statik)], ['Mimari Proje', t(tm.mimari)]], { widths: [1, 1.6] });
    D.p('Bu raporun hazırlanmasında zemin ve temel etüdü veri raporu, statik proje, mimari proje ve imar durumu esas alınmıştır.');
    D.p(`İnşa edilecek ${t(pr.storeys)} ${t(pr.system).toLocaleLowerCase('tr-TR')} yapı ${t(pr.usage).toLocaleLowerCase('tr-TR')} amacıyla kullanılacaktır.`);
    D.p('Bu rapor kapsamında aşağıdaki konular ele alınmıştır.');
    ['Geoteknik parametrelerin ve idealize zemin profilinin belirlenmesi', 'SPT düzeltmeleri ve jeofizik değerlendirme', 'Yerel zemin sınıfı ve deprem parametreleri', 'Taşıma gücü hesabı (TBDY 2018, 16.8)', 'Oturma hesabı (elastik, konsolidasyon, Schmertmann)', 'Zemin gerilme analizi', 'Yatak katsayısı hesabı', 'Kayma kontrolü', 'Sondaj derinliği yeterliliği', 'Şişme potansiyeli ve kazı güvenliği değerlendirmesi'].forEach(x => D.bullet(x));

    // ================= 2. İNŞAAT SAHASI =================
    D.h1('2. İNŞAAT SAHASI HAKKINDA BİLGİLER');
    const site = [['Mal Sahibi', t(pr.owner), '[-]'], ['İli', t(pr.il), '[-]'], ['İlçesi', t(pr.ilce), '[-]'], ['Mahallesi', t(pr.mahalle), '[-]'], ['Mevkii', t(pr.mevki), '[-]'], ['Nitelik', t(pr.nitelik), '[-]'], ['Pafta', t(pr.pafta), '[-]'], ['Ada', t(pr.ada), '[-]'], ['Parsel', t(pr.parsel), '[-]'], ['Parsel alanı', n(pr.parselArea), '[m²]'], ['Arazi eğimi', t(pr.slope), '[%]']];
    if (pr.lat) site.push(['Enlem', t(pr.lat), '[°]'], ['Boylam', t(pr.lon), '[°]']);
    ADg(null, site);
    if (P.coords && P.coords.length) D.table([['No', 'Enlem', 'Boylam'], ...P.coords.map((c, i) => [i + 1, t(c.lat), t(c.lon)])], { title: 'Arazi Koordinatları', widths: [1, 3, 3], align: ['center', 'center', 'center'] });

    // ================= 3. YAPI =================
    D.h1('3. YAPI HAKKINDA BİLGİLER');
    ADg(null, [['Bina kat açıklaması', t(pr.storeys), '[-]'], ['Bina kat sayısı', t(pr.nFloors), '[-]'], ['Bina kullanım amacı', t(pr.usage), '[-]'], ['Bina taşıyıcı sistemi', t(pr.system), '[-]'], ['Bina yüksekliği (H<sub>N</sub>)', n(pr.HN), '[m]'], ['Bina oturum alanı', n(pr.footprint), '[m²]'], ['Bina toplam inşaat alanı', n(pr.totalArea), '[m²]'], ['Bina temel kotu', n(pr.foundLevel), '[m]'], ['Bina temel türü', t(F.type) + ' Temel', '[-]'], ['Bina temel genişliği', n(F.B), '[m]'], ['Bina temel uzunluğu', n(F.L), '[m]']]);
    const bks = +pr.bks;
    D.table([['Bina Kullanım Sınıfı', 'Bina Kullanım Amacı', 'Bina Önem Katsayısı (I)'],
      ['BKS = 1', '<b>Deprem sonrası kullanımı gereken binalar, insanların uzun süreli ve yoğun olarak bulunduğu binalar, değerli eşyanın saklandığı binalar ve tehlikeli madde içeren binalar</b>\na) Hastaneler, dispanserler, sağlık ocakları, itfaiye bina ve tesisleri, PTT ve haberleşme tesisleri, ulaşım istasyonları, enerji tesisleri, vilayet, kaymakamlık ve belediye yönetim binaları, ilk yardım ve afet planlama istasyonları\nb) Okullar, diğer eğitim bina ve tesisleri, yurt ve yatakhaneler, askeri kışlalar, cezaevleri\nc) Müzeler\nd) Toksik, patlayıcı, parlayıcı özellikleri olan maddelerin bulunduğu veya depolandığı binalar', '1,5'],
      ['BKS = 2', '<b>İnsanların kısa süreli ve yoğun olarak bulunduğu binalar.</b> Alışveriş merkezleri, spor tesisleri, sinema, tiyatro, konser salonları, ibadethaneler vb.', '1,2'],
      ['BKS = 3', '<b>Diğer binalar.</b> BKS = 1 ve BKS = 2 için verilen tanımlara girmeyen diğer binalar (konutlar, işyerleri, oteller, bina türü endüstri yapıları vb.)', '1,0']],
      { title: 'Bina Kullanım Sınıfları ve Bina Önem Katsayıları', widths: [1.3, 6.5, 1.4], hlRow: bks, small: true, align: ['center', null, 'center'] });
    const by = R.sp.BYS;
    D.table([[{ v: 'Bina Yükseklik Sınıfı', vm: 'start' }, { v: 'Bina Yükseklik Sınıfları ve Deprem Tasarım Sınıflarına Göre Tanımlanan Bina Yükseklik Aralıkları [m]', span: 3 }],
      [{ v: '', vm: 'cont' }, 'DTS = 1, 1a, 2, 2a', 'DTS = 3, 3a', 'DTS = 4, 4a'],
      ['BYS = 1', 'H<sub>N</sub> > 70', 'H<sub>N</sub> > 91', 'H<sub>N</sub> > 105'],
      ['BYS = 2', '56 < H<sub>N</sub> ≤ 70', '70 < H<sub>N</sub> ≤ 91', '91 < H<sub>N</sub> ≤ 105'],
      ['BYS = 3', '42 < H<sub>N</sub> ≤ 56', '56 < H<sub>N</sub> ≤ 70', '56 < H<sub>N</sub> ≤ 91'],
      ['BYS = 4', '28 < H<sub>N</sub> ≤ 42', { v: '42 < H<sub>N</sub> ≤ 56', span: 2 }],
      ['BYS = 5', '17,5 < H<sub>N</sub> ≤ 28', { v: '28 < H<sub>N</sub> ≤ 42', span: 2 }],
      ['BYS = 6', '10,5 < H<sub>N</sub> ≤ 17,5', { v: '17,5 < H<sub>N</sub> ≤ 28', span: 2 }],
      ['BYS = 7', '7 < H<sub>N</sub> ≤ 10,5', { v: '10,5 < H<sub>N</sub> ≤ 17,5', span: 2 }],
      ['BYS = 8', 'H<sub>N</sub> ≤ 7', { v: 'H<sub>N</sub> ≤ 10,5', span: 2 }]],
      { title: 'Bina Yükseklik Sınıfları ve Deprem Tasarım Sınıflarına Göre Tanımlanan Bina Yükseklik Aralıkları', widths: [1.4, 2, 2, 2], headRows: 2, hlRow: by + 1, align: ['center', 'center', 'center', 'center'] });
    D.p(`Bina yüksekliği H<sub>N</sub> = ${n(pr.HN)} m ve deprem tasarım sınıfı DTS = ${R.sp.DTS} için bina yükseklik sınıfı <b>BYS = ${by}</b> olarak belirlenmiştir (TBDY 2018, Tablo 3.3).`);
    const qavg = c => c.N / (F.B * F.L);
    D.table([[...R.bear.map(b => ({ v: `${b.name} Yüklemesi`, span: 3 }))], R.bear.flatMap(() => ['Min.', 'Ort.', 'Maks.']), R.bear.flatMap(b => [n(b.qmin), n(qavg(b)), n(b.qmax)])],
      { title: 'Yapı Temeline Etkiyen Yüklerin Yaklaşık Değerleri [kN/m²]', headRows: 2, small: true, align: Array(9).fill('center') });

    // ================= 4. MEVCUT ARAŞTIRMALAR =================
    D.h1('4. MEVCUT ZEMİN ARAŞTIRMALARI');
    const nSpt = et.nSpt || P.spt.data.filter(d => d.N > 0).length;
    const ex = [['Zemin etüt kategorisi', t(et.cat), '[-]'], ['Veri raporu / sondaj tarihi', t(et.date), '[-]'], ['Sondaj sayısı', t(P.site.nBore), '[Adet]'], ['Sondaj derinliği', t(et.depths || P.site.boreDepth), '[m]'], ['SPT sayısı', t(nSpt), '[Adet]'], ['SPT deney aralığı', n(R.etut.gap, 1), '[m]']];
    const labs = [['masw', 'Jeofizik ölçüm (MASW/ReMi) sayısı'], ['hydro', 'Hidrojeoloji çalışmaları sayısı'], ['wn', 'Su muhtevası (w<sub>n</sub>) deney sayısı'], ['gn', 'Doğal birim hacim ağırlık deney sayısı'], ['gs', 'Özgül ağırlık deney sayısı'], ['sieve', 'Elek analizi deney sayısı'], ['atterberg', 'Kıvam limitleri deney sayısı'], ['shear', 'Kesme kutusu deney sayısı'], ['ucs', 'Serbest basınç deney sayısı'], ['uu', 'Üç eksenli (UU) deney sayısı'], ['oedo', 'Konsolidasyon (ödometre) deney sayısı']];
    labs.forEach(([k, l]) => { if (+et[k] > 0) ex.push([l, t(et[k]), '[Adet]']); });
    ADg(null, ex);
    D.sub('Yapılan Deneylerin Amacı');
    const DEF = {
      spt: ['Standart Penetrasyon Testi (SPT)', 'Standart Penetrasyon Testi; kohezyonsuz zeminlerin sıkılığının ve içsel sürtünme açısının, kohezyonlu zeminlerin ise kıvamının belirlenmesinde kullanılır. 63,5 kg ağırlığındaki şahmerdanın 76 cm yükseklikten düşürülmesiyle numune alıcının son 30 cm\'lik girişi için gereken darbe sayısı (N) ölçülür.'],
      masw: ['Yüzey Dalgası Yöntemleri (MASW / ReMi)', 'Kayma dalgası hızının (V<sub>s</sub>) derinlikle değişimi aktif ve pasif kaynaklı yüzey dalgası yöntemleriyle belirlenir. Yerel zemin sınıfı ve zemin hakim periyodu bu ölçümlerden elde edilir.'],
      hydro: ['Hidrojeoloji Çalışmaları', 'Yeraltı suyu seviyesi ve değişimi, zeminin efektif gerilme durumunu, taşıma gücünü ve sıvılaşma potansiyelini doğrudan etkilediğinden sondaj kuyularında ölçülür.'],
      wn: ['Su Muhtevası (w<sub>n</sub>)', 'Zemindeki suyun ağırlığının katı tanelerin ağırlığına oranıdır.'],
      gn: ['Doğal Birim Hacim Ağırlık (γ<sub>n</sub>)', 'Zeminin doğal haldeki ağırlığının hacmine oranıdır; gerilme hesaplarında kullanılır.'],
      gs: ['Özgül Ağırlık (G<sub>s</sub>)', 'Zemin danelerinin birim hacim ağırlığının suyun birim hacim ağırlığına oranıdır.'],
      sieve: ['Elek Analizi', 'Zeminin belirli göz açıklıklarına sahip eleklerden geçirilerek dane boyu dağılımının belirlenmesidir; iri daneli zeminlerin sınıflandırılmasında ve ince dane oranının bulunmasında kullanılır.'],
      atterberg: ['Kıvam (Atterberg) Limitleri', 'İnce daneli zeminlerin su içeriğine bağlı davranışını tanımlayan likit limit ve plastik limit değerleri belirlenir; zemin sınıflandırması ve şişme değerlendirmesinde kullanılır.'],
      shear: ['Kesme Kutusu Deneyi', 'Zemin numunesi kesme etkisine maruz bırakılarak kohezyon ve içsel sürtünme açısı belirlenir.'],
      ucs: ['Serbest Basınç Deneyi', 'Kohezyonlu zeminlerde drenajsız kayma dayanımının (c<sub>u</sub> = q<sub>u</sub>/2) belirlenmesinde kullanılır.'],
      uu: ['Üç Eksenli (UU) Deney', 'Konsolidasyonsuz-drenajsız koşulda kayma dayanımı parametrelerinin belirlenmesinde kullanılır.'],
      oedo: ['Konsolidasyon (Ödometre) Deneyi', 'Kohezyonlu zeminlerin sıkışabilirlik parametrelerinin (m<sub>v</sub>, C<sub>c</sub>, e<sub>0</sub>) belirlenmesinde kullanılır.']
    };
    ['spt', ...labs.map(l => l[0])].forEach(k => { if (k === 'spt' ? nSpt > 0 : (+et[k] > 0 || (k === 'masw' && P.vs.length))) { D.sub(DEF[k][0]); D.p(DEF[k][1]); } });

    // ================= 5. İLAVE =================
    D.h1('5. İLAVE ZEMİN ARAŞTIRMALARI');
    const eF = R.checks.filter(c => c.mod === 'etut' && c.ok === false);
    if (!eF.length) D.p("Sondaj sayısı ve derinliği, SPT deney aralığı, jeofizik ölçüm ve laboratuvar deneylerinin varlığı bakımından TBDY 2018 Ek 16A ve Tebliğ 7.2.2'deki asgari sayısal koşullar sağlanmaktadır. Numune kalitesi, laboratuvar deney kapsamı, yeraltı suyu gözlemleri ve sahanın temsiliyeti veri raporu üzerinden değerlendirilmiş olup bu koşullar altında ilave zemin araştırmasına gerek görülmemiştir.");
    else { D.p('Mevcut veri raporu aşağıdaki yönlerden yetersiz bulunmuş olup ilave zemin araştırması yapılması önerilir:'); eF.forEach(c => D.bullet(`${c.t}: ${c.v}`)); }

    // ================= 6. İDEALİZE PROFİL =================
    D.h1('6. İDEALİZE ZEMİN PROFİLLERİ (ARAZİ ZEMİN MODELİ) VE YERALTI SUYU DURUMLARI');
    await img(GDRAW.soilColumn(P, R, { w: 700, h: 560 }), 15, 'İdealize zemin kesiti');
    await img(GDRAW.legend(P.layers), 15, 'Tarama lejantı (Tebliğ 2019 EK-6, TS ISO 710)');
    D.sub('TABAKA BİLGİLERİ');
    D.table([['No', 'Adı', 'Kalınlığı [m]', 'Derinliği [m]', 'Zemin Tanımı'], ...P.layers.map((L, i) => [i + 1, `${GSOIL.label(L)} (${n(L.top)}-${n(L.bottom)} m)`, n(L.bottom - L.top), n(L.bottom), L.desc || GSOIL.nameOf(L) || ''])], { widths: [0.6, 2.4, 1.3, 1.3, 3.2], align: ['center', null, 'center', 'center', null] });
    D.p(P.site.yass >= 50 ? 'Sondajlarda yeraltı suyuna rastlanmamıştır. Hesaplarda yeraltı suyu etkisi dikkate alınmamıştır.' : `Yeraltı su seviyesi: ${n(P.site.yass)} [m]. Hesaplarda bu seviyenin altında efektif gerilmeler kullanılmıştır.`);

    // ================= 7. TASARIM PARAMETRELERİ =================
    D.h1('7. GEOTEKNİK TASARIM PARAMETRELERİNİN TESPİTİ');
    D.sub('SEÇİLEN KARAKTERİSTİK GEOTEKNİK TASARIM PARAMETRELERİ');
    D.sub('Genel Zemin Parametreleri');
    D.table([['No', 'Zemin Adı', 'Gerilme Durumu', 'γ<sub>n</sub> [kN/m³]', 'γ<sub>doy</sub> [kN/m³]', "φ' [°]", "c' [kN/m²]", 'c<sub>u</sub> [kN/m²]'],
      ...P.layers.map((L, i) => [i + 1, `${GSOIL.label(L)} (${n(L.top)}-${n(L.bottom)} m)`, L.beh === 'Kohezyonlu' ? 'Toplam / Efektif' : L.beh === 'Kaya' ? 'Kaya' : 'Efektif (Drenajlı)', n(L.gn), n(L.gsat), n(L.phi, 0), n(L.c, 0), L.cu ? n(L.cu, 0) : '–'])],
      { widths: [0.5, 2.2, 1.6, 1, 1, 0.8, 0.9, 0.9], align: ['center', null, 'center', 'center', 'center', 'center', 'center', 'center'], small: true });
    D.legend([["φ'", 'İçsel sürtünme açısı [°]'], ["c'", 'Kohezyon [kN/m²]'], ['c<sub>u</sub>', 'Drenajsız kayma dayanımı [kN/m²]'], ['γ<sub>n</sub>', 'Doğal birim hacim ağırlık [kN/m³]'], ['γ<sub>doy</sub>', 'Suya doygun birim hacim ağırlık [kN/m³]']]);
    D.sub('Oturma Parametreleri');
    D.table([['No', 'Zemin Adı', 'E<sub>s</sub> [MPa]', 'ν [-]', 'm<sub>v</sub> [m²/kN]', 'C<sub>c</sub> [-]', 'e<sub>0</sub> [-]', 'PI [%]'],
      ...P.layers.map((L, i) => [i + 1, `${GSOIL.label(L)} (${n(L.top)}-${n(L.bottom)} m)`, n(L.Es, 1), n(L.nu), L.mv ? Number(L.mv).toExponential(2).replace('.', ',') : '–', L.Cc ? n(L.Cc, 3) : '–', n(L.e0), L.pi ? n(L.pi, 1) : '–'])],
      { widths: [0.5, 2.2, 1, 0.8, 1.3, 0.8, 0.8, 0.8], align: ['center', null, 'center', 'center', 'center', 'center', 'center', 'center'], small: true });
    D.note('E<sub>s</sub>: statik (drenajlı) elastisite modülü. Jeofizik ölçümlerden elde edilen dinamik modül oturma hesabında kullanılmamıştır.');
    { const NM = { gn: 'γn', gsat: 'γdoy', phi: "φ'", c: "c'", cu: 'cu', Es: 'Es', nu: 'ν', mv: 'mv', Cc: 'Cc', e0: 'e0', pi: 'PI', fines: 'İDO' };
      const tl = P.layers.map((L, i) => Array.isArray(L.tip) && L.tip.length ? `${i + 1} no'lu tabaka (${L.tip.map(k => NM[k] || k).join(', ')})` : null).filter(Boolean);
      if (tl.length) D.note('Tipik değer kullanılan parametreler: ' + tl.join('; ') + '. Bu değerler zemin türü ve Tebliğ (2019) EK-5 sıkılık / kıvam / ayrışma sınıfına göre literatürdeki tipik aralıklardan (Peck vd. 1974; Terzaghi ve Peck 1967; Bowles 1996; Carter ve Bentley 1991; Hoek ve Brown 1997) alınmış ön tahminlerdir ve arazi / laboratuvar deney sonuçlarıyla doğrulanmalıdır.'); }

    D.h2('7.1. SPT Düzeltmeleri');
    D.table([['Simge', 'Açıklama', 'Formül', 'Madde'],
      ['N<sub>1,60</sub>', 'Düzeltilmiş darbe sayısı', { v: 'N<sub>1,60</sub> = N·C<sub>N</sub>·C<sub>R</sub>·C<sub>S</sub>·C<sub>B</sub>·C<sub>E</sub>', font: 'Cambria Math' }, 'TBDY Denk. 16B.1'],
      ['N<sub>60</sub>', 'Enerji ve ekipman düzeltmeli ara değer (zemin sınıfı için)', { v: 'N<sub>60</sub> = N·C<sub>E</sub>·C<sub>B</sub>·C<sub>S</sub>·C<sub>R</sub>', font: 'Cambria Math' }, 'Denk. 16B.1 bileşenleri; Denk. 16.2'],
      ['C<sub>R</sub>', 'Tij boyu düzeltmesi', { v: '3–4 m: 0,75 · 4–6 m: 0,85 · 6–10 m: 0,95 · > 10 m: 1,0\nL < 3 m: 0,75 (Youd vd., 2001; Tablo 16B.1\'de tanımlı değil)', font: 'Cambria Math' }, 'TBDY Tablo 16B.1'],
      ['C<sub>N</sub>', 'Örtü yükü düzeltmesi', { v: "C<sub>N</sub> = 9,78·√(1/σ'<sub>v</sub>) ≤ 1,7", font: 'Cambria Math' }, 'TBDY Denk. 16B.2'],
      ['α, β', 'İnce dane düzeltme katsayıları', { v: 'İDO ≤ %5: α = 0, β = 1\n%5 < İDO ≤ %35: α = e<sup>1,76 − 190/İDO²</sup>, β = 0,99 + İDO<sup>1,5</sup>/1000\nİDO ≥ %35: α = 5, β = 1,2', font: 'Cambria Math' }, 'TBDY Denk. 16B.3b'],
      ['N<sub>1,60f</sub>', 'İnce dane düzeltmeli darbe sayısı', { v: 'N<sub>1,60f</sub> = α + β·N<sub>1,60</sub>', font: 'Cambria Math' }, 'TBDY Denk. 16B.3a']],
      { widths: [0.9, 2.4, 4.2, 1.5], align: ['center', null, null, 'center'], small: true });
    D.table([['No', 'z [m]', 'Tabaka', 'N', "σ'<sub>v</sub> [kN/m²]", 'C<sub>E</sub>', 'C<sub>B</sub>', 'C<sub>S</sub>', 'C<sub>R</sub>', 'N<sub>60</sub>', 'C<sub>N</sub>', 'N<sub>1,60</sub>', 'İDO [%]', 'N<sub>1,60f</sub>'],
      ...R.spt.rows.map((d, i) => [i + 1, n(d.z), d.uscs, d.Nraw >= 50 ? '50 (R)' : d.Nraw, n(d.se, 1), n(P.spt.equip.CE), n(P.spt.equip.CB), n(P.spt.equip.CS), n(d.CR), n(d.N60, 1), n(d.CN, 3), n(d.N160, 1), n(d.fines, 0), n(d.N160f, 1)])],
      { title: 'SPT Düzeltme Sonuçları', small: true, align: Array(14).fill('center') });
    D.legend([['N', 'Arazide ölçülen darbe sayısı (son 30 cm)'], ['C<sub>E</sub>', 'Enerji oranı düzeltmesi'], ['C<sub>B</sub>', 'Kuyu çapı düzeltmesi'], ['C<sub>S</sub>', 'Numune alıcı düzeltmesi'], ['İDO', 'İnce dane oranı (No. 200 elekten geçen) [%]']]);

    D.h2('7.2. Jeofizik Ölçümler');
    D.table([['No', 'Üst [m]', 'Alt [m]', 'Kalınlık [m]', 'V<sub>s</sub> [m/sn]'], ...P.vs.map((v, i) => [i + 1, n(v.top), n(v.bottom), n(v.bottom - v.top), n(v.vs, 0)])], { title: 'Kayma Dalgası Hızı Profili', widths: [0.6, 1, 1, 1, 1.2], align: Array(5).fill('center') });
    await img(GDRAW.vsChart(P, R, { w: 380, h: 440 }), 8.5, 'Kayma dalgası hızı (V<sub>s</sub>) profili');

    // ================= 8. DEPREMSELLİK =================
    D.h1('8. DEPREMSELLİK');
    D.p(`İnceleme alanına ait deprem parametreleri Türkiye Deprem Tehlike Haritaları İnteraktif Web Uygulaması (AFAD, TDTH) kullanılarak${pr.lat ? ` (enlem ${pr.lat}, boylam ${pr.lon})` : ''} elde edilmiştir.${pr.faultDist ? ` İnceleme alanının en yakın diri faya uzaklığı ${t(pr.faultDist)} km'dir.` : ''}`);
    if (R.dd.length) D.table([['Deprem Düzeyi', 'S<sub>S</sub>', 'S<sub>DS</sub>', 'S<sub>1</sub>', 'S<sub>D1</sub>', 'PGA [g]', 'PGV [cm/sn]'], ...R.dd.map(d => [d.name, n(d.Ss, 3), n(d.SDS, 3), n(d.S1, 3), n(d.SD1, 3), n(d.PGA, 3), n(d.PGV, 3)])],
      { title: `Deprem Düzeylerine Göre Spektral İvme Katsayıları (Zemin sınıfı ${R.zs})`, align: Array(7).fill('center'), hlRow: R.dd.findIndex(d => d.name === 'DD-2') + 1 });
    const dtsRow = R.sp.SDS < 0.33 ? 1 : R.sp.SDS < 0.5 ? 2 : R.sp.SDS < 0.75 ? 3 : 4;
    D.table([['DD-2 Deprem Yer Hareketi Düzeyinde Kısa Periyot Tasarım Spektral İvme Katsayısı (S<sub>DS</sub>)', 'BKS = 1', 'BKS = 2, 3'],
      ['S<sub>DS</sub> < 0,33', 'DTS = 4a', 'DTS = 4'], ['0,33 ≤ S<sub>DS</sub> < 0,50', 'DTS = 3a', 'DTS = 3'], ['0,50 ≤ S<sub>DS</sub> < 0,75', 'DTS = 2a', 'DTS = 2'], ['0,75 ≤ S<sub>DS</sub>', 'DTS = 1a', 'DTS = 1']],
      { title: 'Deprem Tasarım Sınıfları (DTS)', widths: [5, 1.5, 1.5], hlRow: dtsRow, align: [null, 'center', 'center'] });
    D.p(`DD-2 deprem düzeyi için S<sub>DS</sub> = ${n(R.sp.SDS, 3)} ve BKS = ${bks} olduğundan deprem tasarım sınıfı <b>DTS = ${R.sp.DTS}</b> olarak belirlenmiştir (TBDY 2018, Tablo 3.2).`);
    D.h2('8.1. Sıvılaşma Analizi');
    if (!R.liq.needed) D.p(P.site.yass >= 20 ? `${P.site.yass >= 50 ? 'Sondajlarda yeraltı suyuna rastlanmamıştır.' : `Yeraltı su seviyesi zemin yüzeyinden ${n(P.site.yass)} m derinliktedir.`} TBDY 2018 16.6.2'ye göre sıvılaşma, yeraltı su seviyesinin altında ve yüzeyden 20 m derinliğe kadar olan kohezyonsuz ya da düşük plastisiteli (PI < %12) zeminlerde tanımlandığından, mevcut ölçümlere göre inceleme alanında sıvılaşma değerlendirmesi kapsamına giren koşul bulunmamaktadır. Mevsimsel en yüksek yeraltı su seviyesinin uzun süreli gözlemle doğrulanması önerilir.` : 'Yeraltı su seviyesinin altında yüzeyden 20 m içinde kohezyonsuz veya düşük plastisiteli (PI < %12) tabaka bulunmadığından TBDY 2018 16.6.2 ve 16.6.4 kapsamında sıvılaşma değerlendirmesi gerektiren koşul belirlenmemiştir.');
    else D.p(`<b>Yeraltı su seviyesi ${n(P.site.yass)} m'dir. Su seviyesinin altında, yüzeyden 20 m içinde kalan ${R.liq.layers.join(', ')} tabakaları için TBDY 2018 16.6 ve Ek 16B'ye göre sıvılaşma tetiklenme analizi ${R.liq.mandatory ? '(16.6.1 gereği zorunlu) ' : ''}ayrıca yapılmalıdır.</b>`);
    D.h2('8.2. Yerel Zemin Sınıfının Belirlenmesi');
    const zsRows = [['ZA', 'Sağlam, sert kayalar', '> 1500', '–', '–'], ['ZB', 'Az ayrışmış, orta sağlam kayalar', '760 – 1500', '–', '–'], ['ZC', 'Çok sıkı kum, çakıl ve sert kil tabakaları veya ayrışmış, çok çatlaklı zayıf kayalar', '360 – 760', '> 50', '> 250'], ['ZD', 'Orta sıkı – sıkı kum, çakıl veya çok katı kil tabakaları', '180 – 360', '15 – 50', '70 – 250'], ['ZE', 'Gevşek kum, çakıl veya yumuşak – katı kil tabakaları veya PI > 20 ve w > %40 koşullarını sağlayan toplamda 3 metreden daha kalın yumuşak kil tabakası (c<sub>u</sub> < 25 kPa) içeren profiller', '< 180', '< 15', '< 70'], ['ZF', 'Sahaya özel araştırma ve değerlendirme gerektiren zeminler', '', '', '']];
    D.table([['Yerel Zemin Sınıfı', 'Zemin Cinsi', '(V<sub>s</sub>)<sub>30</sub> [m/sn]', '(N<sub>60</sub>)<sub>30</sub> [darbe/30 cm]', '(c<sub>u</sub>)<sub>30</sub> [kPa]'], ...zsRows],
      { title: 'Yerel Zemin Sınıfları', widths: [1, 4.5, 1.3, 1.3, 1.1], hlRow: zsRows.findIndex(z => z[0] === R.zs) + 1, small: true, align: ['center', null, 'center', 'center', 'center'] });
    D.h3('8.2.1. V<sub>s</sub>(30)\'a Göre Yerel Zemin Sınıfı Tespiti');
    { const Df = F.Df, zEnd = Df + 30, V = P.vs.filter(v => v.vs > 0).sort((a, b) => a.top - b.top); const rows = []; let k = 0;
      V.forEach((v, i) => { const bot = i === V.length - 1 ? Math.max(v.bottom, zEnd) : v.bottom; const h = Math.max(0, Math.min(bot, zEnd) - Math.max(v.top, Df)); if (h > 0) rows.push([++k, n(h), n(Math.min(bot, zEnd) - Df), n(v.vs, 0), n(h / v.vs, 4)]); });
      D.table([['No', 'h<sub>i</sub> [m]', 'z [m]', 'V<sub>s,i</sub> [m/sn]', 'h<sub>i</sub>/V<sub>s,i</sub> [sn]'], ...rows], { widths: [0.6, 1, 1, 1.2, 1.3], align: Array(5).fill('center') }); }
    D.eq('(V<sub>s</sub>)<sub>30</sub> = 30 / Σ(h<sub>i</sub> / V<sub>s,i</sub>)');
    D.p(`<b>V<sub>s</sub>(30) = ${n(R.vs30, 0)} m/sn → ${t(R.zsVs)}</b>. Hesap temel tabanından itibaren 30 m derinlik için yapılmıştır (TBDY 2018, 16.4.2).`);
    D.p(`SPT verisine göre (N<sub>60</sub>)<sub>30</sub> = ${n(R.spt.N30, 1)} → ${t(R.zsN)}. ${R.zsVs && R.zsN && R.zsVs !== R.zsN ? 'İki yöntem farklı sınıf vermektedir; TBDY 16.3.7 yöntemler arasında öncelik tanımlamadığından seçim gerekçelendirilmiş ve karşılaştırma spektrumu aşağıda verilmiştir. ' : ''}Tasarımda yerel zemin sınıfı <b>${R.zs}</b> olarak alınmıştır.`);
    if (R.cu30) D.p(`Üst 30 m kohezyonlu olduğundan (c<sub>u</sub>)<sub>30</sub> = ${n(R.cu30, 0)} kPa → ${R.zsCu} olarak da hesaplanmıştır (Denk. 16.2).`);
    if (R.zsUnknown) D.p('<b>Zemin sınıfını belirleyecek V<sub>s</sub>, SPT veya c<sub>u</sub> verisi bulunmamaktadır.</b>');
    D.h3('8.2.2. Tasarım Spektrumu');
    D.table([['S<sub>S</sub>', 'S<sub>1</sub>', 'F<sub>S</sub>', 'F<sub>1</sub>', 'S<sub>DS</sub>', 'S<sub>D1</sub>', 'T<sub>A</sub> [sn]', 'T<sub>B</sub> [sn]', 'T<sub>L</sub> [sn]'], [n(P.seis.Ss, 3), n(P.seis.S1, 3), n(R.sp.Fs, 3), n(R.sp.F1, 3), n(R.sp.SDS, 3), n(R.sp.SD1, 3), n(R.sp.TA, 3), n(R.sp.TB, 3), n(R.sp.TL, 0)]], { title: 'DD-2 Tasarım Spektrumu Parametreleri', align: Array(9).fill('center') });
    await img(GDRAW.spectrumChart(R, { w: 560, h: 330 }), 14, 'Yatay elastik tasarım spektrumu (DD-2)');
    if (R.T0) D.p(`Zemin hakim titreşim periyodu, ilk 30 m için T<sub>0</sub> = 4·Σ(h<sub>i</sub>/V<sub>s,i</sub>) = <b>${n(R.T0, 3)} sn</b> olarak hesaplanmıştır.`);

    // ================= 9. YAPI ZEMİN ETKİLEŞİMİ =================
    D.h1('9. YAPI ZEMİN ETKİLEŞİMİ');
    D.h2('9.1. Temel Bilgileri');
    await img(GDRAW.foundationSchematic(P, { w: 700, h: 280 }), 15, 'Temel geometrisi şematik gösterimi');
    ADB(null, [['Temel türü', '[-]', t(F.type) + ' Temel', '[-]'], ['Temel genişliği', '[L<sub>x</sub>]', n(F.B), '[m]'], ['Temel uzunluğu', '[L<sub>y</sub>]', n(F.L), '[m]'], ['Temel kalınlığı', '[h]', n(F.t), '[m]'], ['Temel gömülme derinliği', '[D<sub>f</sub>]', n(F.Df), '[m]'], ['Temel taban eğimi', '[α]', '0', '[°]']]);
    D.sub('Yükleme kombinasyonlarına göre efektif temel boyutları');
    R.bear.forEach(b => { D.sub(b.name); ADB(null, [['Dışmerkezlik (x)', '[e<sub>x</sub>]', n(b.eB, 3), '[m]'], ['Dışmerkezlik (y)', '[e<sub>y</sub>]', n(b.eL, 3), '[m]'], ["Efektif temel genişliği", "[B']", n(b.Bp), '[m]'], ["Efektif temel uzunluğu", "[L']", n(b.Lp), '[m]'], ['Efektif temel alanı', "[A']", n(b.Ap), '[m²]']]); });
    D.note("B' = B − 2e<sub>x</sub>, L' = L − 2e<sub>y</sub> (Meyerhof etkin alan yaklaşımı, TBDY 2018 16.8.3)");

    D.h2('9.2. Yük Bilgileri');
    await img(GDRAW.loadSchematic(P, { w: 520, h: 260 }), 10, 'Yük bilgisi şematik gösterimi');
    R.bear.forEach((b, i) => { const c = cmb[i]; D.sub(b.name); ADB(null, [['Temel taban basıncı', '[q<sub>o</sub>]', n(b.qo), '[kN/m²]'], ['Temel dahil toplam düşey yük', '[N]', n(c.N), '[kN]'], ['X yönündeki yatay kuvvet', '[V<sub>x</sub>]', n(c.HB), '[kN]'], ['Y yönündeki yatay kuvvet', '[V<sub>y</sub>]', n(c.HL), '[kN]'], ['X yönünde dışmerkezlik yaratan moment', '[M<sub>x</sub>]', n(c.MB), '[kNm]'], ['Y yönünde dışmerkezlik yaratan moment', '[M<sub>y</sub>]', n(c.ML), '[kNm]']]); });
    D.p(`Oturma hesabında kullanılan servis yükü (G+Q): N = ${n(P.loads.Nserv)} kN.`);

    D.h2('9.3. Taşıma Gücü');
    await img(GDRAW.bearingSection(P, R, { w: 820, h: 420 }), 15.5, 'Zemin taşıma kapasitesi mekanizması');
    D.p(`Taşıma gücü TBDY 2018 16.8'e göre etkin temel alanı yöntemiyle, ${des.undr ? `drenajsız koşulda (φ = 0, c<sub>u</sub> = ${n(des.cu, 0)} kN/m²)` : `drenajlı koşulda (φ' = ${n(des.phi, 0)}°, c' = ${n(des.c, 0)} kN/m²)`} hesaplanmıştır.`);
    if (R.screen && R.screen.length) {
      D.p(`TBDY 2018 16.8.3.3 gereği, temel tabanından itibaren yaklaşık ${n(R.screenDepth, 1)} m derinliğe kadar (kırılma bölgesi) yer alan her tabakanın parametreleriyle kritik kombinasyonda (${bc.name}) karakteristik taşıma gücü ayrıca hesaplanmıştır:`);
      D.table([['Tabaka', 'Derinlik [m]', "φ' [°]", "c' [kN/m²]", 'c<sub>u</sub> [kN/m²]', 'q<sub>k</sub> [kN/m²]'], ...R.screen.map(s => [s.uscs + (s.undrained ? ' (drenajsız)' : ''), `${n(s.top)} – ${n(s.bottom)}`, s.undrained ? '–' : n(s.phi, 0), s.undrained ? '–' : n(s.c, 0), s.undrained ? n(s.cu, 0) : '–', n(s.qk, 0)]), [{ v: 'Tasarım parametreleri', b: true }, '', des.undr ? '–' : n(des.phi, 0), des.undr ? '–' : n(des.c, 0), des.undr ? n(des.cu, 0) : '–', { v: n(bc.qk, 0), b: true }]], { title: 'Kırılma Bölgesindeki Tabakalara Göre Taşıma Gücü Taraması', widths: [1.5, 1.5, 0.9, 1, 1, 1.2], align: [null, 'center', 'center', 'center', 'center', 'center'] });
      D.p(R.screenOk ? 'Tasarımda kullanılan parametreler, kırılma bölgesindeki tabakaların her biri için hesaplanan değerlerden daha elverişsiz veya eşit sonuç vermektedir.' : '<b>Kırılma bölgesindeki tabakalardan biri tasarım parametrelerinden daha düşük taşıma gücü vermektedir; tasarım parametreleri gözden geçirilmeli veya tabakalı zemin yöntemiyle hesap yapılmalıdır.</b>');
    }
    R.bear.forEach((b, i) => {
      D.sub(b.name);
      const F_ = v => ({ v, font: 'Cambria Math' });
      D.table([['Simge', 'Yöntem', 'Formül', 'Değer'],
        ['N<sub>q</sub>', 'TBDY', F_(b.phi === 0 ? 'φ = 0: N<sub>q</sub> = 1' : "N<sub>q</sub> = e<sup>π·tanφ'</sup>·tan²(45 + φ'/2)"), n(b.Nq, 3)],
        ['N<sub>c</sub>', 'TBDY', F_(b.phi === 0 ? 'N<sub>c</sub> = π + 2' : "N<sub>c</sub> = (N<sub>q</sub> − 1)·cotφ'"), n(b.Nc, 3)],
        ['N<sub>γ</sub>', 'TBDY', F_(b.phi === 0 ? 'N<sub>γ</sub> = 0' : "N<sub>γ</sub> = 2(N<sub>q</sub> − 1)·tanφ'"), n(b.Ng, 3)]], { title: null, widths: [0.9, 1.4, 5, 1.2], align: ['center', 'center', null, 'center'] });
      D.sub('Temel şekil katsayıları');
      D.table([['Simge', 'Yöntem', 'Formül', 'Değer'], ['s<sub>c</sub>', 'De Beer', F_("s<sub>c</sub> = 1 + (B'/L')·(N<sub>q</sub>/N<sub>c</sub>)"), n(b.sc, 3)], ['s<sub>q</sub>', 'De Beer', F_("s<sub>q</sub> = 1 + (B'/L')·tanφ'"), n(b.sq, 3)], ['s<sub>γ</sub>', 'De Beer', F_("s<sub>γ</sub> = 1 − 0,4·(B'/L') ≥ 0,6"), n(b.sg, 3)]], { widths: [0.9, 1.4, 5, 1.2], align: ['center', 'center', null, 'center'] });
      D.sub('Derinlik katsayıları');
      D.table([['Simge', 'Yöntem', 'Formül', 'Değer'], ['d<sub>c</sub>', 'Hansen', F_("d<sub>c</sub> = 1 + 0,4·k;  k = D<sub>f</sub>/B' (D<sub>f</sub>/B' ≤ 1), k = atan(D<sub>f</sub>/B') (D<sub>f</sub>/B' > 1)"), n(b.dc, 3)], ['d<sub>q</sub>', 'Hansen', F_("d<sub>q</sub> = 1 + 2·tanφ'·(1 − sinφ')²·k"), n(b.dq, 3)], ['d<sub>γ</sub>', 'Hansen', F_('d<sub>γ</sub> = 1'), n(b.dg, 3)]], { widths: [0.9, 1.4, 5, 1.2], align: ['center', 'center', null, 'center'] });
      D.sub('Yükleme eğikliği katsayıları');
      D.table([['Simge', 'Yöntem', 'Formül', 'Değer'], ['β', 'Meyerhof', F_('β = atan(V / N)'), n(b.beta, 2) + '°'], ['i<sub>c</sub>, i<sub>q</sub>', 'Meyerhof', F_('i<sub>c</sub> = i<sub>q</sub> = (1 − β/90)²'), n(b.ic, 3)], ['i<sub>γ</sub>', 'Meyerhof', F_("i<sub>γ</sub> = (1 − β/φ')²"), n(b.ig, 3)]], { widths: [0.9, 1.4, 5, 1.2], align: ['center', 'center', null, 'center'] });
      D.sub('TAŞIMA GÜCÜ');
      D.eq("q<sub>k</sub> = c·N<sub>c</sub>·s<sub>c</sub>·d<sub>c</sub>·i<sub>c</sub> + q·N<sub>q</sub>·s<sub>q</sub>·d<sub>q</sub>·i<sub>q</sub> + 0,5·γ'·B'·N<sub>γ</sub>·s<sub>γ</sub>·d<sub>γ</sub>·i<sub>γ</sub>   (TBDY 2018 − 16.8a)");
      D.eq(`q<sub>k</sub> = ${n(b.c, 1)}·${n(b.Nc)}·${n(b.sc)}·${n(b.dc)}·${n(b.ic)} + ${n(b.q, 1)}·${n(b.Nq)}·${n(b.sq)}·${n(b.dq)}·${n(b.iq)} + 0,5·${n(b.gam, 1)}·${n(b.Bp)}·${n(b.Ng)}·${n(b.sg)}·${n(b.dg)}·${n(b.ig)} = ${n(b.qk)} kN/m²`);
      D.table([['Açıklama', 'Yöntem', 'Simge', 'Değer', 'Birim'], ['Temel taşıma gücünün karakteristik dayanımı', 'TBDY', 'q<sub>k</sub>', n(b.qk), '[kN/m²]'], ['Temel tasarım taşıma gücü (γ<sub>Rv</sub> = 1,4)', 'TBDY', 'q<sub>t</sub>', n(b.qt), '[kN/m²]']], { widths: [4.2, 1, 0.9, 1.3, 1.2], align: [null, 'center', 'center', 'center', 'center'] });
      D.table([['Yöntem', 'Değer', 'Sonuç'], ['TBDY', `q<sub>o</sub> = ${n(b.qo)} ≤ q<sub>t</sub> = ${n(b.qt)}`, OK(b.ok)]], { title: null, widths: [1.2, 4, 1.4], align: ['center', 'center', 'center'] });
      if (i === 0) D.legend([['q', "Temel taban seviyesindeki efektif örtü gerilmesi [kN/m²]"], ["γ'", 'Temel altı zeminin efektif birim hacim ağırlığı [kN/m³]'], ["B', L'", 'Efektif temel boyutları [m]'], ['q<sub>o</sub>', "Tasarım düşey yükü altında etkin alandaki ortalama taban basıncı, N/A' [kN/m²]"], ['γ<sub>Rv</sub>', 'Düşey taşıma gücü dayanım katsayısı (TBDY Tablo 16.2)']]);
    });
    D.sub('Taban basıncı dağılımı (bilgi)');
    D.table([['Kombinasyon', '6e<sub>x</sub>/B + 6e<sub>y</sub>/L', 'Temas durumu', 'q<sub>max</sub> [kN/m²]', 'q<sub>min</sub> [kN/m²]'], ...R.bear.map(b => [b.name, n(b.core), b.core <= 1 ? 'Tam temas' : `Kısmi temas (%${n(b.contact * 100, 0)})`, n(b.qmax), n(b.qmin)])], { widths: [1.6, 1.6, 1.8, 1.3, 1.3], align: [null, 'center', 'center', 'center', 'center'] });

    D.h2('9.4. Oturma Analizi');
    D.table([['Ölçüt', 'Zemin Türü', 'Tekil / Sürekli Temel', 'Radye Temel'], ['Maksimum oturma', 'Kil', '65 mm', '65 – 100 mm'], ['', 'Kum', '40 mm', '40 – 65 mm'], ['Maksimum farklı oturma', 'Kil', '40 mm', '–'], ['', 'Kum', '25 mm', '–'], ['Açısal distorsiyon', '–', '1/300', '1/300']], { title: 'Müsaade Edilebilir Oturmalar (Skempton ve MacDonald, 1956)', widths: [2.4, 1.3, 2, 2], align: [null, 'center', 'center', 'center'] });
    const S = R.sett;
    D.p(`Oturma hesabı servis yükü (G+Q) altında, net temel basıncı ile temel merkezi altında yapılmıştır. Gerilme artışı Boussinesq çözümü (dikdörtgen alan köşe çözümü × 4) ile ${n(S.zmax, 1)} m derinliğe kadar ${S.prof.length} dilimde hesaplanmıştır.`);
    ADB('Net Temel Basıncı', [['Servis düşey yükü', '[N]', n(P.loads.Nserv), '[kN]'], ['Brüt taban basıncı', '[q]', n(S.qbr), '[kN/m²]'], ['Temel tabanındaki örtü gerilmesi', '[σ<sub>v</sub>(D<sub>f</sub>)]', n(des.svDf), '[kN/m²]'], ['Net temel basıncı', '[q<sub>net</sub>]', n(S.qnet), '[kN/m²]']]);
    const byL = {}; S.prof.forEach(p => { const k = p.li; byL[k] = byL[k] || { li: k, z1: p.zb, z2: p.zb, ds: 0, n: 0, el: 0, co: 0 }; const o = byL[k]; o.z2 = p.zb; o.ds += p.ds; o.n++; o.el += p.el * P.sett.rig; o.co += p.co * P.sett.rig; });
    const dzh = S.zmax / S.prof.length / 2;
    D.table([['No', 'Tabaka', 'Derinlik (tabandan) [m]', 'Δσ<sub>ort</sub> [kN/m²]', 'E<sub>s</sub> [MPa]', 'S<sub>e</sub> [mm]', 'S<sub>c</sub> [mm]'],
      ...Object.values(byL).map((o, i) => { const L = P.layers[o.li]; return [i + 1, `${GSOIL.label(L)} (${n(L.top)}-${n(L.bottom)} m)`, `${n(o.z1 - dzh)} – ${n(o.z2 + dzh)}`, n(o.ds / o.n, 1), n(L.Es, 1), n(o.el), n(o.co)]; }),
      [{ v: 'Toplam', span: 5, b: true, align: 'right' }, { v: n(S.Sel), b: true }, { v: n(S.Scon), b: true }]],
      { title: 'Tabakalara Göre Oturma', widths: [0.5, 2.2, 1.8, 1.3, 1, 1, 1], align: ['center', null, 'center', 'center', 'center', 'center', 'center'], small: true });
    D.eq('S<sub>e</sub> = Σ Δσ<sub>i</sub>·Δz<sub>i</sub> / E<sub>s,i</sub>        S<sub>c</sub> = Σ m<sub>v,i</sub>·Δσ<sub>i</sub>·Δz<sub>i</sub>');
    D.table([['Yöntem', 'Oturma [mm]', 'Açıklama'], ['Elastik (Boussinesq + E<sub>s</sub>)', n(S.Sel, 1), 'Ani oturma'], ['Konsolidasyon (m<sub>v</sub> / C<sub>c</sub>)', n(S.Scon, 1), 'Kohezyonlu tabakalar'], [{ v: 'Toplam oturma', b: true }, { v: n(S.Stot, 1), b: true }, P.sett.rig !== 1 ? `Rijitlik düzeltmesi ${n(P.sett.rig)}` : 'Esnek temel merkezi'], ['Schmertmann (1978), kontrol', n(R.sch.Se, 1), `C<sub>1</sub> = ${n(R.sch.C1, 3)}, C<sub>2</sub> = ${n(R.sch.C2, 3)}, I<sub>z,max</sub> = ${n(R.sch.Izm, 3)}`]], { title: 'Oturma Analizi Sonuçları', widths: [3, 1.4, 4], align: [null, 'center', null] });
    D.table([['Açıklama', 'Değer', 'Sonuç'], ['Toplam oturma ≤ müsaade edilen oturma', `${n(S.Stot, 1)} mm ≤ ${n(P.sett.allow, 0)} mm`, OK(S.ok)]], { title: 'Oturma Analizi Sonuç Kontrolü', widths: [3.5, 3, 1.4], align: [null, 'center', 'center'] });
    await img(GDRAW.izChart(R, { w: 300, h: 420 }), 6.5, 'Schmertmann birim deformasyon etki faktörü (I<sub>z</sub>) diyagramı');

    D.h2('9.5. Zemin Gerilme Analizi');
    D.p('Temel yükünden kaynaklanan gerilme artışı (Δσ), dikdörtgen yüklü alanın köşesi altındaki Boussinesq (Newmark, 1935) çözümünün süperpozisyonu ile temel merkezi altında hesaplanmıştır.');
    D.eq('Δσ = 4·q<sub>net</sub>·I(m, n),   m = (B/2)/z,   n = (L/2)/z');
    D.table([['z (tabandan) [m]', 'Tabaka', 'Δσ [kN/m²]', "σ'<sub>v</sub> [kN/m²]", "0,1·σ'<sub>v</sub> [kN/m²]", "Δσ/σ'<sub>v</sub>"], ...S.prof.filter((_, i) => i % 3 === 0).map(p => [n(p.zb), p.uscs, n(p.ds, 1), n(p.se, 1), n(p.s10, 1), n(p.ds / p.se, 3)])], { title: 'Derinlikle Gerilme Değişimi', small: true, align: Array(6).fill('center') });
    await img(GDRAW.settChart(R, P, { w: 420, h: 420 }), 9, "Gerilme artışı (Δσ) ve 0,1·σ'<sub>v</sub> etki derinliği");

    D.h2('9.6. Yatak Katsayısı');
    D.table([['Zemin Cinsi', 'k<sub>s</sub> [kN/m³]'], ['Gevşek kum', '4.800 – 16.000'], ['Orta sıkı kum', '9.600 – 80.000'], ['Sıkı kum', '64.000 – 128.000'], ['Killi orta sıkı kum', '32.000 – 80.000'], ['Siltli orta sıkı kum', '24.000 – 48.000'], ['Killi zemin, q<sub>u</sub> ≤ 200 kPa', '12.000 – 24.000'], ['Killi zemin, 200 < q<sub>u</sub> ≤ 800 kPa', '24.000 – 48.000'], ['Killi zemin, q<sub>u</sub> > 800 kPa', '> 48.000']], { title: 'Çeşitli Zeminler için Yatak Katsayısı Değerleri (Bowles, 1996)', widths: [3, 2], align: [null, 'center'] });
    const K = R.ks, nuB = des.layer.nu || 0.3;
    D.table([['Yöntem', 'Formül', 'k<sub>s</sub> [kN/m³]', 'k<sub>s</sub> [t/m³]'],
      ['Oturma uyumlu', { v: 'k<sub>s</sub> = q<sub>net</sub> / S', font: 'Cambria Math' }, n(K.ks1, 0), n(K.ks1 / 9.81, 0)],
      ['Bowles (1996)', { v: 'k<sub>s</sub> = 40·q<sub>k</sub>', font: 'Cambria Math' }, n(K.ks2, 0), n(K.ks2 / 9.81, 0)],
      ['Vesic (1961)', { v: 'k<sub>s</sub> = E<sub>s</sub> / [B·(1 − ν²)]', font: 'Cambria Math' }, n(K.ks3, 0), n(K.ks3 / 9.81, 0)]], { title: 'Yatak Katsayısı Hesap Sonuçları', widths: [2, 3.4, 1.5, 1.5], align: [null, null, 'center', 'center'] });
    D.p(`Hesap girdileri: q<sub>net</sub> = ${n(S.qnet)} kN/m², S = ${n(S.Stot, 1)} mm, q<sub>k</sub> (statik) = ${n(R.bear[0].qk)} kN/m², E<sub>s,eş</sub> = ${n(S.EsEq, 1)} MPa, B = ${n(Math.min(F.B, F.L))} m, ν = ${n(nuB)}.`);
    D.p(`Yöntemler arasında ${n(K.ratio, 1)} kat fark bulunmaktadır. Bowles bağıntısı plaka ölçeğinde 25 mm oturmayı esas aldığından geniş temellerde yatak katsayısını yüksek verir; oturma uyumlu değer ise bu temelin gerçek boyutu ve yükünü yansıtır. Bu nedenle radye temelin statik çözümünün <b>alt sınır k<sub>s</sub> = ${n(K.lo, 0)} kN/m³ (${n(K.lo / 9.81, 0)} t/m³)</b> ve <b>üst sınır k<sub>s</sub> = ${n(K.hi, 0)} kN/m³ (${n(K.hi / 9.81, 0)} t/m³)</b> ile ayrı ayrı yapılması ve donatının iki çözümün zarfına göre belirlenmesi önerilir.`);

    D.h2('9.7. Kayma Kontrolü');
    const Kp = Math.pow(Math.tan((45 + (P.layers[0].phi || 0) / 2) * Math.PI / 180), 2);
    D.table([['Yükleme', 'Yöntem', 'P<sub>tv</sub> [kN] / A<sub>c</sub> [m²]', 'tanδ / c<sub>u</sub>', 'R<sub>th</sub> [kN]', 'R<sub>pt</sub> [kN]', 'V<sub>th</sub> [kN]', 'R<sub>th</sub>+0,3R<sub>pt</sub> [kN]', 'Sonuç'],
      ...R.slide.map((s, i) => [s.name, s.undrained ? 'Drenajsız (16.11)' : 'Drenajlı (16.10)', s.undrained ? `${n(s.Ac, 1)} (${s.AcNote})` : n(cmb[i].N, 0), s.undrained ? n(s.undrained && !des.undr ? des.layer.cu : des.cu, 0) : n(P.slide.tand), n(s.Rth, 0), n(s.Rpt, 0), n(s.Vth, 0), n(s.cap, 0), OK(s.ok)])],
      { widths: [1.4, 1.1, 0.7, 0.7, 1.1, 1, 1, 1.4, 1.1], small: true, align: [null, 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'] });
    D.eq(des.undr ? "V<sub>th</sub> ≤ R<sub>th</sub> + 0,3·R<sub>pt</sub>,   R<sub>th</sub> = A<sub>c</sub>·c<sub>u</sub> / γ<sub>Rh</sub>   (TBDY 2018 − 16.9, 16.11)" : 'V<sub>th</sub> ≤ R<sub>th</sub> + 0,3·R<sub>pt</sub>,   R<sub>th</sub> = P<sub>tv</sub>·tanδ / γ<sub>Rh</sub>   (TBDY 2018 − 16.9, 16.10)');
    D.legend([['P<sub>tv</sub>', 'Temel tabanına etkiyen tasarım düşey kuvveti [kN]'], ['tanδ', 'Temel tabanı ile zemin arasındaki sürtünme katsayısı; TBDY Tablo 16.3 değerlerinden büyük alınmaz (yerinde dökme beton – sıkıştırılmış taban zemini 0,6)'], ['γ<sub>Rh</sub>', 'Sürtünme direnci dayanım katsayısı (1,1)'], ['R<sub>th</sub>', 'Tasarım sürtünme direnci [kN]'], ['R<sub>pt</sub>', `Tasarım pasif direnci, R<sub>pk</sub>/1,4 [kN]${P.slide.usePassive ? ` (K<sub>p</sub> = ${n(Kp, 3)})` : ' — hesapta dikkate alınmamıştır'}`], ['V<sub>th</sub>', 'Temel tabanında etkiyen tasarım yatay kuvveti [kN]'], ['A<sub>c</sub>', 'Temel altında basınç gerilmesi oluşan alan [m²] (iki yönlü kısmi temasta güvenli tarafta A\' alınmıştır)']]);
    if (P.slide.usePassive) D.note(`Pasif direnç TBDY'de tarif edilmediğinden literatür modeli kullanılmıştır (Rankine): R<sub>pk</sub> = b·∫K<sub>p</sub>(z)·σ'<sub>v</sub>(z)dz, gömülme derinliği boyunca; b yatay kuvvete dik temel yüzü genişliğidir. Birim genişlik için ∫ = ${n(R.passiveLine, 1)} kN/m.`);

    D.h2('9.8. Sondaj Derinliği');
    const B = Math.min(F.B, F.L), E = R.etut;
    D.table([['Yöntem', 'Açıklama', 'Sondaj derinliği [m]'],
      ['Temel genişliğine bağlı', `D<sub>f</sub> + 1,5·B = ${n(F.Df)} + 1,5·${n(B)}`, n(F.Df + 1.5 * B)],
      ['Zemin gerilmesine bağlı (bilgi)', `Δσ = 0,10·q<sub>net</sub> (${n(0.1 * S.qnet, 1)} kN/m²)`, S.z10n != null ? n(F.Df + S.z10n) : `> ${n(F.Df + S.zmax)}`],
      ['Efektif gerilmeye bağlı', "Δσ = 0,10·σ'<sub>vo</sub>", S.z10 != null ? n(F.Df + S.z10) : `> ${n(F.Df + S.zmax)}`],
      ['Su seviyesine bağlı', E.rule20 ? 'YASS tabandan 10 m içinde ve gevşek/sıvılaşabilir zemin → tabandan en az 20 m' : 'YASS tabandan 10 m içinde değil; koşul oluşmadı (TBDY 16A.1.4d, Tebliğ 7.2.2.2b-11)', E.rule20 ? n(F.Df + 20) : '–'],
      [{ v: 'Gerekli sondaj derinliği', b: true }, 'Yukarıdakilerden elverişsiz olanı (TBDY 16A.1.4)', { v: n(E.dReq), b: true }],
      ['Mevcut sondaj derinliği', P.site.rock3m ? 'Sağlam tabakaya en az 3 m girilmiştir (16A.1.4a)' : '', n(P.site.boreDepth)]],
      { widths: [2, 4.6, 1.6], align: [null, null, 'center'] });
    D.p(R.checks.find(c => c.t === 'Sondaj derinliği').ok ? 'Mevcut sondaj derinlikleri yeterlidir.' : '<b>Mevcut sondaj derinlikleri yetersizdir; ilave sondaj önerilir.</b>');

    D.h2('9.9. Önerilen Temel Sistemi');
    D.p(`İnşası planlanan yapının kat yüksekliği, yükleri ve oturtulacağı alanın zemin koşulları ile depremselliği göz önünde bulundurularak ${t(F.type).toLocaleLowerCase('tr-TR')} temel sisteminin uygun mühendislik çözümü olduğu düşünülmektedir.`);
    D.p(`${t(F.type)} temel için tasarım taşıma gücü (TBDY − q<sub>t</sub>): statik ${n(R.bear[0].qt)} kN/m², en küçük değer ${n(R.qtMin)} kN/m² (${R.qtMinName}); kullanım oranı en yüksek kombinasyon ${bc.name} (q<sub>o</sub>/q<sub>t</sub> = ${n(bc.qo / bc.qt)}).`);

    D.h2('9.10. Yapı Temelleri ile İlgili Diğer Hususlar');
    if (R.swell.length) {
      D.sub('Şişme Potansiyeli');
      D.eq('S (%) = 60·3,6·10<sup>−5</sup>·PI<sup>2,44</sup>   (Seed, Woodward ve Lundgren, 1962)');
      D.table([['Tabaka', 'PI [%]', 'Şişme potansiyeli [%]', 'Sınıf'], ...R.swell.map(x => [x.uscs, n(x.pi, 1), n(x.S, 1), x.cls])], { widths: [2, 1, 1.6, 1.4], align: [null, 'center', 'center', 'center'] });
      const smax = Math.max(...R.swell.map(x => x.S));
      D.p(smax >= 1.5 ? 'Aktif zonda şişme potansiyeli bulunan tabaka mevcuttur. Temel altına granüler dolgu yapılması, bina çevresinde drenaj ve yüzey suyu kontrolü sağlanması ve gerekirse şişme basıncı deneyi yapılması önerilir.' : 'Aktif zonda kayda değer şişme potansiyeli bulunmamaktadır.');
    }
    D.bullet('Temel çevre dolgusunda geçirimliliği yüksek, çakıllı malzeme kullanılması önerilir.');
    D.bullet('Yüzey sularının temel zeminine sızmasını önlemek için bina çevresinde drenaj önlemleri alınmalıdır.');
    D.bullet('Temel kazısı tamamlandığında taban zemini proje müellifince kontrol edilmeli; bu raporda kabul edilenden farklı bir zeminle karşılaşılması halinde rapor müellifine bilgi verilmelidir.');

    // ================= 10. KAZI =================
    D.h1('10. KAZI GÜVENLİĞİ VE İKSA DEĞERLENDİRMESİ');
    if (F.Df > 1.75) {
      D.bullet("Çevre ve Şehircilik Bakanlığı'nın 2018 yılında yayınladığı 'Kazı Güvenliği ve Alınacak Önlemler' genelgesine göre, 1,75 m'den derin kazılarda kazının uygun şev açıları verilerek şevli yapılması veya kazıdan önce iksa sistemi inşa edilerek yatay toprak basınçlarının karşılanması zorunludur.");
      D.bullet(`Planlanan kazı derinliği ${n(F.Df)} m olduğundan kazı şev açıları ve komşu yapılara olan mesafe proje aşamasında ayrıca değerlendirilmeli, gerekli hallerde şev duraylılık analizi ve iksa projesi hazırlanmalıdır.`);
    } else {
      D.bullet(`Temel kazı derinliği ${n(F.Df)} m olup 1,75 m'den azdır; 'Kazı Güvenliği ve Alınacak Önlemler' genelgesi kapsamında iksa zorunluluğu bulunmamaktadır.`);
    }
    D.bullet('Kazı şevlerinde akma, göçme ve çökme risklerine karşı kazının kontrollü ve gözetim altında açılması, açık kalma süresinin kısa tutulması ve kazı kenarında 2 m genişliğinde yüksüz bölge bırakılması tavsiye olunur.');
    D.bullet('Komşu parsellerde yapılacak bodrum kazılarının bu yapının temeline etkisi, kazı derinliği kadar mesafe içinde kalıyorsa ayrıca değerlendirilmelidir.');

    // ================= 11. SONUÇ =================
    D.h1('11. SONUÇ VE ÖNERİLER');
    const lays = P.layers.map(L => `${n(L.top)}–${n(L.bottom)} m arasında ${(L.desc || GSOIL.nameOf(L) || L.uscs).toLocaleLowerCase('tr-TR')} (${GSOIL.label(L)})`).join(', ');
    D.bullet(`İnceleme alanında yapılan sondajlarda zemin profili ${lays} şeklinde idealize edilmiştir.`);
    D.bullet(!R.liq.needed ? `${P.site.yass >= 50 ? 'Sondajlarda yeraltı suyuna rastlanmamıştır' : `Yeraltı su seviyesi ${n(P.site.yass)} m'dir`}; mevcut ölçümlere göre TBDY 16.6.2 kapsamında sıvılaşma değerlendirmesi gerektiren koşul bulunmamaktadır.` : `Yeraltı su seviyesi ${n(P.site.yass)} m'dir; ${R.liq.layers.join(', ')} tabakaları için sıvılaşma değerlendirmesi ayrıca yapılmalıdır.`);
    D.bullet(`Yerel zemin sınıfı <b>${R.zs}</b>'dir (V<sub>s</sub>(30) = ${n(R.vs30, 0)} m/sn${R.spt.N30 ? `, (N<sub>60</sub>)<sub>30</sub> = ${n(R.spt.N30, 1)}` : ''}).`);
    R.bear.forEach(b => D.bullet(`${b.name} yüklemesinde taban basıncı q<sub>o</sub> = ${n(b.qo)} kN/m², tasarım taşıma gücü q<sub>t</sub> = ${n(b.qt)} kN/m² olup taşıma gücü ${b.ok ? 'yeterlidir' : '<b>yetersizdir</b>'}.`));
    D.bullet(`Servis yükü altında toplam oturma ${n(S.Stot, 1)} mm olarak hesaplanmış olup müsaade edilen ${n(P.sett.allow, 0)} mm sınırının ${S.ok ? 'altındadır' : '<b>üzerindedir</b>'}.`);
    D.bullet(R.slide.some(s => s.ok === false) ? '<b>Kayma kontrolünde yetersizlik bulunmuştur.</b>' : R.slide.some(s => s.ok == null) ? '<b>Bazı kombinasyonlarda kayma kontrolü drenajsız dayanım verisi olmadığından yapılamamıştır (TBDY 16.8.4.6).</b>' : 'Yapının X ve Y yönlerinde yapılan kayma kontrolünde TBDY 16.8.4 koşulu sağlanmaktadır.');
    D.bullet(`Radye temel statik çözümü için yatak katsayısının alt sınır ${n(K.lo / 9.81, 0)} t/m³ ve üst sınır ${n(K.hi / 9.81, 0)} t/m³ değerleriyle zarf analizi şeklinde kullanılması önerilir.`);
    D.bullet(`İnşası planlanan ${t(pr.storeys)} ${t(pr.system).toLocaleLowerCase('tr-TR')} yapının ${t(F.type).toLocaleLowerCase('tr-TR')} temel üzerine oturtulması uygun görülmüştür.`);
    if (R.dd.length) {
      D.bullet('Yapının bulunduğu konum, yerel zemin sınıfı ve deprem düzeyleri için ivme katsayıları:');
      D.table([['Deprem Düzeyi', 'S<sub>S</sub>', 'S<sub>DS</sub>', 'S<sub>1</sub>', 'S<sub>D1</sub>', 'PGA', 'PGV'], ...R.dd.map(d => [d.name, n(d.Ss, 3), n(d.SDS, 3), n(d.S1, 3), n(d.SD1, 3), n(d.PGA, 3), n(d.PGV, 3)])], { align: Array(7).fill('center'), hlRow: R.dd.findIndex(d => d.name === 'DD-2') + 1 });
      R.dd.forEach(d => D.para(`${d.name} deprem düzeyi için Deprem Tasarım Sınıfı: <b>DTS-${d.DTS}</b>`, { style: 'Legend', indent: 567 }));
    }
    R.warn.filter(w => /^TBDY 16\.(4\.3|8\.3\.3|8\.3\.4|8\.4\.6)|sıvılaşma değerlendirmesi|Tablo 16\.1 ZF|Vs ölçümü|Vs profilinde|Tij boyu/.test(w) || /^YASS/.test(w)).forEach(w => D.bullet(w.replace(/; bu sürüm sıvılaşma hesabı yapmaz\./, '.')));
    ADg(`${t(F.type)} Temel ve Üst Yapı Statik Hesaplarına Esas Olacak Parametreler`, [
      ['Taşıma gücü dayanımı (TBDY − q<sub>t</sub>, statik)', n(R.bear[0].qt), '[kN/m²]'], [`Taşıma gücü dayanımı (TBDY − q<sub>t</sub>, en küçük: ${R.qtMinName})`, n(R.qtMin), '[kN/m²]'],
      ['Yatak katsayısı — alt sınır (oturma uyumlu)', n(K.lo, 0), '[kN/m³]'], ['Yatak katsayısı — üst sınır', n(K.hi, 0), '[kN/m³]'], ['Toplam oturma (servis)', n(S.Stot, 1), '[mm]'],
      ['Zemin hakim titreşim periyodu (T<sub>0</sub>)', n(R.T0, 3), '[sn]'], ['Yerel zemin sınıfı', R.zs, '[-]'], ['Deprem yer hareketi düzeyi', 'DD-2', '[-]'],
      ['Kısa periyot tasarım spektral ivme katsayısı (S<sub>DS</sub>)', n(R.sp.SDS, 3), '[-]'], ['1 sn periyot tasarım spektral ivme katsayısı (S<sub>D1</sub>)', n(R.sp.SD1, 3), '[-]'],
      ['Deprem tasarım sınıfı', 'DTS-' + R.sp.DTS, '[-]'], ['Bina kullanım sınıfı (BKS)', t(pr.bks), '[-]'], ['Bina yükseklik sınıfı (BYS)', t(R.sp.BYS), '[-]'],
      ...(pr.lat ? [['Enlem', t(pr.lat), '[°]'], ['Boylam', t(pr.lon), '[°]']] : [])]);
    D.p('Bu geoteknik rapor, veri raporunda verilen arazi ve laboratuvar deneyleri, harita ve vaziyet planı çalışmaları ile yerinde yapılan incelemeler esas alınarak hazırlanmıştır. Arazi ve laboratuvar deney sonuçlarının doğruluğundan çalışmayı yapan ilgili kişi veya firma sorumludur. İmalat sırasında bu raporda kabul edilen zemin koşullarından farklı bir durumla karşılaşılması halinde rapor müellifi ile temasa geçilmelidir.', { spacing: [200, 200] });
    sig();

    // ================= 12. KAYNAKLAR =================
    D.h1('12. KAYNAKLAR', { pageBefore: true });
    ['Türkiye Bina Deprem Yönetmeliği (TBDY), 2018.', 'Çevre ve Şehircilik Bakanlığı (2019). Zemin ve Temel Etüdü Uygulamalarına İlişkin Tebliğ ve Rapor Formatı.', 'TMMOB İnşaat Mühendisleri Odası (2018). TBDY-2018 Uygulama Eğitimi Seminerleri El Kitabı.', 'Bowles, J.E. (1996). Foundation Analysis and Design, 5th ed. McGraw-Hill.', 'Das, B.M. (2010). Principles of Foundation Engineering, 7th ed. Cengage.', 'Meyerhof, G.G. (1963). Some recent research on the bearing capacity of foundations. Canadian Geotechnical Journal 1(1).', 'Hansen, J.B. (1970). A revised and extended formula for bearing capacity. Danish Geotechnical Institute Bulletin 28.', 'Vesic, A.S. (1973). Analysis of ultimate loads of shallow foundations. ASCE JSMFD 99(1).', 'Schmertmann, J.H., Hartman, J.P., Brown, P.R. (1978). Improved strain influence factor diagrams. ASCE JGED 104(8).', 'Skempton, A.W., MacDonald, D.H. (1956). The allowable settlements of buildings. Proc. ICE 5(6).', 'Skempton, A.W. (1986). Standard penetration test procedures. Géotechnique 36(3).', 'Seed, H.B., Woodward, R.J., Lundgren, R. (1962). Prediction of swelling potential for compacted clays. ASCE JSMFD 88(3).', 'Uzuner, B.A. (2007). Temel Zemin Mekaniği, 7. Baskı. Derya Kitabevi.'].forEach(k => D.bullet(k));

    // ================= EKLER =================
    D.h1('13. EKLER');
    ['EK-1: ARAŞTIRMA NOKTALARI VAZİYET PLANI', 'EK-2: SONDAJ LOGLARI', 'EK-3: LABORATUVAR DENEY SONUÇLARI ÖZET TABLOLARI', 'EK-4: JEOFİZİK (MASW) ÖLÇÜM SONUÇLARI'].forEach((e, i) => { D.para(`<b>${e}</b>`, { style: 'ListTitle', pageBefore: i > 0 }); D.note('Veri raporundan eklenecektir.'); });
    return D.build();
  }
  root.GREPORT = { build };
})(typeof window !== 'undefined' ? window : globalThis);
