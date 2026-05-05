// pages/ProveedoresPage.jsx
import { useState, useEffect } from 'react';
import { proveedoresService } from '../services';
import { useCurrency } from '../hooks';
import {
  Plus, Search, Edit2, Trash2, Truck, Phone, Mail,
  MapPin, FileText, X, Check, Loader2, ChevronRight,
  ExternalLink, MessageSquare, PhoneCall, ShoppingBag,
  Package, History, AlertCircle
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────
const waLink   = (tel) => `https://wa.me/57${tel.replace(/\D/g, '')}`;
const mailLink = (email, nombre) =>
  `mailto:${email}?subject=Pedido - ${encodeURIComponent(nombre)}&body=Hola%2C%20me%20comunico%20para%20hacer%20un%20pedido.`;
const telLink  = (tel) => `tel:+57${tel.replace(/\D/g, '')}`;

// ── Sub-componentes ───────────────────────────────────────────
const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative card p-6 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} shadow-2xl z-10 max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const ContactBtn = ({ href, icon: Icon, label, color }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 shadow-sm ${color}`}
  >
    <Icon size={16} />
    {label}
  </a>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  value ? (
    <div className="flex items-start gap-3">
      <Icon size={15} className="text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  ) : null
);

// ── Formulario crear / editar ────────────────────────────────
const ProveedorForm = ({ inicial, onSave, onClose }) => {
  const [form, setForm] = useState(inicial || {
    nombre: '', nit: '', telefono: '', email: '', direccion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: e => setForm(p => ({ ...p, [field]: e.target.value })),
  });

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await onSave(form); }
    catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}
      <div>
        <label className="label">Nombre del proveedor *</label>
        <input className="input" required placeholder="Ej: Distribuidora El Norte" {...f('nombre')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">NIT / CC</label>
          <input className="input font-mono" placeholder="900123456-1" {...f('nit')} />
        </div>
        <div>
          <label className="label">Teléfono / WhatsApp</label>
          <input className="input" placeholder="3001234567" {...f('telefono')} />
        </div>
      </div>
      <div>
        <label className="label">Correo electrónico</label>
        <input type="email" className="input" placeholder="ventas@proveedor.com" {...f('email')} />
      </div>
      <div>
        <label className="label">Dirección</label>
        <input className="input" placeholder="Calle 10 #5-30, Ciudad" {...f('direccion')} />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {inicial ? 'Guardar cambios' : 'Registrar proveedor'}
        </button>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
      </div>
    </form>
  );
};

// ── Tarjeta de proveedor en la lista ─────────────────────────
const ProveedorCard = ({ proveedor, onEdit, onDelete, onVer }) => (
  <div className="card p-5 hover:shadow-md transition-all group">
    <div className="flex items-start justify-between gap-3">
      {/* Avatar + nombre */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <Truck size={20} className="text-indigo-600" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800 truncate">{proveedor.nombre}</p>
          {proveedor.nit && (
            <p className="text-xs text-slate-400 font-mono">NIT: {proveedor.nit}</p>
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(proveedor)}
          className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors" title="Editar">
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(proveedor.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Eliminar">
          <Trash2 size={14} />
        </button>
      </div>
    </div>

    {/* Datos de contacto */}
    <div className="mt-4 space-y-1.5">
      {proveedor.telefono && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Phone size={11} className="text-slate-300" />
          <span>{proveedor.telefono}</span>
        </div>
      )}
      {proveedor.email && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Mail size={11} className="text-slate-300" />
          <span className="truncate">{proveedor.email}</span>
        </div>
      )}
      {proveedor.direccion && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin size={11} className="text-slate-300" />
          <span className="truncate">{proveedor.direccion}</span>
        </div>
      )}
    </div>

    {/* Botones de contacto rápido */}
    <div className="mt-4 flex gap-2 flex-wrap">
      {proveedor.telefono && (
        <>
          <a href={waLink(proveedor.telefono)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition-colors">
            <MessageSquare size={12} /> WhatsApp
          </a>
          <a href={telLink(proveedor.telefono)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors">
            <PhoneCall size={12} /> Llamar
          </a>
        </>
      )}
      {proveedor.email && (
        <a href={mailLink(proveedor.email, proveedor.nombre)} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold transition-colors">
          <Mail size={12} /> Email
        </a>
      )}
    </div>

    {/* Ver detalle */}
    <button onClick={() => onVer(proveedor)}
      className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 transition-colors py-1">
      Ver historial y productos <ChevronRight size={12} />
    </button>
  </div>
);

// ── Panel de detalle del proveedor ───────────────────────────
const DetalleProveedor = ({ proveedor, onClose, onEditar }) => {
  const { format } = useCurrency();

  const totalComprado = proveedor.historial?.reduce(
    (a, c) => a + parseFloat(c.total || 0), 0
  ) ?? 0;

  return (
    <Modal title={proveedor.nombre} onClose={onClose} wide>
      <div className="space-y-6">

        {/* Datos + botones contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Información</p>
            <InfoRow icon={FileText} label="NIT / CC"   value={proveedor.nit} />
            <InfoRow icon={Phone}    label="Teléfono"   value={proveedor.telefono} />
            <InfoRow icon={Mail}     label="Correo"     value={proveedor.email} />
            <InfoRow icon={MapPin}   label="Dirección"  value={proveedor.direccion} />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Contactar ahora</p>
            <div className="space-y-2">
              {proveedor.telefono ? (
                <>
                  <ContactBtn
                    href={waLink(proveedor.telefono)}
                    icon={MessageSquare}
                    label="Abrir WhatsApp"
                    color="bg-green-500 hover:bg-green-600 text-white"
                  />
                  <ContactBtn
                    href={telLink(proveedor.telefono)}
                    icon={PhoneCall}
                    label={`Llamar: ${proveedor.telefono}`}
                    color="bg-blue-500 hover:bg-blue-600 text-white"
                  />
                </>
              ) : (
                <p className="text-xs text-slate-400 italic">Sin teléfono registrado</p>
              )}
              {proveedor.email ? (
                <ContactBtn
                  href={mailLink(proveedor.email, proveedor.nombre)}
                  icon={Mail}
                  label="Enviar correo"
                  color="bg-amber-500 hover:bg-amber-600 text-white"
                />
              ) : (
                <p className="text-xs text-slate-400 italic">Sin email registrado</p>
              )}
            </div>
          </div>
        </div>

        {/* Resumen compras */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-indigo-700">{proveedor.historial?.length ?? 0}</p>
            <p className="text-xs text-indigo-500 font-medium mt-0.5">Compras registradas</p>
          </div>
          <div className="bg-brand-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-700">{format(totalComprado)}</p>
            <p className="text-xs text-brand-500 font-medium mt-0.5">Total comprado</p>
          </div>
        </div>

        {/* Productos asociados */}
        {proveedor.productos?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
              <Package size={12} /> Productos comprados a este proveedor
            </p>
            <div className="divide-y border rounded-xl overflow-hidden">
              {proveedor.productos.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50">
                  <div>
                    <span className="font-medium text-slate-700">{p.nombre}</span>
                    {p.codigo_barras && (
                      <span className="ml-2 text-xs font-mono text-slate-400">{p.codigo_barras}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Costo: <strong>{format(p.precio_costo)}</strong></span>
                    <span className={`font-semibold ${parseFloat(p.stock) <= 0 ? 'text-red-500' : 'text-slate-600'}`}>
                      Stock: {p.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial de compras */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
            <History size={12} /> Últimas compras
          </p>
          {proveedor.historial?.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin compras registradas aún</p>
          ) : (
            <div className="divide-y border rounded-xl overflow-hidden">
              {proveedor.historial?.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-700">Compra #{c.id}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' })}
                      {c.registrado_por && ` · Por: ${c.registrado_por}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{c.num_productos} productos</span>
                    <span className="font-bold text-slate-800">{format(c.total)}</span>
                    <span className={`badge ${
                      c.estado === 'recibida' ? 'badge-green' :
                      c.estado === 'pendiente' ? 'badge-yellow' :
                      c.estado === 'anulada'  ? 'badge-gray' : 'badge-blue'
                    }`}>{c.estado}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones del modal */}
        <div className="flex gap-2 pt-2 border-t">
          <button onClick={() => onEditar(proveedor)} className="btn-secondary text-sm">
            <Edit2 size={14} /> Editar proveedor
          </button>
          <button onClick={onClose} className="btn-secondary text-sm ml-auto">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Página principal ─────────────────────────────────────────
export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null); // null | 'crear' | {proveedor edit} | {detalle}
  const [detalle, setDetalle]         = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const list = await proveedoresService.list();
      setProveedores(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.telefono || '').includes(search) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.nit || '').includes(search)
  );

  const verDetalle = async (proveedor) => {
    setLoadingDetalle(true);
    try {
      const data = await proveedoresService.getOne(proveedor.id);
      setDetalle(data);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleCreate = async (data) => {
    await proveedoresService.create(data);
    await cargar();
    setModal(null);
  };

  const handleUpdate = async (data) => {
    await proveedoresService.update(modal.id || detalle?.id, data);
    await cargar();
    // Si estaba viendo el detalle, refrescar
    if (detalle) {
      const updated = await proveedoresService.getOne(detalle.id);
      setDetalle(updated);
    }
    setModal(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Desactivar este proveedor?')) return;
    await proveedoresService.delete(id);
    await cargar();
    if (detalle?.id === id) setDetalle(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Proveedores</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {proveedores.length} proveedore{proveedores.length !== 1 ? 's' : ''} registrado{proveedores.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setModal('crear')} className="btn-primary shrink-0">
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      {/* Banner de tip */}
      <div className="card p-4 bg-indigo-50 border-indigo-200 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
          <Truck size={16} className="text-indigo-600" />
        </div>
        <div className="text-sm">
          <p className="font-semibold text-indigo-800">Contacta a tus proveedores en un clic</p>
          <p className="text-indigo-600 text-xs mt-0.5">
            Haz clic en <strong>WhatsApp</strong>, <strong>Llamar</strong> o <strong>Email</strong>
            en cada tarjeta para comunicarte directamente sin salir del sistema.
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9 text-sm"
          placeholder="Buscar por nombre, NIT, teléfono o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid de proveedores */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <Truck size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search ? 'No se encontraron proveedores con ese criterio' : 'Aún no tienes proveedores registrados'}
          </p>
          {!search && (
            <button onClick={() => setModal('crear')} className="btn-primary mt-4">
              <Plus size={14} /> Registrar primer proveedor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map(p => (
            <ProveedorCard
              key={p.id}
              proveedor={p}
              onEdit={(prov) => setModal({ ...prov, _edit: true })}
              onDelete={handleDelete}
              onVer={verDetalle}
            />
          ))}
        </div>
      )}

      {/* Loading detalle */}
      {loadingDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="card p-6 flex items-center gap-3 shadow-xl">
            <Loader2 className="animate-spin text-brand-600" size={20} />
            <span className="text-slate-700 font-medium">Cargando información...</span>
          </div>
        </div>
      )}

      {/* Modal crear */}
      {modal === 'crear' && (
        <Modal title="Registrar proveedor" onClose={() => setModal(null)}>
          <ProveedorForm onSave={handleCreate} onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* Modal editar */}
      {modal && modal._edit && (
        <Modal title="Editar proveedor" onClose={() => setModal(null)}>
          <ProveedorForm inicial={modal} onSave={handleUpdate} onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* Panel detalle */}
      {detalle && (
        <DetalleProveedor
          proveedor={detalle}
          onClose={() => setDetalle(null)}
          onEditar={(prov) => {
            setModal({ ...prov, _edit: true });
            setDetalle(null);
          }}
        />
      )}
    </div>
  );
}
