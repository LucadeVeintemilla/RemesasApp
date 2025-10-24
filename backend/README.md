# Remesas Backend (Node.js + Express + Prisma + MySQL)

## Requisitos
- Node.js 18+
- MySQL 8+
- Visual Studio Code
- Github Desktop


## Configuración
1. Copia `.env.example` a `.env` y configura credenciales.
2. Instala dependencias:
   ```bash
   cd frontend
   npm install
   cd backend 
   npm install
   npm install mysql2 bcrypt dotenv
3. Genera cliente Prisma y aplica migraciones (crearemos migraciones luego):
   
   En mySQL workbench: create database remesasdb;

   ```bash remesasdb
   npx prisma generate
   # npx prisma migrate dev --name init
   ```
   #node insert-admin-mysql.js
4. Ejecuta en desarrollo backend y frontend:
   ```bash
   npm run dev o npm start
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
