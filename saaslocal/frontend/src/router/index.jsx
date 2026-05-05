// router/index.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../layouts/AppLayout';
import LoginPage      from '../pages/LoginPage';
import DashboardPage  from '../pages/DashboardPage';
import ProductosPage  from '../pages/ProductosPage';
import VentasPage     from '../pages/VentasPage';
import PosPage        from '../pages/PosPage';
import ClientesPage   from '../pages/ClientesPage';
import ProveedoresPage from '../pages/ProveedoresPage';

const Protected = ({ children }) => {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
};

const PublicOnly = ({ children }) => {
  const { usuario } = useAuth();
  return !usuario ? children : <Navigate to="/" replace />;
};

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<DashboardPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="ventas"    element={<VentasPage />} />
        <Route path="pos"       element={<PosPage />} />
        <Route path="clientes"    element={<ClientesPage />} />
        <Route path="proveedores" element={<ProveedoresPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
