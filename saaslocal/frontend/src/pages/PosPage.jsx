// pages/PosPage.jsx - Pantalla de venta tipo POS
import { useState, useEffect, useRef } from 'react';
import { productosService, ventasService, catalogosService, clientesService } from '../services';
import { useCurrency } from '../hooks';
import { Search, Plus, Minus, Trash2, ShoppingCart, ChevronRight, X, Check, Loader2, User } from 'lucide-react';

const formatCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);

export default function PosPage() {
  const [productos, setProductos]   = useState([]);
  const [search, setSearch]         = useState('');
  const [carrito, setCarrito]       = useState([]);
  const [metodos, setMetodos]       = useState([]);
  const [clientes, setClientes]     = useState([]);
  const [metodoPago, setMetodoPago] = useState('');
  const [clienteId, setClienteId]   = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [descuento, setDescuento]   = useState(0);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');
  const searchRef = useRef();

  useEffect(() => {
    productosService.list({ disponibles: 'true' }).then(setProductos);
    catalogosService.metodosPago().then(setMetodos);
    clientesService.list().then(setClientes);
  }, []);

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo_barras && p.codigo_barras.includes(search))
  );

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const exist = prev.find(i => i.producto_id === producto.id);
      if (exist) {
        if (exist.cantidad >= parseFloat(producto.stock)) return prev; // límite stock
        return prev.map(i => i.producto_id === producto.id
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
        );
      }
      return [...prev, {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_venta: parseFloat(producto.precio_venta),
        cantidad: 1,
        stock: parseFloat(producto.stock),
        descuento: 0,
      }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(prev => prev
      .map(i => i.producto_id === id
        ? { ...i, cantidad: Math.max(0.5, Math.min(i.stock, i.cantidad + delta)) }
        : i
      )
    );
  };

  const quitarItem = (id) => setCarrito(prev => prev.filter(i => i.producto_id !== id));

  const subtotal = carrito.reduce((a, i) => a + i.precio_venta * i.cantidad - i.descuento, 0);
  const total    = subtotal - parseFloat(descuento || 0);
  const cambio   = parseFloat(montoPagado || 0) - total;
  const esCredito = metodos.find(m => m.id === parseInt(metodoPago))?.nombre?.toLowerCase().includes('crédito');

  const procesar = async () => {
    if (carrito.length === 0) return setError('El carrito está vacío');
    if (!metodoPago)          return setError('Selecciona un método de pago');
    setError('');
    setLoading(true);
    try {
      await ventasService.create({
        items: carrito.map(i => ({
          producto_id: i.producto_id,
          cantidad:    i.cantidad,
          precio_venta: i.precio_venta,
          descuento:    i.descuento,
        })),
        metodo_pago_id: parseInt(metodoPago),
        cliente_id:  clienteId ? parseInt(clienteId) : undefined,
        descuento:   parseFloat(descuento || 0),
        monto_pagado: parseFloat(montoPagado || 0),
      });
      setSuccess(true);
      setTimeout(() => {
        setCarrito([]); setSearch(''); setMontoPagado(''); setDescuento(0);
        setClienteId(''); setSuccess(false);
        searchRef.current?.focus();
        // Refrescar stock
        productosService.list({ disponibles: 'true' }).then(setProductos);
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-112px)]">
      {/* Panel izquierdo: búsqueda y productos */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Nueva Venta</h1>
          <p className="text-slate-500 text-sm">Busca productos o escanea código de barras</p>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            className="input pl-9"
            placeholder="Buscar por nombre o código de barras..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {productosFiltrados.map(p => (
            <button
              key={p.id}
              onClick={() => agregarAlCarrito(p)}
              disabled={parseFloat(p.stock) <= 0}
              className="card p-3 text-left hover:border-brand-300 hover:shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="w-full aspect-square bg-slate-100 rounded-lg mb-2 flex items-center justify-center">
                <ShoppingCart size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-700 truncate">{p.nombre}</p>
              <p className="text-xs text-slate-400">Stock: {p.stock}</p>
              <p className="text-brand-700 font-bold text-sm mt-1">{formatCOP(p.precio_venta)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Panel derecho: carrito */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        <div className="card flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-surface-border">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <ShoppingCart size={16} /> Carrito ({carrito.length})
            </h2>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {carrito.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                <ShoppingCart size={32} className="mb-2" />
                <p className="text-sm">Carrito vacío</p>
              </div>
            )}
            {carrito.map(item => (
              <div key={item.producto_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{item.nombre}</p>
                  <p className="text-xs text-slate-400">{formatCOP(item.precio_venta)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(item.producto_id, -1)} className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200">
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-bold w-6 text-center">{item.cantidad}</span>
                  <button onClick={() => cambiarCantidad(item.producto_id, 1)} className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200">
                    <Plus size={10} />
                  </button>
                </div>
                <span className="text-xs font-bold text-slate-700 w-16 text-right">{formatCOP(item.precio_venta * item.cantidad)}</span>
                <button onClick={() => quitarItem(item.producto_id)} className="text-slate-300 hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="p-4 border-t border-surface-border space-y-3">
            {/* Cliente */}
            <div>
              <label className="label flex items-center gap-1"><User size={10} />Cliente (opcional)</label>
              <select className="input text-xs" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                <option value="">— Sin cliente —</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            {/* Método de pago */}
            <div>
              <label className="label">Método de pago *</label>
              <select className="input text-xs" value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {metodos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>

            {/* Descuento */}
            <div>
              <label className="label">Descuento ($)</label>
              <input type="number" className="input text-xs" min="0" placeholder="0"
                value={descuento} onChange={e => setDescuento(e.target.value)} />
            </div>

            {/* Monto pagado */}
            {!esCredito && (
              <div>
                <label className="label">Monto recibido ($)</label>
                <input type="number" className="input text-xs" min="0" placeholder="0"
                  value={montoPagado} onChange={e => setMontoPagado(e.target.value)} />
              </div>
            )}

            {/* Resumen */}
            <div className="bg-slate-50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span><span>{formatCOP(subtotal)}</span>
              </div>
              {parseFloat(descuento) > 0 && (
                <div className="flex justify-between text-xs text-red-500">
                  <span>Descuento</span><span>-{formatCOP(descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-800 border-t pt-1">
                <span>TOTAL</span><span>{formatCOP(total)}</span>
              </div>
              {cambio > 0 && (
                <div className="flex justify-between text-xs text-brand-700 font-semibold">
                  <span>Cambio</span><span>{formatCOP(cambio)}</span>
                </div>
              )}
            </div>

            {error && <p className="text-red-600 text-xs">{error}</p>}

            <button
              onClick={procesar}
              disabled={loading || success || carrito.length === 0}
              className={`w-full btn justify-center py-3 font-bold text-sm transition-all
                ${success ? 'bg-brand-600 text-white' : 'btn-primary'}`}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> :
               success ? <><Check size={16} /> ¡Venta registrada!</> :
               <>Cobrar {formatCOP(total)} <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
