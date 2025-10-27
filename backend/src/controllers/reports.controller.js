import { prisma } from '../db/prisma.js';
import { stringify } from 'csv-stringify/sync';

export async function inventoryReportController(_req, res) {
  const lots = await prisma.productLot.findMany({ include: { product: true }, orderBy: { expiryDate: 'asc' } });
  const nearDays = Number(process.env.NEAR_EXPIRY_DAYS || 7);
  const now = new Date();
  const warnDate = new Date(now.getTime() + nearDays * 86400000);
  res.json(lots.map((l) => ({
    productId: l.productId,
    product: l.product.name,
    lotId: l.id,
    lotCode: l.lotCode,
    quantity: l.quantity,
    entryDate: l.entryDate,
    expiryDate: l.expiryDate,
    nearExpiry: l.expiryDate ? l.expiryDate <= warnDate : false,
  })));
}

export async function remesasReportController(req, res) {
  const { from, to, alumno, producto } = req.query;
  const where = { status: 'confirmado' };
  if (from || to) {
    where.deliveryDate = {};
    if (from) where.deliveryDate.gte = new Date(from);
    if (to) where.deliveryDate.lte = new Date(to);
  }
  if (producto) {
    where.items = { some: { product: { name: { contains: String(producto) } } } };
  }
  if (alumno) {
    where.assignments = { some: { student: { name: { contains: String(alumno) } } } };
  }
  const remesas = await prisma.remesa.findMany({ where, include: { items: { include: { product: true } }, assignments: { include: { student: true } } }, orderBy: { deliveryDate: 'asc' } });
  res.json(remesas);
}

export async function exportCsvController(req, res) {
  const { type = 'inventory' } = req.query;
  if (type === 'inventory') {
    const rows = await prisma.productLot.findMany({ include: { product: true } });
    const csv = stringify(rows.map((r) => ({ product: r.product.name, lotCode: r.lotCode, quantity: r.quantity, entryDate: r.entryDate, expiryDate: r.expiryDate })), { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
    return res.send(csv);
  }
  if (type === 'remesas') {
    const rows = await prisma.deliveryLog.findMany({ include: { student: true, remesa: true, deliveredByAdmin: true } });
    const csv = stringify(rows.map((r) => ({ remesaId: r.remesaId, student: r.student.name, dni: r.student.dni, deliveredAt: r.deliveredAt, deliveredBy: r.deliveredByAdmin?.email || '', notes: r.notes || '' })), { header: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="remesas.csv"');
    return res.send(csv);
  }
  return res.status(400).json({ error: 'Unknown type' });
}

function buildSimplePdf({ title, subtitle, rows }) {
  // Multi-page simple PDF, Helvetica font. rows is array of strings.
  const objects = [];
  const addObj = (s) => { objects.push(s); return objects.length; };
  const header = '%PDF-1.4\n';
  const fontObjNum = addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'); // 1
  const esc = (t) => String(t ?? '').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');

  const pageWidth = 612, pageHeight = 792, margin = 54; // 72pt = 1in
  const lineHeight = 16;
  const titleGap = 24;
  const linesPerPage = Math.floor((pageHeight - margin*2 - (subtitle ? 2*titleGap : titleGap)) / lineHeight) - 2; // header lines

  const pages = [];
  let idx = 0;
  while (idx < rows.length || (rows.length === 0 && idx === 0)) {
    const linesForPage = rows.length === 0 ? [] : rows.slice(idx, idx + linesPerPage);
    idx += linesForPage.length;
    const contentLines = [];
    contentLines.push('BT');
    contentLines.push('/F1 14 Tf');
    let y = pageHeight - margin;
    contentLines.push(`1 0 0 1 72 ${y} Tm (${esc(title)}) Tj`);
    y -= titleGap;
    if (subtitle) {
      contentLines.push('/F1 10 Tf');
      contentLines.push(`1 0 0 1 72 ${y} Tm (${esc(subtitle)}) Tj`);
      y -= titleGap;
    }
    // table header line
    contentLines.push('/F1 11 Tf');
    contentLines.push(`1 0 0 1 72 ${y} Tm (${esc(''.padEnd(80,'-'))}) Tj`);
    y -= lineHeight;
    if (linesForPage.length === 0) {
      contentLines.push(`1 0 0 1 72 ${y} Tm (${esc('Sin datos')}) Tj`);
      y -= lineHeight;
    } else {
      for (const line of linesForPage) {
        contentLines.push(`1 0 0 1 72 ${y} Tm (${esc(line)}) Tj`);
        y -= lineHeight;
      }
    }
    contentLines.push('ET');
    const contentStream = contentLines.join('\n');
    const contentObjStream = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`;
    const contentObjNum = addObj(contentObjStream);
    const pageObjNum = addObj(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjNum} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >>`);
    pages.push({ pageObjNum, contentObjNum });
  }

  const kidsRef = pages.map(p => `${p.pageObjNum} 0 R`).join(' ');
  const pagesObjNum = addObj(`<< /Type /Pages /Kids [ ${kidsRef} ] /Count ${pages.length} >>`);
  for (const p of pages) {
    objects[p.pageObjNum - 1] = objects[p.pageObjNum - 1].replace('/Parent 0 0 R', `/Parent ${pagesObjNum} 0 R`);
  }
  const catalogObjNum = addObj(`<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>`);

  // xref
  let body = '';
  const offsets = [];
  let pos = header.length;
  for (let i=0;i<objects.length;i++) {
    const idxObj = i+1;
    const objStr = `${idxObj} 0 obj\n${objects[i]}\nendobj\n`;
    offsets.push(pos);
    body += objStr;
    pos += objStr.length;
  }
  const xrefStart = pos;
  let xref = `xref\n0 ${objects.length+1}\n`;
  xref += `0000000000 65535 f \n`;
  for (const off of offsets) xref += `${off.toString().padStart(10,'0')} 00000 n \n`;
  const trailer = `trailer\n<< /Size ${objects.length+1} /Root ${catalogObjNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  const pdf = header + body + xref + trailer;
  return Buffer.from(pdf, 'binary');
}

export async function exportPdfController(req, res) {
  const { type = 'inventory' } = req.query;
  if (type === 'inventory') {
    const rows = await prisma.productLot.findMany({ include: { product: true }, orderBy: { expiryDate: 'asc' } });
    const now = new Date();
    const header = `Generado: ${now.toLocaleString()}  |  Total lotes: ${rows.length}`;
    // Columns: Producto (30), Lote (12), Cant (6), Ingreso (12), Vence (12)
    const fmt = (s, n) => String(s ?? '').toString().slice(0, n).padEnd(n, ' ');
    const colHeader = `${fmt('Producto',30)} ${fmt('Lote',12)} ${fmt('Cant',6)} ${fmt('Ingreso',12)} ${fmt('Vence',12)}`;
    const lines = [colHeader, ''.padEnd(80,'-'),
      ...rows.map(r => `${fmt(r.product.name,30)} ${fmt(r.lotCode || '-',12)} ${fmt(r.quantity,6)} ${fmt(r.entryDate ? new Date(r.entryDate).toLocaleDateString() : '-',12)} ${fmt(r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '-',12)}`)
    ];
    const pdf = buildSimplePdf({ title: 'Inventario por lotes', subtitle: header, rows: lines });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.pdf"');
    return res.send(pdf);
  }
  if (type === 'remesas') {
    const rows = await prisma.deliveryLog.findMany({ include: { student: true, remesa: true, deliveredByAdmin: true }, orderBy: { deliveredAt: 'desc' } });
    const now = new Date();
    const header = `Generado: ${now.toLocaleString()}  |  Total entregas: ${rows.length}`;
    // Columns: Remesa (8), Alumno (22), DNI (12), Fecha (20), Por (16)
    const fmt = (s, n) => String(s ?? '').toString().slice(0, n).padEnd(n, ' ');
    const colHeader = `${fmt('Remesa',8)} ${fmt('Alumno',22)} ${fmt('DNI',12)} ${fmt('Fecha',20)} ${fmt('Por',16)}`;
    const lines = [colHeader, ''.padEnd(80,'-'),
      ...rows.map(r => `${fmt(`#${r.remesaId}`,8)} ${fmt(r.student.name,22)} ${fmt(r.student.dni,12)} ${fmt(new Date(r.deliveredAt).toLocaleString(),20)} ${fmt(r.deliveredByAdmin?.email || '',16)}`)
    ];
    const pdf = buildSimplePdf({ title: 'Entregas de remesas', subtitle: header, rows: lines });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="remesas.pdf"');
    return res.send(pdf);
  }
  return res.status(400).json({ error: 'Unknown type' });
}
