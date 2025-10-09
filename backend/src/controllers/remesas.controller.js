import { prisma } from '../db/prisma.js';

function sortByExpiry(a, b) {
  if (a.expiryDate == null && b.expiryDate == null) return 0;
  if (a.expiryDate == null) return 1;
  if (b.expiryDate == null) return -1;
  return new Date(a.expiryDate) - new Date(b.expiryDate);
}

export async function listRemesasController(_req, res) {
  const items = await prisma.remesa.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(items);
}

export async function getRemesaController(req, res) {
  const id = Number(req.params.id);
  const remesa = await prisma.remesa.findUnique({ where: { id }, include: { items: true, assignments: true } });
  if (!remesa) return res.status(404).json({ error: 'Not found' });
  res.json(remesa);
}

export async function createRemesaController(req, res) {
  const { fecha_entrega, nombre_remesa, items = [], alumnos = [] } = req.body || {};
  if (!fecha_entrega || !Array.isArray(items) || items.length === 0 || !Array.isArray(alumnos) || alumnos.length === 0) {
    return res.status(400).json({ error: 'fecha_entrega, items, alumnos requeridos' });
  }
  const remesa = await prisma.remesa.create({
    data: {
      deliveryDate: new Date(fecha_entrega),
      name: nombre_remesa || null,
      items: { create: items.map((i) => ({ productId: Number(i.producto_id), quantityPerStudent: i.cantidad_por_alumno ?? null, totalQuantity: i.cantidad_total ?? null })) },
      assignments: { create: alumnos.map((studentId) => ({ studentId: Number(studentId), status: 'pending' })) },
    },
  });
  res.status(201).json(remesa);
}

export async function confirmRemesaController(req, res) {
  const id = Number(req.params.id);
  // Validate stock per product using FIFO by expiry
  const remesa = await prisma.remesa.findUnique({ where: { id }, include: { items: true, assignments: true } });
  if (!remesa) return res.status(404).json({ error: 'Not found' });
  if (remesa.status === 'confirmed') return res.status(400).json({ error: 'Ya confirmada' });
  const studentsCount = remesa.assignments.length;

  const shortages = [];
  const lotConsumptions = []; // { lotId, take }

  for (const item of remesa.items) {
    const required = item.quantityPerStudent ? item.quantityPerStudent * studentsCount : item.totalQuantity || 0;
    if (required <= 0) continue;
    const lots = await prisma.productLot.findMany({ where: { productId: item.productId, quantity: { gt: 0 } }, orderBy: { expiryDate: 'asc' } });
    let remaining = required;
    for (const lot of lots.sort(sortByExpiry)) {
      if (remaining <= 0) break;
      const take = Math.min(lot.quantity, remaining);
      remaining -= take;
      if (take > 0) lotConsumptions.push({ lotId: lot.id, take });
    }
    if (remaining > 0) {
      shortages.push({ productId: item.productId, missing: remaining });
    }
  }

  if (shortages.length) {
    return res.status(400).json({ error: 'Stock insuficiente', shortages });
  }

  // Transaction: decrement lots and mark remesa confirmed
  await prisma.$transaction(async (tx) => {
    for (const c of lotConsumptions) {
      const lot = await tx.productLot.findUnique({ where: { id: c.lotId } });
      await tx.productLot.update({ where: { id: c.lotId }, data: { quantity: lot.quantity - c.take } });
    }
    await tx.remesa.update({ where: { id }, data: { status: 'confirmed' } });
  });

  res.json({ ok: true });
}

export async function cancelRemesaController(req, res) {
  const id = Number(req.params.id);
  const remesa = await prisma.remesa.update({ where: { id }, data: { status: 'cancelled' } });
  res.json(remesa);
}

export async function listPendingForDniController(req, res) {
  const { dni } = req.params;
  const student = await prisma.student.findUnique({ where: { dni } });
  if (!student) return res.status(404).json({ error: 'Alumno no encontrado' });
  const now = new Date();
  const remesas = await prisma.remesaAssignment.findMany({
    where: { studentId: student.id, status: 'pending', remesa: { deliveryDate: { lte: now }, status: 'confirmed' } },
    include: { remesa: { include: { items: true } } },
  });
  res.json(remesas);
}

export async function markDeliveredController(req, res) {
  const id = Number(req.params.id);
  const { dni, observaciones } = req.body || {};
  const userId = req.user?.id;
  const assignment = await prisma.remesaAssignment.findFirst({ where: { remesaId: id, student: { dni }, status: 'pending' } });
  if (!assignment) return res.status(404).json({ error: 'Asignación no encontrada o ya entregada' });
  await prisma.$transaction(async (tx) => {
    await tx.remesaAssignment.update({ where: { id: assignment.id }, data: { status: 'delivered', deliveredByAdminId: userId, deliveredAt: new Date(), notes: observaciones || null } });
    await tx.deliveryLog.create({ data: { remesaId: id, studentId: assignment.studentId, deliveredByAdminId: userId, deliveredAt: new Date(), notes: observaciones || null } });
  });
  res.json({ ok: true });
}
