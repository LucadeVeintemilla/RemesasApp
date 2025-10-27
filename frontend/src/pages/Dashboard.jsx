import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { Users, Package, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [remesas, setRemesas] = useState([]);

  useEffect(() => {
    (async () => {
      const [s, p, r] = await Promise.all([
        api.get('/api/students', { params: { pageSize: 999 } }),
        api.get('/api/products'),
        api.get('/api/remesas'),
      ]);
      setStudents(s.data.items || []);
      setProducts(p.data || []);
      setRemesas(r.data || []);
    })();
  }, []);

  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const lowStock = products.filter(p => p.stockTotal <= (p.minStockAlert || 0)).length;
    const pendingRemesas = remesas.filter(r => r.status === 'borrador').length;
    const nearExpiry = products.filter(p => p.nearExpiry).length;
    return { totalStudents, lowStock, pendingRemesas, nearExpiry };
  }, [students, products, remesas]);

  const productsByCategory = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      const k = p.category || 'Sin categoría';
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [products]);

  const deliveriesByWeek = useMemo(() => {
    const map = new Map();
    remesas.filter(r => r.status === 'confirmado').forEach(r => {
      const d = new Date(r.deliveryDate);
      const key = `${d.getFullYear()}-W${Math.ceil((((d - new Date(d.getFullYear(),0,1)) / 86400000) + new Date(d.getFullYear(),0,1).getDay()+1)/7)}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a,b)=>a.name.localeCompare(b.name));
  }, [remesas]);

  const Card = ({ icon: Icon, title, value, tone }) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4 flex items-center gap-4 hover:shadow-md transition">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${tone}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Users} title="Total alumnos" value={metrics.totalStudents} tone="bg-brand-500" />
        <Card icon={Package} title="Stock bajo" value={metrics.lowStock} tone="bg-amber-500" />
        <Card icon={ClipboardCheck} title="Remesas pendientes" value={metrics.pendingRemesas} tone="bg-sky-500" />
        <Card icon={AlertTriangle} title="Próximos a vencer" value={metrics.nearExpiry} tone="bg-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
          <div className="font-medium mb-2">Productos por categoría</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <Tooltip formatter={(v) => [v, 'Productos']} />
                <Bar dataKey="value" fill="#3a93ff" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
          <div className="font-medium mb-2">Entregas por semana</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deliveriesByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                                    <Tooltip formatter={(v) => [v, 'Entregas']} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
