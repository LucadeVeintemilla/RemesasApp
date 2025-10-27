import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, PackageCheck, AlertTriangle, Boxes, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', unidad: '', categoria: '', min_stock_alert: 0 });
  const [selected, setSelected] = useState(null);
  const [lots, setLots] = useState([]);
  const [lotForm, setLotForm] = useState({ cantidad: 0, fecha_ingreso: '', fecha_vencimiento: '', codigo_lote: '' });
  const [error, setError] = useState('');
  const [openProduct, setOpenProduct] = useState(false);
  const [openLots, setOpenLots] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/products');
      setProducts(data);
    } finally { setLoading(false); }
  };

  const loadLots = async (productId) => {
    const { data } = await api.get(`/api/lots/product/${productId}`);
    setLots(data);
  };

  useEffect(() => { loadProducts(); }, []);

  const createProduct = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/products', form);
      setForm({ nombre: '', unidad: '', categoria: '', min_stock_alert: 0 });
      await loadProducts();
      setOpenProduct(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear producto');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar producto?')) return;
    await api.delete(`/api/products/${id}`);
    if (selected?.id === id) { setSelected(null); setLots([]); }
    await loadProducts();
  };

  const selectProduct = async (p) => {
    setSelected(p);
    await loadLots(p.id);
    setOpenLots(true);
  };

  const createLot = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setError('');
    try {
      await api.post('/api/lots', { ...lotForm, product_id: selected.id });
      setLotForm({ cantidad: 0, fecha_ingreso: '', fecha_vencimiento: '', codigo_lote: '' });
      await loadLots(selected.id);
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear lote');
    }
  };

  const deleteLot = async (id) => {
    if (!confirm('¿Eliminar lote?')) return;
    await api.delete(`/api/lots/${id}`);
    await loadLots(selected.id);
    await loadProducts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Productos</div>
        <button onClick={() => setOpenProduct(true)} className="flex items-center gap-2 px-3 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow">
          <Plus size={18} /> Agregar producto
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
        {loading ? (
          <div>Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map(p => {
              const status = p.stockTotal <= (p.minStockAlert || 0)
                ? { label: 'Stock bajo', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' }
                : p.nearExpiry
                  ? { label: 'Cerca de vencer', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' }
                  : { label: 'OK', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
              return (
                <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="text-brand-500" size={18} />
                      <div className="font-medium">{p.name}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{p.category || 'Sin categoría'} • Unidad: {p.unit}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300"><Boxes size={16} /> {p.stockTotal} en stock</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => selectProduct(p)} className="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Lotes</button>
                    <button onClick={() => deleteProduct(p.id)} className="px-3 py-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">Eliminar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal producto */}
      <AnimatePresence>
        {openProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Nuevo producto</div>
                <button onClick={() => setOpenProduct(false)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
              </div>
              <form onSubmit={createProduct} className="grid gap-3">
                <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Unidad (ej. kg, unid)" value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} />
                  <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 gap-3">Stock Bajo Alerta</div>
                <input type="number" className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Alerta stock mínimo" value={form.min_stock_alert}
                       onChange={(e) => setForm({ ...form, min_stock_alert: Number(e.target.value) })} />
                {error && <div className="text-rose-600 text-sm">{error}</div>}
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setOpenProduct(false)} className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Cancelar</button>
                  <button className="px-3 py-2 rounded-md bg-brand-500 hover:bg-brand-600 text-white">Crear</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer Lotes */}
      <AnimatePresence>
        {openLots && selected && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-y-0 right-0 w-full max-w-xl z-50 bg-white dark:bg-slate-900 shadow-xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="font-semibold">Lotes de {selected.name}</div>
              <button onClick={() => setOpenLots(false)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-auto">
              <form onSubmit={createLot} className="grid grid-cols-2 gap-3">
                {/** Cantidad */}
                <div className="flex flex-col">
                <label className="text-sm text-slate-500 dark:text-slate-400">Cantidad</label>
                <input type="number" className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Cantidad" value={lotForm.cantidad}
                       onChange={(e) => setLotForm({ ...lotForm, cantidad: Number(e.target.value) })} />
                </div>
                <div className="flex flex-col"></div>
                <div className="flex flex-col">
                <label className="text-sm text-slate-500 dark:text-slate-400">Fecha ingreso</label>
                <input type="date" className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Fecha ingreso" value={lotForm.fecha_ingreso}
                       onChange={(e) => setLotForm({ ...lotForm, fecha_ingreso: e.target.value })} />
                </div>
                <div className="flex flex-col">
                <label className="text-sm text-slate-500 dark:text-slate-400">Fecha Vencimiento</label>
                <input type="date" className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Fecha vencimiento" value={lotForm.fecha_vencimiento}
                       onChange={(e) => setLotForm({ ...lotForm, fecha_vencimiento: e.target.value })} />
                </div>
                <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Código lote" value={lotForm.codigo_lote}
                       onChange={(e) => setLotForm({ ...lotForm, codigo_lote: e.target.value })} />
                {error && <div className="text-rose-600 text-sm col-span-2">{error}</div>}
                <div className="col-span-2 flex justify-end gap-2">
                  <button className="px-3 py-2 rounded-md bg-brand-500 hover:bg-brand-600 text-white">Crear lote</button>
                </div>
              </form>

              <div className="border rounded-lg border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="text-left px-3 py-2">ID</th>
                      <th className="text-left px-3 py-2">Código</th>
                      <th className="text-left px-3 py-2">Cantidad</th>
                      <th className="text-left px-3 py-2">Ingreso</th>
                      <th className="text-left px-3 py-2">Vencimiento</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lots.map(l => (
                      <tr key={l.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-2">{l.id}</td>
                        <td className="px-3 py-2">{l.lotCode || '-'}</td>
                        <td className="px-3 py-2">{l.quantity}</td>
                        <td className="px-3 py-2">{new Date(l.entryDate).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : '-'}</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => deleteLot(l.id)} className="text-rose-600 hover:underline">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
