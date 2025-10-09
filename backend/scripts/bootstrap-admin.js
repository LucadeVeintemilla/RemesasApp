import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/db/prisma.js';

async function main() {
  const existing = await prisma.adminUser.count();
  if (existing > 0) {
    console.log('Admin(s) already exist. Skipping bootstrap.');
    return;
  }
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@example.com';
  const name = process.env.BOOTSTRAP_ADMIN_NAME || 'Admin';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'changeme123';
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.create({ data: { email, name, passwordHash } });
  console.log('Bootstrap admin created:', { id: user.id, email: user.email, name: user.name });
  console.log('Temp password:', password);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
