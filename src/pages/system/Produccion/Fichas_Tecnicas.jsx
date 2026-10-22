
import { useState } from 'react';
import { Plus, Search, FileText, Clock3, Layers3, Eye } from 'lucide-react';

const initialCards = [
    { id: 1, code: 'FT-BOL-001', product: 'Bolso Elipse', version: '1.2', category: 'Bolsos', time: 210, materials: 6, status: 'Vigente', notes: 'Bolso de uso diario con cierre superior y correa ajustable.' },
    { id: 2, code: 'FT-ACC-002', product: 'Faja para Dama', version: '1.0', category: 'Accesorios', time: 95, materials: 4, status: 'Vigente', notes: 'Faja de cuero con hebilla metálica.' },
    { id: 3, code: 'FT-ACC-003', product: 'Cosmetiquera Neo', version: '1.1', category: 'Accesorios', time: 80, materials: 5, status: 'En revisión', notes: 'Estuche con forro interior y cierre.' },
];

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

export default function Fichas_Tecnicas() {
    const [cards, setCards] = useState(initialCards);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Todas');
    const [modal, setModal] = useState(null);
    const emptyForm = { product: '', category: 'Bolsos', time: 60, materials: 3, notes: '' };
    const [form, setForm] = useState(emptyForm);

    const filtered = cards.filter(c =>
        `${c.product} ${c.code} ${c.category}`.toLowerCase().includes(search.toLowerCase()) &&
        (status === 'Todas' || c.status === status)
    );

    const save = e => {
        e.preventDefault();
        if (!form.product.trim()) return;
        setCards(prev => [
            ...prev,
            {
                ...form,
                id: Date.now(),
                code: `FT-NUE-${String(prev.length + 1).padStart(3, '0')}`,
                version: '1.0',
                time: Number(form.time),
                materials: Number(form.materials),
                status: 'Vigente',
            },
        ]);
        setModal(null);
        setForm(emptyForm);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-amber-700">Producción / Configuración</p>
                    <h1 className="text-2xl font-bold text-gray-900">Fichas técnicas</h1>
                    <p className="mt-1 text-sm text-gray-500">Especificaciones y recursos requeridos por producto.</p>
                </div>
                <button onClick={() => setModal('new')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                    <Plus size={18} /> Nueva ficha
                </button>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
                <Stat icon={<FileText size={20} />} label="Fichas registradas" value={cards.length} />
                <Stat icon={<Layers3 size={20} />} label="Fichas vigentes" value={cards.filter(c => c.status === 'Vigente').length} />
                <Stat icon={<Clock3 size={20} />} label="Tiempo promedio" value={`${Math.round(cards.reduce((a, c) => a + c.time, 0) / (cards.length || 1))} min`} />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por producto o código..." className={`${inputClass} pl-10`} />
                </div>
                <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass + ' sm:w-48'}>
                    <option>Todas</option><option>Vigente</option><option>En revisión</option>
                </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map(card => (
                    <article key={card.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><FileText size={22} /></div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${card.status === 'Vigente' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>{card.status}</span>
                        </div>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">{card.code} · v{card.version}</p>
                        <h2 className="mt-1 text-lg font-bold text-gray-900">{card.product}</h2>
                        <p className="mt-1 text-sm text-gray-500">{card.category}</p>
                        <p className="mt-3 text-sm text-gray-600">{card.notes || 'Sin observaciones registradas.'}</p>
                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                            <div><p className="text-xs text-gray-500">Tiempo estándar</p><p className="mt-1 font-semibold">{card.time} min</p></div>
                            <div><p className="text-xs text-gray-500">Materiales</p><p className="mt-1 font-semibold">{card.materials} tipos</p></div>
                        </div>
                        <button onClick={() => setModal(card)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800">
                            <Eye size={16} /> Ver detalles
                        </button>
                    </article>
                ))}
            </div>

            {filtered.length === 0 && <p className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">No se encontraron fichas técnicas.</p>}

            {modal === 'new' && (
                <Modal title="Registrar ficha técnica" onClose={() => setModal(null)}>
                    <form onSubmit={save} className="space-y-4">
                        <Field label="Nombre del producto">
                            <input required value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} className={inputClass} placeholder="Ej. Bolso artesanal" />
                        </Field>
                        <Field label="Categoría">
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
                                <option>Bolsos</option><option>Accesorios</option><option>Billeteras</option><option>Otros</option>
                            </select>
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Tiempo estándar (min)">
                                <input type="number" min="1" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className={inputClass} />
                            </Field>
                            <Field label="Tipos de materiales">
                                <input type="number" min="1" required value={form.materials} onChange={e => setForm({ ...form, materials: e.target.value })} className={inputClass} />
                            </Field>
                        </div>
                        <Field label="Descripción">
                            <textarea rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputClass} placeholder="Especificaciones principales" />
                        </Field>
                        <Actions onCancel={() => setModal(null)} />
                    </form>
                </Modal>
            )}

            {modal && modal !== 'new' && (
                <Modal title="Detalle de ficha técnica" onClose={() => setModal(null)}>
                    <div className="space-y-3 text-sm">
                        <p><span className="text-gray-500">Código:</span> <strong>{modal.code}</strong></p>
                        <p><span className="text-gray-500">Producto:</span> <strong>{modal.product}</strong></p>
                        <p><span className="text-gray-500">Categoría:</span> {modal.category}</p>
                        <p><span className="text-gray-500">Versión:</span> {modal.version}</p>
                        <p><span className="text-gray-500">Tiempo estándar:</span> {modal.time} minutos</p>
                        <p><span className="text-gray-500">Materiales requeridos:</span> {modal.materials} tipos</p>
                        <p><span className="text-gray-500">Observaciones:</span> {modal.notes || 'Sin observaciones'}</p>
                        <button onClick={() => setModal(null)} className="rounded-lg bg-amber-500 px-4 py-2 font-semibold text-white">Cerrar</button>
                    </div>
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

function Actions({ onCancel }) {
    return <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">Guardar</button></div>;
}
