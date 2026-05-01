-- ============================================================
-- SaasLocal - Datos de ejemplo / seed
-- Contraseña de todos los usuarios: Admin1234!
-- Hash bcrypt de "Admin1234!"
-- ============================================================

-- Tiendas de ejemplo
INSERT INTO tiendas (nombre, nit, direccion, telefono, email, plan) VALUES
  ('Tienda La Esperanza',  '900123456-1', 'Calle 5 #12-34, Bogotá',     '3001234567', 'esperanza@example.com',  'pro'),
  ('Minimercado El Pino',  '800987654-2', 'Carrera 8 #22-10, Medellín', '3119876543', 'elpino@example.com',     'basic');

-- Usuarios (contraseña: Admin1234!)
INSERT INTO usuarios (tienda_id, rol_id, nombre, email, contrasena_hash) VALUES
  (1, 1, 'Carlos Ramírez',  'carlos@esperanza.com',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhcanFp8hoLtd1vj7iS9qy'),
  (1, 2, 'Ana Gómez',       'ana@esperanza.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhcanFp8hoLtd1vj7iS9qy'),
  (1, 3, 'Pedro Vargas',    'pedro@esperanza.com',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhcanFp8hoLtd1vj7iS9qy'),
  (2, 1, 'Lucía Herrera',   'lucia@elpino.com',      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhcanFp8hoLtd1vj7iS9qy');

-- Categorías tienda 1
INSERT INTO categorias (tienda_id, nombre, color, icono) VALUES
  (1, 'Bebidas',      '#3b82f6', 'droplet'),
  (1, 'Lácteos',      '#f59e0b', 'package'),
  (1, 'Aseo',         '#10b981', 'sparkles'),
  (1, 'Enlatados',    '#6366f1', 'archive'),
  (1, 'Panadería',    '#f97316', 'coffee'),
  (1, 'Licores',      '#ec4899', 'wine'),
  (2, 'Bebidas',      '#3b82f6', 'droplet'),
  (2, 'Snacks',       '#84cc16', 'shopping-bag');

-- Proveedores tienda 1
INSERT INTO proveedores (tienda_id, nombre, nit, telefono, email) VALUES
  (1, 'Distribuidora Norte', '901234567-1', '3201112233', 'ventas@dnorte.com'),
  (1, 'Lácteos El Campo',    '700234567-2', '3154445566', 'pedidos@elcampo.com');

-- Productos tienda 1
INSERT INTO productos (tienda_id, categoria_id, nombre, codigo_barras, precio_costo, precio_venta, unidad) VALUES
  (1,1,'Agua Cristal 600ml',   '7702098000015', 700,  1200, 'und'),
  (1,1,'Gaseosa Colombiana 2L','7702057000038', 3200, 5000, 'und'),
  (1,1,'Jugo Hit 250ml',       '7702462000042', 800,  1500, 'und'),
  (1,1,'Cerveza Club Colombia','7702057100015', 2800, 4500, 'und'),
  (1,2,'Leche Entera 1L',      '7702001000071', 2900, 4200, 'und'),
  (1,2,'Yogur Alpina 200g',    '7702039000011', 1500, 2500, 'und'),
  (1,2,'Queso Campesino 500g', '7706894000022', 8000,12000, 'und'),
  (1,3,'Jabón Rey 300g',       '7702095000033', 1800, 3200, 'und'),
  (1,3,'Detergente Ariel 500g','7500435000011', 5500, 8500, 'und'),
  (1,4,'Atún Van Camps 170g',  '7702034000019', 2200, 3800, 'und'),
  (1,4,'Fríjoles La Fama 400g','7702462100011', 1900, 3500, 'und'),
  (1,5,'Arepa Boyacense x6',   '7702003000044', 2500, 4000, 'und'),
  (1,5,'Pan Tajado Bimbo',     '7501030901000', 3800, 6500, 'und');

-- Inventario tienda 1
INSERT INTO inventario (tienda_id, producto_id, cantidad, cantidad_minima) VALUES
  (1,1,120,10), (1,2,48,5),  (1,3,60,8),  (1,4,36,6),
  (1,5,80,10),  (1,6,45,5),  (1,7,20,3),  (1,8,30,5),
  (1,9,25,3),   (1,10,50,8), (1,11,40,6), (1,12,30,5),
  (1,13,20,4);

-- Métodos de pago tienda 1
INSERT INTO metodos_pago (tienda_id, nombre) VALUES
  (1,'Efectivo'), (1,'Nequi'), (1,'Daviplata'), (1,'Transferencia'), (1,'Crédito'),
  (2,'Efectivo'), (2,'Nequi');

-- Clientes tienda 1
INSERT INTO clientes (tienda_id, nombre, telefono, direccion, saldo_deuda, limite_credito) VALUES
  (1,'María López',    '3001112233','Calle 3 #5-20', 15000, 50000),
  (1,'Juan Martínez',  '3112223344','Cra 7 #10-15',  0,     30000),
  (1,'Rosa Bermúdez',  '3004445566','Calle 8 #2-10', 45000, 100000),
  (1,'Ernesto Silva',  '3163334455','Mz A Casa 12',  0,     20000);

-- Ventas de ejemplo (tienda 1)
INSERT INTO ventas (tienda_id, usuario_id, cliente_id, metodo_pago_id, subtotal, total, monto_pagado, cambio, estado) VALUES
  (1,1,NULL,1, 14700,14700,15000,300,'completada'),
  (1,2,1,   5, 37600,37600,0,   0,  'credito'),
  (1,1,2,   2, 21000,21000,21000,0, 'completada');

INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_venta, subtotal) VALUES
  (1,1, 3,1200,3600), (1,5, 2,4200,8400), (1,8, 1,3200,3200), (1,10,1,3800,3800) -- ajuste manual subtotal para demo
  ;

INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_venta, subtotal) VALUES
  (2,2,2,5000,10000),(2,7,1,12000,12000),(2,6,3,2500,7500),(2,9,1,8500,8500);

INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_venta, subtotal) VALUES
  (3,1,5,1200,6000),(3,12,2,4000,8000),(3,11,2,3500,7000);

-- Actualizar saldo deuda clientes (crédito en venta 2)
UPDATE clientes SET saldo_deuda = 37600 WHERE id = 1;

-- Caja abierta tienda 1
INSERT INTO cajas (tienda_id, usuario_id, monto_apertura) VALUES (1, 1, 50000);
