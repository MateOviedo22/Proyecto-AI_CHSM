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
    key: 'crm',
    label: 'CRM y clientes',
    path: '/sistema/crm',
    icon: 'Users',
    children: [
      { key: 'crm-panel', label: 'Panel CRM', path: '/sistema/crm/Dash' },
      { key: 'crm-clientes', label: 'Clientes', path: '/sistema/crm/clientes' },
      { key: 'crm-historial', label: 'Historial de clientes', path: '/sistema/crm/historial' },
      { key: 'crm-segmentacion', label: 'Segmentación', path: '/sistema/crm/segmentacion' },
      { key: 'crm-reportes', label: 'Reportes CRM', path: '/sistema/crm/reportes' },
    ],
  },
  {
    key: 'produccion',
    label: 'Producción',
    path: '/sistema/produccion',
    icon: 'Factory',
  },
  {
    key: 'inventario',
    label: 'Inventario',
    path: '/sistema/inventario',
    icon: 'Package',
  },
  {
    key: 'ventas',
    label: 'Ventas y órdenes',
    path: '/sistema/ventas',
    icon: 'ShoppingCart',
  },
  {
    key: 'finanzas',
    label: 'Finanzas',
    path: '/sistema/finanzas',
    icon: 'LineChart',
  },
  {
    key: 'rrhh',
    label: 'R.R.H.H',
    path: '/sistema/rrhh',
    icon: 'IdCard',
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
  { id: 1, name: 'Bolso Elipse', price: 10.99, stock: 50, unitCost: 7.95, image: 'bolso-elipse.jpg', category: 'Bolsos', minStock: 15, bom: 'Cuero tratado, hilo y herrajes' },
  { id: 2, name: 'Faja para Dama', price: 14.99, stock: 20, unitCost: 8.5, image: 'faja-dama.jpg', category: 'Accesorios', minStock: 15, bom: 'Cuero tratado, hilo y herrajes' },
  { id: 3, name: 'Cosmetiquera Neo', price: 5.99, stock: 10, unitCost: 2.85, image: 'cosmetiquera-neo.jpg', category: 'Accesorios', minStock: 15, bom: 'Cuero tratado, hilo y herrajes' },
  { id: 4, name: 'Bolso Avalon', price: 10.99, stock: 45, unitCost: 7.95, image: 'bolso-avalon.jpg', category: 'Bolsos', minStock: 15, bom: 'Cuero tratado, hilo y herrajes' },
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
