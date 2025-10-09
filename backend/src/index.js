import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admins.routes.js';
import studentsRoutes from './routes/students.routes.js';
import productsRoutes from './routes/products.routes.js';
import lotsRoutes from './routes/lots.routes.js';
import remesasRoutes from './routes/remesas.routes.js';
import reportsRoutes from './routes/reports.routes.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'remesas-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/lots', lotsRoutes);
app.use('/api/remesas', remesasRoutes);
app.use('/api/reports', reportsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
