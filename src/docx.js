/* Tarayıcıda .docx üretimi: küçük ZIP (store) yazıcı + WordprocessingML oluşturucu. Harici kütüphane yok. */
(function (root) {
  'use strict';
  // ---------- ZIP ----------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  const enc = new TextEncoder();
  function zip(files) { // files: [{name, data: Uint8Array|string}]
    const parts = [], cen = []; let off = 0;
    const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    for (const f of files) {
      const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, name = enc.encode(f.name), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, tm, true); h.setUint16(12, dt, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, tm, true); c.setUint16(14, dt, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      cen.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    }
    const cenSize = cen.reduce((a, b) => a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cenSize, true); e.setUint32(16, off, true);
    const all = [...parts, ...cen, new Uint8Array(e.buffer)], total = all.reduce((a, b) => a + b.length, 0), out = new Uint8Array(total);
    let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
    return out;
  }

  // ---------- HTML parçası → Word run'ları ----------
  const xesc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  function runs(html, base = {}) {
    const out = [], st = [Object.assign({}, base)];
    String(html == null ? '' : html).split(/(<\/?(?:sub|sup|b|i|strong|em|br|span)\b[^>]*>)/i).forEach(tok => {
      if (!tok) return;
      const m = tok.match(/^<(\/?)(sub|sup|b|i|strong|em|br|span)\b[^>]*>$/i);
      if (m) {
        const tag = m[2].toLowerCase(), close = !!m[1];
        if (tag === 'br') { out.push('<w:r><w:br/></w:r>'); return; }
        if (close) { if (st.length > 1) st.pop(); return; }
        const s = Object.assign({}, st[st.length - 1]);
        if (tag === 'sub') s.va = 'subscript'; else if (tag === 'sup') s.va = 'superscript'; else if (tag === 'b' || tag === 'strong') s.b = true; else if (tag === 'i' || tag === 'em') s.i = true;
        st.push(s); return;
      }
      const s = st[st.length - 1], t = decode(tok);
      let pr = '';
      if (s.font) pr += `<w:rFonts w:ascii="${s.font}" w:hAnsi="${s.font}" w:cs="${s.font}"/>`;
      if (s.b) pr += '<w:b/>'; if (s.i) pr += '<w:i/>';
      if (s.color) pr += `<w:color w:val="${s.color}"/>`;
      if (s.sz) pr += `<w:sz w:val="${s.sz}"/><w:szCs w:val="${s.sz}"/>`;
      if (s.va) pr += `<w:vertAlign w:val="${s.va}"/>`;
      out.push(`<w:r>${pr ? '<w:rPr>' + pr + '</w:rPr>' : ''}<w:t xml:space="preserve">${xesc(t)}</w:t></w:r>`);
    });
    return out.join('');
  }

  // ---------- Belge (TEKŞAHLAR / GEOTEKNİKPRO düzeni) ----------
  const BLUE = '365F91', HEAD = 'F0F0F0', HIL = 'F5CD58', LINE = 'A6A6A6';
  const TEXTW = 9356; // A4 - (1700 + 850)
  class Doc {
    constructor(meta = {}) { this.body = []; this.media = []; this.meta = meta; this.heads = []; this.tabs = []; this.figs = []; this.ph = {}; }
    para(html, o = {}) {
      let pp = '';
      if (o.style) pp += `<w:pStyle w:val="${o.style}"/>`;
      if (o.keep) pp += '<w:keepNext/>';
      if (o.pageBefore) pp += '<w:pageBreakBefore/>';
      if (o.shade) pp += `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>`;
      if (o.indent) pp += `<w:ind w:left="${o.indent}"${o.hanging ? ` w:hanging="${o.hanging}"` : ''}/>`;
      if (o.spacing) pp += `<w:spacing w:before="${o.spacing[0]}" w:after="${o.spacing[1]}"/>`;
      if (o.align) pp += `<w:jc w:val="${o.align}"/>`;
      this.body.push(`<w:p>${pp ? '<w:pPr>' + pp + '</w:pPr>' : ''}${runs(html, o.run || {})}</w:p>`);
      return this;
    }
    h1(t, o = {}) { this.heads.push({ lvl: 1, t }); return this.para(t, Object.assign({ style: 'Heading1' }, o)); }
    h2(t) { this.heads.push({ lvl: 2, t }); return this.para(t, { style: 'Heading2' }); }
    h3(t) { this.heads.push({ lvl: 3, t }); return this.para(t, { style: 'Heading3' }); }
    sub(t) { return this.para(`<b>${t}</b>`, { style: 'SubHead', keep: true }); }
    p(t, o = {}) { return this.para(t, Object.assign({ style: 'Body' }, o)); }
    note(t) { return this.para(t, { style: 'Note' }); }
    bullet(t) { return this.para('•\t' + t, { style: 'Bullet' }); }
    legend(items) { this.para('Burada,', { style: 'Body', keep: true, spacing: [120, 40] }); items.forEach(([s, t]) => this.para(`<b>${s}</b> : ${t}`, { style: 'Legend' })); return this; }
    eq(html) { return this.para(html, { style: 'Eq', run: { font: 'Cambria Math' } }); }
    pageBreak() { this.body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>'); return this; }
    placeholder(key) { this.ph[key] = this.body.length; this.body.push(''); return this; }
    fill(key, xml) { this.body[this.ph[key]] = xml; }
    caption(kind, title) {
      if (kind === 'tab') { this.tabs.push(title); this.para(`<b>Tablo–${this.tabs.length}: ${title}</b>`, { style: 'TabCap', keep: true }); }
    }
    // cell: string | {v, fill, span, b, align, hl}
    table(rows, o = {}) {
      if (o.title) this.caption('tab', o.title);
      const ncol = o.widths ? o.widths.length : Math.max(...rows.map(r => r.reduce((a, c) => a + ((c && c.span) || 1), 0)));
      const ws = o.widths || Array(ncol).fill(1), tot = ws.reduce((a, b) => a + b, 0), total = o.width || TEXTW;
      const w = ws.map(x => Math.round(x / tot * total));
      const hdrN = o.header === false ? 0 : (o.headRows || 1);
      const bd = `<w:top w:val="single" w:sz="6" w:space="0" w:color="${LINE}"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="${LINE}"/><w:right w:val="nil"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D9D9D9"/><w:insideV w:val="nil"/>`;
      let x = `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/>${o.center ? '<w:jc w:val="center"/>' : ''}<w:tblLayout w:type="fixed"/><w:tblBorders>${o.noBorder ? '<w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/>' : bd}</w:tblBorders><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${w.map(v => `<w:gridCol w:w="${v}"/>`).join('')}</w:tblGrid>`;
      rows.forEach((r, i) => {
        const hdr = i < hdrN;
        x += `<w:tr><w:trPr>${hdr ? '<w:tblHeader/>' : ''}<w:cantSplit/></w:trPr>`;
        let col = 0;
        r.forEach(c => {
          const cell = (c !== null && typeof c === 'object') ? c : { v: c };
          const span = cell.span || 1, cw = w.slice(col, col + span).reduce((a, b) => a + b, 0); col += span;
          const fill = cell.hl || (o.hlRow != null && o.hlRow === i) ? HIL : hdr ? HEAD : (cell.fill || (o.firstColFill && col === span ? HEAD : null));
          const al = cell.align || (hdr ? 'center' : (o.align ? o.align[col - span] : null));
          x += `<w:tc><w:tcPr><w:tcW w:w="${cw}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}${cell.vm ? `<w:vMerge${cell.vm === 'start' ? ' w:val="restart"' : ''}/>` : ''}${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ''}<w:vAlign w:val="center"/></w:tcPr>`;
          const lines = String(cell.v == null ? '' : cell.v).split('\n');
          lines.forEach(line => { x += `<w:p><w:pPr><w:pStyle w:val="${o.small ? 'TableSmall' : 'TableText'}"/>${al ? `<w:jc w:val="${al}"/>` : ''}</w:pPr>${runs(line, (hdr || cell.b) ? { b: true, font: cell.font } : (cell.font ? { font: cell.font } : {}))}</w:p>`; });
          x += '</w:tc>';
        });
        x += '</w:tr>';
      });
      x += '</w:tbl>';
      this.body.push(x);
      this.body.push('<w:p><w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr></w:p>');
      return this;
    }
    image(png, pxW, pxH, cmW, caption) {
      const n = this.media.length + 1, id = 'rIdImg' + n, cx = Math.round(cmW * 360000), cy = Math.round(cx * pxH / pxW);
      this.media.push({ name: `image${n}.png`, data: png, id });
      this.body.push(`<w:p><w:pPr><w:pStyle w:val="Figure"/><w:keepNext/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n + 10}" name="Şekil ${n}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${n + 10}" name="image${n}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`);
      if (caption) { this.figs.push(caption); this.para(`<b>Şekil-${this.figs.length}</b> ${caption}`, { style: 'Caption' }); }
      return this;
    }
    // İçindekiler ve listeler (TEKŞAHLAR'daki gibi numaralı satırlar, sayfa no yok)
    tocXML() {
      const rows = this.heads.map(h => { const m = h.t.match(/^([\d.]+)\.?\s+(.*)$/); const no = m ? m[1].replace(/\.$/, '') : '', txt = m ? m[2] : h.t; return { lvl: h.lvl, no, txt }; });
      const save = this.body; this.body = [];
      this.para('<b>İÇİNDEKİLER</b>', { style: 'TocTitle' });
      const tw = TEXTW;
      let x = `<w:tbl><w:tblPr><w:tblW w:w="${tw}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="${LINE}"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="${LINE}"/><w:right w:val="nil"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:insideV w:val="nil"/></w:tblBorders><w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="${tw}"/></w:tblGrid>`;
      rows.forEach(r => { x += `<w:tr><w:tc><w:tcPr><w:tcW w:w="${tw}" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:pStyle w:val="TocLine"/><w:tabs><w:tab w:val="left" w:pos="${(r.lvl - 1) * 340 + 400 + (r.lvl > 1 ? 300 : 0)}"/></w:tabs><w:ind w:left="${(r.lvl - 1) * 340}"/></w:pPr>${runs(r.no)}<w:r><w:tab/></w:r>${runs(r.txt)}</w:p></w:tc></w:tr>`; });
      x += '</w:tbl>';
      this.body.push(x);
      this.body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      const lst = (title, pre, arr) => { this.para(`<b>${title}</b>`, { style: 'ListTitle' }); arr.forEach((t, i) => this.para(`${pre}${i + 1}:\t${t}`, { style: 'ListLine' })); };
      if (this.meta.annexes && this.meta.annexes.length) lst('EK LİSTESİ', 'EK-', this.meta.annexes);
      lst('TABLO LİSTESİ', 'Tablo-', this.tabs);
      lst('ŞEKİL LİSTESİ', 'Şekil-', this.figs);
      this.body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      const out = this.body.join(''); this.body = save; return out;
    }
    build() {
      if (this.ph.toc != null) this.fill('toc', this.tocXML());
      const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
      const sect = `<w:sectPr><w:headerReference w:type="default" r:id="rIdHdr"/><w:footerReference w:type="default" r:id="rIdFtr"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1133" w:right="850" w:bottom="1133" w:left="1700" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>`;
      const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${this.body.join('')}${sect}</w:body></w:document>`;
      const hl = (lab, val) => `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0"/></w:pPr>${runs(`<b>${lab}</b> ${val}`, { sz: 17, font: 'Arial' })}</w:p>`;
      const header = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}><w:tbl><w:tblPr><w:tblW w:w="${TEXTW}" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="${TEXTW}"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="${TEXTW}" w:type="dxa"/></w:tcPr>${hl('Proje Adı :', xesc(this.meta.header || ''))}${hl('İmar Bilgileri', xesc(this.meta.headerRight || ''))}</w:tc></w:tr></w:tbl><w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p></w:hdr>`;
      const footer = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}><w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="8" w:space="4" w:color="000000"/></w:pBdr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>- - - -</w:t></w:r></w:p><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
      const font = 'Times New Roman';
      const pst = (id, name, ppr, rpr, extra = '') => `<w:style w:type="paragraph" w:styleId="${id}"${id === 'Normal' ? ' w:default="1"' : ''}><w:name w:val="${name}"/>${id !== 'Normal' ? '<w:basedOn w:val="Normal"/>' : ''}${extra}<w:pPr>${ppr}</w:pPr><w:rPr>${rpr}</w:rPr></w:style>`;
      const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}" w:eastAsia="${font}"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="tr-TR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>` +
        pst('Normal', 'Normal', '', '') +
        pst('Body', 'Gövde', '<w:spacing w:before="0" w:after="160"/><w:jc w:val="both"/>', '') +
        pst('CoverTitle', 'Kapak başlık', '<w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/>', `<w:b/><w:color w:val="${BLUE}"/><w:sz w:val="32"/>`) +
        pst('CoverSub', 'Kapak alt', '<w:jc w:val="center"/><w:spacing w:before="120" w:after="120"/>', '<w:b/><w:sz w:val="22"/>') +
        pst('Heading1', 'heading 1', '<w:keepNext/><w:spacing w:before="240" w:after="160"/><w:outlineLvl w:val="0"/>', `<w:b/><w:color w:val="${BLUE}"/><w:sz w:val="27"/>`, '<w:next w:val="Body"/>') +
        pst('Heading2', 'heading 2', '<w:keepNext/><w:spacing w:before="200" w:after="120"/><w:outlineLvl w:val="1"/>', `<w:b/><w:color w:val="${BLUE}"/><w:sz w:val="24"/>`, '<w:next w:val="Body"/>') +
        pst('Heading3', 'heading 3', '<w:keepNext/><w:spacing w:before="160" w:after="100"/><w:outlineLvl w:val="2"/>', `<w:b/><w:color w:val="${BLUE}"/><w:sz w:val="22"/>`, '<w:next w:val="Body"/>') +
        pst('SubHead', 'Ara başlık', '<w:keepNext/><w:spacing w:before="160" w:after="80"/>', '<w:b/>') +
        pst('TabCap', 'Tablo başlığı', '<w:keepNext/><w:spacing w:before="160" w:after="80"/>', '<w:b/>') +
        pst('Caption', 'caption', '<w:jc w:val="center"/><w:spacing w:before="60" w:after="200"/>', '<w:sz w:val="20"/>') +
        pst('Figure', 'Şekil', '<w:jc w:val="center"/><w:spacing w:before="120" w:after="0"/>', '') +
        pst('Eq', 'Denklem', '<w:jc w:val="center"/><w:spacing w:before="80" w:after="80"/>', '<w:sz w:val="22"/>') +
        pst('Note', 'Not', '<w:spacing w:before="0" w:after="100"/>', '<w:i/><w:color w:val="595959"/><w:sz w:val="18"/>') +
        pst('Legend', 'Simge açıklaması', '<w:spacing w:before="0" w:after="20"/>', '<w:sz w:val="20"/>') +
        pst('Bullet', 'Madde', '<w:tabs><w:tab w:val="left" w:pos="567"/></w:tabs><w:ind w:left="567" w:hanging="283"/><w:spacing w:before="0" w:after="80"/><w:jc w:val="both"/>', '') +
        pst('TableText', 'Tablo metni', '<w:spacing w:before="0" w:after="0"/>', '<w:sz w:val="20"/><w:szCs w:val="20"/>') +
        pst('TableSmall', 'Tablo küçük', '<w:spacing w:before="0" w:after="0"/>', '<w:sz w:val="17"/><w:szCs w:val="17"/>') +
        pst('TocTitle', 'İçindekiler başlık', '<w:jc w:val="center"/><w:spacing w:before="240" w:after="240"/>', `<w:b/><w:color w:val="${BLUE}"/><w:sz w:val="24"/>`) +
        pst('TocLine', 'İçindekiler satır', '<w:spacing w:before="20" w:after="20"/>', '<w:sz w:val="20"/>') +
        pst('ListTitle', 'Liste başlık', '<w:spacing w:before="240" w:after="120"/>', `<w:b/><w:color w:val="${BLUE}"/><w:sz w:val="22"/>`) +
        pst('ListLine', 'Liste satır', '<w:tabs><w:tab w:val="left" w:pos="1134"/></w:tabs><w:ind w:left="1134" w:hanging="1134"/><w:spacing w:before="20" w:after="20"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="D9D9D9"/></w:pBdr>', '<w:sz w:val="20"/>') +
        `</w:styles>`;
      const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
      const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
      const drels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSt" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdHdr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFtr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${this.media.map(m => `<Relationship Id="${m.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`).join('')}</Relationships>`;
      const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
      const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xesc(this.meta.title || 'Geoteknik rapor')}</dc:title><dc:creator>${xesc(this.meta.author || '')}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>`;
      return zip([
        { name: '[Content_Types].xml', data: ct }, { name: '_rels/.rels', data: rels }, { name: 'docProps/core.xml', data: core },
        { name: 'word/document.xml', data: document }, { name: 'word/styles.xml', data: styles }, { name: 'word/header1.xml', data: header }, { name: 'word/footer1.xml', data: footer },
        { name: 'word/_rels/document.xml.rels', data: drels }, ...this.media.map(m => ({ name: 'word/media/' + m.name, data: m.data }))
      ]);
    }
  }
  root.GDOCX = { Doc, zip, crc32, runs };
})(typeof window !== 'undefined' ? window : globalThis);
