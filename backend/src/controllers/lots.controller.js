import { prisma } from '../db/prisma.js';

export async function listLotsByProductController(req, res) {
  const productId = Number(req.params.productId);
  const lots = await prisma.productLot.findMany({ where: { productId }, orderBy: { expiryDate: 'asc' } });
  res.json(lots);
}

export async function getLotController(req, res) {
  const id = Number(req.params.id);
  const lot = await prisma.productLot.findUnique({ where: { id } });
  if (!lot) return res.status(404).json({ error: 'Not found' });
  res.json(lot);
}

export async function createLotController(req, res) {
  const { product_id, cantidad, fecha_ingreso, fecha_vencimiento, codigo_lote } = req.body || {};
  if (!product_id || cantidad == null || !fecha_ingreso || !fecha_vencimiento) return res.status(400).json({ error: 'Campos requeridos' });
  const inDate = new Date(fecha_ingreso);
  const expDate = new Date(fecha_vencimiento);
  if (!(expDate > inDate)) return res.status(400).json({ error: 'fecha_vencimiento debe ser mayor a fecha_ingreso' });
  const lot = await prisma.productLot.create({
    data: {
      productId: Number(product_id),
      quantity: Number(cantidad),
      entryDate: inDate,
      expiryDate: expDate,
      lotCode: codigo_lote || null,
    },
  });
  res.status(201).json(lot);
}

export async function updateLotController(req, res) {
  const id = Number(req.params.id);
  const { cantidad, fecha_vencimiento, codigo_lote } = req.body || {};
  const data = {};
  if (cantidad != null) data.quantity = Number(cantidad);
  if (fecha_vencimiento) data.expiryDate = new Date(fecha_vencimiento);
  if (codigo_lote !== undefined) data.lotCode = codigo_lote;
  const lot = await prisma.productLot.update({ where: { id }, data });
  res.json(lot);
}

export async function deleteLotController(req, res) {
  const id = Number(req.params.id);
  await prisma.productLot.delete({ where: { id } });
  res.status(204).send();
}
