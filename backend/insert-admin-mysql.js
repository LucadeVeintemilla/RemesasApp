import 'dotenv/config';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

async function main() {
    const { DATABASE_URL, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_PASSWORD } = process.env;
    if (!DATABASE_URL) throw new Error('DATABASE_URL missing in .env');

    const url = new URL(DATABASE_URL);
    const conn = await mysql.createConnection({
        host: url.hostname,
        user: url.username,
        password: url.password,
        port: url.port ? Number(url.port) : 3306,
        database: url.pathname.replace(/^\//, ''),
    });

    const email = BOOTSTRAP_ADMIN_EMAIL || 'admin@example.com';
    const name = BOOTSTRAP_ADMIN_NAME || 'Admin';
    const password = BOOTSTRAP_ADMIN_PASSWORD || 'changeme123';
    const passwordHash = await bcrypt.hash(password, 10);

    const sql = `
     INSERT INTO \`adminUser\` (email, name, passwordHash, createdAt, updatedAt)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      passwordHash = VALUES(passwordHash),
      updatedAt = NOW()
   `;

    await conn.execute(sql, [email, name, passwordHash]);
    console.log('Admin inserted/updated:', { email, name });
    console.log('Temp password (plaintext):', password);
    await conn.end();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});