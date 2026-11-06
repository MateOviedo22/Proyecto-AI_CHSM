import { useMemo, useState } from 'react';
import { useApiRead } from '../../../hooks/useApiRead';

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const COLORES = ['bg-emerald-600','bg-amber-500','bg-blue-600','bg-purple-600','bg-gray-500'];
import {
    Download,
    Users,
    ShoppingBag,
    UserCheck,
    CalendarDays,
    TrendingUp,
    TrendingDown,
    FileBarChart,
    Filter,
} from 'lucide-react';

const currency = (value) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 0,
    }).format(value);

const dateLabel = (value) =>
    new Date(`${value}T12:00:00`).toLocaleDateString('es-NI', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

export default function ReportesCRM() {
    // Datos reales: ventas completadas por mes, clientes por tipo y actividades CRM registradas.
    const ventas = useApiRead('/ventas');
    const clientes = useApiRead('/recursos/clientes');
    const actividadesApi = useApiRead('/recursos/actividades');
    const monthlySales = useMemo(() => {
        const hoy = new Date();
        return Array.from({ length: 12 }, (_, i) => {
            const d = new Date(hoy.getFullYear(), hoy.getMonth() - 11 + i, 1);
            const del = ventas.filter(v => v.estado === 'Completada' && new Date(v.fecha).getFullYear() === d.getFullYear() && new Date(v.fecha).getMonth() === d.getMonth());
            return { month: MESES[d.getMonth()], sales: del.reduce((s, v) => s + v.total, 0), customers: new Set(del.map(v => v.cliente)).size };
        });
    }, [ventas]);
    const segmentData = useMemo(() => Object.entries(clientes.reduce((m, c) => { m[c.type] = (m[c.type] || 0) + 1; return m; }, {})).map(([name, count], i) => ({ name, count, color: COLORES[Math.min(i, COLORES.length - 1)] })), [clientes]);
    const activities = actividadesApi.map(a => ({ date: a.date, client: a.client, activity: a.title, type: a.type, status: a.status, responsible: a.responsible }));
    const [period, setPeriod] = useState('6');
    const [activityFilter, setActivityFilter] = useState('Todas');

    const visibleSales = useMemo(
        () => monthlySales.slice(-Number(period)),
        [period, monthlySales]
    );

    const visibleActivities = activities.filter(
        (item) => activityFilter === 'Todas' || item.status === activityFilter
    );

    const maxSales = Math.max(1, ...visibleSales.map((item) => item.sales));

    function exportCSV() {
        const rows = [
            ['Fecha', 'Cliente', 'Actividad', 'Tipo', 'Estado', 'Responsable'],
            ...visibleActivities.map((item) => [
                item.date,
                item.client,
                item.activity,
                item.type,
                item.status,
                item.responsible,
            ]),
        ];
        const csv = rows
            .map((row) =>
                row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')
            )
            .join('\r\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'sunshine-reporte-crm.csv';
        anchor.click();
        URL.revokeObjectURL(url);
    }


    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-medium text-emerald-700">Sunshine Handmade / CRM</p>
                        <h1 className="mt-1 text-3xl font-bold text-gray-900">Reportes CRM</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Analiza el comportamiento comercial, la cartera de clientes y las actividades de seguimiento.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                            aria-label="Periodo del reporte"
                        >
                            <option value="3">Últimos 3 meses</option>
                            <option value="6">Últimos 6 meses</option>
                            <option value="12">Últimos 12 meses</option>
                        </select>
                        <button
                            onClick={exportCSV}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                        >
                            <Download size={17} /> Exportar actividades
                        </button>
                    </div>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Clientes registrados', value: String(clientes.length), note: `${clientes.filter(c => c.purchases > 0).length} con compras`, icon: Users, positive: true },
                        { label: 'Ventas del periodo', value: currency(visibleSales.reduce((t, m) => t + m.sales, 0)), note: (() => { const ant = monthlySales.slice(-2 * Number(period), -Number(period)).reduce((t, m) => t + m.sales, 0); const act = visibleSales.reduce((t, m) => t + m.sales, 0); return ant ? `${act >= ant ? '+' : ''}${(((act - ant) / ant) * 100).toFixed(1)}% vs. periodo anterior` : 'Sin periodo anterior comparable'; })(), icon: ShoppingBag, positive: true },
                        { label: 'Clientes activos', value: String(clientes.filter(c => c.status === 'Activo').length), note: `${clientes.length ? ((clientes.filter(c => c.status === 'Activo').length / clientes.length) * 100).toFixed(1) : 0}% de la cartera`, icon: UserCheck, positive: true },
                        { label: 'Seguimientos pendientes', value: String(activities.filter(a => a.status === 'Pendiente').length), note: 'Requieren atención', icon: CalendarDays, positive: false },
                    ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <article key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                        <p className="mt-3 text-2xl font-bold text-gray-900">{stat.value}</p>
                                        <p className={`mt-2 flex items-center gap-1 text-xs ${stat.positive ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {stat.note}
                                        </p>
                                    </div>
                                    <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Icon size={22} /></span>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-semibold text-gray-900">Evolución de ventas</h2>
                                <p className="mt-1 text-sm text-gray-500">Importe mensual ilustrativo en córdobas</p>
                            </div>
                            <FileBarChart size={22} className="text-emerald-700" />
                        </div>
                        <div className="flex h-64 items-end gap-3 border-b border-gray-100 pb-2 sm:gap-5">
                            {visibleSales.map((item) => (
                                <div key={item.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                                    <span className="text-center text-[10px] font-medium text-gray-500 sm:text-xs">
                                        {currency(item.sales)}
                                    </span>
                                    <div
                                        className="w-full max-w-16 rounded-t-lg bg-emerald-600 transition-all hover:bg-emerald-700"
                                        style={{ height: `${(item.sales / maxSales) * 72}%` }}
                                        title={`${item.month}: ${currency(item.sales)}`}
                                    />
                                    <span className="text-xs text-gray-500">{item.month}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-xs text-gray-400">
                            Representación visual de datos de demostración; no corresponde a una consulta de ventas real.
                        </p>
                    </article>

                    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <h2 className="font-semibold text-gray-900">Clientes por segmento</h2>
                        <p className="mt-1 text-sm text-gray-500">Distribución de la cartera</p>
                        <div className="mt-6 space-y-5">
                            {segmentData.map((segment) => {
                                const total = segmentData.reduce((sum, item) => sum + item.count, 0);
                                const percent = (segment.count / total) * 100;
                                return (
                                    <div key={segment.name}>
                                        <div className="mb-2 flex justify-between gap-3 text-sm">
                                            <span className="text-gray-700">{segment.name}</span>
                                            <span className="font-semibold text-gray-900">{segment.count} ({percent.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                            <div className={`h-full rounded-full ${segment.color}`} style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </article>
                </section>
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-semibold text-gray-900">Reporte de actividades CRM</h2>
                            <p className="mt-1 text-sm text-gray-500">Interacciones y tareas de seguimiento recientes</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={17} className="text-gray-400" />
                            <select
                                value={activityFilter}
                                onChange={(e) => setActivityFilter(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                                aria-label="Filtrar actividades por estado"
                            >
                                <option value="Todas">Todos los estados</option>
                                <option value="Completada">Completadas</option>
                                <option value="Pendiente">Pendientes</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <th className="px-4 py-3 font-medium">Fecha</th>
                                    <th className="px-4 py-3 font-medium">Cliente</th>
                                    <th className="px-4 py-3 font-medium">Actividad</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium">Responsable</th>
                                    <th className="px-4 py-3 font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleActivities.map((item) => (
                                    <tr key={`${item.date}-${item.client}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                        <td className="whitespace-nowrap px-4 py-4 text-gray-600">{dateLabel(item.date)}</td>
                                        <td className="px-4 py-4 font-medium text-gray-800">{item.client}</td>
                                        <td className="px-4 py-4 text-gray-600">{item.activity}</td>
                                        <td className="px-4 py-4 text-gray-600">{item.type}</td>
                                        <td className="px-4 py-4 text-gray-600">{item.responsible}</td>
                                        <td className="px-4 py-4">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === 'Completada' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {visibleActivities.length === 0 && (
                            <p className="py-10 text-center text-sm text-gray-500">No hay actividades para este filtro.</p>
                        )}
                    </div>
                </section>

                <p className="text-xs text-gray-400">
                    Reporte de demostración. Las métricas definitivas deben calcularse con datos reales del ERP.
                </p>
            </div>
        </div>
    );
}