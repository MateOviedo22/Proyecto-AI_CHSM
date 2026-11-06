# Sunshine Handmade — ERP y CRM

Proyecto web basado en el frontend entregado por el equipo. Se añadieron una API REST, un esquema de PostgreSQL y conexiones para los procesos indicados abajo. Se conservan las pantallas originales que todavía requieren integración; dentro de la aplicación aparecen identificadas como **pantallas de demostración**.

> Esta entrega es una base funcional para desarrollo y pruebas académicas. No debe utilizarse para gestionar datos reales ni ponerse en producción sin completar las pantallas pendientes, revisar las reglas del negocio y hacer pruebas de seguridad, respaldo y recuperación.

## 1. Tecnologías y carpetas

- **Frontend:** React 18, Vite y JavaScript; se conserva la estructura del proyecto entregado.
- **Backend:** Node.js y Express, con API REST, consultas parametrizadas y autenticación por token.
- **Base de datos:** PostgreSQL. `docker-compose.yml` facilita levantar una instancia local de desarrollo.
- **Versiones recomendadas:** Node.js 22 LTS (22.15.1 o posterior), npm y Docker Desktop con Docker Compose. También funciona Node 24.

Se eligió Node.js para compartir JavaScript con el frontend actual. Una propuesta anterior del proyecto contemplaba Java 17; si ese lenguaje es un requisito obligatorio de la clase, este backend tendría que adaptarse a Java.

```text
Proyecto-AI_CHSM-main/
├── src/                         Frontend React y conexión con la API
├── backend/
│   ├── src/                     API, configuración de recursos y conexión a BD
│   ├── scripts/init-db.js       Creación de tablas, ejemplos y usuario inicial
│   ├── tests/api.test.js        Pruebas automatizadas de la API
│   ├── .env.example             Configuración de ejemplo; copiar a .env
│   └── package.json
├── database/
│   ├── 01_schema.sql            Tablas, relaciones, restricciones e índices
│   └── 02_datos_demo.sql        Datos ficticios opcionales para probar
├── docs/
│   ├── ALCANCE.md               Pantallas conectadas y pendientes
│   └── API.md                   Rutas y ejemplos de peticiones
├── docker-compose.yml           PostgreSQL para pruebas locales
└── package.json                 Dependencias del frontend
```

## 2. Ejecutar en Windows paso a paso

### Antes de comenzar

1. Descomprime el ZIP en una carpeta de trabajo y abre **la carpeta del proyecto** en VS Code.
2. Instala Node.js 22 y abre Docker Desktop; espera a que indique que el motor está iniciado.
3. Abre una terminal de PowerShell en VS Code. Los comandos siguientes se ejecutan dentro de la carpeta que contiene `docker-compose.yml` y este `README.md`.
4. Este archivo configura PostgreSQL en el puerto **5432**, la API en **3001** y Vite en **5173**. Si otro programa ocupa el 5432, cambia el puerto publicado de `docker-compose.yml` y el puerto de `DATABASE_URL` en `backend/.env`.

### Terminal 1: base de datos y backend

Desde la raíz del proyecto:

```powershell
docker compose up -d
cd backend
Copy-Item .env.example .env
npm ci
npm run db:init
npm run dev
```

Espera a que aparezca `API Sunshine en http://localhost:3001` y deja esta terminal abierta. `npm run db:init` crea las tablas, carga los datos ficticios si `SEED_DEMO=true` y crea el usuario inicial si aún no existe. No cambia la contraseña de un usuario existente. Si PostgreSQL aún se está iniciando y la conexión falla, espera unos segundos y vuelve a ejecutar `npm run db:init`.

Si utilizas PostgreSQL instalado en Windows en vez de Docker, crea una base vacía y modifica `DATABASE_URL` en `backend/.env` con tu usuario, contraseña, servidor, puerto y nombre de base. Después ejecuta los comandos de `backend` indicados arriba. El script SQL está en `database/01_schema.sql`; **`npm run db:init` también debe ejecutarse** para crear el usuario administrador.

### Terminal 2: frontend

Abre una segunda terminal de PowerShell en VS Code, situada en la raíz del proyecto:

```powershell
npm ci
npm run dev
```

Abre **http://localhost:5173** y entra al sistema:

- Usuario inicial de demostración: `admin`
- Contraseña inicial de demostración: `Sunshine2026!`

Esas credenciales proceden de `backend/.env.example`; sirven solo para el entorno local. Cambia `ADMIN_PASSWORD` y `JWT_SECRET` en `backend/.env` **antes** de ejecutar `npm run db:init` por primera vez en una base nueva. Si ya se creó la cuenta, modificar `.env` no cambia su contraseña: se necesita un procedimiento administrativo de cambio de contraseña aún pendiente.

El registro público del diseño original está deshabilitado. Actualmente la cuenta inicial se crea con el script; la administración de más usuarios desde una pantalla todavía no está implementada.

Para detener la aplicación, pulsa `Ctrl+C` en ambas terminales. Desde la raíz, `docker compose stop` detiene PostgreSQL conservando el volumen y sus datos; vuelve a iniciarlo con `docker compose up -d`. **No ejecutes `docker compose down -v` si deseas conservar la información**, pues elimina el volumen local.

## 3. Qué está conectado

- Inicio de sesión con usuario y contraseña almacenados en la base de datos.
- CRM: panel, clientes, estado, segmentación basada en clientes y ventas asociadas; consulta de actividades CRM.
- Compras: proveedores, solicitud y aprobación, creación y envío/cancelación de órdenes, recepción parcial o total y entrada de material al inventario.
- Inventario: panel, catálogo de productos y materiales compartido, alta de productos y materiales, entrada directa y consulta de movimientos registrados.
- Ventas: catálogo, precios y promociones, cotizaciones, conversión a orden de seguimiento, punto de venta, panel y reporte de ventas.
- Producción: creación y seguimiento de órdenes en las dos pantallas de órdenes/panel.
- Finanzas: registros de ingresos, gastos, cuentas por cobrar y pagar, panel e informe con totales. Una venta del punto de venta genera un ingreso confirmado.
- Recursos humanos: panel, reporte y alta y consulta en las pantallas de empleados, áreas y puestos, asistencias y permisos/ausencias.

La venta consulta los precios y la promoción vigente más reciente en el servidor; registra el detalle, descuenta existencias, crea el movimiento de inventario y el ingreso dentro de una misma transacción. El comprobante de esta aplicación **es interno y no constituye factura fiscal**.

La orden creada desde una cotización sirve para seguimiento y **no crea automáticamente un cobro ni descuenta inventario**. Estos se registran al realizar una venta en el punto de venta. Las cotizaciones conservan el precio base al momento de crearlas y no incorporan automáticamente promociones. Todavía no existe un vínculo automático entre esa orden y el cobro del punto de venta; evita registrar dos veces una operación mientras se desarrolla ese flujo.

La recepción de compra aumenta las existencias y recalcula el costo promedio del material. Una entrada directa desde el catálogo de materiales también incrementa el inventario, pero no crea una orden de compra. No registres la misma mercancía por ambos caminos.

**Importante:** las devoluciones de compra/venta, traslados por almacén, fichas técnicas, consumo automático de materiales, varios reportes generales y otras pantallas aún contienen comportamiento de muestra. No deben tomarse como operaciones reales. Consulta la lista detallada en `docs/ALCANCE.md` y el aviso que aparece en cada pantalla no conectada.

## 4. Pruebas

Desde la raíz:

```powershell
npm run build
cd backend
npm test
```

Las pruebas automatizadas crean una instancia aislada basada en PGlite (motor PostgreSQL en WebAssembly); comprueban autenticación, clientes, control de versiones, ventas, rollback por stock insuficiente, entrada de materiales, cuentas, cotizaciones y flujo de compra. No utilizan ni modifican tu base de datos de Docker. También se hizo una comprobación con PostgreSQL 16 real de la inicialización, el inicio de sesión, la venta, la entrada de inventario, la cotización y la recepción de compra. Antes de un despliegue, repitan las pruebas en su propio entorno y validen los procesos con el equipo.

La aplicación no carga automáticamente los datos que antes se guardaban en el navegador mediante `localStorage`. Si tenían datos de prueba importantes allí, consérvenlos y acuerden una migración antes de borrar los datos del navegador.

## 5. Documentación adicional

- `docs/ALCANCE.md`: funcionalidades conectadas, pendientes y decisiones del modelo.
- `docs/API.md`: rutas REST, autenticación, ejemplos y reglas.
- `database/01_schema.sql`: esquema relacional. `database/02_datos_demo.sql`: ejemplos ficticios.

Los datos de ejemplo no son información real de Sunshine. Para iniciar una base vacía, establece `SEED_DEMO=false` en `.env` antes de crearla. El cambio no borra datos ya insertados. Conserva `.env`, contraseñas, tokens y respaldos fuera del repositorio.
