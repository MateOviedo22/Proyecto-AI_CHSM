import { useState } from 'react';
import {
    AlertTriangle,
    Search,
    RefreshCw,
    CheckCircle2,
    Package,
    Clock3,
} from 'lucide-react';

const initialAlerts = [
    {
        id: 1,
        item: 'Cuero tratado café',
        code: 'MAT-001',
        current: 45,
        minimum: 50,
        unit: 'm²',
        type: 'Bajo',
        date: '2026-10-24',
    },
    {
        id: 2,
        item: 'Hilo negro',
        code: 'INS-001',
        current: 5,
        minimum: 15,
        unit: 'carretes',
        type: 'Crítico',
        date: '2026-10-24',
    },
    {
        id: 3,
        item: 'Botones de presión 25mm',
        code: 'INS-003',
        current: 100,
        minimum: 200,
        unit: 'unidades',
        type: 'Bajo',
        date: '2026-10-23',
    },
];

export default function Reposicion_Alertas() {
    const [alerts, setAlerts] = useState(initialAlerts);
    const [filter, setFilter] = useState('Todas');
    const [search, setSearch] = useState('');

    const filteredAlerts = alerts.filter((alert) => {
        const matchesSearch = `${alert.item} ${alert.code}`
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesFilter =
            filter === 'Todas' || alert.type === filter;

        return matchesSearch && matchesFilter;
    });

    const markAsAttended = (id) => {
        setAlerts((current) =>
            current.filter((alert) => alert.id !== id)
        );
    };

    const critical = alerts.filter(
        (alert) => alert.type === 'Crítico'
    ).length;

    const low = alerts.filter(
        (alert) => alert.type === 'Bajo'
    ).length;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">

                <div>
                    <p className="text-sm font-medium text-emerald-700">
                        Sunshine Handmade / Inventario
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                        Reposición y Alertas
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Identifica materiales con existencias bajas y gestiona
                        las necesidades de reposición.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        icon={<AlertTriangle size={20} />}
                        label="Alertas activas"
                        value={alerts.length}
                        detail="Requieren seguimiento"
                        iconClass="bg-amber-50 text-amber-600"
                    />

                    <SummaryCard
                        icon={<AlertTriangle size={20} />}
                        label="Críticas"
                        value={critical}
                        detail="Atención prioritaria"
                        iconClass="bg-red-50 text-red-600"
                    />

                    <SummaryCard
                        icon={<RefreshCw size={20} />}
                        label="Stock bajo"
                        value={low}
                        detail="Necesitan reposición"
                        iconClass="bg-blue-50 text-blue-600"
                    />
                </div>

                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                    <div className="border-b border-gray-100 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Alertas de inventario
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Materiales que están por debajo del nivel establecido.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50
                                        py-2.5 pl-9 pr-3 text-sm outline-none
                                        focus:border-emerald-500 focus:bg-white
                                        focus:ring-2 focus:ring-emerald-100 sm:w-56"
                                    />
                                </div>

                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="rounded-xl border border-gray-200 bg-gray-50
                                    px-3 py-2.5 text-sm outline-none
                                    focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                >
                                    <option>Todas</option>
                                    <option>Crítico</option>
                                    <option>Bajo</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {filteredAlerts.map((alert) => {
                            const percentage = Math.round(
                                (alert.current / alert.minimum) * 100
                            );

                            return (
                                <div
                                    key={alert.id}
                                    className="p-5 transition hover:bg-gray-50/70"
                                >
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                        <div className="flex gap-4">
                                            <div
                                                className={`flex h-11 w-11 shrink-0 items-center
                                                justify-center rounded-xl ${
                                                    alert.type === 'Crítico'
                                                        ? 'bg-red-50 text-red-600'
                                                        : 'bg-amber-50 text-amber-600'
                                                }`}
                                            >
                                                <AlertTriangle size={21} />
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {alert.item}
                                                    </h3>

                                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                                                        {alert.code}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    Existencia actual: {alert.current} {alert.unit}
                                                    {' · '}
                                                    Mínimo: {alert.minimum} {alert.unit}
                                                </p>

                                                <div className="mt-3 w-full max-w-md">
                                                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                alert.type === 'Crítico'
                                                                    ? 'bg-red-500'
                                                                    : 'bg-amber-500'
                                                            }`}
                                                            style={{
                                                                width: `${Math.min(percentage, 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <p className="mt-2 text-xs text-gray-400">
                                                    Última alerta: {alert.date}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                    alert.type === 'Crítico'
                                                        ? 'bg-red-50 text-red-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}
                                            >
                                                {alert.type}
                                            </span>

                                            <button
                                                onClick={() => markAsAttended(alert.id)}
                                                className="inline-flex items-center gap-2 rounded-xl
                                                border border-gray-200 px-3 py-2 text-sm
                                                font-medium text-gray-700 transition
                                                hover:bg-gray-50"
                                            >
                                                <CheckCircle2 size={16} />
                                                Atendida
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredAlerts.length === 0 && (
                            <div className="px-5 py-12 text-center">
                                <CheckCircle2
                                    size={30}
                                    className="mx-auto text-emerald-500"
                                />

                                <p className="mt-3 font-medium text-gray-700">
                                    No hay alertas pendientes
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    El inventario no presenta alertas con estos filtros.
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function SummaryCard({ icon, label, value, detail, iconClass }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={`mb-4 inline-flex rounded-xl p-2.5 ${iconClass}`}>
                {icon}
            </div>

            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
    );
}