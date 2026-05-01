// pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services';
import { useCurrency } from '../hooks';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, ShoppingCart, Users, AlertTriangle,
  CreditCard, Package, ArrowRight, Loader2
} from 'lucide-react';

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ec4899','#8b5cf6'];

const StatCard = ({ title, value, sub, icon: Icon, color = 'brand' }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-100`}>
        <Icon size={20} className={`text-${color}-600`} />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { format } = useCurrency();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    dashboardService.getStats()
      .then(setStats)
      .catch(() => setError('No se pudieron cargar las estadísticas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  if (error) return <div className="text-red-500 p-4">{error}</div>;

  const { hoy, semana, topProductos, alertasStock, deudas, metodosPago } = stats;

  const semanaData = semana.map(d => ({
    fecha: new Date(d.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
    ventas: parseFloat(d.total),
    num: parseInt(d.num_ventas),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Resumen del día de hoy</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ventas hoy" value={format(hoy.total_ventas)} sub={`${hoy.num_ventas} transacciones`} icon={TrendingUp} color="brand" />
        <StatCard title="Cobrado (efectivo)" value={format(hoy.total_efectivo)} icon={ShoppingCart} color="blue" />
        <StatCard title="Créditos pendientes" value={format(deudas.total_deudas)} sub={`${deudas.num_clientes} clientes`} icon={CreditCard} color="amber" />
        <StatCard title="Alertas stock" value={alertasStock.length} sub="productos bajos" icon={AlertTriangle} color="red" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ventas 7 días */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold text-slate-700 mb-4">Ventas últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={semanaData} barSize={32}>
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => format(v)} />
              <Bar dataKey="ventas" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Métodos de pago */}
        <div className="card p-5">
          <h3 className="font-bold text-slate-700 mb-4">Métodos de pago (30d)</h3>
          {metodosPago.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={metodosPago} dataKey="total" nameKey="metodo" cx="50%" cy="50%" outerRadius={70}>
                  {metodosPago.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={v => format(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-sm text-center mt-10">Sin datos aún</p>}
        </div>
      </div>

      {/* Top productos + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top productos */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700">Top productos (30d)</h3>
            <Link to="/productos" className="text-brand-600 text-xs font-medium flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {topProductos.length === 0 && <p className="text-slate-400 text-sm">Sin ventas aún</p>}
            {topProductos.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-mono w-5 text-slate-400">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{p.nombre}</p>
                  <p className="text-xs text-slate-400">{p.unidades} unidades</p>
                </div>
                <span className="text-sm font-semibold text-brand-700">{format(p.ingresos)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de stock */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Stock bajo
            </h3>
            <Link to="/productos" className="text-brand-600 text-xs font-medium flex items-center gap-1 hover:underline">
              Gestionar <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {alertasStock.length === 0 && (
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <Package size={14} /> Inventario en buen estado
              </p>
            )}
            {alertasStock.slice(0, 6).map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${p.stock === 0 ? 'bg-red-500' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{p.nombre}</p>
                  <p className="text-xs text-slate-400">{p.categoria}</p>
                </div>
                <span className={`text-sm font-bold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {p.stock} {p.stock === 0 ? '(agotado)' : `(mín. ${p.stock_minimo})`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deudas clientes */}
      {parseFloat(deudas.total_deudas) > 0 && (
        <div className="card p-5 border-l-4 border-amber-400">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-700">Deudas pendientes de clientes</p>
              <p className="text-sm text-slate-500">
                {deudas.num_clientes} cliente(s) deben un total de <strong>{format(deudas.total_deudas)}</strong>
              </p>
            </div>
            <Link to="/clientes" className="btn-secondary text-xs">
              Ver clientes <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
