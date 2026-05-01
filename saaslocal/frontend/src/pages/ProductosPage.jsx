// pages/ProductosPage.jsx
import { useState, useEffect } from 'react';
import { productosService, catalogosService } from '../services';
import { useCurrency } from '../hooks';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, Loader2, X, Check } from 'lucide-react';

const UNIDADES = ['und', 'kg', 'lt', 'caja', 'paq', 'docena'];

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

const ProductoForm = ({ inicial, categorias, onSave, onClose }) => {
  const [form, setForm] = useState(inicial || {
    nombre: '', categoria_id: '', precio_costo: '', precio_venta: '',
    codigo_barras: '', unidad: 'und', disponible: true,
    stock_inicial: '', stock_minimo: '', descripcion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: e => setForm(p => ({ ...p, [field]: e.target.value })),
  });

  return (
    <form onSubmit={handle} className="space-y-3">
      {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Nombre *</label>
          <input className="input" required {...f('nombre')} />
        </div>
        <div>
          <label className="label">Categoría</label>
          <select className="input" {...f('categoria_id')}>
            <option value="">— Sin categoría —</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Unidad</label>
          <select className="input" {...f('unidad')}>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Precio costo ($)</label>
          <input type="number" className="input" min="0" step="1" {...f('precio_costo')} />
        </div>
        <div>
          <label className="label">Precio venta ($) *</label>
          <input type="number" className="input" min="1" step="1" required {...f('precio_venta')} />
        </div>
        <div>
          <label className="label">Código de barras</label>
          <input className="input font-mono" {...f('codigo_barras')} />
        </div>
        {!inicial && (
          <>
            <div>
              <label className="label">Stock inicial</label>
              <input type="number" className="input" min="0" {...f('stock_inicial')} />
            </div>
            <div>
              <label className="label">Stock mínimo</label>
              <input type="number" className="input" min="0" {...f('stock_minimo')} />
            </div>
          </>
        )}
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="disp" checked={form.disponible !== false}
            onChange={e => setForm(p => ({ ...p, disponible: e.target.checked }))} />
          <label htmlFor="disp" className="text-sm text-slate-600">Disponible para venta</label>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {inicial ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  );
};

export default function ProductosPage() {
  const { format } = useCurrency();
  const [productos, setProductos]   = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null); // null | 'crear' | producto

  const cargar = async () => {
    setLoading(true);
    const [prods, cats] = await Promise.all([
      productosService.list(),
      catalogosService.categorias(),
    ]);
    setProductos(prods);
    setCategorias(cats);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo_barras || '').includes(search)
  );

  const handleCreate = async (data) => {
    await productosService.create(data);
    await cargar();
    setModal(null);
  };

  const handleUpdate = async (data) => {
    await productosService.update(modal.id, data);
    await cargar();
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return;
    await productosService.delete(id);
    await cargar();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Productos</h1>
          <p className="text-slate-500 text-sm">{productos.length} productos registrados</p>
        </div>
        <button onClick={() => setModal('crear')} className="btn-primary">
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-8 text-sm" placeholder="Buscar..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-32 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-surface-border bg-slate-50">
              <tr>
                {['Nombre','Categoría','Precio costo','Precio venta','Stock','Estado',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtrados.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">{p.nombre}</p>
                    {p.codigo_barras && <p className="text-xs text-slate-400 font-mono">{p.codigo_barras}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.categoria_nombre || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{format(p.precio_costo)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{format(p.precio_venta)}</td>
                  <td className="px-4 py-3">
                    <span className={parseFloat(p.stock) <= parseFloat(p.stock_minimo) && parseFloat(p.stock_minimo) > 0
                      ? 'font-bold text-amber-600 flex items-center gap-1'
                      : 'text-slate-700'}>
                      {parseFloat(p.stock) <= parseFloat(p.stock_minimo) && parseFloat(p.stock_minimo) > 0
                        && <AlertTriangle size={12} />}
                      {p.stock} {p.unidad}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.disponible
                      ? <span className="badge-green">Disponible</span>
                      : <span className="badge-gray">Inactivo</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setModal(p)} className="p-1.5 rounded hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">
                  <Package size={24} className="mx-auto mb-2 opacity-40" />
                  No se encontraron productos
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear */}
      {modal === 'crear' && (
        <Modal title="Nuevo producto" onClose={() => setModal(null)}>
          <ProductoForm categorias={categorias} onSave={handleCreate} onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* Modal editar */}
      {modal && modal !== 'crear' && (
        <Modal title="Editar producto" onClose={() => setModal(null)}>
          <ProductoForm inicial={modal} categorias={categorias} onSave={handleUpdate} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
