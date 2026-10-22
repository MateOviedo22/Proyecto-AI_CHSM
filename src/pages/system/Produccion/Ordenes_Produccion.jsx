
import { useState } from 'react';
import { Plus, Search, ClipboardList, Clock3, CheckCircle2 } from 'lucide-react';

const initialOrders = [
    { id: 'OP-2026-041', product: 'Bolso Elipse', quantity: 12, priority: 'Alta', due: '2026-10-28', responsible: 'Equipo de costura', status: 'En proceso' },
    { id: 'OP-2026-040', product: 'Faja para Dama', quantity: 20, priority: 'Media', due: '2026-10-26', responsible: 'Taller A', status: 'Pendiente' },
    { id: 'OP-2026-039', product: 'Cosmetiquera Neo', quantity: 15, priority: 'Baja', due: '2026-10-24', responsible: 'Taller B', status: 'Completada' },
    { id: 'OP-2026-038', product: 'Bolso Avalon', quantity: 8, priority: 'Alta', due: '2026-10-23', responsible: 'Equipo de ensamblaje', status: 'En proceso' },
];

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

const statusStyle = {
    Pendiente: 'bg-gray-100 text-gray-700',
    'En proceso': 'bg-blue-100 text-blue-700',
    Completada: 'bg-green-100 text-green-700',
    Pausada: 'bg-amber-100 text-amber-800',
};

export default function Ordenes_Produccion() {
    const [orders, setOrders] = useState(initialOrders);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('Todas');
    const [showForm, setShowForm] = useState(false);
    const emptyForm = { product: '', quantity: 1, priority: 'Media', due: '', responsible: '' };
    const [form, setForm] = useState(emptyForm);

    const filtered = orders.filter(o =>
        `${o.id} ${o.product} ${o.responsible}`.toLowerCase().includes(search.toLowerCase()) &&
        (filter === 'Todas' || o.status === filter)
    );

    const updateStatus = (id, status) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    };

    const save = e => {
        e.preventDefault();
        if (!form.product.trim()) return;

        setOrders(prev => {
            const nextNumber = Math.max(0, ...prev.map(o => Number(o.id.split('-').pop()) || 0)) + 1;
            return [{
                ...form,
                id: `OP-2026-${String(nextNumber).padStart(3, '0')}`,
                quantity: Number(form.quantity),
                status: 'Pendiente',
            }, ...prev];
        });

        setShowForm(false);
        setForm(emptyForm);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-amber-700">Producción / Operaciones</p>
                    <h1 className="text-2xl font-bold text-gray-900">Órdenes de producción</h1>
                    <p className="mt-1 text-sm text-gray-500">Planifica, prioriza y da seguimiento a la fabricación.</p>
                </div>
                <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                    <Plus size={18} /> Nueva orden
                </button>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
                <Stat icon={<ClipboardList size={20} />} label="Órdenes registradas" value={orders.length} />
                <Stat icon={<Clock3 size={20} />} label="En proceso" value={orders.filter(o => o.status === 'En proceso').length} />
                <Stat icon={<CheckCircle2 size={20} />} label="Unidades planificadas" value={orders.reduce((a, o) => a + Number(o.quantity), 0)} />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar orden, producto o responsable..." className={`${inputClass} pl-10`} />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)} className={inputClass + ' sm:w-48'}>
                    <option>Todas</option><option>Pendiente</option><option>En proceso</option><option>Completada</option><option>Pausada</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Orden</th><th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3">Cantidad</th><th className="px-4 py-3">Prioridad</th>
                                <th className="px-4 py-3">Fecha prevista</th><th className="px-4 py-3">Responsable</th>
                                <th className="px-4 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(o => (
                                <tr key={o.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 font-semibold text-amber-700">{o.id}</td>
                                    <td className="px-4 py-4 font-medium text-gray-900">{o.product}</td>
                                    <td className="px-4 py-4">{o.quantity} unidades</td>
                                    <td className="px-4 py-4">
                                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${o.priority === 'Alta' ? 'bg-red-100 text-red-700' : o.priority === 'Media' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>{o.priority}</span>
                                    </td>
                                    <td className="px-4 py-4">{o.due || 'Sin definir'}</td>
                                    <td className="px-4 py-4 text-gray-600">{o.responsible || 'Sin asignar'}</td>
                                    <td className="px-4 py-4">
                                        <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className={`rounded-full border-0 px-2.5 py-1.5 text-xs font-medium ${statusStyle[o.status]}`} aria-label={`Estado de ${o.id}`}>
                                            <option>Pendiente</option><option>En proceso</option><option>Completada</option><option>Pausada</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <p className="p-8 text-center text-sm text-gray-500">No se encontraron órdenes.</p>}
            </div>

            {showForm && (
                <Modal title="Crear orden de producción" onClose={() => setShowForm(false)}>
                    <form onSubmit={save} className="space-y-4">
                        <Field label="Producto">
                            <input required value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className={inputClass} placeholder="Nombre del producto" />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Cantidad">
                                <input type="number" min="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
                            </Field>
                            <Field label="Prioridad">
                                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className={inputClass}>
                                    <option>Alta</option><option>Media</option><option>Baja</option>
                                </select>
                            </Field>
                            <Field label="Fecha prevista">
                                <input type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} className={inputClass} />
                            </Field>
                            <Field label="Responsable">
                                <input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} className={inputClass} placeholder="Equipo o persona" />
                            </Field>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
                            <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">Crear orden</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

function Stat({ icon, label, value }) {
    return <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="rounded-lg bg-amber-50 p-3 text-amber-700">{icon}</div><div><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-bold">{value}</p></div></div>;
}

function Field({ label, children }) {
    return <label className="block space-y-1.5 text-sm font-medium text-gray-700">{label}{children}</label>;
}

function Modal({ title, onClose, children }) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900">×</button></div>{children}</div></div>;
}
