# Alcance y revisión del frontend de Sunshine

## Qué se encontró

El ZIP original era una aplicación React/Vite sin API. La sesión aceptaba cualquier credencial con el formato mínimo, los datos de muchos módulos estaban escritos en sus componentes y varias pantallas de compras usaban `localStorage`. Había catálogos distintos con productos o clientes inconsistentes. Las rutas principales de ventas, inventario, finanzas y RR. HH. estaban repetidas; también la ruta de órdenes de compra apuntaba por error a una pantalla de ventas.

## Funcionalidad conectada

| Módulo | Pantallas o procesos conectados | Alcance actual |
|---|---|---|
| Acceso | Inicio de sesión | Cuenta inicial creada por script, contraseña con hash, token con vencimiento y consultas protegidas. No hay alta pública ni administración visual de usuarios. |
| CRM | Panel; clientes; segmentación; historial de actividades | Alta, edición y cambio de estado de clientes. La segmentación utiliza datos reales y cuenta ventas vinculadas al cliente. En historial se consulta/cambia el estado de actividades guardadas; aún no hay formulario conectado para crearlas desde la pantalla. |
| Compras | Panel; proveedores; solicitudes; órdenes; recepción | Los formularios de solicitud, orden y recepción fueron adaptados al catálogo real. Una orden contiene un material; la recepción puede ser parcial y actualiza inventario en una transacción. No hay edición de solicitudes u órdenes ya creadas en la nueva interfaz. |
| Inventario | Panel; catálogo; materiales; trazabilidad | Catálogo común de productos/materiales, alta de material y entrada directa con costo promedio. Trazabilidad muestra las entradas/ventas registradas desde la API; los saldos iniciales de los datos de ejemplo no tienen movimiento histórico. |
| Ventas | Catálogo; precios y promociones; cotizaciones; órdenes; punto de venta; panel y reporte | La cotización utiliza productos y precios base registrados, sin promociones automáticas. Convertir crea una orden de seguimiento una sola vez. El POS aplica una promoción vigente por producto, registra la venta, descuenta stock y agrega un ingreso. El reporte lista hasta 500 ventas. |
| Producción | Panel; órdenes de producción | Crear y actualizar órdenes compartidas entre ambas pantallas. El producto y responsable se capturan como texto; no consume materiales ni agrega terminados automáticamente. |
| Finanzas | Panel; ingresos; gastos; cuentas por cobrar/pagar; informe | Se registran y consultan datos de los formularios. El saldo se calcula desde monto y abonado. Ventas del POS generan ingresos. El panel muestra ingresos confirmados y gastos pagados, no constituye contabilidad ni sustituye conciliación. |
| RR. HH. | Panel; empleados; áreas/puestos; asistencia; ausencias; reporte | Formulario de alta y consulta de cada sección, panel y reporte de empleados. Los campos empleado/puesto escritos en texto no están todavía vinculados mediante selectores a un registro maestro. |

Las pantallas de solicitudes, órdenes y recepción de compras se sustituyeron por versiones más sencillas conectadas a la misma API; el resto de componentes originales se conserva en el código para consulta.

## Pendiente antes de considerar completo el sistema

- Dashboard general, paneles y reportes que aún presentan métricas de ejemplo; los reportes de ventas conectados sí usan ventas reales. La página de historial de CRM parte vacía si no se cargan actividades por API.
- Compras: devoluciones, reportes de compras, edición de solicitudes/órdenes, múltiples líneas por orden y asociación de recepción con cuentas por pagar.
- Ventas: cambios/devoluciones, vincular el pago a una orden, reservas de stock, impuestos y facturación fiscal. Cuando hay varias promociones vigentes para un producto se aplica la más recientemente registrada; no se acumulan entre sí.
- Inventario: almacenes y ubicaciones con existencias por sitio, traslados, reposición, informes y controles de stock por almacén. El saldo operativo actual es global por producto o material.
- Producción: fichas técnicas y etapas operativas, planificación, consumo de insumos, terminados, control de calidad y reportes. El esquema incluye tablas iniciales para varias de estas relaciones, pero no un proceso completo ni pantallas conectadas para ellas.
- Finanzas: conciliación, pagos/abonos con historial, ingresos/gastos por compra y venta a crédito y libros contables. Los campos de contraparte de cuentas son texto en la interfaz actual.
- RR. HH.: relaciones entre empleados, puestos y asistencias, reglas laborales, permisos detallados, nómina y gestión de datos sensibles.
- Seguridad: administración de cuentas, recuperación/cambio de contraseña, permisos por acción y módulo, expiración de sesión con revocación, HTTPS, auditoría ampliada, revisión de seguridad y controles para archivos y despliegue.
- Preparación operativa: pruebas de todos los módulos y navegadores, migración de datos existentes, validación con Sunshine, copias de seguridad, restauración y despliegue con PostgreSQL administrado si se decide usar nube.

Las secciones pendientes se mantienen con una franja amarilla que indica que son demostrativas. Sus cambios pueden perderse al recargar o permanecer solo en el navegador; no se sincronizan con la base central. Las tablas preparatorias del esquema no implican que sus funcionalidades ya estén implementadas.

## Decisiones de modelo

- PostgreSQL almacena las entidades principales en tablas separadas; detalles de venta, cotización y orden tienen claves foráneas. Las operaciones de venta y recepción usan transacciones y bloquean los saldos que modifican.
- Se conservan identificadores visibles compatibles con el frontend. Algunas referencias se capturan todavía como texto porque el formulario original no selecciona un registro relacionado; deben normalizarse al completar los módulos.
- Producto/material tiene un saldo global, no un saldo por almacén. Las tablas de almacén y otras tablas preparatorias no están enlazadas al flujo de existencias actual.
- El servidor valida cantidades, precios y estados principales. El control de concurrencia por versión cubre registros generales y edición de cotizaciones; los movimientos de stock usan bloqueo transaccional.
- Los valores de `02_datos_demo.sql` son ficticios. No se importaron datos reales, contraseñas anteriores ni registros guardados en el navegador.
