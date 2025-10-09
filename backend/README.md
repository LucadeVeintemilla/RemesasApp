# Remesas Backend (Node.js + Express + Prisma + MySQL)

## Requisitos
- Node.js 18+
- MySQL 8+

## Configuración
1. Copia `.env.example` a `.env` y configura credenciales.
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Genera cliente Prisma y aplica migraciones (crearemos migraciones luego):
   ```bash
   npx prisma generate
   # npx prisma migrate dev --name init
   ```
4. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```

## Endpoints clave
- `POST /api/auth/login`
- `POST /api/auth/admins` (crear admin; requiere token admin)
- CRUD `students`, `products`, `lots`
- `POST /api/remesas/:id/confirm` (decremento FIFO por vencimiento)
- `GET /api/remesas/pending/by-dni/:dni`
- `POST /api/remesas/:id/deliver`
- `GET /api/reports/export/csv?type=inventory|remesas`

## Notas
- La lógica de confirmación de remesas descuenta stock por lotes ordenados por fecha de vencimiento (FIFO por vencimiento).
- CSV habilitado; PDF opcional (pendiente).
