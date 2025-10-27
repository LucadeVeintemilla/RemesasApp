import { prisma } from '../db/prisma.js';

export async function listStudentsController(req, res) {
  const { q, dni, grado, seccion, page = 1, pageSize = 20 } = req.query;
  const filters = [];
  if (q) filters.push({ name: { contains: q } });
  if (dni) {
    const isFullDni = /^\d{8,12}$/.test(String(dni));
    filters.push(isFullDni ? { dni: String(dni) } : { dni: { contains: String(dni) } });
  }
  if (grado) filters.push({ grade: grado });
  if (seccion) filters.push({ section: seccion });
  const where = filters.length ? { AND: filters } : {};
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
  const { nombre_completo, grado, seccion, fecha_nacimiento, observaciones, dni } = req.body || {};
  if (typeof dni !== 'undefined') {
    if (dni !== null && !/^\d{8,12}$/.test(String(dni))) {
      return res.status(400).json({ error: 'DNI formato inválido' });
    }
  }
  const data = {};
  if (typeof nombre_completo !== 'undefined') data.name = nombre_completo;
  if (typeof grado !== 'undefined') data.grade = grado;
  if (typeof seccion !== 'undefined') data.section = seccion;
  if (typeof fecha_nacimiento !== 'undefined') data.birthDate = fecha_nacimiento ? new Date(fecha_nacimiento) : null;
  if (typeof observaciones !== 'undefined') data.notes = observaciones ?? null;
  if (typeof dni !== 'undefined') data.dni = dni === null ? null : String(dni);
  try {
    const student = await prisma.student.update({ where: { id }, data });
    res.json(student);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'DNI duplicado' });
    throw e;
  }
}

export async function deleteStudentController(req, res) {
  const id = Number(req.params.id);
  const force = String(req.query.force || '').toLowerCase() === 'true';
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  if (force) {
    await prisma.$transaction([
      prisma.deliveryLog.deleteMany({ where: { studentId: id } }),
      prisma.remesaAssignment.deleteMany({ where: { studentId: id } }),
      prisma.student.delete({ where: { id } }),
    ]);
    return res.status(204).send();
  }

  const [logsCount, assignmentsCount] = await Promise.all([
    prisma.deliveryLog.count({ where: { studentId: id } }),
    prisma.remesaAssignment.count({ where: { studentId: id } }),
  ]);
  if (logsCount > 0 || assignmentsCount > 0) {
    return res.status(409).json({
      error: 'No se puede eliminar el alumno porque tiene registros relacionados',
      details: { deliveryLogs: logsCount, assignments: assignmentsCount },
      hint: 'Use ?force=true para eliminar junto con sus registros relacionados',
    });
  }

  await prisma.student.delete({ where: { id } });
  res.status(204).send();
}
