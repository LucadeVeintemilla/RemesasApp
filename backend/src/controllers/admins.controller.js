import { prisma } from '../db/prisma.js';

export async function listAdminsController(_req, res) {
  const admins = await prisma.adminUser.findMany({ select: { id: true, email: true, name: true, createdAt: true } });
  res.json(admins);
}
