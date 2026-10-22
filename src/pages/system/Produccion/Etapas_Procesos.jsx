
import { useState } from 'react';
import {
    Plus, Search, Pencil, CheckCircle2, Clock3, Workflow
} from 'lucide-react';

const initialStages = [
    { id: 1, name: 'Diseño y patronaje', description: 'Preparación del diseño y patrones de corte', order: 1, duration: 45, responsible: 'Diseño', active: true },
    { id: 2, name: 'Corte de cuero', description: 'Corte de piezas según ficha técnica', order: 2, duration: 35, responsible: 'Corte', active: true },
    { id: 3, name: 'Preparación y costura', description: 'Unión de piezas y costuras principales', order: 3, duration: 90, responsible: 'Costura', active: true },
    { id: 4, name: 'Ensamblaje', description: 'Montaje de herrajes y componentes', order: 4, duration: 55, responsible: 'Ensamblaje', active: true },
    { id: 5, name: 'Control de calidad', description: 'Inspección final del producto', order: 5, duration: 20, responsible: 'Calidad', active: true },
];

const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

export default function Etapas_Procesos() {
    const [stages, setStages] = useState(initialStages);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const emptyForm = {
        name: '', description: '', duration: 30, responsible: ''
    };
    const [form, setForm] = useState(emptyForm);

    const filtered = stages
        .filter(s =>
            `${s.name} ${s.description} ${s.responsible}`
                .toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => a.order - b.order);

    const openNew = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = stage => {
        setEditing(stage);
        setForm({
            name: stage.name,
            description: stage.description,
            duration: stage.duration,
            responsible: stage.responsible,
        });
        setShowForm(true);
    };

    const save = e => {
        e.preventDefault();
        if (!form.name.trim()) return;

        if (editing) {
            setStages(prev => prev.map(s =>
                s.id === editing.id
                    ? { ...s, ...form, duration: Number(form.duration) }
                    : s
            ));
        } else {
            setStages(prev => [
                ...prev,
                {
                    ...form,
                    id: Date.now(),
                    order: Math.max(0, ...prev.map(s => s.order)) + 1,
                    duration: Number(form.duration),
                    active: true,
                },
            ]);
        }
        setShowForm(false);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-amber-700">
                        Producción / Configuración
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Etapas y procesos
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra las fases del proceso de fabricación.
                    </p>
                </div>
                <button onClick={openNew}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                    <Plus size={18} /> Nueva etapa
                </button>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Etapas configuradas" value={stages.length} icon={<Workflow size={20} />} />
                <Stat label="Etapas activas" value={stages.filter(s => s.active).length} icon={<CheckCircle2 size={20} />} />
                <Stat label="Tiempo estándar total" value={`${stages.filter(s => s.active).reduce((sum, s) => sum + Number(s.duration), 0)} min`} icon={<Clock3 size={20} />} />
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative mb-4 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar etapa o responsable..."
                        className={`${inputClass} pl-10`} />
                </div>

                <div className="space-y-3">
                    {filtered.map(stage => (
                        <article key={stage.id}
                            className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 font-bold text-amber-700">
                                {stage.order}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="font-semibold text-gray-900">{stage.name}</h2>
                                    <span className={`rounded-full px-2 py-0.5 text-xs ${stage.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {stage.active ? 'Activa' : 'Inactiva'}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">{stage.description}</p>
                                <p className="mt-2 text-xs text-gray-500">
                                    Responsable: {stage.responsible || 'Sin asignar'} · {stage.duration} min estimados
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setStages(prev => prev.map(s => s.id === stage.id ? { ...s, active: !s.active } : s))}
                                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                                    {stage.active ? 'Desactivar' : 'Activar'}
                                </button>
                                <button onClick={() => openEdit(stage)}
                                    className="rounded-lg p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-700"
                                    aria-label={`Editar ${stage.name}`}>
                                    <Pencil size={17} />
                                </button>
                            </div>
                        </article>
                    ))}
                    {filtered.length === 0 && (
                        <p className="py-8 text-center text-sm text-gray-500">
                            No se encontraron etapas.
                        </p>
                    )}
                </div>
            </section>

            {showForm && (
                <Modal title={editing ? 'Editar etapa' : 'Nueva etapa'} onClose={() => setShowForm(false)}>
                    <form onSubmit={save} className="space-y-4">
                        <Field label="Nombre de la etapa">
                            <input required value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className={inputClass} placeholder="Ej. Acabado" />
                        </Field>
                        <Field label="Descripción">
                            <textarea value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className={inputClass} rows="3" />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Tiempo estimado (minutos)">
                                <input type="number" min="1" required value={form.duration}
                                    onChange={e => setForm({ ...form, duration: e.target.value })}
                                    className={inputClass} />
                            </Field>
                            <Field label="Responsable">
                                <input value={form.responsible}
                                    onChange={e => setForm({ ...form, responsible: e.target.value })}
                                    className={inputClass} placeholder="Área o puesto" />
                            </Field>
                        </div>
                        <FormActions onCancel={() => setShowForm(false)} />
                    </form>
                </Modal>
            )}
        </div>
    );
}

function Stat({ label, value, icon }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-700">{icon}</div>
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

function FormActions({ onCancel }) {
    return (
        <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
            <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">Guardar</button>
        </div>
    );
}
