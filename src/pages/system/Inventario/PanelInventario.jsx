import { Link } from 'react-router-dom';
import {
    Package,
    Boxes,
    Warehouse,
    AlertTriangle,
    ArrowUpRight,
    ArrowRight,
    Clock3,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    ClipboardList,
    MapPin,
    BellRing,
} from 'lucide-react';

const stats = [
    {
        label: 'Productos registrados',
        value: '52',
        detail: 'Productos en catálogo',
        icon: Package,
        color: 'bg-blue-50 text-blue-600',
    },
    {
        label: 'Materiales registrados',
        value: '38',
        detail: 'Materias primas e insumos',
        icon: Boxes,
        color: 'bg-emerald-50 text-emerald-600',
    },
    {
        label: 'Valor del inventario',
        value: 'C$ 186,500',
        detail: 'Valor estimado actual',
        icon: Warehouse,
        color: 'bg-purple-50 text-purple-600',
    },
    {
        label: 'Alertas de stock',
        value: '8',
        detail: '2 requieren atención inmediata',
        icon: AlertTriangle,
        color: 'bg-amber-50 text-amber-600',
    },
];

const movements = [
    {
        id: 1,
        type: 'Entrada',
        description: 'Cuero tratado café',
        quantity: '+25 m²',
        location: 'Almacén principal',
        date: 'Hoy · 10:30 a. m.',
        icon: ArrowDownToLine,
        color: 'bg-emerald-50 text-emerald-700',
    },
    {
        id: 2,
        type: 'Salida',
        description: 'Hilo negro',
        quantity: '-10 carretes',
        location: 'Taller de producción',
        date: 'Hoy · 9:15 a. m.',
        icon: ArrowUpFromLine,
        color: 'bg-red-50 text-red-700',
    },
    {
        id: 3,
        type: 'Traslado',
        description: 'Herrajes metálicos',
        quantity: '30 unidades',
        location: 'Almacén → Taller',
        date: 'Ayer · 3:40 p. m.',
        icon: ArrowLeftRight,
        color: 'bg-blue-50 text-blue-700',
    },
];

const alerts = [
    {
        id: 1,
        item: 'Cuero tratado café',
        detail: 'Actual: 45 m² · Mínimo: 50 m²',
        status: 'Bajo',
        color: 'bg-amber-50 text-amber-700',
    },
    {
        id: 2,
        item: 'Botones de presión 25mm',
        detail: 'Actual: 100 unidades · Mínimo: 200',
        status: 'Crítico',
        color: 'bg-red-50 text-red-700',
    },
    {
        id: 3,
        item: 'Hilo negro',
        detail: 'Actual: 5 carretes · Mínimo: 15',
        status: 'Bajo',
        color: 'bg-amber-50 text-amber-700',
    },
];

const quickLinks = [
    {
        title: 'Catálogo de inventario',
        description: 'Consultar productos y existencias.',
        to: '/sistema/inventario/catalogo',
        icon: Package,
    },
    {
        title: 'Catálogo de materiales',
        description: 'Gestionar materias primas e insumos.',
        to: '/sistema/inventario/materiales',
        icon: Boxes,
    },
    {
        title: 'Reposición y alertas',
        description: 'Revisar productos con stock bajo.',
        to: '/sistema/inventario/reposicion',
        icon: BellRing,
    },
];

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-800">
                {children}
            </h2>

            {action}
        </div>
    );
}

export default function PanelInventario() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">

                {/* Encabezado */}
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-medium text-blue-700">
                            Sunshine Handmade / Inventario
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                            Panel de Inventario
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Controla las existencias, materiales, almacenes y movimientos del inventario.
                        </p>
                    </div>

                    <Link
                        to="/sistema/inventario/traslados"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                        <ArrowLeftRight size={18} />
                        Registrar traslado
                    </Link>
                </header>

                {/* Estadísticas */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <article
                                key={stat.label}
                                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {stat.label}
                                        </p>

                                        <p className="mt-3 text-3xl font-bold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-xl p-3 ${stat.color}`}
                                    >
                                        <Icon size={22} />
                                    </span>
                                </div>

                                <p className="mt-4 text-xs text-gray-500">
                                    {stat.detail}
                                </p>
                            </article>
                        );
                    })}
                </section>

                {/* Movimientos + alertas */}
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

                    {/* Movimientos */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
                        <SectionTitle
                            action={
                                <Link
                                    to="/sistema/inventario/trazabilidad"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900"
                                >
                                    Ver trazabilidad
                                    <ArrowUpRight size={16} />
                                </Link>
                            }
                        >
                            Movimientos recientes
                        </SectionTitle>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                                        <th className="px-3 py-3 font-medium">
                                            Movimiento
                                        </th>

                                        <th className="px-3 py-3 font-medium">
                                            Producto / Material
                                        </th>

                                        <th className="px-3 py-3 font-medium">
                                            Cantidad
                                        </th>

                                        <th className="px-3 py-3 font-medium">
                                            Ubicación
                                        </th>

                                        <th className="px-3 py-3 font-medium">
                                            Fecha
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {movements.map((movement) => {
                                        const Icon = movement.icon;

                                        return (
                                            <tr
                                                key={movement.id}
                                                className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                            >
                                                <td className="px-3 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium ${movement.color}`}
                                                    >
                                                        <Icon size={14} />
                                                        {movement.type}
                                                    </span>
                                                </td>

                                                <td className="px-3 py-4 font-medium text-gray-800">
                                                    {movement.description}
                                                </td>

                                                <td className="px-3 py-4 font-medium text-gray-700">
                                                    {movement.quantity}
                                                </td>

                                                <td className="px-3 py-4 text-gray-500">
                                                    {movement.location}
                                                </td>

                                                <td className="px-3 py-4 text-gray-400">
                                                    {movement.date}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <p className="mt-3 text-xs text-gray-400">
                            Datos ilustrativos para la interfaz.
                        </p>
                    </div>

                    {/* Alertas */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <SectionTitle
                            action={
                                <Link
                                    to="/sistema/inventario/reposicion"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900"
                                >
                                    Ver todas
                                    <ArrowUpRight size={16} />
                                </Link>
                            }
                        >
                            Alertas de inventario
                        </SectionTitle>

                        <div className="space-y-5">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex gap-3"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                        <AlertTriangle size={19} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {alert.item}
                                            </p>

                                            <span
                                                className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${alert.color}`}
                                            >
                                                {alert.status}
                                            </span>
                                        </div>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {alert.detail}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link
                            to="/sistema/inventario/reposicion"
                            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Gestionar reposiciones
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

                {/* Estado de almacenes */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <SectionTitle
                        action={
                            <Link
                                to="/sistema/inventario/almacenes"
                                className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900"
                            >
                                Gestionar almacenes
                                <ArrowUpRight size={16} />
                            </Link>
                        }
                    >
                        Estado de almacenes
                    </SectionTitle>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <WarehouseCard
                            name="Almacén principal"
                            location="Área de almacenamiento"
                            products="32 productos"
                            status="Operativo"
                        />

                        <WarehouseCard
                            name="Almacén de materiales"
                            location="Área de materias primas"
                            products="38 materiales"
                            status="Operativo"
                        />

                        <WarehouseCard
                            name="Taller de producción"
                            location="Área de producción"
                            products="18 materiales"
                            status="Operativo"
                        />
                    </div>
                </section>

                {/* Accesos directos */}
                <section>
                    <SectionTitle>Accesos directos</SectionTitle>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {quickLinks.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.title}
                                    to={item.to}
                                    className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                                >
                                    <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
                                        <Icon size={23} />
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="block font-semibold text-gray-800">
                                            {item.title}
                                        </span>

                                        <span className="mt-1 block text-sm text-gray-500">
                                            {item.description}
                                        </span>
                                    </span>

                                    <ArrowRight
                                        size={18}
                                        className="text-gray-400 transition group-hover:text-blue-700"
                                    />
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}

function WarehouseCard({
    name,
    location,
    products,
    status,
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                    <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
                        <Warehouse size={21} />
                    </span>

                    <div>
                        <p className="font-semibold text-gray-800">
                            {name}
                        </p>

                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={13} />
                            {location}
                        </p>
                    </div>
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {status}
                </span>
            </div>

            <div className="mt-4 border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">
                    Existencias registradas
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                    {products}
                </p>
            </div>
        </div>
    );
}
