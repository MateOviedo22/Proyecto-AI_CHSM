//Colocar Consumo de materiales, mermas y desperdicios,
import { useState } from 'react';
import { Plus, Search, Package, AlertTriangle, Boxes } from 'lucide-react';

const initialMaterials = [
    { id: 1, code: 'MAT-CUE-001', name: 'Cuero tratado café', category: 'Cuero', unit: 'm²', stock: 45, minimum: 50, cost: 380, supplier: 'Curtidos del Norte' },
    { id: 2, code: 'MAT-HER-002', name: 'Botones de presión 25 mm', category: 'Herrajes', unit: 'unidad', stock: 100, minimum: 200, cost: 8.5, supplier: 'Suministros León' },
    { id: 3, code: 'MAT-HIL-003', name: 'Carrete de hilo negro', category: 'Costura', unit: 'carrete', stock: 5, minimum: 15, cost: 95, supplier: 'Textiles Centro' },
    { id: 4, code: 'MAT-CIE-004', name: 'Cierre metálico 30 cm', category: 'Herrajes', unit: 'unidad', stock: 120, minimum: 40, cost: 22, supplier: 'Suministros León' },
    { id: 5, code: 'MAT-FOR-005', name: 'Forro textil beige', category: 'Textil', unit: 'm', stock: 85, minimum: 25, cost: 65, supplier: 'Textiles Centro' },
];

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';
const money = n => new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO', maximumFractionDigits: 2 }).format(n);

export default function Materiales() {
    const [materials, setMaterials] = useState(initialMaterials);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Todas');
    const [showForm, setShowForm] = useState(false);
    const emptyForm = { name: '', category: 'Cuero', unit: 'unidad', stock: 0, minimum: 0, cost: 0, supplier: '' };
    const [form, setForm] = useState(emptyForm);

    const low = materials.filter(m => Number(m.stock) <= Number(m.minimum));
    const filtered = materials.filter(m =>
        `${m.name} ${m.code} ${m.supplier}`.toLowerCase().includes(search.toLowerCase()) &&
        (category === 'Todas' || m.category === category)
    );

    const save = e => {
        e.preventDefault();
        if (!form.name.trim()) return;

        setMaterials(prev => [
            ...prev,
            {
                ...form,
                id: Date.now(),
                code: `MAT-NUE-${String(prev.length + 1).padStart(3, '0')}`,
                stock: Number(form.stock),
                minimum: Number(form.minimum),
                cost: Number(form.cost),
            },
        ]);
        setShowForm(false);
        setForm(emptyForm);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-amber-700">Producción / Inventario</p>
                    <h1 className="text-2xl font-bold text-gray-900">Materiales</h1>
                    <p className="mt-1 text-sm text-gray-500">Controla materias primas, existencias y niveles mínimos.</p>
                </div>
                <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                    <Plus size={18} /> Agregar material
                </button>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
                <Stat icon={<Boxes size={20} />} label="Tipos de materiales" value={materials.length} />
                <Stat icon={<AlertTriangle size={20} />} label="Con stock bajo" value={low.length} warning={low.length > 0} />
                <Stat icon={<Package size={20} />} label="Valor estimado" value={money(materials.reduce((sum, m) => sum + m.stock * m.cost, 0))} />
            </div>

            {low.length > 0 && (
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Atención: materiales bajo el mínimo</p>
                        <p className="mt-1 text-sm">{low.map(m => m.name).join(', ')}. Revisa si es necesario gestionar una compra.</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar material, código o proveedor..." className={`${inputClass} pl-10`} />
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass + ' sm:w-48'}>
                    <option>Todas</option><option>Cuero</option><option>Herrajes</option><option>Costura</option><option>Textil</option><option>Empaque</option><option>Otro</option>
                </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Material</th><th className="px-4 py-3">Categoría</th>
                                <th className="px-4 py-3">Existencia</th><th className="px-4 py-3">Mínimo</th>
                                <th className="px-4 py-3">Costo unitario</th><th className="px-4 py-3">Proveedor</th>
                                <th className="px-4 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(m => {
                                const isLow = Number(m.stock) <= Number(m.minimum);
                                return (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4"><p className="font-semibold text-gray-900">{m.name}</p><p className="mt-1 text-xs text-gray-400">{m.code}</p></td>
                                        <td className="px-4 py-4 text-gray-600">{m.category}</td>
                                        <td className="px-4 py-4 font-semibold">{m.stock} {m.unit}</td>
                                        <td className="px-4 py-4 text-gray-600">{m.minimum} {m.unit}</td>
                                        <td className="px-4 py-4">{money(m.cost)}</td>
                                        <td className="px-4 py-4 text-gray-600">{m.supplier || 'Sin proveedor'}</td>
                                        <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{isLow ? 'Stock bajo' : 'Disponible'}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <p className="p-8 text-center text-sm text-gray-500">No se encontraron materiales.</p>}
            </div>

            {showForm && (
                <Modal title="Agregar material" onClose={() => setShowForm(false)}>
                    <form onSubmit={save} className="space-y-4">
                        <Field label="Nombre del material">
                            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Ej. Cuero natural" />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Categoría">
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
                                    <option>Cuero</option><option>Herrajes</option><option>Costura</option><option>Textil</option><option>Empaque</option><option>Otro</option>
                                </select>
                            </Field>
                            <Field label="Unidad de medida">
                                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inputClass}>
                                    <option>unidad</option><option>m²</option><option>m</option><option>carrete</option><option>kg</option><option>litro</option>
                                </select>
                            </Field>
                            <Field label="Existencia actual">
                                <input type="number" min="0" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className={inputClass} />
                            </Field>
                            <Field label="Stock mínimo">
                                <input type="number" min="0" required value={form.minimum} onChange={e => setForm({ ...form, minimum: e.target.value })} className={inputClass} />
                            </Field>
                            <Field label="Costo unitario (C$)">
                                <input type="number" min="0" step="0.01" required value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className={inputClass} />
                            </Field>
                            <Field label="Proveedor">
                                <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className={inputClass} placeholder="Nombre del proveedor" />
                            </Field>
                        </div>
                        <Actions onCancel={() => setShowForm(false)} label="Guardar material" />
                    </form>
                </Modal>
            )}
        </div>
    );
}

function Stat({ icon, label, value, warning }) {
    return <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className={`rounded-lg p-3 ${warning ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{icon}</div><div className="min-w-0"><p className="text-sm text-gray-500">{label}</p><p className="truncate text-xl font-bold text-gray-900">{value}</p></div></div>;
}

function Field({ label, children }) {
    return <label className="block space-y-1.5 text-sm font-medium text-gray-700">{label}{children}</label>;
}

function Modal({ title, onClose, children }) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900">×</button></div>{children}</div></div>;
}

function Actions({ onCancel, label = 'Guardar' }) {
    return <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button><button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">{label}</button></div>;
}
