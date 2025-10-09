import { useEffect, useState } from 'react';
import api from '../lib/api';
import { BarChart3, Download, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, CartesianGrid, Tooltip } from 'recharts';

export default function Reports() {
  const [inventory, setInventory] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '', alumno: '', producto: '' });
  const [remesas, setRemesas] = useState([]);

  const loadInventory = async () => {
    const { data } = await api.get('/api/reports/inventory');
    setInventory(data || []);
  };

  const loadRemesas = async () => {
    const { data } = await api.get('/api/reports/remesas', { params: filters });
    setRemesas(data || []);
  };

  useEffect(() => { loadInventory(); }, []);

  const exportCsv = async (type) => {
    const url = new URL('/api/reports/export/csv', api.defaults.baseURL);
    url.searchParams.set('type', type);
    window.open(url.toString(), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
          <div className="text-sm text-slate-500">Total lotes</div>
          <div className="text-2xl font-semibold">{inventory.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
          <div className="text-sm text-slate-500">Cerca a vencer</div>
          <div className="text-2xl font-semibold">{inventory.filter(i => i.nearExpiry).length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
          <div className="text-sm text-slate-500">Productos</div>
          <div className="text-2xl font-semibold">{new Set(inventory.map(i => i.product)).size}</div>
        </div>
      </div>

      {/* Inventario */}
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium flex items-center gap-2"><BarChart3 size={18} /> Inventario por lotes</div>
          <button onClick={() => exportCsv('inventory')} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
            <Download size={16} /> CSV
          </button>
        </div>

        <div className="overflow-auto border rounded-lg border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="text-left px-3 py-2">Producto</th>
                <th className="text-left px-3 py-2">Código lote</th>
                <th className="text-left px-3 py-2">Cantidad</th>
                <th className="text-left px-3 py-2">Ingreso</th>
                <th className="text-left px-3 py-2">Vencimiento</th>
                <th className="px-3 py-2">Alerta</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((l, idx) => (
                <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2">{l.product}</td>
                  <td className="px-3 py-2">{l.lotCode || '-'}</td>
                  <td className="px-3 py-2">{l.quantity}</td>
                  <td className="px-3 py-2">{l.entryDate ? new Date(l.entryDate).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-2">{l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : '-'}</td>
                  <td className="px-3 py-2 text-center">
                    {l.nearExpiry && <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Cerca a vencer</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Remesas */}
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Remesas entregadas (filtros)</div>
          <div className="flex items-center gap-2 text-slate-500"><Filter size={16} />
            <input type="date" className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
            <input type="date" className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
            <input className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Alumno" value={filters.alumno} onChange={e => setFilters({ ...filters, alumno: e.target.value })} />
            <input className="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Producto" value={filters.producto} onChange={e => setFilters({ ...filters, producto: e.target.value })} />
            <button onClick={loadRemesas} className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Filtrar</button>
            <button onClick={() => exportCsv('remesas')} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
              <Download size={16} /> CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="overflow-auto border rounded-lg border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="text-left px-3 py-2">ID</th>
                    <th className="text-left px-3 py-2">Fecha</th>
                    <th className="text-left px-3 py-2">Items</th>
                    <th className="text-left px-3 py-2">Alumnos</th>
                  </tr>
                </thead>
                <tbody>
                  {remesas.map(r => (
                    <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2">{r.id}</td>
                      <td className="px-3 py-2">{new Date(r.deliveryDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{r.items.map(i => `${i.product.name}${i.quantityPerStudent ? ` x${i.quantityPerStudent}/alumno` : ` total ${i.totalQuantity}`}`).join(', ')}</td>
                      <td className="px-3 py-2">{r.assignments.map(a => a.student.name).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
            <div className="font-medium mb-2">Remesas por mes</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(remesas || []).reduce((acc, r) => {
                  const d = new Date(r.deliveryDate); const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`;
                  const f = acc.find(a => a.name === key); if (f) f.value += 1; else acc.push({ name: key, value: 1 }); return acc;
                }, []).sort((a,b)=>a.name.localeCompare(b.name))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
