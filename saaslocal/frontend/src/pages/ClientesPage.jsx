// pages/ClientesPage.jsx
import { useState, useEffect } from 'react';
import { clientesService } from '../services';
import { useCurrency } from '../hooks';
import { Plus, Search, User, CreditCard, X, Check, Loader2, DollarSign, ChevronRight } from 'lucide-react';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative card p-6 w-full max-w-md shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>
);

export default function ClientesPage() {
  const { format } = useCurrency();
  const [clientes, setClientes] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'crear' | {cliente} | {abonar, cliente}
  const [form, setForm]         = useState({ nombre: '', telefono: '', email: '', direccion: '', limite_credito: 0 });
  const [monto, setMonto]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [detalle, setDetalle]   = useState(null);

  const cargar = async () => {
    setLoading(true);
    const list = await clientesService.list();
    setClientes(list);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (c.telefono || '').includes(search)
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await clientesService.create(form);
      await cargar();
      setModal(null);
      setForm({ nombre: '', telefono: '', email: '', direccion: '', limite_credito: 0 });
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const handleAbonar = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await clientesService.abonar(modal.cliente.id, parseFloat(monto));
      await cargar();
      setModal(null); setMonto('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const verDetalle = async (cliente) => {
    const data = await clientesService.getOne(cliente.id);
    setDetalle(data);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Clientes</h1>
          <p className="text-slate-500 text-sm">{clientes.length} clientes registrados</p>
        </div>
        <button onClick={() => { setModal('crear'); setError(''); }} className="btn-primary">
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Resumen deudas */}
      {clientes.some(c => parseFloat(c.saldo_deuda) > 0) && (
        <div className="card p-4 border-l-4 border-amber-400 flex items-center gap-4">
          <CreditCard size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="font-semibold text-slate-700 text-sm">Créditos pendientes</p>
            <p className="text-xs text-slate-500">
              Total acumulado: <strong>
                {format(clientes.reduce((a, c) => a + parseFloat(c.saldo_deuda || 0), 0))}
              </strong> en {clientes.filter(c => parseFloat(c.saldo_deuda) > 0).length} cliente(s)
            </p>
          </div>
        </div>
      )}

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-8 text-sm" placeholder="Buscar..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-32"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-slate-50">
              <tr>
                {['Cliente','Teléfono','Deuda','Límite crédito',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtrados.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => verDetalle(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-700">{c.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.telefono || '—'}</td>
                  <td className="px-4 py-3">
                    {parseFloat(c.saldo_deuda) > 0
                      ? <span className="badge-red">{format(c.saldo_deuda)}</span>
                      : <span className="badge-green">Al día</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{format(c.limite_credito)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                      {parseFloat(c.saldo_deuda) > 0 && (
                        <button
                          onClick={() => { setModal({ type: 'abonar', cliente: c }); setError(''); setMonto(''); }}
                          className="btn-secondary text-xs py-1 px-2"
                        >
                          <DollarSign size={12} /> Abonar
                        </button>
                      )}
                      <ChevronRight size={16} className="text-slate-300 mt-0.5" />
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">
                  <User size={24} className="mx-auto mb-2 opacity-40" />
                  No se encontraron clientes
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear cliente */}
      {modal === 'crear' && (
        <Modal title="Nuevo cliente" onClose={() => setModal(null)}>
          <form onSubmit={handleCreate} className="space-y-3">
            {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
            <div><label className="label">Nombre *</label>
              <input className="input" required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Teléfono</label>
                <input className="input" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></div>
              <div><label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            </div>
            <div><label className="label">Dirección</label>
              <input className="input" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} /></div>
            <div><label className="label">Límite crédito ($)</label>
              <input type="number" className="input" min="0" value={form.limite_credito}
                onChange={e => setForm(f => ({ ...f, limite_credito: e.target.value }))} /></div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Crear cliente
              </button>
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal abonar */}
      {modal?.type === 'abonar' && (
        <Modal title={`Abonar — ${modal.cliente.nombre}`} onClose={() => setModal(null)}>
          <form onSubmit={handleAbonar} className="space-y-4">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <p className="text-sm text-slate-600">
              Deuda actual: <strong className="text-red-600">{format(modal.cliente.saldo_deuda)}</strong>
            </p>
            <div>
              <label className="label">Monto a abonar ($)</label>
              <input type="number" className="input" required min="1"
                max={modal.cliente.saldo_deuda}
                value={monto} onChange={e => setMonto(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <DollarSign size={14} />} Registrar abono
              </button>
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal detalle cliente */}
      {detalle && (
        <Modal title={detalle.nombre} onClose={() => setDetalle(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-400">Teléfono:</span> {detalle.telefono || '—'}</div>
              <div><span className="text-slate-400">Email:</span> {detalle.email || '—'}</div>
              <div><span className="text-slate-400">Deuda:</span> <strong className="text-red-600">{format(detalle.saldo_deuda)}</strong></div>
              <div><span className="text-slate-400">Límite:</span> {format(detalle.limite_credito)}</div>
            </div>
            {detalle.deudas?.length > 0 && (
              <div>
                <p className="label mb-2">Ventas a crédito pendientes</p>
                <div className="space-y-2">
                  {detalle.deudas.map(d => (
                    <div key={d.id} className="flex justify-between text-sm bg-red-50 rounded-lg p-2">
                      <span className="text-slate-500">{new Date(d.created_at).toLocaleDateString('es-CO')}</span>
                      <span className="text-slate-700">Total: {format(d.total)}</span>
                      <span className="font-bold text-red-600">Debe: {format(d.pendiente)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!detalle.deudas || detalle.deudas.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">Sin deudas pendientes ✓</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
