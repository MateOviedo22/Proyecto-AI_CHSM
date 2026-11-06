# Progreso de implementación — rama `feature/erp-integracion`

Base: `integration` (commit `6e5c39b`). Referencias: *Propuesta de Solución Sunshine* (RF-01…RF-39, FRQ-0001…0012) y las observaciones del docente.
Las pruebas y verificaciones descritas se ejecutaron en este entorno: Node 22.23 y PostgreSQL 16 local en el puerto 5433. Los resultados se detallan al final.

## Incrementos (un commit por incremento)

| Incremento | Contenido | Commit |
|---|---|---|
| I0 | Migraciones aditivas, roles de negocio, usuarios, permisos y respaldos | `I0: migraciones, roles…` |
| I1 | Datos maestros: proveedores (razón social, condiciones, varios proveedores por material), BOM multinivel con partes, líneas, etapas, reclamos | `I1: datos maestros…` |
| I2 + I3 | Almacenes escalables, existencias por almacén y lote, trazabilidad, entradas y salidas manuales, alertas; compras multilínea, recepción por línea con lote, devoluciones e historial del proveedor | `I2+I3: …` |
| I4 | Producción: plan con detalle, órdenes multiproducto, firmas, requisiciones base y adicionales, avance, calidad, cierre con lote y desperdicio | `I4: producción completa…` |
| I5 | Traslados: formulario formal, cinco firmas, despacho y recepción por lote, diferencias y evidencias | `I5: traslados…` |
| I6 | Ventas: factura interna numerada, facturación de órdenes sin doble cobro, anulación, devoluciones y cambios, cotización imprimible | `I6: ventas…` |
| I7 | Reportes estadísticos, dashboard real, alertas en la barra superior y control de acceso por ruta | `I7: reportes…` |

## Matriz de brechas actualizada

Estados: **IP** = implementada y probada (prueba automatizada y recorrido en la interfaz) · **PI** = parcial · **NI** = no implementada.

| ID | Requerimiento | Antes | Ahora | Evidencia |
|---|---|---|---|---|
| G01 | Catálogo de productos | IP | IP | `productos` + `unidad`; detalle de producto (`GET /productos/:id/detalle`) |
| G02 | Componentes y materiales por producto (BOM multinivel) | SB+SF | IP | `routes/maestros.js` (fichas, explosión, ciclos); `Fichas_Tecnicas.jsx`; `maestros.test.js` |
| G03 | Cantidades y unidades | PI | IP | Cantidad, merma y parte por material; lista de unidades `GET /unidades` |
| G04 | Varios proveedores por material | PI | IP | `material_proveedores`; `MaterialProveedores.jsx` |
| G05 | Razón social y nombre comercial | PI | IP | Migración 002; formulario de `Proveedores.jsx` |
| G06 | Planificación de producción | SF | IP | `planes_produccion`; `Planificación.jsx`; `produccion.test.js` |
| G07 | Órdenes de producción (código, fecha, varios productos) | PI | IP | `orden_produccion_detalles`; `Ordenes_Produccion.jsx` |
| G08 | Autorización y responsables (elaboró, revisó, autorizó) | NI | IP | Separación de funciones (`permisos.distinto`); gerencia autoriza |
| G09 | Requisiciones vinculadas a la orden | NI | IP | Requisición base generada por la ficha; `Produccion/Materiales.jsx` |
| G10 | Materiales adicionales justificados | NI | IP | Justificación obligatoria y aprobación por otra persona |
| G11 | Lotes de producción | NI | IP | `lotes` con prefijo `LP-`, uno por producto al cerrar |
| G12 | Cantidades producidas | NI | IP | `produccion_registros` |
| G13 | Existencias por almacén | SB+SF | IP | `existencias` y `stock.js`; invariante comprobada en las pruebas |
| G14 | Control de calidad | NI | IP | `control_calidad`; solo lo aprobado entra al inventario |
| G15 | Cierre de producción | NI | IP | `POST /produccion/ordenes/:id/cerrar` (lote, sobrantes, desperdicio) |
| G16 | Planificado frente a real | SF | IP | Plan, orden y `GET /reportes/produccion` |
| G17 | Solicitudes y órdenes de compra multilínea | IP (1 línea) | IP | `routes/compras.js` |
| G18 | Roles y permisos | PI | IP | `permisos.js`, `utils/permisos.js`, Usuarios, Roles y protección por ruta |
| G19 | Recepción de materiales | IP con defecto | IP | Recepción por línea con almacén y lote (se corrigió el uso de `rows[0]`) |
| G20 | Devoluciones de compra | SB+SF | IP | Estados Pendiente → Enviada → Acreditada sin doble descuento |
| G21 | Historial de entregas, reclamos y condiciones de pago | NI | IP | `GET /proveedores/:id/historial`, reclamos, puntaje |
| G22 | Materia prima y producto terminado | IP | IP | — |
| G23 | Stock mínimo y alertas | PI | IP | Mínimo global y por almacén; dashboard y campana de alertas |
| G24 | Entradas y salidas | IP | IP | Salidas por defectuoso o limpieza (FRQ-0003/0004) |
| G25 | Lotes y trazabilidad | PI | IP | `GET /trazabilidad/lotes/:codigo` (origen, insumos, destino) |
| G26 | Historial de movimientos | IP | IP | Filtros por almacén, lote, tipo, fechas y texto |
| G27 | Traslados | SF | IP | `routes/traslados.js`, `Traslados.jsx`, `traslados.test.js` |
| G28 | Cotizaciones (imprimir) | IP | IP | `CotizacionDoc` imprimible |
| G29 | Órdenes de venta | PI | IP | `POST /ordenes-venta/:id/facturar` |
| G30 | Facturación | PI | IP | Factura interna numerada (no fiscal, según el documento) |
| G31 | Inventario actualizado por la venta | IP | IP | Salida FIFO desde el almacén de venta |
| G32 | Historial de ventas | IP | IP | Detalle de venta y enlace a la factura |
| G33 | Devoluciones y cambios de venta | SB+SF | IP | `POST /ventas/devoluciones` |
| G34 | Reportes estadísticos | SF/NI | IP | `routes/reportes.js` y cuatro pantallas de reportes |
| G35 | Etapas y procesos | SB+SF | IP | Recurso `etapas` |
| G36 | Migraciones | NI | IP | `database/migrations` y `schema_migrations` |
| — | Respaldos (RF-37…39) | NI | IP | `npm run db:backup` y `npm run db:restore`; historial en Administración |
| — | Línea de trabajo (RF-12) | NI | IP | `lineas_produccion`; plan y orden |
| — | Notificación al cliente del estado del pedido (FRQ-0012) | NI | NI | Pendiente (ver más abajo) |

## Cambios en la base de datos (todos aditivos)

Las migraciones `001`…`007` se aplican con `npm run db:init` y quedan registradas en `schema_migrations`. No eliminan datos.
- El único `DROP CONSTRAINT` reemplaza un `CHECK` por otro más amplio: roles, estados de ficha, devoluciones y ventas.
- Los saldos previos se asignaron así: materiales al Taller y productos a la Tienda.
- Las ventas previas reciben una factura con numeración consecutiva.

Tablas nuevas:
- **Inventario y compras:** `respaldos`, `material_proveedores`, `ficha_componentes`, `lineas_produccion`, `reclamos_proveedor`, `lotes`, `existencias`, `minimos_almacen`.
- **Producción:** `planes_produccion`, `plan_detalles`, `orden_produccion_detalles`, `requisiciones_material`, `requisicion_detalles`, `produccion_registros`, `control_calidad`, `produccion_resumen_materiales`.
- **Traslados y ventas:** `traslados`, `traslado_detalles`, `traslado_despachos`, `traslado_evidencias`, `facturas`.

## Pruebas ejecutadas (resultados reales)

- **`cd backend && npm test`:** 55 de 55 pruebas en verde (PGlite), repartidas así:
  - `api.test.js`: las 11 originales, ahora sobre el esquema migrado.
  - `seguridad`: 5 · `maestros`: 8 · `inventario`: 8 · `produccion`: 7 · `traslados`: 6 · `ventas`: 4 · `reportes`: 6.
- **`npm run build` (frontend):** compila sin errores. Solo queda el aviso de tamaño de bundle que ya existía.
- **PostgreSQL 16 real:**
  - `db:init` sobre una base creada con la versión de `integration` que ya tenía una venta y una entrada aplica las 7 migraciones. La segunda ejecución no aplica nada y la suma de existencias por almacén coincide con el saldo global.
  - Instalación limpia probada con `SEED_DEMO=false` y con `SEED_DEMO=true`.
  - `db:backup` crea el archivo y registra el respaldo. `db:restore` exige `--confirmar` y restaura correctamente en otra base.
- **Recorridos en la interfaz con Playwright y varios usuarios** (admin, vendedora, producción e inventario):
  - Compra multilínea → recepción con lote → trazabilidad.
  - Plan → orden → revisión y autorización → entrega de materiales → avance → calidad → cierre con lote.
  - Traslado con cinco firmas, evidencia y recepción con diferencia.
  - Venta en el POS con factura, facturación de una orden de venta, impresión de cotización y devolución.
  - Todas las rutas del menú cargan sin errores de API ni de consola. Los únicos fallos de red son de Google Fonts, bloqueado por la red del entorno.

## Pendiente y motivos

- **FRQ-0012 (notificar al cliente por correo o mensaje):** requiere un proveedor externo de correo o mensajería y credenciales; no se agregó para no inventar una integración.
- **Facturación fiscal e impuestos:** el documento indica conservar la facturación existente. La factura del sistema es un comprobante interno.
- **Cambio de producto con diferencia de precio:** el cambio registra la entrada y la salida de inventario, pero no cobra ni reembolsa diferencias.
- **Historial CRM:** la pantalla consulta y cambia el estado de las actividades, pero no tiene formulario de alta (situación previa, sin cambios).
- **Recuperación de contraseña por correo:** pendiente por el mismo motivo que FRQ-0012. La administración puede cambiar contraseñas.
- **Código previo sin ruta:** se conserva sin eliminar (pantallas de compras con `localStorage`, `Dashboard/Secciones.jsx`, `ProductionPage`, etc.).
- **Push de la rama:** GitHub devolvió 403 porque la app de Claude no tiene acceso al repositorio. Los commits están en la rama local `feature/erp-integracion`.
