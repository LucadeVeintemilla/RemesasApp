import { useState } from 'react';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Search, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Delivery() {
  const [dni, setDni] = useState('');
  const [pendings, setPendings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/api/remesas/pending/by-dni/${dni}`);
      setPendings(data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error buscando remesas');
      setPendings([]);
    } finally { setLoading(false); }
  };

  const deliver = async (remesaId) => {
    try {
      await api.post(`/api/remesas/${remesaId}/deliver`, { dni });
      await search();
      toast.success('Entrega confirmada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo entregar');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-8 flex flex-col items-center">
        <div className="text-lg font-semibold mb-4">Verificación de entrega</div>
        <div className="flex w-full max-w-xl items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
            <Search className="text-slate-400" size={18} />
            <input className="flex-1 outline-none bg-transparent text-lg" placeholder="Ingresa DNI del alumno" value={dni} onChange={(e) => setDni(e.target.value)} />
          </div>
          <button onClick={search} disabled={!dni || loading} className="px-4 py-3 rounded-xl bg-brand-500 disabled:bg-slate-400 text-white font-medium shadow">
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        {error && <div className="text-rose-600 text-sm mt-3">{error}</div>}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-card p-4">
        <div className="font-medium mb-2">Remesas pendientes</div>
        {pendings.length === 0 ? (
          <div className="text-slate-500">No hay remesas pendientes para este DNI</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendings.map(p => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Remesa #{p.remesaId}</div>
                    <div className="font-medium">{new Date(p.remesa.deliveryDate).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  {p.remesa.items.map(i => `${i.productId}${i.quantityPerStudent ? ` x${i.quantityPerStudent}/alumno` : ` total ${i.totalQuantity}`}`).join(', ')}
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={() => deliver(p.remesaId)} className="px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2">
                    <CheckCircle2 size={16} /> Marcar entregado
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
