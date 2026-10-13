// Builds the signed agreement PDF: client details, the agreement text,
// consent choices and the signature with its audit details.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const NAVY = rgb(0.09, 0.106, 0.251);
const INK = rgb(0.133, 0.141, 0.2);
const GREY = rgb(0.42, 0.435, 0.5);
const LAV = rgb(0.569, 0.518, 0.851);
const A4 = [595.28, 841.89];
const M = 56; // margin

// Standard PDF fonts use WinAnsi encoding: swap or drop anything outside it.
const clean = (s) => String(s == null ? '' : s)
  .replace(/[‘’]/g, '’').replace(/[“”]/g, '"')
  .replace(/→/g, '->').replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ–—’•€…]/g, '');

export const formatPounds = (pence) => '£' + (pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const ukTime = (iso) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
export const ukDate = (isoDate) => new Date(isoDate + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'long', year: 'numeric' });

export async function buildAgreementPdf({ agreement, agreementSha256, rec, signaturePng, logoPng }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${agreement.title} – ${rec.id}`);
  pdf.setAuthor('Properfy');
  pdf.setSubject(`Signed by ${rec.client_name}`);
  pdf.setCreator('properfy.co.uk/get-started');
  pdf.setCreationDate(new Date(rec.signed_at));

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await pdf.embedPng(logoPng);
  const sig = await pdf.embedPng(signaturePng);

  let page, y, pageTop;
  const width = A4[0] - M * 2;
  const newPage = () => {
    page = pdf.addPage(A4);
    y = A4[1] - M;
    const lw = 118, lh = lw * logo.height / logo.width;
    page.drawImage(logo, { x: M, y: y - lh, width: lw, height: lh });
    const label = 'Welcome & Payment Agreement';
    page.drawText(label, { x: A4[0] - M - font.widthOfTextAtSize(label, 8.5), y: y - lh + 4, size: 8.5, font, color: GREY });
    y -= lh + 10;
    page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 1.2, color: LAV });
    y -= 22;
    pageTop = y;
  };
  const ensure = (h) => { if (y - h < M + 30) newPage(); };
  const lines = (text, f, size, w = width) => {
    const out = [];
    for (const para of clean(text).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const test = line ? line + ' ' + word : word;
        if (f.widthOfTextAtSize(test, size) <= w) line = test;
        else {
          if (line) out.push(line);
          // Break very long words (e.g. user agents).
          let wd = word;
          while (f.widthOfTextAtSize(wd, size) > w) {
            let cut = wd.length;
            while (cut > 1 && f.widthOfTextAtSize(wd.slice(0, cut), size) > w) cut--;
            out.push(wd.slice(0, cut));
            wd = wd.slice(cut);
          }
          line = wd;
        }
      }
      out.push(line);
    }
    return out;
  };
  const text = (t, { f = font, size = 10, color = INK, gap = 4, x = M, w = width, lead = 1.4 } = {}) => {
    for (const l of lines(t, f, size, w)) {
      ensure(size * lead);
      page.drawText(l, { x, y: y - size, size, font: f, color });
      y -= size * lead;
    }
    y -= gap;
  };
  // Agreement blocks: paragraphs (strings), {h} subheadings, {list} and {table} (first row is the header).
  const block = (b, hSize = 10.5) => {
    if (typeof b === 'string') return text(b, { size: 10, gap: 6 });
    if (b.h) { ensure(34); return text(b.h, { f: bold, size: hSize, color: NAVY, gap: 3 }); }
    if (b.list) {
      for (const li of b.list) {
        const l = lines(li, font, 10, width - 14);
        ensure(l.length * 14);
        page.drawText('•', { x: M + 3, y: y - 10, size: 10, font, color: INK });
        l.forEach((ln, i) => page.drawText(ln, { x: M + 14, y: y - 10 - i * 14, size: 10, font, color: INK }));
        y -= l.length * 14 + 3;
      }
      y -= 4;
    }
    if (b.table) {
      const tw = 300, rowH = 19;
      ensure(rowH * b.table.length + 10);
      b.table.forEach((r, i) => {
        const f = i ? font : bold, size = i ? 10 : 8.5, color = i ? INK : GREY;
        const [k, v] = r.map(clean);
        page.drawText(k, { x: M, y: y - 12, size, font: f, color });
        page.drawText(v, { x: M + tw - f.widthOfTextAtSize(v, size), y: y - 12, size, font: f, color });
        y -= rowH;
        page.drawLine({ start: { x: M, y: y + 3 }, end: { x: M + tw, y: y + 3 }, thickness: 0.5, color: LAV });
      });
      y -= 10;
    }
  };
  const row = (k, v) => {
    const kw = 150;
    const vl = lines(v, font, 9.5, width - kw);
    ensure(vl.length * 13.5);
    page.drawText(clean(k), { x: M, y: y - 9.5, size: 9.5, font: bold, color: NAVY });
    vl.forEach((l, i) => page.drawText(l, { x: M + kw, y: y - 9.5 - i * 13.5, size: 9.5, font, color: INK }));
    y -= vl.length * 13.5 + 3;
  };

  newPage();
  text(agreement.title, { f: bold, size: 17, color: NAVY, gap: 2 });
  if (agreement.subtitle) text(agreement.subtitle, { size: 11, color: NAVY, gap: 2 });
  text(`Reference ${rec.id} · Agreement version ${agreement.version}`, { size: 9, color: GREY, gap: 14 });

  text('Your details', { f: bold, size: 11.5, color: NAVY, gap: 4 });
  row('Client', rec.client_name);
  row('Email', rec.client_email);
  row('Property postcode', rec.property_postcode);
  row('Transaction', rec.transaction_label);
  row('Initial payment', formatPounds(rec.amount_pence));
  row('Payment method', rec.payment_method === 'card' ? 'Card (Stripe secure checkout)' : 'Bank transfer (reference: property postcode)');
  y -= 10;

  for (const b of agreement.intro || []) block(b, 11.5);
  y -= 4;
  for (const s of agreement.sections) {
    ensure(40);
    text(s.heading, { f: bold, size: 11.5, color: NAVY, gap: 3 });
    for (const b of s.blocks) block(b);
    y -= 4;
  }
  if (agreement.closing) {
    ensure(60);
    if (y < pageTop) { // no divider straight under the page header
      page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 0.6, color: LAV });
      y -= 14;
    }
    for (const b of agreement.closing) block(b, 11.5);
  }

  ensure(120);
  y -= 6;
  text('Your choices', { f: bold, size: 11.5, color: NAVY, gap: 4 });
  text(`[x] ${agreement.acceptConsent}`, { size: 9.5, gap: 6 });
  text(`[${rec.early_start_requested ? 'x' : ' '}] ${agreement.earlyStartConsent}`, { size: 9.5, gap: 6 });
  text(rec.early_start_requested
    ? `The client asked for work to begin during the cooling-off period. The cooling-off period ends on ${ukDate(rec.cancellation_period_ends)}.`
    : `The client did not ask for an early start. Properfy will not begin work until the cooling-off period has ended on ${ukDate(rec.cancellation_period_ends)}. Work may begin on ${ukDate(rec.services_may_start)}.`, { size: 9.5, color: NAVY, gap: 14 });

  ensure(170);
  text('Signature', { f: bold, size: 11.5, color: NAVY, gap: 6 });
  const sw = Math.min(220, sig.width), sh = sw * sig.height / sig.width;
  const boxH = Math.min(sh, 90);
  const boxW = boxH * sig.width / sig.height;
  page.drawRectangle({ x: M, y: y - boxH - 12, width: Math.max(boxW, 160) + 16, height: boxH + 12, borderColor: LAV, borderWidth: 0.8, color: rgb(1, 1, 1) });
  page.drawImage(sig, { x: M + 8, y: y - boxH - 6, width: boxW, height: boxH });
  y -= boxH + 22;
  row('Signed by', `${rec.client_name} (${rec.signature_method === 'typed' ? 'typed signature' : 'drawn signature'})`);
  row('Signed at', `${ukTime(rec.signed_at)} (${rec.signed_at} UTC)`);
  row('IP address', rec.signer_ip || 'Not recorded');
  row('Browser', rec.signer_user_agent || 'Not recorded');
  row('Agreement version', agreement.version);
  row('Agreement fingerprint', `SHA-256 ${agreementSha256}`);

  // Appendix (the cancellation form) on its own page, so it can be printed and posted.
  if (agreement.appendix) {
    newPage();
    for (const b of agreement.appendix) {
      const field = typeof b === 'string' && b.match(/^(.*?)\s*…{3,}$/);
      if (field) { // a field to fill in: its label, then ruled lines to write on
        text(field[1], { size: 10.5, gap: 0 });
        for (let i = 0; i < (/address/i.test(field[1]) ? 2 : 1); i++) {
          ensure(26);
          y -= 22;
          page.drawLine({ start: { x: M, y }, end: { x: A4[0] - M, y }, thickness: 0.6, color: GREY });
        }
        y -= 16;
      } else if (typeof b === 'string') text(b, { size: 10.5, gap: 12 });
      else block(b, 14);
    }
  }

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const foot = `Properfy · info@properfy.co.uk · properfy.co.uk · ${rec.id} · Page ${i + 1} of ${pages.length}`;
    p.drawText(clean(foot), { x: M, y: 30, size: 7.5, font, color: GREY });
  });
  return pdf.save();
}
