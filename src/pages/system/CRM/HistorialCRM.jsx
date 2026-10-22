
import { useMemo, useState } from 'react';
import {
    Search,
    Clock3,
    Phone,
    Mail,
    CalendarDays,
    ShoppingBag,
    MessageCircle,
    Filter,
    ArrowUpRight,
} from 'lucide-react';

const initialActivities = [
    {
        id: 1,
        client: 'Hotel Las Flores',
        type: 'Llamada',
        title: 'Seguimiento de cotización',
        description: 'El cliente consultó por disponibilidad de bolsos artesanales.',
        date: '2026-10-21',
        time: '10:00',
        responsible: 'Área comercial',
        status: 'Completada',
    },
    {
        id: 2,
        client: 'María González',
        type: 'Compra',
        title: 'Compra registrada',
        description: 'Compra de una cartera artesanal.',
        date: '2026-10-20',
        time: '14:30',
        responsible: 'Ventas',
        status: 'Completada',
    },
    {
        id: 3,
        client: 'Tienda Artesanal Granada',
        type: 'Correo',
        title: 'Envío de catálogo',
        description: 'Se compartió el catálogo de productos y precios mayoristas.',
        date: '2026-10-20',
        time: '11:15',
        responsible: 'Área comercial',
        status: 'Completada',
    },
    {
        id: 4,
        client: 'Ana Martínez',
        type: 'Reunión',
        title: 'Presentación de colección',
        description: 'Presentación programada de productos disponibles.',
        date: '2026-10-23',
        time: '09:00',
        responsible: 'Área comercial',
        status: 'Pendiente',
    },
    {
        id: 5,
        client: 'Carlos López',
        type: 'Seguimiento',
        title: 'Consultar interés de compra',
        description: 'Contactar al cliente para conocer sus preferencias.',
        date: '2026-10-24',
        time: '15:00',
        responsible: 'Área comercial',
        status: 'Pendiente',
    },
    {
        id: 6,
        client: 'Hotel Las Flores',
        type: 'Correo',
        title: 'Confirmación de propuesta',
        description: 'Se envió información complementaria del pedido.',
        date: '2026-10-19',
        time: '16:00',
        responsible: 'Área comercial',
        status: 'Completada',
    },
];

const activityIcons = {
    Llamada: Phone,
    Correo: Mail,
    Reunión: CalendarDays,
    Compra: ShoppingBag,
    Seguimiento: MessageCircle,
};

const activityColors = {
    Llamada: 'bg-blue-50 text-blue-700',
    Correo: 'bg-purple-50 text-purple-700',
    Reunión: 'bg-amber-50 text-amber-700',
    Compra: 'bg-emerald-50 text-emerald-700',
    Seguimiento: 'bg-pink-50 text-pink-700',
};

function formatDate(dateString) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString('es-NI', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export default function HistorialCRM() {
    const [activities, setActivities] = useState(initialActivities);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('Todos');
    const [statusFilter, setStatusFilter] = useState('Todos');

    const filteredActivities = useMemo(() => {
        const query = search.toLowerCase().trim();

        return activities
            .filter((activity) => {
                const matchesSearch =
                    activity.client.toLowerCase().includes(query) ||
                    activity.title.toLowerCase().includes(query) ||
                    activity.description.toLowerCase().includes(query) ||
                    activity.responsible.toLowerCase().includes(query);

                const matchesType =
                    typeFilter === 'Todos' || activity.type === typeFilter;

                const matchesStatus =
                    statusFilter === 'Todos' || activity.status === statusFilter;

                return matchesSearch && matchesType && matchesStatus;
            })
            .sort(
                (a, b) =>
                    new Date(`${b.date}T${b.time}`) -
                    new Date(`${a.date}T${a.time}`)
            );
    }, [activities, search, typeFilter, statusFilter]);

    function toggleStatus(id) {
        setActivities((previous) =>
            previous.map((activity) =>
                activity.id === id
                    ? {
                        ...activity,
                        status:
                            activity.status === 'Pendiente'
                                ? 'Completada'
                                : 'Pendiente',
                    }
                    : activity
            )
        );
    }

    const pendingCount = activities.filter(
        (activity) => activity.status === 'Pendiente'
    ).length;

    const completedCount = activities.filter(
        (activity) => activity.status === 'Completada'
    ).length;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-6xl space-y-6">
                <header>
                    <p className="text-sm font-medium text-emerald-700">
                        Sunshine Handmade / CRM
                    </p>
                    <h1 className="mt-1 text-3xl font-bold text-gray-900">
                        Historial CRM
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Consulta las interacciones y da seguimiento a las actividades comerciales.
                    </p>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: 'Actividades registradas',
                            value: activities.length,
                            color: 'text-gray-900',
                        },
                        {
                            label: 'Pendientes',
                            value: pendingCount,
                            color: 'text-amber-600',
                        },
                        {
                            label: 'Completadas',
                            value: completedCount,
                            color: 'text-emerald-700',
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                        >
                            <p className="text-sm text-gray-500">{stat.label}</p>
                            <p className={`mt-2 text-3xl font-bold ${stat.color}`}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-5 flex items-center gap-2">
                        <Filter size={19} className="text-emerald-700" />
                        <h2 className="font-semibold text-gray-800">
                            Buscar y filtrar actividades
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar cliente o actividad..."
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-600"
                            />
                        </div>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
                        >
                            <option value="Todos">Todos los tipos</option>
                            <option value="Llamada">Llamadas</option>
                            <option value="Correo">Correos</option>
                            <option value="Reunión">Reuniones</option>
                            <option value="Compra">Compras</option>
                            <option value="Seguimiento">Seguimientos</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
                        >
                            <option value="Todos">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Completada">Completada</option>
                        </select>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
                    <div className="mb-7 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Línea de tiempo
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {filteredActivities.length} actividades encontradas
                            </p>
                        </div>
                        <Clock3 size={22} className="text-emerald-700" />
                    </div>

                    {filteredActivities.length > 0 ? (
                        <div className="space-y-0">
                            {filteredActivities.map((activity, index) => {
                                const Icon = activityIcons[activity.type] || MessageCircle;

                                return (
                                    <article key={activity.id} className="relative flex gap-4 pb-8 last:pb-0">
                                        {index !== filteredActivities.length - 1 && (
                                            <div className="absolute bottom-0 left-5 top-11 w-px bg-gray-200" />
                                        )}

                                        <div
                                            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${activityColors[activity.type]}`}
                                        >
                                            <Icon size={19} />
                                        </div>

                                        <div className="min-w-0 flex-1 rounded-xl border border-gray-100 p-4">
                                            <div className="flex flex-col justify-between gap-3 sm:flex-row">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {activity.title}
                                                        </h3>
                                                        <span
                                                            className={`rounded-full px-2 py-1 text-xs ${activity.status === 'Pendiente'
                                                                    ? 'bg-amber-50 text-amber-700'
                                                                    : 'bg-emerald-50 text-emerald-700'
                                                                }`}
                                                        >
                                                            {activity.status}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 text-sm font-medium text-emerald-800">
                                                        {activity.client}
                                                    </p>
                                                    <p className="mt-2 text-sm leading-6 text-gray-500">
                                                        {activity.description}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 text-left sm:text-right">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {formatDate(activity.date)}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {activity.time}
                                                    </p>
                                                    <p className="mt-2 text-xs text-gray-500">
                                                        {activity.responsible}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                                                <span className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">
                                                    {activity.type}
                                                </span>
                                                <button
                                                    onClick={() => toggleStatus(activity.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                                >
                                                    {activity.status === 'Pendiente'
                                                        ? 'Marcar completada'
                                                        : 'Marcar pendiente'}
                                                    <ArrowUpRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <Clock3 size={36} className="mx-auto text-gray-300" />
                            <p className="mt-3 font-medium text-gray-700">
                                No hay actividades coincidentes
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                                Prueba con otros filtros.
                            </p>
                        </div>
                    )}
                </section>

                <p className="text-xs text-gray-400">
                    Historial ilustrativo. En producción, cada actividad debe asociarse
                    con su cliente y guardarse en el backend.
                </p>
            </div>
        </div>
    );
}
