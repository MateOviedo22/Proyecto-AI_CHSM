import { useState } from 'react';
import { CalendarDays, Plus, Search, ClipboardList } from 'lucide-react';
import { productionPlans as initialPlans } from '../../../data/mockData';

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-700';

export default function Planificacion() {
    const [plans, setPlans] = useState(initialPlans);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('Todos');
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        product: '',
        quantity: '',
        startDate: '',
        dueDate: '',
        responsible: '',
        priority: 'Media',
    });

    const updateForm = (field, value) =>
        setForm((previous) => ({ ...previous, [field]: value }));

    const addPlan = (event) => {
        event.preventDefault();

        if (form.dueDate < form.startDate) {
            alert('La fecha de entrega no puede ser anterior al inicio.');
            return;
        }

        setPlans((previous) => [
            {
                id: `PLAN-${Date.now()}`,
                ...form,
                quantity: Number(form.quantity),
                status: 'Planificada',
            },
            ...previous,
        ]);

        setForm({
            product: '',
            quantity: '',
            startDate: '',
            dueDate: '',
            responsible: '',
            priority: 'Media',
        });

        setShowForm(false);
    };

    const filteredPlans = plans.filter((plan) => {
        const matchesSearch =
            `${plan.id} ${plan.product} ${plan.responsible}`
                .toLowerCase()
                .includes(search.toLowerCase());

        return (
            matchesSearch &&
            (filter === 'Todos' || plan.status === filter)
        );
    });

    const statusStyle = {
        Planificada: 'bg-blue-100 text-blue-800',
        'En proceso': 'bg-yellow-100 text-yellow-800',
        Completada: 'bg-green-100 text-green-800',
        Cancelada: 'bg-red-100 text-red-800',
    };

    return (
        <main className="space-y-6 p-4 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Planificación de producción
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Programa y organiza las órdenes de fabricación.
                    </p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 rounded-lg bg-yellow-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-yellow-800"
                >
                    <Plus size={18} />
                    Nueva planificación
                </button>
            </header>

            {showForm && (
                <form
                    onSubmit={addPlan}
                    className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 md:grid-cols-2 lg:grid-cols-3"
                >
                    <h2 className="font-semibold md:col-span-2 lg:col-span-3">
                        Datos de planificación
                    </h2>

                    <label className="space-y-1 text-sm">
                        <span>Producto</span>
                        <input
                            required
                            className={inputClass}
                            value={form.product}
                            onChange={(e) => updateForm('product', e.target.value)}
                            placeholder="Ej. Bolso Elipse"
                        />
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Cantidad de unidades</span>
                        <input
                            required
                            min="1"
                            type="number"
                            className={inputClass}
                            value={form.quantity}
                            onChange={(e) => updateForm('quantity', e.target.value)}
                        />
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Responsable</span>
                        <input
                            required
                            className={inputClass}
                            value={form.responsible}
                            onChange={(e) => updateForm('responsible', e.target.value)}
                            placeholder="Nombre del responsable"
                        />
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Fecha de inicio</span>
                        <input
                            required
                            type="date"
                            className={inputClass}
                            value={form.startDate}
                            onChange={(e) => updateForm('startDate', e.target.value)}
                        />
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Fecha de entrega</span>
                        <input
                            required
                            type="date"
                            min={form.startDate || undefined}
                            className={inputClass}
                            value={form.dueDate}
                            onChange={(e) => updateForm('dueDate', e.target.value)}
                        />
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Prioridad</span>
                        <select
                            className={inputClass}
                            value={form.priority}
                            onChange={(e) => updateForm('priority', e.target.value)}
                        >
                            <option>Alta</option>
                            <option>Media</option>
                            <option>Baja</option>
                        </select>
                    </label>

                    <div className="flex gap-2 md:col-span-2 lg:col-span-3">
                        <button className="rounded-lg bg-yellow-700 px-4 py-2 text-sm text-white">
                            Guardar planificación
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-lg border px-4 py-2 text-sm"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            <section className="grid gap-4 sm:grid-cols-3">
                {[
                    ['Total de planes', plans.length],
                    ['En proceso', plans.filter((p) => p.status === 'En proceso').length],
                    ['Completados', plans.filter((p) => p.status === 'Completada').length],
                ].map(([label, value]) => (
                    <article key={label} className="rounded-xl border bg-white p-4">
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className="mt-2 text-2xl font-bold">{value}</p>
                    </article>
                ))}
            </section>

            <section className="overflow-hidden rounded-xl border bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <CalendarDays size={19} />
                        Programa de producción
                    </h2>

                    <div className="flex flex-wrap gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                className={`${inputClass} pl-9`}
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <select
                            className={inputClass}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option>Todos</option>
                            <option>Planificada</option>
                            <option>En proceso</option>
                            <option>Completada</option>
                            <option>Cancelada</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                {['Código', 'Producto', 'Cantidad', 'Fechas', 'Responsable', 'Prioridad', 'Estado'].map((heading) => (
                                    <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium">
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filteredPlans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-4 py-3 font-medium">{plan.id}</td>
                                    <td className="px-4 py-3">{plan.product}</td>
                                    <td className="px-4 py-3">{plan.quantity}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {plan.startDate} – {plan.dueDate}
                                    </td>
                                    <td className="px-4 py-3">{plan.responsible}</td>
                                    <td className="px-4 py-3">{plan.priority}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            aria-label={`Estado de ${plan.id}`}
                                            value={plan.status}
                                            onChange={(e) =>
                                                setPlans((previous) =>
                                                    previous.map((item) =>
                                                        item.id === plan.id
                                                            ? { ...item, status: e.target.value }
                                                            : item
                                                    )
                                                )
                                            }
                                            className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[plan.status] || 'bg-gray-100 text-gray-700'}`}
                                        >
                                            {['Planificada', 'En proceso', 'Completada', 'Cancelada'].map((status) => (
                                                <option key={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredPlans.length === 0 && (
                        <p className="p-8 text-center text-sm text-gray-500">
                            <ClipboardList className="mx-auto mb-2" />
                            No se encontraron planificaciones.
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}