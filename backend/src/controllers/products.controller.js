import { prisma } from '../db/prisma.js';

export async function listProductsController(_req, res) {
  const products = await prisma.product.findMany({
    include: {
      lots: true,
      _count: { select: { lots: true } },
    },
    orderBy: { name: 'asc' },
  });
  const nearDays = Number(process.env.NEAR_EXPIRY_DAYS || 7);
  const now = new Date();
  const warnDate = new Date(now.getTime() + nearDays * 86400000);
  const mapped = products.map((p) => {
    const stockTotal = p.lots.reduce((sum, l) => sum + l.quantity, 0);
    const nearExpiry = p.lots.some((l) => l.expiryDate && l.expiryDate <= warnDate);
    return { id: p.id, name: p.name, unit: p.unit, category: p.category, minStockAlert: p.minStockAlert, stockTotal, nearExpiry };
  });
  res.json(mapped);
}

export async function getProductController(req, res) {
  const id = Number(req.params.id);
  const product = await prisma.product.findUnique({ where: { id }, include: { lots: true } });
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
}

export async function createProductController(req, res) {
  const { nombre, unidad, categoria, min_stock_alert } = req.body || {};
  if (!nombre || !unidad) return res.status(400).json({ error: 'nombre y unidad requeridos' });
  const product = await prisma.product.create({ data: { name: nombre, unit: unidad, category: categoria || null, minStockAlert: min_stock_alert ?? 0 } });
  res.status(201).json(product);
}

export async function updateProductController(req, res) {
  const id = Number(req.params.id);
  const { nombre, unidad, categoria, min_stock_alert } = req.body || {};
  const product = await prisma.product.update({ where: { id }, data: { name: nombre, unit: unidad, category: categoria, minStockAlert: min_stock_alert } });
  res.json(product);
}

export async function deleteProductController(req, res) {
  const id = Number(req.params.id);
  await prisma.product.delete({ where: { id } });
  res.status(204).send();
}
