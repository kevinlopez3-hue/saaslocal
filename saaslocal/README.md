# SaasLocal — Sistema POS Multi-Tenant para Tiendas de Barrio

Sistema completo de punto de venta (POS) con gestión de inventario, clientes con crédito (fiados), dashboard de métricas y arquitectura multi-tenant. Listo para correr en un VPS Ubuntu / DigitalOcean con Docker.

---

## Tecnologías

| Capa | Stack |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js 20 + Express 4 |
| Base de datos | PostgreSQL 16 |
| Containerización | Docker + Docker Compose |
| Servidor web | Nginx (sirve el frontend y hace proxy al backend) |

---

## Estructura del proyecto

```
saaslocal/
├── backend/
│   ├── src/
│   │   ├── config/        → Conexión PostgreSQL (pool)
│   │   ├── controllers/   → Manejo de request/response
│   │   ├── middlewares/   → JWT auth, manejo de errores
│   │   ├── models/        → Queries SQL y lógica de datos
│   │   ├── routes/        → Definición de endpoints
│   │   ├── scripts/       → migrate.js, seed.js
│   │   ├── utils/         → logger, jwt helper
│   │   └── index.js       → Entry point del servidor
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/           → Axios + interceptores JWT
│   │   ├── context/       → AuthContext (sesión global)
│   │   ├── hooks/         → useApi, useCurrency, useDebounce
│   │   ├── layouts/       → AppLayout con sidebar
│   │   ├── pages/         → Login, Dashboard, POS, Productos, Ventas, Clientes
│   │   ├── router/        → Rutas protegidas
│   │   ├── services/      → Llamadas al backend
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── nginx.conf
│   └── .env.example
│
├── database/
│   ├── schema.sql         → Tablas, índices, triggers
│   └── seed.sql           → Datos de ejemplo
│
├── .vscode/               → Settings, launch, extensiones recomendadas
├── api-tests.http         → Tests de API con REST Client
├── docker-compose.yml     → Producción
├── docker-compose.dev.yml → Desarrollo con hot reload
├── .env.example
└── README.md
```

---

## Inicio rápido — Desarrollo local (sin Docker)

### Prerequisitos

- Node.js 20+
- PostgreSQL 16 corriendo localmente
- npm o pnpm

### 1. Clonar y configurar variables de entorno

```bash
git clone <tu-repo> saaslocal
cd saaslocal

# Backend
cp backend/.env.example backend/.env
# Edita backend/.env con tus credenciales de PostgreSQL

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 2. Crear la base de datos

```bash
# Conectarte a PostgreSQL y crear la DB
psql -U postgres -c "CREATE DATABASE saaslocal;"

# Ejecutar schema
psql -U postgres -d saaslocal -f database/schema.sql

# Insertar datos de ejemplo
psql -U postgres -d saaslocal -f database/seed.sql
```

O con los scripts npm del backend:

```bash
cd backend
npm install
npm run migrate   # crea las tablas
npm run seed      # inserta datos de ejemplo
```

### 3. Arrancar el backend

```bash
cd backend
npm install
npm run dev       # nodemon con hot reload en http://localhost:4000
```

### 4. Arrancar el frontend

```bash
cd frontend
npm install
npm run dev       # Vite dev server en http://localhost:5173
```

### 5. Abrir en el navegador

```
http://localhost:5173
```

Credenciales de demo:
- **Email:** `carlos@esperanza.com`
- **Contraseña:** `Admin1234!`

---

## Desarrollo local con Docker

```bash
# Levantar todos los servicios con hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Solo la base de datos (para correr backend/frontend en local)
docker-compose up postgres
```

---

## Deployment en producción — VPS Ubuntu / DigitalOcean

### Prerequisitos en el VPS

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Instalar Docker Compose v2
sudo apt install docker-compose-plugin -y

# Verificar
docker --version
docker compose version
```

### 1. Subir el código al servidor

```bash
# Opción A: clonar desde Git
git clone <tu-repo> /opt/saaslocal
cd /opt/saaslocal

# Opción B: copiar con SCP desde tu máquina local
scp -r ./saaslocal usuario@IP_VPS:/opt/saaslocal
```

### 2. Configurar variables de entorno

```bash
cd /opt/saaslocal
cp .env.example .env
nano .env   # o vim .env
```

Variables **obligatorias** para producción:

```env
DB_PASSWORD=contraseña_muy_segura_aqui
JWT_SECRET=string_aleatorio_de_48_chars_minimo
CORS_ORIGIN=https://tudominio.com
NODE_ENV=production
```

Para generar un `JWT_SECRET` seguro:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Build y arranque

```bash
cd /opt/saaslocal
docker compose up --build -d

# Ver logs en tiempo real
docker compose logs -f

# Ver estado de los contenedores
docker compose ps
```

La aplicación estará disponible en `http://IP_DEL_VPS`.

### 4. (Opcional) Configurar dominio con HTTPS — Nginx + Certbot

```bash
# Instalar Nginx en el host (proxy inverso con SSL)
sudo apt install nginx certbot python3-certbot-nginx -y

# Crear config Nginx en el host
sudo nano /etc/nginx/sites-available/saaslocal
```

Contenido de la config:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activar y obtener certificado SSL
sudo ln -s /etc/nginx/sites-available/saaslocal /etc/nginx/sites-enabled/
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
sudo systemctl reload nginx
```

### 5. Comandos útiles de operación

```bash
# Reiniciar servicios
docker compose restart

# Ver logs del backend
docker compose logs backend -f --tail=100

# Actualizar código y redesplegar
git pull
docker compose up --build -d

# Backup de la base de datos
docker exec saaslocal_db pg_dump -U postgres saaslocal > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i saaslocal_db psql -U postgres saaslocal < backup_20241201.sql

# Acceder a PostgreSQL
docker exec -it saaslocal_db psql -U postgres -d saaslocal

# Ver espacio en disco de volúmenes
docker system df
```

---

## Variables de entorno — Referencia completa

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `DB_HOST` | No | `localhost` | Host de PostgreSQL |
| `DB_PORT` | No | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | No | `saaslocal` | Nombre de la base de datos |
| `DB_USER` | No | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | **Sí prod** | `postgres` | Contraseña de PostgreSQL |
| `DB_POOL_MAX` | No | `20` | Conexiones máximas en pool |
| `DB_SSL` | No | `false` | Usar SSL para PostgreSQL |
| `JWT_SECRET` | **Sí** | — | Clave secreta para JWT |
| `JWT_EXPIRES` | No | `8h` | Duración del token |
| `PORT` | No | `4000` | Puerto del backend |
| `NODE_ENV` | No | `development` | Ambiente |
| `LOG_LEVEL` | No | `info` | Nivel de logs |
| `CORS_ORIGIN` | **Sí prod** | `http://localhost:5173` | Origen permitido por CORS |
| `APP_PORT` | No | `80` | Puerto externo del frontend |

---

## Módulos del sistema

### Autenticación
- Login con email y contraseña (bcrypt + JWT)
- Sesión persistente en localStorage
- Rutas privadas protegidas en el frontend
- Roles: `admin`, `cajero`, `bodeguero`

### POS (Nueva Venta)
- Búsqueda de productos por nombre o código de barras
- Carrito con ajuste de cantidades en tiempo real
- Validación de stock antes de confirmar
- Selección de cliente (opcional) para ventas a crédito
- Selección de método de pago
- Cálculo automático de cambio
- Descuento por venta
- Transacción atómica: venta + descuento de inventario + actualización de deuda

### Inventario y Productos
- CRUD completo con categorías
- Control de stock con alertas de mínimos
- Movimientos automáticos al vender/comprar
- Filtros por categoría y disponibilidad

### Clientes (Fiados)
- Registro con límite de crédito configurable
- Saldo de deuda actualizado automáticamente al vender a crédito
- Historial de ventas pendientes
- Registro de abonos parciales

### Dashboard
- Ventas del día (total, crédito vs efectivo)
- Gráfico de barras: ventas últimos 7 días
- Gráfico de torta: métodos de pago (últimos 30 días)
- Top 5 productos más vendidos
- Alertas de stock bajo
- Resumen de deudas pendientes

---

## API — Endpoints disponibles

```
POST   /api/v1/auth/login           → Login
GET    /api/v1/auth/me              → Perfil del usuario

GET    /api/v1/dashboard            → Estadísticas completas

GET    /api/v1/productos            → Listar (con filtros)
POST   /api/v1/productos            → Crear
PUT    /api/v1/productos/:id        → Actualizar
DELETE /api/v1/productos/:id        → Desactivar

GET    /api/v1/ventas               → Historial (con filtros)
GET    /api/v1/ventas/:id           → Detalle con líneas
POST   /api/v1/ventas               → Registrar venta

GET    /api/v1/clientes             → Listar
GET    /api/v1/clientes/:id         → Detalle + historial deudas
POST   /api/v1/clientes             → Crear
PUT    /api/v1/clientes/:id         → Actualizar
POST   /api/v1/clientes/:id/abonar  → Abonar a deuda

GET    /api/v1/categorias           → Listar categorías
GET    /api/v1/metodos-pago         → Listar métodos de pago

GET    /health                      → Health check
```

---

## Extensiones de VSCode recomendadas

Abre el proyecto y acepta instalar las extensiones sugeridas (archivo `.vscode/extensions.json`). Las más importantes:

- **Tailwind CSS IntelliSense** — autocomplete de clases Tailwind
- **ESLint + Prettier** — formato automático al guardar
- **REST Client** — probar la API desde `api-tests.http` sin Postman
- **SQLTools + PostgreSQL driver** — explorar la DB desde VSCode
- **Docker** — gestionar contenedores desde el panel lateral
- **GitLens** — historial de cambios inline

---

## Diferencias con el ERD original y entidades agregadas

Ver sección al final de este README.

---

## Seguridad implementada

- **Contraseñas:** hash con bcrypt (factor 12)
- **JWT:** firmado con secreto configurable, expira en 8h
- **Multi-tenant:** `tienda_id` validado en **cada** query SQL
- **SQL injection:** 100% queries parametrizadas con `pg` (sin ORM)
- **Rate limiting:** 200 req/15min por IP
- **Helmet:** headers HTTP seguros
- **CORS:** origen configurable por variable de entorno
- **Usuario no-root:** el contenedor Docker corre como usuario `nodejs`

---

## Cambios respecto al ERD original

Se explica en detalle en el mensaje de respuesta del asistente.
