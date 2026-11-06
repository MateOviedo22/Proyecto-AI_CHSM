import { useMemo, useState } from 'react';
import { Plus, Search, FileText, Clock3, Layers3, Eye, Trash2, Printer } from 'lucide-react';
import { api } from '../../../services/api';
import { useApiList } from '../../../hooks/useApiList';
import { useAuth } from '../../../context/AuthContext';
import { puede } from '../../../utils/permisos';
import { Notice, Table, Cell, money, num, useAction, imprimir } from '../../../components/erp/Erp';

const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';
const PARTES = ['Cuerpo', 'Asa', 'Forro', 'Costura', 'Herrajes', 'Accesorio', 'Empaque', 'General'];
const emptyForm = { productoId: '', nombre: '', versionFicha: '1.0', tiempoMinutos: 60, notas: '', materiales: [], componentes: [] };
const statusTone = { Vigente: 'bg-green-100 text-green-700', Borrador: 'bg-yellow-100 text-yellow-800', Obsoleta: 'bg-gray-100 text-gray-600' };

// FRQ-0008: ficha técnica (lista de materiales multinivel) por producto, con partes, mermas y subensambles.
export default function Fichas_Tecnicas() {
    const { user } = useAuth();
    const editable = puede(user, 'produccion', 'escribir');
    const [cards, reload] = useApiList('/fichas-tecnicas');
    const [productos] = useApiList('/recursos/productos');
    const [materiales] = useApiList('/recursos/materiales');
    const { busy, notice, run, setNotice } = useAction(reload);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Todas');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [explosion, setExplosion] = useState(null);

    const filtered = cards.filter(c =>
        `${c.producto} ${c.codigo} ${c.nombre}`.toLowerCase().includes(search.toLowerCase()) &&
        (status === 'Todas' || c.estado === status)
    );
    const matById = useMemo(() => Object.fromEntries(materiales.map(m => [m.id, m])), [materiales]);

    const openNew = () => { setForm(emptyForm); setModal('form'); setNotice(null); };
    const openEdit = card => { setForm({ ...card, materiales: card.materiales.map(m => ({ ...m })), componentes: card.componentes.map(c => ({ ...c })) }); setModal('form'); };
    const openDetail = async card => {
        setModal(card); setExplosion(null);
        try { setExplosion((await api(`/fichas-tecnicas/${card.id}/explosion?cantidad=1`)).data); } catch (e) { setExplosion({ error: e.message }); }
    };
    const setLine = (kind, i, key, value) => setForm(f => ({ ...f, [kind]: f[kind].map((l, j) => j === i ? { ...l, [key]: value } : l) }));
    const addLine = kind => setForm(f => ({ ...f, [kind]: [...f[kind], kind === 'materiales' ? { materialId: '', cantidad: '', mermaPct: 0, parte: 'Cuerpo' } : { productoId: '', cantidad: 1, parte: 'Accesorio' }] }));
    const removeLine = (kind, i) => setForm(f => ({ ...f, [kind]: f[kind].filter((_, j) => j !== i) }));

    const save = async e => {
        e.preventDefault();
        const body = { ...form, productoId: Number(form.productoId), tiempoMinutos: Number(form.tiempoMinutos),
            materiales: form.materiales.map(m => ({ materialId: Number(m.materialId), cantidad: Number(m.cantidad), mermaPct: Number(m.mermaPct || 0), parte: m.parte })),
            componentes: form.componentes.map(c => ({ productoId: Number(c.productoId), cantidad: Number(c.cantidad), parte: c.parte })) };
        const ok = form.id ? await run(`/fichas-tecnicas/${form.id}`, { method: 'PUT', body }, 'Ficha actualizada.') : await run('/fichas-tecnicas', { body }, 'Ficha registrada como borrador.');
        if (ok) setModal(null);
    };
    const cambiarEstado = async (card, estado) => { if (await run(`/fichas-tecnicas/${card.id}/estado`, { method: 'PATCH', body: { estado } }, `Ficha marcada como ${estado.toLowerCase()}.`)) setModal(null); };
    const nuevaVersion = async card => { const r = await run(`/fichas-tecnicas/${card.id}/nueva-version`, {}, 'Se creó una nueva versión en borrador.'); if (r) openEdit(r); };

    return (
        <div className="space-y-6 p-4 md:p-6 print:p-0">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                <div>
                    <p className="text-sm font-medium text-amber-700">Producción / Configuración</p>
                    <h1 className="text-2xl font-bold text-gray-900">Fichas técnicas</h1>
                    <p className="mt-1 text-sm text-gray-500">Lista de materiales (BOM) por producto: partes, consumos, mermas y componentes.</p>
                </div>
                {editable && <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                    <Plus size={18} /> Nueva ficha
                </button>}
            </header>
            <Notice notice={notice} />

            <div className="grid gap-4 sm:grid-cols-3 print:hidden">
                <Stat icon={<FileText size={20} />} label="Fichas registradas" value={cards.length} />
                <Stat icon={<Layers3 size={20} />} label="Fichas vigentes" value={cards.filter(c => c.estado === 'Vigente').length} />
                <Stat icon={<Clock3 size={20} />} label="Tiempo promedio" value={`${Math.round(cards.reduce((a, c) => a + c.tiempoMinutos, 0) / (cards.length || 1))} min`} />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row print:hidden">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por producto o código..." className={`${inputClass} pl-10`} />
                </div>
                <select value={status} onChange={e => setStatus(e.target.value)} className={inputClass + ' sm:w-48'}>
                    <option>Todas</option><option>Vigente</option><option>Borrador</option><option>Obsoleta</option>
                </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 print:hidden">
                {filtered.map(card => (
                    <article key={card.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><FileText size={22} /></div>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone[card.estado]}`}>{card.estado}</span>
                        </div>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">{card.codigo} · v{card.versionFicha}</p>
                        <h2 className="mt-1 text-lg font-bold text-gray-900">{card.producto}</h2>
                        <p className="mt-1 text-sm text-gray-500">{card.nombre} · Partes: {card.partes.join(', ') || '—'}</p>
                        <p className="mt-3 text-sm text-gray-600">{card.notas || 'Sin observaciones registradas.'}</p>
                        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                            <div><p className="text-xs text-gray-500">Tiempo</p><p className="mt-1 font-semibold">{card.tiempoMinutos} min</p></div>
                            <div><p className="text-xs text-gray-500">Materiales</p><p className="mt-1 font-semibold">{card.materiales.length} + {card.componentes.length} comp.</p></div>
                            <div><p className="text-xs text-gray-500">Costo directo</p><p className="mt-1 font-semibold">{money(card.costoMateriales)}</p></div>
                        </div>
                        <button onClick={() => openDetail(card)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800">
                            <Eye size={16} /> Ver detalles
                        </button>
                    </article>
                ))}
            </div>
            {filtered.length === 0 && <p className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500 print:hidden">No se encontraron fichas técnicas.</p>}

            {modal === 'form' && (
                <Modal title={form.id ? `Editar ${form.codigo}` : 'Registrar ficha técnica'} onClose={() => setModal(null)} wide>
                    <form onSubmit={save} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Producto">
                                <select required value={form.productoId} onChange={e => { const p = productos.find(x => x.id === Number(e.target.value)); setForm({ ...form, productoId: e.target.value, nombre: form.nombre || p?.nombre || '' }); }} className={inputClass}>
                                    <option value="">Selecciona...</option>{productos.map(p => <option key={p.id} value={p.id}>{p.codigo} · {p.nombre}</option>)}
                                </select>
                            </Field>
                            <Field label="Nombre de la ficha"><input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} /></Field>
                            <Field label="Versión"><input required value={form.versionFicha} onChange={e => setForm({ ...form, versionFicha: e.target.value })} className={inputClass} /></Field>
                            <Field label="Tiempo estándar (min)"><input type="number" min="0" required value={form.tiempoMinutos} onChange={e => setForm({ ...form, tiempoMinutos: e.target.value })} className={inputClass} /></Field>
                        </div>
                        <Field label="Notas / especificaciones"><textarea rows="2" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className={inputClass} /></Field>
                        <div>
                            <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold text-gray-800">Materiales por parte</h3><button type="button" onClick={() => addLine('materiales')} className="text-sm font-semibold text-amber-700">+ Agregar material</button></div>
                            {form.materiales.map((l, i) => (
                                <div key={i} className="mb-2 grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-2">
                                    <select value={l.parte} onChange={e => setLine('materiales', i, 'parte', e.target.value)} className={inputClass}>{PARTES.map(p => <option key={p}>{p}</option>)}</select>
                                    <select required value={l.materialId} onChange={e => setLine('materiales', i, 'materialId', e.target.value)} className={inputClass}><option value="">Material...</option>{materiales.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}</select>
                                    <input type="number" step="0.001" min="0.001" required placeholder={`Cantidad ${matById[l.materialId]?.unit || ''}`} value={l.cantidad} onChange={e => setLine('materiales', i, 'cantidad', e.target.value)} className={inputClass} />
                                    <input type="number" step="0.1" min="0" max="99" placeholder="Merma %" value={l.mermaPct} onChange={e => setLine('materiales', i, 'mermaPct', e.target.value)} className={inputClass} title="Porcentaje de merma o desperdicio esperado" />
                                    <button type="button" onClick={() => removeLine('materiales', i)} className="p-2 text-red-600" aria-label="Quitar"><Trash2 size={16} /></button>
                                </div>))}
                        </div>
                        <div>
                            <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold text-gray-800">Componentes (subensambles)</h3><button type="button" onClick={() => addLine('componentes')} className="text-sm font-semibold text-amber-700">+ Agregar componente</button></div>
                            {form.componentes.map((l, i) => (
                                <div key={i} className="mb-2 grid grid-cols-[1fr_2fr_1fr_auto] gap-2">
                                    <select value={l.parte} onChange={e => setLine('componentes', i, 'parte', e.target.value)} className={inputClass}>{PARTES.map(p => <option key={p}>{p}</option>)}</select>
                                    <select required value={l.productoId} onChange={e => setLine('componentes', i, 'productoId', e.target.value)} className={inputClass}><option value="">Producto componente...</option>{productos.filter(p => p.id !== Number(form.productoId)).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
                                    <input type="number" step="0.001" min="0.001" required value={l.cantidad} onChange={e => setLine('componentes', i, 'cantidad', e.target.value)} className={inputClass} />
                                    <button type="button" onClick={() => removeLine('componentes', i)} className="p-2 text-red-600" aria-label="Quitar"><Trash2 size={16} /></button>
                                </div>))}
                            <p className="text-xs text-gray-500">Los componentes se calculan con su propia ficha vigente (hasta 5 niveles).</p>
                        </div>
                        <Notice notice={notice} />
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setModal(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
                            <button disabled={busy} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50">Guardar borrador</button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal && modal !== 'form' && (
                <Modal title={`${modal.codigo} · ${modal.producto}`} onClose={() => setModal(null)} wide>
                    <div className="space-y-4 text-sm">
                        <p className="hidden text-xl font-bold print:block">Ficha técnica {modal.codigo} — {modal.producto}</p>
                        <div className="grid gap-3 sm:grid-cols-4">
                            <p><span className="block text-xs text-gray-500">Estado</span>{modal.estado}</p>
                            <p><span className="block text-xs text-gray-500">Versión</span>{modal.versionFicha}</p>
                            <p><span className="block text-xs text-gray-500">Tiempo estándar</span>{modal.tiempoMinutos} min</p>
                            <p><span className="block text-xs text-gray-500">Elaborada por</span>{modal.creadoPor || '—'}</p>
                        </div>
                        <p className="text-gray-600">{modal.notas}</p>
                        <h3 className="font-semibold">Materiales directos</h3>
                        <Table headers={['Parte', 'Material', 'Cantidad', 'Merma', 'Costo']} min={520}>
                            {modal.materiales.map(m => <tr key={m.materialId}><Cell>{m.parte}</Cell><Cell>{m.nombre}</Cell><Cell>{num(m.cantidad, 3)} {m.unidad}</Cell><Cell>{m.mermaPct}%</Cell><Cell>{money(m.costo)}</Cell></tr>)}
                        </Table>
                        {modal.componentes.length > 0 && <><h3 className="font-semibold">Componentes</h3>
                            <Table headers={['Parte', 'Producto', 'Cantidad']} min={420}>{modal.componentes.map(c => <tr key={c.productoId}><Cell>{c.parte}</Cell><Cell>{c.nombre}</Cell><Cell>{num(c.cantidad, 3)}</Cell></tr>)}</Table></>}
                        <h3 className="font-semibold">Requerimiento total por unidad (explosión multinivel)</h3>
                        {explosion?.error ? <p className="text-red-700">{explosion.error}</p> : explosion ? (
                            <Table headers={['Material', 'Cantidad', 'Costo']} min={420}>{explosion.materiales.map(m => <tr key={m.materialId}><Cell>{m.nombre}</Cell><Cell>{num(m.cantidad, 3)} {m.unidad}</Cell><Cell>{money(m.costoTotal)}</Cell></tr>)}
                                <tr><Cell className="font-semibold">Costo total de materiales</Cell><Cell /><Cell className="font-semibold">{money(explosion.costoTotal)}</Cell></tr></Table>
                        ) : <p className="text-gray-500">Calculando...</p>}
                        <Notice notice={notice} />
                        <div className="flex flex-wrap justify-end gap-2 print:hidden">
                            <button type="button" onClick={imprimir} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm"><Printer size={16} /> Imprimir</button>
                            {editable && modal.estado === 'Borrador' && <><button onClick={() => openEdit(modal)} className="rounded-lg border px-4 py-2 text-sm">Editar</button>
                                <button disabled={busy} onClick={() => cambiarEstado(modal, 'Vigente')} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Aprobar como vigente</button></>}
                            {editable && modal.estado === 'Vigente' && <><button disabled={busy} onClick={() => nuevaVersion(modal)} className="rounded-lg border px-4 py-2 text-sm">Nueva versión</button>
                                <button disabled={busy} onClick={() => cambiarEstado(modal, 'Obsoleta')} className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700">Marcar obsoleta</button></>}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function Stat({ icon, label, value }) {
    return <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><div className="rounded-lg bg-amber-50 p-3 text-amber-700">{icon}</div><div><p className="text-sm text-gray-500">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div></div>;
}
function Field({ label, children }) { return <label className="block space-y-1.5 text-sm font-medium text-gray-700">{label}{children}</label>; }
function Modal({ title, onClose, children, wide }) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:static print:bg-white print:p-0"><div className={`max-h-[92vh] w-full overflow-y-auto rounded-xl bg-white p-5 shadow-xl print:max-h-none print:shadow-none ${wide ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between print:hidden"><h2 className="text-lg font-bold">{title}</h2><button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-900" aria-label="Cerrar">×</button></div>{children}</div></div>;
}
