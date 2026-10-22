
import { useMemo, useState } from 'react';
import {
    Users,
    Crown,
    Repeat2,
    UserRound,
    Search,
    ArrowRight,
    Target,
    TrendingUp,
    ShoppingBag,
} from 'lucide-react';

const initialClients = [
    {
        id: 'CLI-001',
        name: 'María González',
        category: 'Frecuente',
        purchases: 8,
        amount: 12500,
        lastPurchase: '2026-10-15',
        status: 'Activo',
    },
    {
        id: 'CLI-002',
        name: 'Hotel Las Flores',
        category: 'Corporativo',
        purchases: 12,
        amount: 58000,
        lastPurchase: '2026-10-18',
        status: 'Activo',
    },
    {
        id: 'CLI-003',
        name: 'Ana Martínez',
        category: 'Ocasional',
        purchases: 2,
        amount: 1800,
        lastPurchase: '2026-08-12',
        status: 'Activo',
    },
    {
        id: 'CLI-004',
        name: 'Tienda Artesanal Granada',
        category: 'Mayorista',
        purchases: 15,
        amount: 75000,
        lastPurchase: '2026-10-19',
        status: 'Activo',
    },
    {
        id: 'CLI-005',
        name: 'Carlos López',
        category: 'Ocasional',
        purchases: 1,
        amount: 650,
        lastPurchase: '2026-05-10',
        status: 'Inactivo',
    },
    {
        id: 'CLI-006',
        name: 'Lucía Ramírez',
        category: 'Frecuente',
        purchases: 6,
        amount: 9200,
        lastPurchase: '2026-10-10',
        status: 'Activo',
    },
    {
        id: 'CLI-007',
        name: 'Artesanías del Lago',
        category: 'Mayorista',
        purchases: 10,
        amount: 46000,
        lastPurchase: '2026-09-30',
        status: 'Activo',
    },
    {
        id: 'CLI-008',
        name: 'Pedro Hernández',
        category: 'Ocasional',
        purchases: 1,
        amount: 950,
        lastPurchase: '2026-07-04',
        status: 'Activo',
    },
];

const segments = [
    {
        name: 'Frecuentes',
        category: 'Frecuente',
        description: 'Clientes con compras recurrentes.',
        icon: Repeat2,
        color: 'bg-blue-50 text-blue-700',
        bar: 'bg-blue-500',
    },
    {
        name: 'Mayoristas',
        category: 'Mayorista',
        description: 'Compradores por volumen.',
        icon: ShoppingBag,
        color: 'bg-emerald-50 text-emerald-700',
        bar: 'bg-emerald-500',
    },
    {
        name: 'Corporativos',
        category: 'Corporativo',
        description: 'Empresas y organizaciones.',
        icon: Crown,
        color: 'bg-purple-50 text-purple-700',
        bar: 'bg-purple-500',
    },
    {
        name: 'Ocasionales',
        category: 'Ocasional',
        description: 'Clientes con compras puntuales.',
        icon: UserRound,
        color: 'bg-amber-50 text-amber-700',
        bar: 'bg-amber-500',
    },
];

const money = (amount) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 0,
    }).format(amount);

const dateFormatter = new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
});

export default function Segmentacion() {
    const [clients] = useState(initialClients);
    const [selectedSegment, setSelectedSegment] = useState('Todos');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    const segmentCounts = useMemo(() => {
        return segments.map((segment) => ({
            ...segment,
            count: clients.filter(
                (client) => client.category === segment.category
            ).length,
            total: clients
                .filter((client) => client.category === segment.category)
                .reduce((sum, client) => sum + client.amount, 0),
        }));
    }, [clients]);

    const filteredClients = useMemo(() => {
        const query = search.toLowerCase().trim();

        return clients.filter((client) => {
            const matchesSearch =
                client.name.toLowerCase().includes(query) ||
                client.id.toLowerCase().includes(query);

            const matchesSegment =
                selectedSegment === 'Todos' ||
                client.category === selectedSegment;

            const matchesStatus =
                statusFilter === 'Todos' || client.status === statusFilter;

            return matchesSearch && matchesSegment && matchesStatus;
        });
    }, [clients, search, selectedSegment, statusFilter]);

    const activeClients = clients.filter(
        (client) => client.status === 'Activo'
    ).length;

    const totalSales = clients.reduce(
        (sum, client) => sum + client.amount,
        0
    );

    const totalPurchases = clients.reduce(
        (sum, client) => sum + client.purchases,
        0
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">
                <header>
                    <p className="text-sm font-medium text-emerald-700">
                        Sunshine Handmade / CRM
                    </p>
                    <h1 className="mt-1 text-3xl font-bold text-gray-900">
                        Segmentación de clientes
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                        Identifica los distintos perfiles de clientes de Sunshine para
                        organizar el seguimiento y orientar las estrategias comerciales.
                    </p>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: 'Clientes registrados',
                            value: clients.length,
                            icon: Users,
                            color: 'bg-blue-50 text-blue-700',
                        },
                        {
                            label: 'Clientes activos',
                            value: activeClients,
                            icon: UserRound,
                            color: 'bg-emerald-50 text-emerald-700',
                        },
                        {
                            label: 'Compras registradas',
                            value: totalPurchases,
                            icon: ShoppingBag,
                            color: 'bg-purple-50 text-purple-700',
                        },
                        {
                            label: 'Importe acumulado',
                            value: money(totalSales),
                            icon: TrendingUp,
                            color: 'bg-amber-50 text-amber-700',
                        },
                    ].map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <article
                                key={stat.label}
                                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                        <p className="mt-3 text-2xl font-bold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <span className={`rounded-xl p-3 ${stat.color}`}>
                                        <Icon size={22} />
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <section>
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Segmentos comerciales
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Selecciona un segmento para filtrar el directorio.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {segmentCounts.map((segment) => {
                            const Icon = segment.icon;
                            const isSelected = selectedSegment === segment.category;
                            const percentage =
                                clients.length > 0
                                    ? (segment.count / clients.length) * 100
                                    : 0;

                            return (
                                <button
                                    key={segment.category}
                                    type="button"
                                    onClick={() =>
                                        setSelectedSegment(
                                            isSelected ? 'Todos' : segment.category
                                        )
                                    }
                                    aria-pressed={isSelected}
                                    className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isSelected
                                            ? 'border-emerald-600 ring-2 ring-emerald-100'
                                            : 'border-gray-100'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <span className={`rounded-xl p-3 ${segment.color}`}>
                                            <Icon size={23} />
                                        </span>
                                        <span className="text-sm font-semibold text-gray-500">
                                            {percentage.toFixed(0)}%
                                        </span>
                                    </div>

                                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                                        {segment.name}
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {segment.description}
                                    </p>

                                    <div className="mt-4 flex items-end justify-between gap-2">
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {segment.count}
                                            </p>
                                            <p className="text-xs text-gray-500">clientes</p>
                                        </div>
                                        <span className="text-right text-sm font-medium text-gray-700">
                                            {money(segment.total)}
                                        </span>
                                    </div>

                                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className={`h-full rounded-full ${segment.bar}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-sm font-medium text-emerald-700">
                                        <span>{isSelected ? 'Filtro seleccionado' : 'Ver clientes'}</span>
                                        <ArrowRight size={17} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-5 flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar cliente por nombre o código..."
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-600"
                            />
                        </div>

                        <select
                            value={selectedSegment}
                            onChange={(e) => setSelectedSegment(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
                        >
                            <option value="Todos">Todos los segmentos</option>
                            <option value="Frecuente">Frecuentes</option>
                            <option value="Mayorista">Mayoristas</option>
                            <option value="Corporativo">Corporativos</option>
                            <option value="Ocasional">Ocasionales</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
                        >
                            <option value="Todos">Todos los estados</option>
                            <option value="Activo">Activos</option>
                            <option value="Inactivo">Inactivos</option>
                        </select>
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                Clientes por segmento
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {filteredClients.length} registros encontrados
                            </p>
                        </div>

                        {selectedSegment !== 'Todos' && (
                            <button
                                onClick={() => setSelectedSegment('Todos')}
                                className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                            >
                                Limpiar segmento
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <th className="px-4 py-3 font-medium">Cliente</th>
                                    <th className="px-4 py-3 font-medium">Segmento</th>
                                    <th className="px-4 py-3 font-medium">Compras</th>
                                    <th className="px-4 py-3 font-medium">Importe acumulado</th>
                                    <th className="px-4 py-3 font-medium">Última compra</th>
                                    <th className="px-4 py-3 font-medium">Estado</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-gray-800">
                                                {client.name}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                {client.id}
                                            </p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                                {client.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {client.purchases}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-gray-800">
                                            {money(client.amount)}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {dateFormatter.format(
                                                new Date(`${client.lastPurchase}T12:00:00Z`)
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${client.status === 'Activo'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {client.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredClients.length === 0 && (
                            <div className="py-12 text-center">
                                <Users size={35} className="mx-auto text-gray-300" />
                                <p className="mt-3 font-medium text-gray-700">
                                    No se encontraron clientes
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Cambia los filtros o el término de búsqueda.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                    <Target size={20} className="mt-0.5 shrink-0" />
                    <p>
                        Los segmentos y montos son ilustrativos. En una versión conectada
                        al backend, las categorías deben derivarse de criterios comerciales
                        definidos y los importes deben calcularse a partir de las ventas
                        efectivamente registradas.
                    </p>
                </div>
            </div>
        </div>
    );
}
