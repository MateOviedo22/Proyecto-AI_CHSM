
import { Link } from 'react-router-dom';
import {
    Users,
    UserPlus,
    TrendingUp,
    Target,
    ArrowUpRight,
    ArrowRight,
    Clock3,
    Phone,
    CalendarDays,
    ShoppingBag,
    CircleDollarSign,
} from 'lucide-react';

const stats = [
    {
        label: 'Total de clientes',
        value: '248',
        detail: '+12 este mes',
        icon: Users,
        color: 'bg-blue-50 text-blue-600',
    },
    {
        label: 'Clientes nuevos',
        value: '18',
        detail: 'Durante este mes',
        icon: UserPlus,
        color: 'bg-emerald-50 text-emerald-600',
    },
    {
        label: 'Oportunidades activas',
        value: '32',
        detail: '8 requieren seguimiento',
        icon: Target,
        color: 'bg-amber-50 text-amber-600',
    },
    {
        label: 'Conversión comercial',
        value: '24%',
        detail: 'Indicador de demostración',
        icon: TrendingUp,
        color: 'bg-purple-50 text-purple-600',
    },
];

const opportunities = [
    {
        client: 'Hotel Las Flores',
        description: 'Pedido de bolsos artesanales',
        amount: 'C$ 12,500',
        stage: 'Propuesta',
        color: 'bg-blue-50 text-blue-700',
    },
    {
        client: 'María González',
        description: 'Compra para regalo corporativo',
        amount: 'C$ 4,800',
        stage: 'Contactado',
        color: 'bg-amber-50 text-amber-700',
    },
    {
        client: 'Tienda Artesanal Granada',
        description: 'Solicitud de catálogo mayorista',
        amount: 'C$ 18,000',
        stage: 'Calificado',
        color: 'bg-emerald-50 text-emerald-700',
    },
];

const activities = [
    {
        title: 'Contactar a Hotel Las Flores',
        subtitle: 'Dar seguimiento a la cotización',
        time: 'Hoy · 10:00 a. m.',
        icon: Phone,
    },
    {
        title: 'Reunión con cliente potencial',
        subtitle: 'Presentación de productos',
        time: 'Hoy · 2:00 p. m.',
        icon: CalendarDays,
    },
    {
        title: 'Revisar historial de compra',
        subtitle: 'Cliente: María González',
        time: 'Mañana',
        icon: ShoppingBag,
    },
];

const quickLinks = [
    {
        title: 'Gestionar clientes',
        description: 'Consultar y registrar clientes.',
        to: '/sistema/crm/clientes',
        icon: Users,
    },
    {
        title: 'Historial CRM',
        description: 'Revisar interacciones y seguimientos.',
        to: '/sistema/crm/historial',
        icon: Clock3,
    },
    {
        title: 'Segmentación',
        description: 'Explorar grupos de clientes.',
        to: '/crm/segmentacion',
        icon: Target,
    },
];

function SectionTitle({ children, action }) {
    return (
        <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-800">{children}</h2>
            {action}
        </div>
    );
}

export default function PanelCRM() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-medium text-emerald-700">
                            Sunshine Handmade / CRM
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                            Panel CRM
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Gestiona las relaciones comerciales y el seguimiento de tus clientes.
                        </p>
                    </div>

                    <Link
                        to="/sistema/crm/clientes"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                        <UserPlus size={18} />
                        Registrar cliente
                    </Link>
                </header>

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
                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                        <p className="mt-3 text-3xl font-bold text-gray-900">
                                            {stat.value}
                                        </p>
                                    </div>
                                    <span className={`rounded-xl p-3 ${stat.color}`}>
                                        <Icon size={22} />
                                    </span>
                                </div>
                                <p className="mt-4 text-xs text-gray-500">{stat.detail}</p>
                            </article>
                        );
                    })}
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
                        <SectionTitle
                            action={
                                <Link
                                    to="/sistema/crm/historial"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-900"
                                >
                                    Ver historial <ArrowUpRight size={16} />
                                </Link>
                            }
                        >
                            Oportunidades comerciales
                        </SectionTitle>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[520px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                                        <th className="px-3 py-3 font-medium">Cliente</th>
                                        <th className="px-3 py-3 font-medium">Oportunidad</th>
                                        <th className="px-3 py-3 font-medium">Valor estimado</th>
                                        <th className="px-3 py-3 font-medium">Etapa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {opportunities.map((item) => (
                                        <tr
                                            key={item.client}
                                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                        >
                                            <td className="px-3 py-4 font-medium text-gray-800">
                                                {item.client}
                                            </td>
                                            <td className="px-3 py-4 text-gray-500">
                                                {item.description}
                                            </td>
                                            <td className="px-3 py-4 font-medium text-gray-700">
                                                {item.amount}
                                            </td>
                                            <td className="px-3 py-4">
                                                <span
                                                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${item.color}`}
                                                >
                                                    {item.stage}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="mt-3 text-xs text-gray-400">
                            Datos ilustrativos para la interfaz.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <SectionTitle>Seguimientos pendientes</SectionTitle>

                        <div className="space-y-5">
                            {activities.map((activity) => {
                                const Icon = activity.icon;

                                return (
                                    <div key={activity.title} className="flex gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            <Icon size={19} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {activity.title}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {activity.subtitle}
                                            </p>
                                            <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                                                <Clock3 size={13} />
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <Link
                            to="/sistema/crm/historial"
                            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Consultar actividades <ArrowRight size={16} />
                        </Link>
                    </div>
                </section>

                <section>
                    <SectionTitle>Accesos directos</SectionTitle>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {quickLinks.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.title}
                                    to={item.to}
                                    className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                                >
                                    <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
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
                                        className="text-gray-400 transition group-hover:text-emerald-700"
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
