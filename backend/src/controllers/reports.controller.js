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
  const where = {
    deliveryDate: {
      gte: from ? new Date(from) : undefined,
      lte: to ? new Date(to) : undefined,
    },
    items: producto ? { some: { product: { name: { contains: String(producto), mode: 'insensitive' } } } } : undefined,
    assignments: alumno ? { some: { student: { name: { contains: String(alumno), mode: 'insensitive' } } } } : undefined,
    status: 'confirmed',
  };
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
