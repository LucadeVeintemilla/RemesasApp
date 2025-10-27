import { useEffect, useState } from 'react';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X } from 'lucide-react';

export default function Students() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [grado, setGrado] = useState('');
  const [seccion, setSeccion] = useState('');
  const [form, setForm] = useState({ nombre_completo: '', grado: '', seccion: '', dni: '' });
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, nombre_completo: '', grado: '', seccion: '', fecha_nacimiento: '', observaciones: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = { q };
      if (grado) params.grado = grado;
      if (seccion) params.seccion = seccion;
      const { data } = await api.get('/api/students', { params });
      setItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/students', form);
      setForm({ nombre_completo: '', grado: '', seccion: '', dni: '' });
      await load();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear');
    }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar alumno?')) return;
    await api.delete(`/api/students/${id}`);
    await load();
  };

  const openEdit = (s) => {
    const toIsoDate = (d) => d ? new Date(d).toISOString().slice(0,10) : '';
    setEditForm({
      id: s.id,
      nombre_completo: s.name || '',
      grado: s.grade || '',
      seccion: s.section || '',
      //dni
      dni: s.dni || '',
    });
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/students/${editForm.id}`, {
        nombre_completo: editForm.nombre_completo,
        grado: editForm.grado,
        seccion: editForm.seccion,
        dni: editForm.dni || null,
      });
      await load();
      setEditOpen(false);
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo actualizar');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Alumnos</div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white">
          <Plus size={18} /> Nuevo alumno
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <Search size={16} className="text-slate-400" />
            <input className="outline-none bg-transparent" placeholder="Buscar nombre" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Grado" value={grado} onChange={(e) => setGrado(e.target.value)} />
          <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Sección" value={seccion} onChange={(e) => setSeccion(e.target.value)} />
          <button onClick={load} className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Filtrar</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Grado</th>
                <th className="text-left px-4 py-3">Sección</th>
                <th className="text-left px-4 py-3">DNI</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-900/60'}>
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.grade}</td>
                  <td className="px-4 py-3">{s.section}</td>
                  <td className="px-4 py-3">{s.dni}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-3 justify-end">
                      <button onClick={() => openEdit(s)} className="text-sky-600 hover:underline">Editar</button>
                      <button onClick={() => remove(s.id)} className="text-rose-600 hover:underline">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Nuevo alumno</div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
              </div>
              <form onSubmit={create} className="grid gap-3">
                <input className={`px-3 py-2 rounded-md border ${form.nombre_completo === '' && error ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900`}
                       placeholder="Nombre completo" value={form.nombre_completo} onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Grado" value={form.grado} onChange={(e) => setForm({ ...form, grado: e.target.value })} />
                  <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Sección" value={form.seccion} onChange={(e) => setForm({ ...form, seccion: e.target.value })} />
                </div>
                <input className={`px-3 py-2 rounded-md border ${form.dni === '' && error ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-900`}
                       placeholder="DNI" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
                {error && <div className="text-rose-600 text-sm">{error}</div>}
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Cancelar</button>
                  <button className="px-3 py-2 rounded-md bg-brand-500 hover:bg-brand-600 text-white">Crear</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold">Editar alumno</div>
                <button onClick={() => setEditOpen(false)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
              </div>
              <form onSubmit={saveEdit} className="grid gap-3">
                <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                       placeholder="Nombre completo" value={editForm.nombre_completo} onChange={(e) => setEditForm({ ...editForm, nombre_completo: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  {/* dni y label para cada campo */}
                  <label className="text-sm font-semibold">DNI</label>
                  <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="DNI" value={editForm.dni} onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })} />
                  {/* grado */}
                  <label className="text-sm font-semibold">Grado</label>
                  <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Grado" value={editForm.grado} onChange={(e) => setEditForm({ ...editForm, grado: e.target.value })} />
                  {/* seccion */}
                  <label className="text-sm font-semibold">Sección</label>
                  <input className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" placeholder="Sección" value={editForm.seccion} onChange={(e) => setEditForm({ ...editForm, seccion: e.target.value })} />
                </div>
               <div className="flex justify-end gap-2 mt-2">
                  <button type="button" onClick={() => setEditOpen(false)} className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Cancelar</button>
                  <button className="px-3 py-2 rounded-md bg-brand-500 hover:bg-brand-600 text-white">Guardar</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
