
import { useMemo, useState } from 'react';
import {
    TrendingUp,
    ShoppingBag,
    DollarSign,
    Clock3,
    Search,
    RotateCcw,
    ArrowUpRight,
    CreditCard,
} from 'lucide-react';

const ventasDemo = [
    { id: 'V-1025', fecha: '2026-10-25', cliente: 'María López', metodo: 'Efectivo', estado: 'Completada', total: 1850 },
    { id: 'V-1024', fecha: '2026-10-24', cliente: 'Ana Martínez', metodo: 'Transferencia', estado: 'Completada', total: 3200 },
    { id: 'V-1023', fecha: '2026-10-23', cliente: 'Cliente de mostrador', metodo: 'Efectivo', estado: 'Completada', total: 950 },
    { id: 'V-1022', fecha: '2026-10-22', cliente: 'Lucía García', metodo: 'Tarjeta', estado: 'Pendiente', total: 2450 },
    { id: 'V-1021', fecha: '2026-10-18', cliente: 'Carolina Ruiz', metodo: 'Transferencia', estado: 'Completada', total: 4100 },
    { id: 'V-1020', fecha: '2026-10-12', cliente: 'Elena Pérez', metodo: 'Efectivo', estado: 'Completada', total: 1650 },
    { id: 'V-1019', fecha: '2026-09-28', cliente: 'Sofía Mendoza', metodo: 'Tarjeta', estado: 'Completada', total: 2800 },
];

const moneda = (n) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(n);

export default function PanelVentas() {
    const [periodo, setPeriodo] = useState('30');
    const [busqueda, setBusqueda] = useState('');
    const [estado, setEstado] = useState('Todos');
    const [filtros, setFiltros] = useState({
        periodo: '30',
        busqueda: '',
        estado: 'Todos',
    });

    const ventasFiltradas = useMemo(() => {
        const hoy = new Date('2026-10-25T12:00:00');

        return ventasDemo.filter((v) => {
            const dias = filtros.periodo === '7' ? 7 : filtros.periodo === '30' ? 30 : null;
            const diferencia = (hoy - new Date(`${v.fecha}T12:00:00`)) / 86400000;
            const coincideFecha = dias === null || (diferencia >= 0 && diferencia <= dias);
            const texto = `${v.id} ${v.cliente}`.toLowerCase();
            const coincideTexto = texto.includes(filtros.busqueda.toLowerCase());
            const coincideEstado = filtros.estado === 'Todos' || v.estado === filtros.estado;

            return coincideFecha && coincideTexto && coincideEstado;
        });
    }, [filtros]);

    const completadas = ventasFiltradas.filter((v) => v.estado === 'Completada');
    const ingresos = completadas.reduce((suma, v) => suma + v.total, 0);
    const pendientes = ventasFiltradas.filter((v) => v.estado === 'Pendiente').length;
    const promedio = completadas.length ? ingresos / completadas.length : 0;

    const metodos = ['Efectivo', 'Transferencia', 'Tarjeta'].map((metodo) => ({
        metodo,
        cantidad: completadas.filter((v) => v.metodo === metodo).reduce((s, v) => s + v.total, 0),
    }));
    const maxMetodo = Math.max(...metodos.map((m) => m.cantidad), 1);

    const aplicarFiltros = () => setFiltros({ periodo, busqueda, estado });
    const limpiarFiltros = () => {
        setPeriodo('30');
        setBusqueda('');
        setEstado('Todos');
        setFiltros({ periodo: '30', busqueda: '', estado: 'Todos' });
    };

    const indicadores = [
        { titulo: 'Ingresos completados', valor: moneda(ingresos), nota: 'Ventas completadas', Icon: DollarSign },
        { titulo: 'Ventas registradas', valor: ventasFiltradas.length, nota: 'Según filtros aplicados', Icon: ShoppingBag },
        { titulo: 'Ticket promedio', valor: moneda(promedio), nota: 'Por venta completada', Icon: TrendingUp },
        { titulo: 'Ventas pendientes', valor: pendientes, nota: 'Requieren seguimiento', Icon: Clock3 },
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <p className="text-sm text-gray-500">Ventas y órdenes / Panel de ventas</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-800">Panel de ventas</h1>
                <p className="mt-1 text-sm text-gray-500">Resumen del desempeño comercial de Sunshine Handmade.</p>
            </div>

            <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-gray-800">Filtrar información</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                    <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
                        <option value="7">Últimos 7 días</option>
                        <option value="30">Últimos 30 días</option>
                        <option value="todos">Todo el período</option>
                    </select>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                            placeholder="Buscar código o cliente"
                            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm" />
                    </div>
                    <select value={estado} onChange={(e) => setEstado(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
                        <option>Todos</option>
                        <option>Completada</option>
                        <option>Pendiente</option>
                    </select>
                    <div className="flex gap-2">
                        <button onClick={aplicarFiltros}
                            className="flex-1 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white">
                            Aplicar filtros
                        </button>
                        <button onClick={limpiarFiltros} title="Restablecer filtros"
                            className="rounded-xl border border-gray-200 px-3 text-gray-600 hover:bg-gray-50">
                            <RotateCcw size={17} />
                        </button>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {indicadores.map(({ titulo, valor, nota, Icon }) => (
                    <article key={titulo} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500">{titulo}</p>
                                <p className="mt-2 text-xl font-bold text-gray-800">{valor}</p>
                                <p className="mt-1 text-xs text-gray-400">{nota}</p>
                            </div>
                            <span className="rounded-xl bg-orange-50 p-3 text-orange-700"><Icon size={21} /></span>
                        </div>
                    </article>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-800">Ingresos por método de pago</h2>
                            <p className="mt-1 text-sm text-gray-500">Solo ventas completadas</p>
                        </div>
                        <CreditCard className="text-orange-700" size={21} />
                    </div>
                    <div className="mt-6 space-y-5">
                        {metodos.map(({ metodo, cantidad }) => (
                            <div key={metodo}>
                                <div className="mb-2 flex justify-between gap-3 text-sm">
                                    <span className="text-gray-600">{metodo}</span>
                                    <span className="font-semibold text-gray-800">{moneda(cantidad)}</span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full rounded-full bg-orange-500"
                                        style={{ width: `${(cantidad / maxMetodo) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-800">Actividad comercial</h2>
                            <p className="mt-1 text-sm text-gray-500">Resumen de los resultados filtrados</p>
                        </div>
                        <ArrowUpRight className="text-orange-700" size={21} />
                    </div>
                    <div className="mt-5 space-y-4">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                            <span className="text-sm text-gray-600">Ventas completadas</span>
                            <span className="font-bold text-green-700">{completadas.length}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                            <span className="text-sm text-gray-600">Ventas pendientes</span>
                            <span className="font-bold text-amber-700">{pendientes}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                            <span className="text-sm text-gray-600">Ingresos completados</span>
                            <span className="font-bold text-gray-800">{moneda(ingresos)}</span>
                        </div>
                    </div>
                </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                    <h2 className="font-semibold text-gray-800">Ventas recientes</h2>
                    <p className="mt-1 text-sm text-gray-500">{ventasFiltradas.length} transacción(es) encontradas</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-3">Código</th><th className="px-5 py-3">Fecha</th>
                                <th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Pago</th>
                                <th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ventasFiltradas.map((v) => (
                                <tr key={v.id} className="hover:bg-orange-50/30">
                                    <td className="px-5 py-4 font-semibold">{v.id}</td>
                                    <td className="px-5 py-4 text-gray-600">{v.fecha}</td>
                                    <td className="px-5 py-4">{v.cliente}</td>
                                    <td className="px-5 py-4 text-gray-600">{v.metodo}</td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs ${v.estado === 'Completada' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                                            }`}>{v.estado}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right font-semibold">{moneda(v.total)}</td>
                                </tr>
                            ))}
                            {!ventasFiltradas.length && (
                                <tr><td colSpan="6" className="px-5 py-10 text-center text-gray-500">No se encontraron ventas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <p className="text-xs text-gray-400">
                Datos ficticios para demostración. Las fechas del filtro están referidas al 25 de octubre de 2026.
            </p>
        </div>
    );
}
