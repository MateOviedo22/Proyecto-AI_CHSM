/** Datos simulados del sistema, basados en las capturas de Figma. */

export const user = { name: 'Usuaria Admin', role: 'Propietaria-Gerente' };

export const modules = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/sistema/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    key: 'crm', modulo: 'crm',
    label: 'CRM y clientes',
    path: '/sistema/crm',
    icon: 'Users',
    children: [
      {
        key: 'crm-panel',
        label: 'Panel CRM',
        path: '/sistema/crm/Dash',
      },
      {
        key: 'crm-clientes',
        label: 'Clientes',
        path: '/sistema/crm/clientes',
      },
      {
        key: 'crm-historial',
        label: 'Historial de clientes',
        path: '/sistema/crm/historial',
      },
      {
        key: 'crm-segmentacion',
        label: 'Segmentación',
        path: '/sistema/crm/segmentacion',
      },
      {
        key: 'crm-reportes',
        label: 'Reportes CRM',
        path: '/sistema/crm/reportes',
      },
    ],
  },
  {
  key: 'compras', modulo: 'compras',
  label: 'Compras',
  path: '/sistema/compras',
  icon: 'ShoppingBasket',
  children: [
    {
      key: 'compras-panel',
      label: 'Panel de compras',
      path: '/sistema/compras',
    },
    {
      key: 'compras-proveedores',
      label: 'Proveedores',
      path: '/sistema/compras/proveedores',
    },
    {
      key: 'compras-solicitudes',
      label: 'Solicitudes de compra',
      path: '/sistema/compras/solicitudes',
    },
    {
      key: 'compras-ordenes',
      label: 'Órdenes de compra',
      path: '/sistema/compras/ordenes',
    },
    {
      key: 'compras-recepcion',
      label: 'Recepción de compras',
      path: '/sistema/compras/recepcion',
    },
    {
      key: 'compras-devoluciones',
      label: 'Devoluciones de compras',
      path: '/sistema/compras/devoluciones',
    },
    {
      key: 'compras-reportes',
      label: 'Reportes de compras',
      path: '/sistema/compras/reportes',
    },
  ],
},

  {
    key: 'produccion', modulo: 'produccion',
    label: 'Producción',
    path: '/sistema/produccion',
    icon: 'Factory',
    children: [
      {
        key: 'produccion-panel',
        label: 'Panel de producción',
        path: '/sistema/produccion/panel',
      },
      {
        key: 'produccion-etapas',
        label: 'Etapas y procesos',
        path: '/sistema/produccion/etapas',
      },
      {
        key: 'produccion-fichas',
        label: 'Fichas técnicas',
        path: '/sistema/produccion/fichas-tecnicas',
      },
      {
        key: 'produccion-materiales',
        label: 'Requisiciones de materiales',
        path: '/sistema/produccion/materiales',
      },
      {
        key: 'produccion-ordenes',
        label: 'Órdenes de producción',
        path: '/sistema/produccion/ordenes-produccion',
      },
      {
        key: 'produccion-planificacion',
        label: 'Planificación',
        path: '/sistema/produccion/planificacion',
      },
      {
        key: 'produccion-terminados',
        label: 'Productos terminados',
        path: '/sistema/produccion/productos-terminados',
      },
      {
        key: 'produccion-reportes',
        label: 'Reportes de producción',
        path: '/sistema/produccion/reportes',
      },

    ],
  },
  {
    key: 'inventario', modulo: 'inventario',
    label: 'Inventario',
    path: '/sistema/inventario',
    icon: 'Package',
    children: [
      {
        key: 'inventario-panel',
        label: 'Panel de inventario',
        path: '/sistema/inventario',
      },
      {
        key: 'inventario-productos',
        label: 'Productos',
        path: '/sistema/inventario/catalogo',
      },
      {
        key: 'inventario-materiales',
        label: 'Materiales',
        path: '/sistema/inventario/materiales',
      },
      {
        key: 'inventario-proveedores',
        label: 'Proveedores',
        path: '/sistema/compras/proveedores',
      },
      {
        key: 'inventario-almacenes',
        label: 'Almacenes',
        path: '/sistema/inventario/almacenes',
      },
      {
        key: 'inventario-informes',
        label: 'Informes',
        path: '/sistema/inventario/informes',
      },
      {
        key: 'inventario-alertas',
        label: 'Alertas',
        path: '/sistema/inventario/reposiciones',
      },
      {
        key: 'inventario-traslados',
        label: 'Traslados',
        path: '/sistema/inventario/traslados',
      },
      {
        key: 'inventario-trazabilidad',
        label: 'Trazabilidad',
        path: '/sistema/inventario/trazabilidad',
      },
    ],
  },
  {
    key: 'ventas', modulo: 'ventas',
    label: 'Ventas y órdenes',
    path: '/sistema/ventas',
    icon: 'ShoppingCart',
    children: [
      {
        key: 'ventas-panel',
        label: 'Panel de ventas',
        path: '/sistema/ventas',
      },
      {
        key: 'ventas-cotizaciones',
        label: 'Cotizaciones',
        path: '/sistema/ventas/cotizaciones',
      },
      {
        key: 'ventas-ordenes',
        label: 'Órdenes de venta',
        path: '/sistema/ventas/ordenes-venta',
      },
      {
        key: 'ventas-punto-venta',
        label: 'Punto de venta',
        path: '/sistema/ventas/punto-venta',
      },
      {
        key: 'ventas-catalogo',
        label: 'Catálogo de ventas',
        path: '/sistema/ventas/catalogo',
      },
      {
        key: 'ventas-promociones',
        label: 'Precios y promociones',
        path: '/sistema/ventas/promociones',
      },
      {
        key: 'ventas-cambios-devoluciones',
        label: 'Cambios y devoluciones',
        path: '/sistema/ventas/devoluciones',
      },
      {
        key: 'ventas-reportes',
        label: 'Reportes de ventas',
        path: '/sistema/ventas/reportes',
      },
    ],
  },
  {
    key: 'finanzas', modulo: 'finanzas',
    label: 'Finanzas',
    path: '/sistema/finanzas',
    icon: 'LineChart',
    children: [
      {
        key: 'finanzas-panel',
        label: 'Panel financiero',
        path: '/sistema/finanzas',
      },
      {
        key: 'finanzas-ingresos',
        label: 'Ingresos',
        path: '/sistema/finanzas/ingresos',
      },
      {
        key: 'finanzas-gastos',
        label: 'Gastos',
        path: '/sistema/finanzas/gastos',
      },
      {
        key: 'finanzas-cobrar',
        label: 'Cuentas por cobrar',
        path: '/sistema/finanzas/cobros',
      },
      {
        key: 'finanzas-pagar',
        label: 'Cuentas por pagar',
        path: '/sistema/finanzas/pagos',
      },
      {
        key: 'finanzas-informes',
        label: 'Informes financieros',
        path: '/sistema/finanzas/informes',
      },
    ],
  },
  {
    key: 'rrhh', modulo: 'rrhh',
    label: 'R.R.H.H',
    path: '/sistema/rrhh',
    icon: 'IdCard',
    children: [
      {
        key: 'rrhh-panel',
        label: 'Panel de RRHH',
        path: '/sistema/rrhh',
      },
      {
        key: 'rrhh-empleados',
        label: 'Empleados',
        path: '/sistema/rrhh/empleados',
      },
      {
        key: 'rrhh-areas-puestos',
        label: 'Áreas y puestos',
        path: '/sistema/rrhh/areas-puestos',
      },
      {
        key: 'rrhh-asistencias',
        label: 'Asistencias y horario',
        path: '/sistema/rrhh/asistencias-horario',
      },
      {
        key: 'rrhh-permisos',
        label: 'Permisos y ausencias',
        path: '/sistema/rrhh/permisos-ausencias',
      },
      {
        key: 'rrhh-reportes',
        label: 'Reportes de empleados',
        path: '/sistema/rrhh/reportes',
      },
    ],
  },
  {
    key: 'admin', modulo: 'seguridad',
    label: 'Administración',
    path: '/sistema/admin',
    icon: 'Shield',
    children: [
      { key: 'admin-usuarios', label: 'Usuarios', path: '/sistema/admin/usuarios' },
      { key: 'admin-roles', label: 'Roles y permisos', path: '/sistema/admin/roles' },
      { key: 'admin-seguridad', label: 'Respaldos y bitácora', path: '/sistema/admin/seguridad' },
    ],
  },];

export const dashboardKpis = [
  { id: 'ganancias', label: 'Ganancias totales', value: 52450, currency: true, trend: 10.6, trendLabel: 'comparado al mes anterior', icon: 'LineChart' },
  { id: 'ordenes', label: 'Órdenes activas', value: 137, trend: 4.2, trendLabel: 'comparado a la semana anterior', icon: 'ShoppingCart' },
  { id: 'produccion', label: 'Producción', value: 350, unit: 'Unidades', trend: -3.5, trendLabel: 'comparado a la semana anterior', icon: 'Package' },
  { id: 'materia', label: 'Materia prima', value: 25000, currency: true, trend: 8.6, trendLabel: 'comparado al mes anterior', icon: 'Box' },
];

export const incomeVsExpenses = [
  { mes: 'Ene', ingresos: 5, gastos: 4.5 }, { mes: 'Feb', ingresos: 0.2, gastos: 5 },
  { mes: 'Mar', ingresos: 8, gastos: 8 }, { mes: 'Abr', ingresos: 16, gastos: 12 },
  { mes: 'May', ingresos: 23, gastos: 17 }, { mes: 'Jun', ingresos: 27, gastos: 20 },
  { mes: 'Jul', ingresos: 26, gastos: 20 }, { mes: 'Ago', ingresos: 20, gastos: 18 },
  { mes: 'Sep', ingresos: 14, gastos: 12 }, { mes: 'Oct', ingresos: 9, gastos: 8 },
  { mes: 'Nov', ingresos: 5, gastos: 6 }, { mes: 'Dic', ingresos: 3, gastos: 4 },
];

export const inventoryAlerts = [
  { id: 1, item: 'Cuero tratado (Café)', detail: 'Actual: 45 m² / Mín: 50 m²', level: 'Bajo' },
  { id: 2, item: 'Botones de presión (25mm)', detail: 'Actual: 100 pc / Mín: 200', level: 'Crítico' },
  { id: 3, item: 'Carretes de hilo (Negro)', detail: 'Actual: 5 carretes / Mín: 15 carretes', level: 'Bajo' },
];

export const customers = [
  { id: 1, name: 'María López', user: 'mlopez', email: 'maria.lopez@email.com', status: 'Activo', lastPurchase: '2026-09-20', total: 4850 },
  { id: 2, name: 'Carlos Rodríguez', user: 'crodriguez', email: 'carlos.rodriguez@email.com', status: 'Activo', lastPurchase: '2026-09-18', total: 2300 },
  { id: 3, name: 'Ana Martínez', user: 'amartinez', email: 'ana.martinez@email.com', status: 'Activo', lastPurchase: '2026-09-15', total: 7200 },
  { id: 4, name: 'Roberto García', user: 'rgarcia', email: 'roberto.garcia@email.com', status: 'Inactivo', lastPurchase: '2026-07-10', total: 1850 },
  { id: 5, name: 'Sofía Hernández', user: 'shernandez', email: 'sofia.hernandez@email.com', status: 'Activo', lastPurchase: '2026-09-22', total: 5600 },
];

export const products = [
  { id: 1, name: 'Bolso Elipse', price: 10.99, stock: 50, unitCost: 7.95, image: 'https://th.bing.com/th/id/OIP.q64yF-gXdE5EsSINXodhFgHaHa?w=189&h=189&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3', category: 'Bolsos', minStock: 15, bom: 'Cuero tratado, hilo y herrajes' },
  { id: 2, name: 'Faja para Dama', price: 14.99, stock: 20, unitCost: 8.5, image: 'data:image/webp;base64,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', category: 'Accesorios', minStock: 15, bom: 'Cuero tratado, hilo y herrajes' },
  { id: 3, name: 'Cosmetiquera Neo', price: 5.99, stock: 10, unitCost: 2.85, image: 'https://th.bing.com/th/id/OIP.227uyhFLeA-XOqfo2R0_VQHaHa?w=195&h=195&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3', category: 'Accesorios', minStock: 15, bom: 'Cuero tratado, hilo y herrajes' },
  { id: 4, name: 'Bolso Avalon', price: 10.99, stock: 45, unitCost: 7.95, image: 'data:image/webp;base64,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', category: 'Bolsos', minStock: 15, bom: 'Cuero tratado, hilo y herrajes' },
];

export const inventoryStats = { products: 52, lowStock: 2, value: 52550 };

export const orders = [
  { id: '#ORD-00125', customer: 'María López', date: '2026-09-20', items: 2, total: 4850, method: 'Efectivo', status: 'Completada' },
  { id: '#ORD-00124', customer: 'Carlos Rodríguez', date: '2026-09-18', items: 1, total: 2300, method: 'Transferencia', status: 'Pendiente' },
  { id: '#ORD-00123', customer: 'Ana Martínez', date: '2026-09-15', items: 3, total: 7200, method: 'Tarjeta', status: 'Completada' },
  { id: '#ORD-00122', customer: 'Roberto García', date: '2026-09-10', items: 1, total: 1850, method: 'Efectivo', status: 'Cancelada' },
  { id: '#ORD-00121', customer: 'Sofía Hernández', date: '2026-09-08', items: 2, total: 5600, method: 'Transferencia', status: 'En proceso' },
];

export const salesStats = { today: 12, pending: 5, month: 48500 };

export const financeKpis = [
  { id: 'ingresos', label: 'Ingresos:', value: 128450, trend: 12.4 },
  { id: 'gastos', label: 'Gastos:', value: 64280, trend: -4.1 },
  { id: 'utilidad', label: 'Utilidad:', value: 64170, trend: 8.5 },
  { id: 'cobrar', label: 'Cuentas por cobrar:', value: 18500, trend: 2.1 },
];

export const transactions = [
  { id: 1, date: '2026-09-25', description: 'Venta de bolso', type: 'Ingreso', category: 'Venta de productos', method: 'Efectivo', amount: 4350, status: 'Completado' },
  { id: 2, date: '2026-09-24', description: 'Compra de materia prima', type: 'Gasto', category: 'Materia prima', method: 'Transferencia', amount: 8500, status: 'Completado' },
  { id: 3, date: '2026-09-23', description: 'Pago de internet', type: 'Gasto', category: 'Servicios', method: 'Transferencia', amount: 1200, status: 'Completado' },
  { id: 4, date: '2026-09-22', description: 'Venta mayorista', type: 'Ingreso', category: 'Venta mayorista', method: 'Tarjeta', amount: 12800, status: 'Pendiente' },
];

export const employees = [
  { id: 1, name: 'Rosé Park', role: 'Gerente general', area: 'Dirección General', status: 'Activo', hired: '2019-05-20', phone: '8888-1234' },
  { id: 2, name: 'Kris Dremuur', role: 'Contador', area: 'Administración', status: 'Activo', hired: '2022-04-18', phone: '8888-1234' },
  { id: 3, name: 'Yuji Itadori', role: 'Ensamblador', area: 'Producción', status: 'Activo', hired: '2020-10-15', phone: '8888-7434' },
  { id: 4, name: 'Susie Crocodile', role: 'Vendedora', area: 'Ventas', status: 'Inactivo', hired: '2023-08-10', phone: '8888-8756' },
  { id: 5, name: 'Korra Mara', role: 'Analista financiera', area: 'Finanzas', status: 'Activo', hired: '2025-01-22', phone: '8888-5468' },
];

/** Tono de badge por estado (lo consumirá <Badge /> en el Paso 3). */
export const statusTone = {
  Activo: 'ok', Completada: 'ok', Completado: 'ok', Ingreso: 'info',
  Inactivo: 'bad', Cancelada: 'bad', Crítico: 'bad', Gasto: 'bad',
  Pendiente: 'warn', Bajo: 'warn', 'En proceso': 'info',
};


export const productionPlans = [
  {
    id: 'PLAN-001',
    product: 'Bolso Elipse',
    quantity: 30,
    startDate: '2026-10-20',
    dueDate: '2026-10-28',
    responsible: 'Coordinación de producción',
    priority: 'Alta',
    status: 'En proceso',
  },
  {
    id: 'PLAN-002',
    product: 'Faja para Dama',
    quantity: 20,
    startDate: '2026-10-22',
    dueDate: '2026-10-30',
    responsible: 'Equipo de marroquinería',
    priority: 'Media',
    status: 'Planificada',
  },
  {
    id: 'PLAN-003',
    product: 'Cosmetiquera Neo',
    quantity: 40,
    startDate: '2026-10-10',
    dueDate: '2026-10-18',
    responsible: 'Equipo de ensamblaje',
    priority: 'Baja',
    status: 'Completada',
  },
  {
    id: 'PLAN-004',
    product: 'Bolso Avalon',
    quantity: 25,
    startDate: '2026-10-23',
    dueDate: '2026-10-31',
    responsible: 'Equipo de costura',
    priority: 'Alta',
    status: 'Planificada',
  },
  {
    id: 'PLAN-005',
    product: 'Billetera Clásica',
    quantity: 35,
    startDate: '2026-10-24',
    dueDate: '2026-11-02',
    responsible: 'Equipo de ensamblaje',
    priority: 'Media',
    status: 'Planificada',
  },
];

export const finishedProducts = [
  {
    id: 'PT-001',
    product: 'Bolso Avalon',
    orderId: 'OP-001',
    quantity: 25,
    approved: 23,
    rejected: 2,
    finishedDate: '2026-10-18',
    inventoryStatus: 'Pendiente',
  },
  {
    id: 'PT-002',
    product: 'Faja para Dama',
    orderId: 'OP-002',
    quantity: 18,
    approved: 18,
    rejected: 0,
    finishedDate: '2026-10-17',
    inventoryStatus: 'Enviado al inventario',
  },
  {
    id: 'PT-003',
    product: 'Cosmetiquera Neo',
    orderId: 'OP-003',
    quantity: 32,
    approved: 30,
    rejected: 2,
    finishedDate: '2026-10-16',
    inventoryStatus: 'Pendiente',
  },
  {
    id: 'PT-004',
    product: 'Bolso Elipse',
    orderId: 'OP-004',
    quantity: 30,
    approved: 29,
    rejected: 1,
    finishedDate: '2026-10-15',
    inventoryStatus: 'Enviado al inventario',
  },
  {
    id: 'PT-005',
    product: 'Billetera Clásica',
    orderId: 'OP-005',
    quantity: 40,
    approved: 38,
    rejected: 2,
    finishedDate: '2026-10-14',
    inventoryStatus: 'Pendiente',
  },
];



export const productionReports = {
  'Mes actual': {
    planned: 120,
    produced: 95,
    completedOrders: 8,
    stages: [
      { name: 'Corte', quantity: 110 },
      { name: 'Costura', quantity: 100 },
      { name: 'Ensamblaje', quantity: 95 },
      { name: 'Acabado y revisión', quantity: 90 },
    ],
  },

  'Mes anterior': {
    planned: 100,
    produced: 92,
    completedOrders: 7,
    stages: [
      { name: 'Corte', quantity: 100 },
      { name: 'Costura', quantity: 96 },
      { name: 'Ensamblaje', quantity: 92 },
      { name: 'Acabado y revisión', quantity: 92 },
    ],
  },

  'Últimos 7 días': {
    planned: 35,
    produced: 28,
    completedOrders: 3,
    stages: [
      { name: 'Corte', quantity: 35 },
      { name: 'Costura', quantity: 32 },
      { name: 'Ensamblaje', quantity: 28 },
      { name: 'Acabado y revisión', quantity: 25 },
    ],
  },
};
