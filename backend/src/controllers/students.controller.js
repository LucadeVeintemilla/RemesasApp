import { prisma } from '../db/prisma.js';

export async function listStudentsController(req, res) {
  const { q, dni, grado, seccion, page = 1, pageSize = 20 } = req.query;
  const where = {
    AND: [
      q ? { name: { contains: q, mode: 'insensitive' } } : {},
      dni ? { dni } : {},
      grado ? { grade: grado } : {},
      seccion ? { section: seccion } : {},
    ],
  };
  const skip = (Number(page) - 1) * Number(pageSize);
  const [total, items] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({ where, skip, take: Number(pageSize), orderBy: { name: 'asc' } }),
  ]);
  res.json({ total, items, page: Number(page), pageSize: Number(pageSize) });
}

export async function getStudentController(req, res) {
  const id = Number(req.params.id);
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return res.status(404).json({ error: 'Not found' });
  res.json(student);
}

export async function createStudentController(req, res) {
  const { nombre_completo, grado, seccion, dni, fecha_nacimiento, observaciones } = req.body || {};
  if (!nombre_completo || !grado || !seccion || !dni) return res.status(400).json({ error: 'Missing required fields' });
  // Simple DNI format validation: 8 digits typical; adjust if needed
  if (!/^\d{8,12}$/.test(dni)) return res.status(400).json({ error: 'DNI formato inválido' });
  try {
    const student = await prisma.student.create({
      data: {
        name: nombre_completo,
        grade: grado,
        section: seccion,
        dni,
        birthDate: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        notes: observaciones || null,
      },
    });
    res.status(201).json(student);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'DNI duplicado' });
    throw e;
  }
}

export async function updateStudentController(req, res) {
  const id = Number(req.params.id);
  const { nombre_completo, grado, seccion, fecha_nacimiento, observaciones } = req.body || {};
  const student = await prisma.student.update({
    where: { id },
    data: {
      name: nombre_completo,
      grade: grado,
      section: seccion,
      birthDate: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined,
      notes: observaciones,
    },
  });
  res.json(student);
}

export async function deleteStudentController(req, res) {
  const id = Number(req.params.id);
  await prisma.student.delete({ where: { id } });
  res.status(204).send();
}
