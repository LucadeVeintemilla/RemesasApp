import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';

export async function loginController(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: 'admin', email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}

export async function createAdminController(req, res) {
  const { email, name, password } = req.body || {};
  if (!email || !name || !password) return res.status(400).json({ error: 'email, name, password required' });
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({ data: { email, name, passwordHash } });
  const issueToken = (process.env.ISSUE_TOKEN_ON_ADMIN_CREATE || 'true').toLowerCase() === 'true';
  const response = { user: { id: user.id, email: user.email, name: user.name } };
  if (issueToken) {
    response.token = jwt.sign({ id: user.id, role: 'admin', email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '12h' });
  }
  res.status(201).json(response);
}
