import { useEffect, useState } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { CheckCircle2, Users, Package, ClipboardList, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Remesas() {
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [items, setItems] = useState([]); // { producto_id, cantidad_por_alumno, cantidad_total }
  const [fecha, setFecha] = useState('');
  const [nombre, setNombre] = useState('');
  const [remesas, setRemesas] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 alumnos, 2 productos, 3 cantidades, 4 confirmar

  const loadBase = async () => {
    const [s, p, r] = await Promise.all([
      api.get('/api/students', { params: { pageSize: 100 } }),
      api.get('/api/products'),
      api.get('/api/remesas'),
    ]);
    setStudents(s.data.items || []);
    setProducts(p.data || []);
    setRemesas(r.data || []);
  };

  useEffect(() => { loadBase(); }, []);

  const addItem = (productId) => {
    if (!productId) return;
    setItems((prev) => [...prev, { producto_id: Number(productId), cantidad_por_alumno: 1, cantidad_total: null }]);
  };

  const createRemesa = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        fecha_entrega: fecha,
        nombre_remesa: nombre || null,
        items: items.map(i => ({ producto_id: i.producto_id, cantidad_por_alumno: i.cantidad_por_alumno, cantidad_total: i.cantidad_total })),
        alumnos: selectedStudents.map(Number),
      };
      await api.post('/api/remesas', payload);
      setFecha(''); setNombre(''); setItems([]); setSelectedStudents([]);
      const { data } = await api.get('/api/remesas');
      setRemesas(data || []);
      setStep(1);
      toast.success('Remesa creada');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear remesa');
    }
  };

  const confirmRemesa = async (id) => {
    try {
      await api.post(`/api/remesas/${id}/confirm`);
      const { data } = await api.get('/api/remesas');
      setRemesas(data || []);
      toast.success('Remesa confirmada correctamente');
    } catch (err) {
      const shortages = err.response?.data?.shortages;
      if (shortages) {
        toast.error('Stock insuficiente: ' + shortages.map(s => `Prod ${s.productId} faltan ${s.missing}`).join(', '));
      } else {
        toast.error(err.response?.data?.error || 'Error al confirmar');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold flex items-center gap-2"><ClipboardList size={18} /> Nueva remesa</div>
          <div className="flex items-center gap-2">
            <input type="date" className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Nombre (opcional)" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-3 mb-4">
          {[1,2,3,4].map(n => (
            <div key={n} className={`flex items-center gap-2 ${n < 4 ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step >= n ? 'bg-brand-500' : 'bg-slate-300'}`}>{n}</div>
              {n < 4 && <div className={`h-1 flex-1 rounded ${step > n ? 'bg-brand-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="grid gap-4">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="font-medium flex items-center gap-2"><Users size={16} /> Selecciona alumnos</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-auto border border-slate-200 dark:border-slate-800 rounded-md p-2">
                {students.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedStudents.includes(s.id)} onChange={(e) => {
                      setSelectedStudents(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id));
                    }} />
                    {s.name} ({s.grade}-{s.section})
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <button disabled={selectedStudents.length === 0} onClick={() => setStep(2)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-brand-500 disabled:bg-slate-400 text-white">Siguiente <ArrowRight size={16} /></button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="font-medium flex items-center gap-2"><Package size={16} /> Selecciona productos</div>
              <div className="flex items-center gap-2">
                <select onChange={(e) => addItem(e.target.value)} defaultValue="" className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <option value="" disabled>Agregar producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="border rounded-md border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="text-left px-3 py-2">Producto</th>
                      <th className="text-left px-3 py-2">Cant por alumno</th>
                      <th className="text-left px-3 py-2">Cant total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const p = products.find(x => x.id === it.producto_id);
                      return (
                        <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2">{p?.name}</td>
                          <td className="px-3 py-2"><input type="number" className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" value={it.cantidad_por_alumno ?? ''} onChange={e => {
                            const v = e.target.value === '' ? null : Number(e.target.value);
                            setItems(prev => prev.map((x, i) => i === idx ? { ...x, cantidad_por_alumno: v } : x));
                          }} /></td>
                          <td className="px-3 py-2"><input type="number" className="w-24 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" value={it.cantidad_total ?? ''} onChange={e => {
                            const v = e.target.value === '' ? null : Number(e.target.value);
                            setItems(prev => prev.map((x, i) => i === idx ? { ...x, cantidad_total: v } : x));
                          }} /></td>
                          <td className="px-3 py-2 text-right"><button type="button" className="text-rose-600 hover:underline" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}>Quitar</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Atrás</button>
                <button disabled={items.length === 0} onClick={() => setStep(3)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-brand-500 disabled:bg-slate-400 text-white">Siguiente <ArrowRight size={16} /></button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="font-medium">Confirmar cantidades</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Alumnos: {selectedStudents.length}. Verifica cantidades por alumno o totales por item.</div>
              <div className="border rounded-md border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="text-left px-3 py-2">Producto</th>
                      <th className="text-left px-3 py-2">Cant por alumno</th>
                      <th className="text-left px-3 py-2">Cant total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const p = products.find(x => x.id === it.producto_id);
                      return (
                        <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2">{p?.name}</td>
                          <td className="px-3 py-2">{it.cantidad_por_alumno ?? '-'}</td>
                          <td className="px-3 py-2">{it.cantidad_total ?? '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Atrás</button>
                <button onClick={() => setStep(4)} className="flex items-center gap-2 px-3 py-2 rounded-md bg-brand-500 text-white">Siguiente <ArrowRight size={16} /></button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="font-medium flex items-center gap-2 text-emerald-600"><CheckCircle2 size={18} /> Listo para crear</div>
              {error && <div className="text-rose-600 text-sm">{error}</div>}
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Atrás</button>
                <button onClick={createRemesa} className="px-3 py-2 rounded-md bg-brand-500 hover:bg-brand-600 text-white">Crear remesa</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
        <div className="font-medium mb-2">Remesas existentes</div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-left px-3 py-2">Fecha</th>
                <th className="text-left px-3 py-2">Estado</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {remesas.map(r => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2">{r.id}</td>
                  <td className="px-3 py-2">{r.name || '-'}</td>
                  <td className="px-3 py-2">{new Date(r.deliveryDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${r.status === 'draft' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : r.status === 'confirmed' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>{r.status}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.status === 'draft' && <button onClick={() => confirmRemesa(r.id)} className="px-3 py-1 rounded-md bg-sky-500 hover:bg-sky-600 text-white">Confirmar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
