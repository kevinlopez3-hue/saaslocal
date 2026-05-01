// pages/VentasPage.jsx
import { useState, useEffect } from 'react';
import { ventasService } from '../services';
import { useCurrency } from '../hooks';
import { Search, ShoppingCart, Loader2, X, Eye } from 'lucide-react';

const ESTADOS = { completada: 'badge-green', credito: 'badge-red', anulada: 'badge-gray', parcial: 'badge-yellow' };

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative card p-6 w-full max-w-lg shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
      </div>
      {children}
    </div>
  </div>
);

export default function VentasPage() {
  const { format } = useCurrency();
  const [ventas, setVentas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [estado, setEstado]   = useState('');
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    ventasService.list().then(v => { setVentas(v); setLoading(false); });
  }, []);

  const filtradas = ventas.filter(v => {
    const matchSearch = !search ||
      v.cajero?.toLowerCase().includes(search.toLowerCase()) ||
      v.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      String(v.id).includes(search);
    const matchEstado = !estado || v.estado === estado;
    return matchSearch && matchEstado;
  });

  const verDetalle = async (id) => {
    const venta = await ventasService.getOne(id);
    setDetalle(venta);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Historial de Ventas</h1>
        <p className="text-slate-500 text-sm">{ventas.length} ventas registradas</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8 text-sm w-52" placeholder="Buscar..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm w-40" value={estado} onChange={e => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="completada">Completada</option>
          <option value="credito">Crédito</option>
          <option value="anulada">Anulada</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-32"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-slate-50">
              <tr>
                {['#','Fecha','Cajero','Cliente','Método','Total','Estado',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtradas.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400 text-xs">#{v.id}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(v.created_at).toLocaleString('es-CO', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{v.cajero}</td>
                  <td className="px-4 py-3 text-slate-500">{v.cliente_nombre || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{v.metodo_pago || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{format(v.total)}</td>
                  <td className="px-4 py-3">
                    <span className={ESTADOS[v.estado] || 'badge-gray'}>{v.estado}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => verDetalle(v.id)} className="p-1.5 rounded hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">
                  <ShoppingCart size={24} className="mx-auto mb-2 opacity-40" />
                  Sin ventas
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Detalle modal */}
      {detalle && (
        <Modal title={`Venta #${detalle.id}`} onClose={() => setDetalle(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400">Cajero:</span> {detalle.cajero}</div>
              <div><span className="text-slate-400">Cliente:</span> {detalle.cliente_nombre || '—'}</div>
              <div><span className="text-slate-400">Método:</span> {detalle.metodo_pago || '—'}</div>
              <div><span className="text-slate-400">Estado:</span>
                <span className={`ml-1 ${ESTADOS[detalle.estado]}`}>{detalle.estado}</span>
              </div>
              <div><span className="text-slate-400">Fecha:</span> {new Date(detalle.created_at).toLocaleString('es-CO')}</div>
            </div>
            {detalle.detalle && (
              <div>
                <p className="label mb-2">Items vendidos</p>
                <div className="divide-y border rounded-lg overflow-hidden">
                  {detalle.detalle.map(d => (
                    <div key={d.id} className="flex justify-between items-center px-3 py-2 text-sm">
                      <span className="text-slate-700">{d.producto_nombre}</span>
                      <span className="text-slate-500">{d.cantidad} × {format(d.precio_venta)}</span>
                      <span className="font-semibold">{format(d.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
              {parseFloat(detalle.descuento) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Descuento</span><span>-{format(detalle.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 border-t pt-1">
                <span>Total</span><span>{format(detalle.total)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Pagado</span><span>{format(detalle.monto_pagado)}</span>
              </div>
              {parseFloat(detalle.cambio) > 0 && (
                <div className="flex justify-between text-brand-700">
                  <span>Cambio</span><span>{format(detalle.cambio)}</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
