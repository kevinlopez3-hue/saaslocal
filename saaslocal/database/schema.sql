-- ============================================================
-- SaasLocal - Sistema POS Multi-Tenant para Tiendas de Barrio
-- Schema v1.0
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TIENDAS (tenant root)
-- ============================================================
CREATE TABLE tiendas (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  nit             VARCHAR(30),
  direccion       VARCHAR(200),
  telefono        VARCHAR(20),
  email           VARCHAR(100),
  logo_url        VARCHAR(300),
  activa          BOOLEAN NOT NULL DEFAULT TRUE,
  plan            VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free','basic','pro')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
  id    SERIAL PRIMARY KEY,
  tipo  VARCHAR(30) NOT NULL UNIQUE   -- 'admin','cajero','bodeguero'
);

INSERT INTO roles (tipo) VALUES ('admin'), ('cajero'), ('bodeguero');

-- ============================================================
-- USUARIOS
-- ============================================================
CREATE TABLE usuarios (
  id               SERIAL PRIMARY KEY,
  tienda_id        INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  rol_id           INT NOT NULL REFERENCES roles(id),
  nombre           VARCHAR(100) NOT NULL,
  email            VARCHAR(100) NOT NULL,
  contrasena_hash  TEXT NOT NULL,
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_login     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tienda_id, email)
);

-- ============================================================
-- CATEGORIAS
-- ============================================================
CREATE TABLE categorias (
  id         SERIAL PRIMARY KEY,
  tienda_id  INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre     VARCHAR(80) NOT NULL,
  color      VARCHAR(7) DEFAULT '#6366f1',
  icono      VARCHAR(50),
  activa     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tienda_id, nombre)
);

-- ============================================================
-- PROVEEDORES
-- ============================================================
CREATE TABLE proveedores (
  id         SERIAL PRIMARY KEY,
  tienda_id  INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre     VARCHAR(120) NOT NULL,
  nit        VARCHAR(30),
  telefono   VARCHAR(20),
  email      VARCHAR(100),
  direccion  VARCHAR(200),
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTOS
-- ============================================================
CREATE TABLE productos (
  id               SERIAL PRIMARY KEY,
  tienda_id        INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  categoria_id     INT REFERENCES categorias(id) ON DELETE SET NULL,
  nombre           VARCHAR(150) NOT NULL,
  descripcion      TEXT,
  codigo_barras    VARCHAR(50),
  precio_costo     NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_venta     NUMERIC(12,2) NOT NULL,
  unidad           VARCHAR(20) NOT NULL DEFAULT 'und',   -- und, kg, lt, caja
  disponible       BOOLEAN NOT NULL DEFAULT TRUE,
  imagen_url       VARCHAR(300),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tienda_id, codigo_barras)
);

-- ============================================================
-- INVENTARIO
-- ============================================================
CREATE TABLE inventario (
  id               SERIAL PRIMARY KEY,
  tienda_id        INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  producto_id      INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad         INTEGER NOT NULL DEFAULT 0,
  cantidad_minima  INTEGER NOT NULL DEFAULT 0,
  cantidad_maxima  INTEGER,
  ubicacion        VARCHAR(80),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tienda_id, producto_id)
);

-- ============================================================
-- MOVIMIENTOS DE INVENTARIO
-- ============================================================
CREATE TABLE inventario_movimientos (
  id           SERIAL PRIMARY KEY,
  tienda_id    INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  producto_id  INT NOT NULL REFERENCES productos(id),
  usuario_id   INT REFERENCES usuarios(id),
  tipo         VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada','salida','ajuste','venta','compra','devolucion')),
  cantidad     INTEGER NOT NULL,
  cantidad_anterior INTEGER NOT NULL,
  cantidad_nueva    INTEGER NOT NULL,
  motivo       TEXT,
  referencia_id INT,            -- id de venta o compra que generó el movimiento
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE TABLE clientes (
  id            SERIAL PRIMARY KEY,
  tienda_id     INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre        VARCHAR(120) NOT NULL,
  telefono      VARCHAR(20),
  email         VARCHAR(100),
  direccion     VARCHAR(200),
  documento     VARCHAR(30),
  saldo_deuda   NUMERIC(12,2) NOT NULL DEFAULT 0,
  limite_credito NUMERIC(12,2) NOT NULL DEFAULT 0,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  notas         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- METODOS DE PAGO
-- ============================================================
CREATE TABLE metodos_pago (
  id         SERIAL PRIMARY KEY,
  tienda_id  INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  nombre     VARCHAR(60) NOT NULL,
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (tienda_id, nombre)
);

-- ============================================================
-- VENTAS
-- ============================================================
CREATE TABLE ventas (
  id               SERIAL PRIMARY KEY,
  tienda_id        INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  usuario_id       INT NOT NULL REFERENCES usuarios(id),
  cliente_id       INT REFERENCES clientes(id),
  metodo_pago_id   INT REFERENCES metodos_pago(id),
  subtotal         NUMERIC(12,2) NOT NULL DEFAULT 0,
  descuento        NUMERIC(12,2) NOT NULL DEFAULT 0,
  impuesto         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total            NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_pagado     NUMERIC(12,2) NOT NULL DEFAULT 0,
  cambio           NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado           VARCHAR(20) NOT NULL DEFAULT 'completada'
                   CHECK (estado IN ('completada','anulada','credito','parcial')),
  notas            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DETALLE DE VENTAS
-- ============================================================
CREATE TABLE detalle_ventas (
  id            SERIAL PRIMARY KEY,
  venta_id      INT NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id   INT NOT NULL REFERENCES productos(id),
  cantidad      INTEGER NOT NULL,
  precio_venta  NUMERIC(12,2) NOT NULL,
  descuento     NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal      NUMERIC(12,2) NOT NULL
);

-- ============================================================
-- COMPRAS A PROVEEDORES
-- ============================================================
CREATE TABLE compras_proveedor (
  id             SERIAL PRIMARY KEY,
  tienda_id      INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  proveedor_id   INT REFERENCES proveedores(id),
  usuario_id     INT REFERENCES usuarios(id),
  total          NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado         VARCHAR(20) NOT NULL DEFAULT 'recibida'
                 CHECK (estado IN ('pendiente','recibida','parcial','anulada')),
  notas          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DETALLE DE COMPRAS
-- ============================================================
CREATE TABLE detalle_compras (
  id                  SERIAL PRIMARY KEY,
  compra_id           INT NOT NULL REFERENCES compras_proveedor(id) ON DELETE CASCADE,
  producto_id         INT NOT NULL REFERENCES productos(id),
  cantidad            NUMERIC(12,3) NOT NULL,
  precio_costo        NUMERIC(12,2) NOT NULL,
  subtotal            NUMERIC(12,2) NOT NULL
);

-- ============================================================
-- CAJA (sesiones de caja)
-- ============================================================
CREATE TABLE cajas (
  id              SERIAL PRIMARY KEY,
  tienda_id       INT NOT NULL REFERENCES tiendas(id) ON DELETE CASCADE,
  usuario_id      INT NOT NULL REFERENCES usuarios(id),
  monto_apertura  NUMERIC(12,2) NOT NULL DEFAULT 0,
  monto_cierre    NUMERIC(12,2),
  estado          VARCHAR(20) NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada')),
  abierta_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cerrada_en      TIMESTAMPTZ,
  notas_cierre    TEXT
);

-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX idx_usuarios_tienda        ON usuarios(tienda_id);
CREATE INDEX idx_productos_tienda       ON productos(tienda_id);
CREATE INDEX idx_productos_categoria    ON productos(categoria_id);
CREATE INDEX idx_inventario_tienda      ON inventario(tienda_id);
CREATE INDEX idx_inventario_producto    ON inventario(producto_id);
CREATE INDEX idx_clientes_tienda        ON clientes(tienda_id);
CREATE INDEX idx_ventas_tienda          ON ventas(tienda_id);
CREATE INDEX idx_ventas_created         ON ventas(tienda_id, created_at DESC);
CREATE INDEX idx_ventas_cliente         ON ventas(cliente_id);
CREATE INDEX idx_detalle_venta          ON detalle_ventas(venta_id);
CREATE INDEX idx_inv_mov_tienda         ON inventario_movimientos(tienda_id);
CREATE INDEX idx_inv_mov_producto       ON inventario_movimientos(producto_id);

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tiendas_upd   BEFORE UPDATE ON tiendas   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_usuarios_upd  BEFORE UPDATE ON usuarios  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_productos_upd BEFORE UPDATE ON productos  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clientes_upd  BEFORE UPDATE ON clientes   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_inv_upd       BEFORE UPDATE ON inventario FOR EACH ROW EXECUTE FUNCTION set_updated_at();
