
import { useState } from 'react';
import {
    Factory, ClipboardList, Clock3, CheckCircle2,
    AlertTriangle, ArrowRight, Plus
} from 'lucide-react';

const initialOrders = [
    { id: 'OP-041', product: 'Bolso Elipse', quantity: 12, stage: 'Costura', progress: 65, due: '2026-10-28', status: 'En proceso' },
    { id: 'OP-040', product: 'Faja para Dama', quantity: 20, stage: 'Corte', progress: 25, due: '2026-10-26', status: 'En proceso' },
    { id: 'OP-039', product: 'Cosmetiquera Neo', quantity: 15, stage: 'Control de calidad', progress: 90, due: '2026-10-24', status: 'En revisión' },
    { id: 'OP-038', product: 'Bolso Avalon', quantity: 8, stage: 'Ensamblaje', progress: 50, due: '2026-10-23', status: 'En proceso' },
];

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

const stages = [
    'Diseño y patronaje',
    'Corte',
    'Costura',
    'Ensamblaje',
    'Control de calidad',
];

export default function PanelProduccion() {
    const [orders, setOrders] = useState(initialOrders);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ product: '', quantity: 1, due: '' });
    const [filter, setFilter] = useState('Todas');

    const today = new Date().toISOString().slice(0, 10);
    const active = orders.filter(o => o.progress < 100);
    const completed = orders.filter(o => o.progress >= 100).length;
    const delayed = active.filter(o => o.due && o.due < today).length;

    const visible = orders.filter(o =>
        filter === 'Todas' || o.status === filter
    );

    const createOrder = e => {
        e.preventDefault();
        if (!form.product.trim()) return;

        setOrders(prev => {
            const nextNumber = Math.max(
                40,
                ...prev.map(o => Number(o.id.split('-').pop()) || 0)
            ) + 1;

            return [{
                ...form,
                id: `OP-${String(nextNumber).padStart(3, '0')}`,
                quantity: Number(form.quantity),
                stage: 'Diseño y patronaje',
                progress: 0,
                status: 'En proceso',
            }, ...prev];
        });

        setShowForm(false);
        setForm({ product: '', quantity: 1, due: '' });
    };

    const advance = id => {
        setOrders(prev => prev.map(o => {
            if (o.id !== id || o.progress >= 100) return o;

            const progress = Math.min(100, o.progress + 10);

            return {
                ...o,
                progress,
                status: progress >= 100 ? 'Completada' : 'En proceso',
            };
        }));
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-amber-700">Sunshine / Producción</p>
                    <h1 className="text-2xl font-bold text-gray-900">Panel de producción</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Resumen del avance de fabricación y las órdenes activas.
                    </p>
                </div>
                <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                    <Plus size={18} /> Nueva orden
                </button>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon={<ClipboardList size={20} />} label="Órdenes activas" value={active.length} />
                <Stat icon={<Factory size={20} />} label="Unidades planificadas" value={orders.reduce((a, o) => a + Number(o.quantity), 0)} />
                <Stat icon={<CheckCircle2 size={20} />} label="Órdenes completadas" value={completed} />
                <Stat icon={<AlertTriangle size={20} />} label="Órdenes atrasadas" value={delayed} warning={delayed > 0} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="font-bold text-gray-900">Seguimiento de producción</h2>
                            <p className="mt-1 text-sm text-gray-500">Avance estimado por orden</p>
                        </div>
                        <select value={filter} onChange={e => setFilter(e.target.value)} className={inputClass + ' sm:w-44'}>
                            <option>Todas</option><option>En proceso</option><option>En revisión</option><option>Completada</option>
                        </select>
                    </div>

                    <div className="space-y-5">
                        {visible.map(o => (
                            <article key={o.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-semibold text-amber-700">{o.id}</p>
                                        <h3 className="mt-1 font-semibold text-gray-900">{o.product}</h3>
                                        <p className="mt-1 text-xs text-gray-500">{o.quantity} unidades · Etapa: {o.stage}</p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{o.progress}%</span>
                                </div>

                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${o.progress}%` }} />
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                                    <span>Entrega: {o.due || 'Sin fecha'}</span>
                                    <button disabled={o.progress >= 100} onClick={() => advance(o.id)} className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-800 disabled:cursor-not-allowed disabled:text-gray-400">
                                        {o.progress >= 100 ? 'Completada' : 'Avanzar'}
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    {visible.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No hay órdenes en este estado.</p>}
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h2 className="font-bold text-gray-900">Resumen operativo</h2>
                        <p className="mt-1 text-sm text-gray-500">Distribución por etapa actual</p>
                    </div>

                    <div className="space-y-4">
                        {stages.map(stage => {
                            const count = orders.filter(o =>
                                o.stage === stage && o.progress < 100
                            ).length;

                            const percentage = active.length
                                ? Math.round(count / active.length * 100)
                                : 0;

                            return (
                                <div key={stage}>
                                    <div className="mb-1.5 flex justify-between gap-3 text-sm">
                                        <span className="text-gray-600">{stage}</span>
                                        <span className="font-semibold">{count}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100">
                                        <div className="h-2 rounded-full bg-amber-300 transition-all" style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 rounded-lg bg-amber-50 p-4">
                        <div className="flex items-start gap-2 text-amber-800">
                            <Clock3 size={18} className="mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold">Recomendación</p>
                                <p className="mt-1 text-sm">
                                    Revisa diariamente las órdenes próximas a entrega y actualiza el avance de cada etapa.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {showForm && (
                <Modal title="Nueva orden de producción" onClose={() => setShowForm(false)}>
                    <form onSubmit={createOrder} className="space-y-4">
                        <Field label="Producto">
                            <input required value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className={inputClass} placeholder="Nombre del producto" />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Cantidad">
                                <input type="number" min="1" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
                            </Field>
                            <Field label="Fecha de entrega">
                                <input type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} className={inputClass} />
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

function Stat({ icon, label, value, warning }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className={`rounded-lg p-3 ${warning ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{icon}</div>
            <div><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div>
        </div>
    );
}

function Field({ label, children }) {
    return <label className="block space-y-1.5 text-sm font-medium text-gray-700">{label}{children}</label>;
}

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900" aria-label="Cerrar">×</button>
                </div>
                {children}
            </div>
        </div>
    );
}
