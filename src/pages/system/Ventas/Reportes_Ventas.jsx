
import { useMemo, useState } from 'react';
import {
    BarChart3,
    Download,
    Search,
    Filter,
    TrendingUp,
    ShoppingBag,
    DollarSign,
    ReceiptText,
    RotateCcw,
} from 'lucide-react';

const ventasIniciales = [
    { id: 'V-1001', fecha: '2026-10-25', cliente: 'María López', metodo: 'Efectivo', estado: 'Completada', total: 1850 },
    { id: 'V-1002', fecha: '2026-10-24', cliente: 'Ana Martínez', metodo: 'Transferencia', estado: 'Completada', total: 3200 },
    { id: 'V-1003', fecha: '2026-10-23', cliente: 'Cliente de mostrador', metodo: 'Efectivo', estado: 'Completada', total: 950 },
    { id: 'V-1004', fecha: '2026-10-22', cliente: 'Lucía García', metodo: 'Tarjeta', estado: 'Pendiente', total: 2450 },
    { id: 'V-1005', fecha: '2026-10-18', cliente: 'Carolina Ruiz', metodo: 'Transferencia', estado: 'Completada', total: 4100 },
    { id: 'V-1006', fecha: '2026-09-28', cliente: 'Elena Pérez', metodo: 'Efectivo', estado: 'Completada', total: 1650 },
];

const moneda = (valor) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(valor);

export default function Reportes_Ventas() {
    const [ventas] = useState(ventasIniciales);
    const [busqueda, setBusqueda] = useState('');
    const [periodo, setPeriodo] = useState('todos');
    const [estado, setEstado] = useState('Todos');
    const [aplicados, setAplicados] = useState({
        busqueda: '',
        periodo: 'todos',
        estado: 'Todos',
    });

    const ventasFiltradas = useMemo(() => {
        const hoy = new Date('2026-10-25T12:00:00');
        const dias = aplicados.periodo === '7' ? 7 : aplicados.periodo === '30' ? 30 : null;

        return ventas.filter((venta) => {
            const coincideBusqueda =
                venta.id.toLowerCase().includes(aplicados.busqueda.toLowerCase()) ||
                venta.cliente.toLowerCase().includes(aplicados.busqueda.toLowerCase());

            const fechaVenta = new Date(`${venta.fecha}T12:00:00`);
            const coincidePeriodo =
                dias === null || (hoy - fechaVenta) / 86400000 <= dias;

            const coincideEstado =
                aplicados.estado === 'Todos' || venta.estado === aplicados.estado;

            return coincideBusqueda && coincidePeriodo && coincideEstado;
        });
    }, [ventas, aplicados]);

    const ingresos = ventasFiltradas
        .filter((v) => v.estado === 'Completada')
        .reduce((suma, venta) => suma + venta.total, 0);

    const aplicarFiltros = () => {
        setAplicados({ busqueda, periodo, estado });
    };

    const limpiarFiltros = () => {
        setBusqueda('');
        setPeriodo('todos');
        setEstado('Todos');
        setAplicados({ busqueda: '', periodo: 'todos', estado: 'Todos' });
    };

    const exportarCSV = () => {
        const encabezado = ['Código', 'Fecha', 'Cliente', 'Método de pago', 'Estado', 'Total'];
        const filas = ventasFiltradas.map((v) => [
            v.id, v.fecha, v.cliente, v.metodo, v.estado, v.total,
        ]);

        const contenido = [encabezado, ...filas]
            .map((fila) =>
                fila.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(';')
            )
            .join('\n');

        const blob = new Blob(['\uFEFF' + contenido], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'reporte_ventas.csv';
        enlace.click();
        URL.revokeObjectURL(url);
    };

    const indicadores = [
        {
            titulo: 'Ventas registradas',
            valor: ventasFiltradas.length,
            detalle: 'Transacciones del filtro',
            icono: ShoppingBag,
        },
        {
            titulo: 'Ingresos completados',
            valor: moneda(ingresos),
            detalle: 'Solo ventas completadas',
            icono: DollarSign,
        },
        {
            titulo: 'Ticket promedio',
            valor: moneda(
                ventasFiltradas.filter((v) => v.estado === 'Completada').length
                    ? ingresos / ventasFiltradas.filter((v) => v.estado === 'Completada').length
                    : 0
            ),
            detalle: 'Por venta completada',
            icono: TrendingUp,
        },
        {
            titulo: 'Pendientes',
            valor: ventasFiltradas.filter((v) => v.estado === 'Pendiente').length,
            detalle: 'Requieren seguimiento',
            icono: ReceiptText,
        },
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm text-gray-500">Ventas y órdenes / Reportes</p>
                    <h1 className="mt-1 text-2xl font-bold text-gray-800">Reportes de ventas</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Consulta el comportamiento de las ventas de Sunshine Handmade.
                    </p>
                </div>
                <button
                    onClick={exportarCSV}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-medium text-white hover:opacity-90"
                >
                    <Download size={18} /> Exportar CSV
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {indicadores.map(({ titulo, valor, detalle, icono: Icon }) => (
                    <div key={titulo} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{titulo}</p>
                                <p className="mt-2 text-xl font-bold text-gray-800">{valor}</p>
                                <p className="mt-1 text-xs text-gray-400">{detalle}</p>
                            </div>
                            <div className="rounded-xl bg-orange-50 p-3 text-orange-700">
                                <Icon size={21} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <Filter size={19} className="text-gray-500" />
                    <h2 className="font-semibold text-gray-800">Filtros del reporte</h2>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div className="relative">
                        <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                            placeholder="Buscar código o cliente"
                            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
                        />
                    </div>

                    <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                    >
                        <option value="todos">Todos los períodos</option>
                        <option value="7">Últimos 7 días</option>
                        <option value="30">Últimos 30 días</option>
                    </select>

                    <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                    >
                        <option value="Todos">Todos los estados</option>
                        <option value="Completada">Completadas</option>
                        <option value="Pendiente">Pendientes</option>
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={aplicarFiltros}
                            className="flex-1 rounded-xl bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            Aplicar
                        </button>
                        <button
                            onClick={limpiarFiltros}
                            title="Limpiar filtros"
                            className="rounded-xl border border-gray-200 px-3 text-gray-600 hover:bg-gray-50"
                        >
                            <RotateCcw size={17} />
                        </button>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-gray-800">Detalle de transacciones</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {ventasFiltradas.length} registro(s) encontrados
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                        <BarChart3 size={17} /> Datos de demostración
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-3">Código</th>
                                <th className="px-5 py-3">Fecha</th>
                                <th className="px-5 py-3">Cliente</th>
                                <th className="px-5 py-3">Método de pago</th>
                                <th className="px-5 py-3">Estado</th>
                                <th className="px-5 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ventasFiltradas.map((venta) => (
                                <tr key={venta.id} className="hover:bg-orange-50/40">
                                    <td className="px-5 py-4 font-semibold text-gray-700">{venta.id}</td>
                                    <td className="px-5 py-4 text-gray-600">{venta.fecha}</td>
                                    <td className="px-5 py-4 text-gray-700">{venta.cliente}</td>
                                    <td className="px-5 py-4 text-gray-600">{venta.metodo}</td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${venta.estado === 'Completada'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-amber-50 text-amber-700'
                                            }`}>
                                            {venta.estado}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right font-semibold text-gray-800">
                                        {moneda(venta.total)}
                                    </td>
                                </tr>
                            ))}
                            {ventasFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-5 py-10 text-center text-gray-500">
                                        No hay ventas que coincidan con los filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
