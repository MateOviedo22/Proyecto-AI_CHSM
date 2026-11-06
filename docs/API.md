# API REST de Sunshine

La API escucha en `http://localhost:3001/api`. Recibe y devuelve JSON. Las respuestas de éxito usan `data` salvo autenticación y salud; los errores contienen `error`. Las claves y campos de la API están alineados con las pantallas conectadas; puede consultarse la lista exacta en `backend/src/resources.js`.

## Acceso

- `GET /salud`: comprueba la conexión con la base.
- `POST /auth/login`: `{ "username": "admin", "password": "..." }`. Devuelve `token` y `user`.
- `GET /auth/me`: datos del usuario autenticado.
- Los demás endpoints requieren `Authorization: Bearer <token>`. No existe registro público.

Ejemplo en PowerShell, con la API iniciada:

```powershell
$body = @{ username = 'admin'; password = 'Sunshine2026!' } | ConvertTo-Json
$session = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method Post -ContentType 'application/json' -Body $body
$headers = @{ Authorization = "Bearer $($session.token)" }
Invoke-RestMethod -Uri 'http://localhost:3001/api/recursos/clientes' -Headers $headers
```

## Catálogos y registros

`GET /recursos/{recurso}`, `POST /recursos/{recurso}`, `PUT /recursos/{recurso}/{id}` y `DELETE /recursos/{recurso}/{id}`. En `PUT` debe enviarse `_version` con el valor recibido; un conflicto responde `409`. Las eliminaciones se reservan a administradores, los ingresos/gastos no se eliminan por esta API y los saldos no se modifican por edición genérica. La fecha opcional de producción/contratación admite `null`.

Recursos permitidos:

- `clientes`, `proveedores`, `materiales`, `productos`, `promociones`, `actividades`.
- `ordenes-produccion`.
- `empleados`, `cargos`, `asistencias`, `ausencias` (solo rol administrador).
- `ingresos`, `gastos`, `cuentas-cobrar`, `cuentas-pagar` (solo rol administrador).

Los identificadores los genera actualmente cada formulario de la interfaz; la API comprueba duplicados. La configuración fija de campos evita usar nombres enviados por el cliente como identificadores SQL.

## Ventas e inventario

- `GET /ventas`: últimas 500 ventas.
- `POST /ventas`: registra una venta. Ejemplo:

```json
{
  "cliente": "María González",
  "clienteId": "CLI-001",
  "metodo": "Efectivo",
  "porcentajeDescuento": 0,
  "items": [{ "productoId": 1, "cantidad": 2 }]
}
```

`clienteId` es opcional; sin él se conserva el nombre libre. El servidor aplica el precio de la base y la promoción vigente más reciente, si existe; no usa un precio enviado desde el cliente. El descuento porcentual del carrito se aplica además sobre ese precio promocional. Stock insuficiente responde 409 sin registrar parcialmente la operación.

- `POST /materiales/{id}/entradas`: `{ "quantity": 5, "unitCost": 400, "supplier": "Proveedor", "invoice": "FAC-001" }`.
- `GET /movimientos`: últimos 500 movimientos con artículo, usuario, fecha y saldo posterior.

## Cotizaciones y órdenes de venta

- `GET /cotizaciones`, `POST /cotizaciones`, `PUT /cotizaciones/{id}`, `DELETE /cotizaciones/{id}`.
- Ejemplo de alta: `{ "id":"COT-100", "cliente":"Cliente", "vencimiento":"2099-12-31", "notas":"", "items":[{"productoId":1,"cantidad":2}] }`. En edición se incluye `_version` y no se permite editar una cotización convertida. Los precios de la cotización son precios base y no incluyen promociones.
- `POST /cotizaciones/{id}/convertir`: crea una orden de seguimiento una sola vez.
- `GET /ordenes-venta` y `PATCH /ordenes-venta/{id}/estado` con `{ "estado":"En preparación" }`. La orden no registra el pago ni modifica existencias.

## Compras

- `GET /compras`: solicitudes, órdenes y recepciones.
- `POST /compras/solicitudes`: `{ "materialId":1, "cantidad":5, "solicitante":"Taller", "area":"Producción", "prioridad":"Alta", "justificacion":"Reposición" }`.
- `PATCH /compras/solicitudes/{id}/estado`: `{ "estado":"Aprobada" }` o `Rechazada`.
- `POST /compras/ordenes`: `{ "solicitudId":null, "proveedorId":1, "materialId":1, "cantidad":5, "precio":400, "fechaEntrega":null }`. La solicitud aprobada es opcional; si se incluye debe coincidir con el material.
- `PATCH /compras/ordenes/{id}/estado`: `{ "estado":"Enviada" }` o `Cancelada` cuando el estado lo permita.
- `POST /compras/recepciones`: `{ "ordenId":"OC-...", "cantidad":2, "documento":"FAC-1", "observaciones":"" }`. Bloquea la orden y el material, impide recibir más de lo pendiente y actualiza stock y costo promedio en la misma transacción.

## Rutas añadidas en `feature/erp-integracion`

Todas requieren token. El servidor valida el rol con la matriz de `backend/src/permisos.js`; la consulta `GET /roles` la devuelve. Los cambios de estado son atómicos: si un documento ya cambió, responden `409`.

**Usuarios y seguridad** (solo administración):
- `GET/POST /usuarios`, `PUT /usuarios/{id}`, `PATCH /usuarios/{id}/estado` con `{activo}`, `PATCH /usuarios/{id}/password`.
- `GET /roles`, `GET /respaldos`, `GET /auditoria`.

**Datos maestros:**
- `GET/POST /fichas-tecnicas`, `GET/PUT /fichas-tecnicas/{id}`, `PATCH /fichas-tecnicas/{id}/estado` con `{estado:"Vigente"|"Obsoleta"}`.
- `POST /fichas-tecnicas/{id}/nueva-version`, `GET /fichas-tecnicas/{id}/explosion?cantidad=10`.
- Ejemplo de ficha: `{productoId, nombre, versionFicha, tiempoMinutos, materiales:[{materialId,cantidad,mermaPct,parte}], componentes:[{productoId,cantidad,parte}]}`.
- `GET /productos/{id}/detalle`, `GET /unidades`.
- `GET/PUT /materiales/{id}/proveedores` con `{proveedores:[{proveedorId,precioRef,plazoEntregaDias,preferido}]}` y `GET /proveedores/{id}/materiales`.
- `GET/POST /reclamos`, `PATCH /reclamos/{id}` con `{estado,respuesta}`.
- Recursos genéricos nuevos: `etapas`, `lineas-produccion`. Proveedores añade `razonSocial`, `ruc`, `paymentTerms`, `paymentDays`, `website` y `notes`.

**Inventario:**
- `GET/POST /almacenes`, `PUT /almacenes/{id}`.
- `GET /existencias?almacenId=&tipo=producto|material&q=`, `GET /disponibilidad`, `PUT /minimos`.
- `POST /inventario/movimientos` con `{tipo:"Entrada"|"Salida",almacenId,productoId|materialId,loteId?,cantidad,motivo,detalle?}`.
- `GET /movimientos?almacenId=&productoId=&materialId=&lote=&tipo=&referencia=&q=&desde=&hasta=`.
- `GET /lotes`, `GET /trazabilidad/lotes/{codigo}`, `GET /alertas/stock`.
- Las rutas existentes de venta, entrada de material y alta con saldo aceptan además un `almacenId` opcional.

**Compras:**
- `POST /compras/ordenes` acepta `lineas:[{materialId,cantidad,precio}]`. El formato de una sola línea sigue funcionando.
- `POST /compras/recepciones` con `{ordenId,ordenDetalleId,cantidad,almacenId?,lote?,vencimiento?}`; crea un lote.
- `GET/POST /compras/devoluciones`, `PATCH /compras/devoluciones/{id}/estado` (`Enviada` descuenta el inventario).
- `GET /proveedores/{id}/historial`.

**Producción:**
- Planes: `GET/POST /produccion/planes`, `PUT /produccion/planes/{id}`, `PATCH /produccion/planes/{id}/{revisar|devolver|autorizar|cancelar|cerrar}`.
- Órdenes:
  - `GET/POST /produccion/ordenes`, `GET/PUT /produccion/ordenes/{id}`.
  - `PATCH /produccion/ordenes/{id}/{revisar|devolver|autorizar|cancelar}`.
  - `POST /produccion/ordenes/{id}/registros`, `POST /produccion/ordenes/{id}/calidad`, `POST /produccion/ordenes/{id}/cerrar` con `{devoluciones:[{materialId,cantidad}],almacenDestinoId?}`.
- Requisiciones y calidad: `GET /produccion/requisiciones`, `POST /produccion/requisiciones/adicional`, `PATCH /produccion/requisiciones/{id}/{aprobar|rechazar|entregar}`, `GET /produccion/calidad`.
- Reglas:
  - Quien elabora no revisa ni autoriza, y solo administración autoriza.
  - Una orden sin plan, o que lo excede, exige justificación.
  - Solo lo aprobado en calidad entra al inventario.

**Traslados:**
- `GET/POST /traslados`, `GET/PUT /traslados/{id}`.
- `PATCH /traslados/{id}/{revisar|devolver|autorizar|despachar|recibir|cancelar}`. Para recibir: `{detalles:[{id,recibida,motivo}]}`.
- `GET/POST /traslados/{id}/evidencias`: JSON con `contenido` en base64; JPG, PNG o PDF de hasta 2 MB.
- `GET /traslados/evidencias/{id}`.

**Ventas:**
- `GET /ventas?desde=&hasta=&clienteId=`, `GET /ventas/{id}`.
- `POST /ventas` devuelve también el número de `factura`.
- `POST /ordenes-venta/{id}/facturar`. `PATCH /ordenes-venta/{id}/estado` ya no acepta `Completada`, porque la orden se completa al facturarla.
- `GET /facturas`, `GET /facturas/{id}`, `PATCH /facturas/{id}/anular` con `{motivo}`.
- `GET/POST /ventas/devoluciones` con `{ventaId,ventaDetalleId,cantidad,tipo:"Devolución"|"Cambio",motivo,reingresa,productoCambioId?}`.

**Reportes** (`?desde=&hasta=`):
- `GET /reportes/produccion`, `GET /reportes/consumo-materiales`, `GET /reportes/inventario`, `GET /reportes/compras-proveedores`, `GET /reportes/traslados`, `GET /reportes/ventas`, `GET /reportes/dashboard`.

## Limitaciones importantes

La API cubre los procesos descritos aquí; no hay endpoints operativos para todas las pantallas de demostración. El control de permisos actual distingue `admin` y `operador` de forma básica; no sustituye una matriz de permisos por módulo y acción. Los reportes agregados y las relaciones capturadas como texto son una base para continuar el desarrollo. No se recomienda publicar el proyecto ni usarlo con información real sin las mejoras de `ALCANCE.md`.
