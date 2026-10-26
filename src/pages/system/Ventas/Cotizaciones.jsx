
import { useMemo, useState } from 'react';
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    FileText,
    X,
    Check,
    ShoppingCart,
    CalendarDays,
    CircleDollarSign,
    Eye,
    ArrowRightLeft,
} from 'lucide-react';

const productosDemo = [
    { id: 1, nombre: 'Billetera clásica', precio: 850 },
    { id: 2, nombre: 'Bolso artesanal', precio: 2450 },
    { id: 3, nombre: 'Monedero pequeño', precio: 450 },
    { id: 4, nombre: 'Cartera elegante', precio: 3200 },
    { id: 5, nombre: 'Porta documentos', precio: 1150 },
    { id: 6, nombre: 'Llavero de cuero', precio: 180 },
];

const cotizacionesIniciales = [
    {
        id: 'COT-1001',
        cliente: 'María López',
        fecha: '2026-10-25',
        vencimiento: '2026-11-05',
        estado: 'Pendiente',
        notas: 'Entrega en tienda',
        items: [
            { productoId: 1, cantidad: 2, precio: 850 },
            { productoId: 6, cantidad: 2, precio: 180 },
        ],
    },
    {
        id: 'COT-1002',
        cliente: 'Ana Martínez',
        fecha: '2026-10-23',
        vencimiento: '2026-11-02',
        estado: 'Pendiente',
        notas: 'Empaque para regalo',
        items: [{ productoId: 2, cantidad: 1, precio: 2450 }],
    },
    {
        id: 'COT-1003',
        cliente: 'Lucía García',
        fecha: '2026-10-18',
        vencimiento: '2026-10-24',
        estado: 'Vencida',
        notas: '',
        items: [{ productoId: 4, cantidad: 1, precio: 3200 }],
    },
];

const moneda = (valor) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(valor);

const hoy = () => new Date().toLocaleDateString('en-CA');

const formularioInicial = () => ({
    cliente: '',
    vencimiento: hoy(),
    notas: '',
    items: [{ productoId: '1', cantidad: 1 }],
});

const totalCotizacion = (cotizacion) =>
    cotizacion.items.reduce((suma, item) => suma + item.cantidad * item.precio, 0);

const estadoVisual = (estado) => ({
    Pendiente: 'bg-amber-50 text-amber-700',
    Convertida: 'bg-green-50 text-green-700',
    Vencida: 'bg-red-50 text-red-700',
}[estado] || 'bg-gray-100 text-gray-600');

export default function Cotizaciones() {
    const [cotizaciones, setCotizaciones] = useState(cotizacionesIniciales);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [formulario, setFormulario] = useState(formularioInicial);
    const [editandoId, setEditandoId] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [ordenesGeneradas, setOrdenesGeneradas] = useState([]);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    const cotizacionesActualizadas = useMemo(() => {
        return cotizaciones.map((c) => {
            if (c.estado === 'Pendiente' && c.vencimiento < hoy()) {
                return { ...c, estado: 'Vencida' };
            }
            return c;
        });
    }, [cotizaciones]);

    const cotizacionesFiltradas = cotizacionesActualizadas.filter((c) => {
        const coincideTexto =
            `${c.id} ${c.cliente}`.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = filtroEstado === 'Todos' || c.estado === filtroEstado;
        return coincideTexto && coincideEstado;
    });

    const cantidadPendientes = cotizacionesActualizadas.filter((c) => c.estado === 'Pendiente').length;
    const cantidadConvertidas = cotizacionesActualizadas.filter((c) => c.estado === 'Convertida').length;
    const valorPendiente = cotizacionesActualizadas
        .filter((c) => c.estado === 'Pendiente')
        .reduce((suma, c) => suma + totalCotizacion(c), 0);

    const actualizarItem = (indice, campo, valor) => {
        setFormulario((actual) => ({
            ...actual,
            items: actual.items.map((item, i) =>
                i === indice ? { ...item, [campo]: valor } : item
            ),
        }));
    };

    const agregarItem = () => {
        setFormulario((actual) => ({
            ...actual,
            items: [...actual.items, { productoId: '1', cantidad: 1 }],
        }));
    };

    const quitarItem = (indice) => {
        setFormulario((actual) => ({
            ...actual,
            items: actual.items.filter((_, i) => i !== indice),
        }));
    };

    const abrirNueva = () => {
        setEditandoId(null);
        setFormulario(formularioInicial());
        setError('');
        setMostrarFormulario(true);
    };

    const abrirEdicion = (cotizacion) => {
        if (cotizacion.estado !== 'Pendiente') {
            setMensaje('Solo puedes editar cotizaciones pendientes y vigentes.');
            return;
        }

        setEditandoId(cotizacion.id);
        setFormulario({
            cliente: cotizacion.cliente,
            vencimiento: cotizacion.vencimiento,
            notas: cotizacion.notas || '',
            items: cotizacion.items.map((item) => ({
                productoId: String(item.productoId),
                cantidad: item.cantidad,
            })),
        });
        setError('');
        setMostrarFormulario(true);
    };

    const guardarCotizacion = (e) => {
        e.preventDefault();

        if (!formulario.cliente.trim()) {
            setError('Escribe el nombre del cliente.');
            return;
        }

        if (formulario.vencimiento < hoy()) {
            setError('La fecha de vencimiento debe ser hoy o una fecha futura.');
            return;
        }

        if (!formulario.items.length) {
            setError('Agrega al menos un producto.');
            return;
        }

        const items = formulario.items.map((item) => {
            const producto = productosDemo.find(
                (p) => p.id === Number(item.productoId)
            );
            return {
                productoId: Number(item.productoId),
                cantidad: Number(item.cantidad),
                precio: producto?.precio || 0,
            };
        });

        if (items.some((item) => !Number.isInteger(item.cantidad) || item.cantidad < 1)) {
            setError('Cada producto debe tener una cantidad entera de al menos una unidad.');
            return;
        }

        const datos = {
            cliente: formulario.cliente.trim(),
            vencimiento: formulario.vencimiento,
            notas: formulario.notas.trim(),
            items,
            estado: 'Pendiente',
        };

        if (editandoId) {
            setCotizaciones((actuales) =>
                actuales.map((c) => c.id === editandoId ? { ...c, ...datos } : c)
            );
            setMensaje(`La cotización ${editandoId} fue actualizada.`);
        } else {
            const nueva = {
                ...datos,
                id: `COT-${Date.now().toString().slice(-6)}`,
                fecha: hoy(),
            };
            setCotizaciones((actuales) => [nueva, ...actuales]);
            setMensaje(`Cotización ${nueva.id} creada correctamente.`);
        }

        setMostrarFormulario(false);
        setFormulario(formularioInicial());
        setEditandoId(null);
        setError('');
    };

    const eliminarCotizacion = (cotizacion) => {
        if (cotizacion.estado !== 'Pendiente' && cotizacion.estado !== 'Vencida') {
            setMensaje('No se puede eliminar una cotización que ya fue convertida.');
            return;
        }

        if (!window.confirm(`¿Eliminar la cotización ${cotizacion.id}?`)) return;

        setCotizaciones((actuales) => actuales.filter((c) => c.id !== cotizacion.id));
        setMensaje(`Cotización ${cotizacion.id} eliminada.`);
    };

    const convertirOrden = (cotizacion) => {
        if (cotizacion.estado !== 'Pendiente' || cotizacion.vencimiento < hoy()) {
            setMensaje('Solo puedes convertir cotizaciones pendientes que no estén vencidas.');
            return;
        }

        const nuevaOrden = {
            id: `OV-${Date.now().toString().slice(-6)}`,
            cotizacionId: cotizacion.id,
            cliente: cotizacion.cliente,
            fecha: hoy(),
            estado: 'Pendiente',
            total: totalCotizacion(cotizacion),
            items: cotizacion.items.map((item) => ({
                ...item,
                nombre: productosDemo.find((p) => p.id === item.productoId)?.nombre || 'Producto',
            })),
        };

        setOrdenesGeneradas((actuales) => [nuevaOrden, ...actuales]);
        setCotizaciones((actuales) =>
            actuales.map((c) =>
                c.id === cotizacion.id ? { ...c, estado: 'Convertida' } : c
            )
        );
        setMensaje(`Cotización convertida en la orden ${nuevaOrden.id}.`);
    };

    const nombreProducto = (id) =>
        productosDemo.find((p) => p.id === Number(id))?.nombre || 'Producto';

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm text-gray-500">Ventas y órdenes / Cotizaciones</p>
                    <h1 className="mt-1 text-2xl font-bold text-gray-800">Cotizaciones</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Prepara ofertas comerciales y conviértelas en órdenes de venta.
                    </p>
                </div>
                <button onClick={abrirNueva}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-medium text-white hover:opacity-90">
                    <Plus size={18} /> Nueva cotización
                </button>
            </div>

            {mensaje && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-800">
                    <span>{mensaje}</span>
                    <button onClick={() => setMensaje('')} aria-label="Cerrar mensaje"><X size={17} /></button>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                    <span>{error}</span>
                    <button onClick={() => setError('')} aria-label="Cerrar error"><X size={17} /></button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Cotizaciones pendientes</p>
                        <FileText className="text-orange-700" size={22} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{cantidadPendientes}</p>
                    <p className="mt-1 text-xs text-gray-400">Esperando respuesta del cliente</p>
                </article>
                <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Valor pendiente</p>
                        <CircleDollarSign className="text-orange-700" size={22} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{moneda(valorPendiente)}</p>
                    <p className="mt-1 text-xs text-gray-400">Monto potencial, no ingreso confirmado</p>
                </article>
                <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Convertidas</p>
                        <ShoppingCart className="text-orange-700" size={22} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{cantidadConvertidas}</p>
                    <p className="mt-1 text-xs text-gray-400">Convertidas a órdenes en esta página</p>
                </article>
            </div>

            {mostrarFormulario && (
                <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-gray-800">
                                {editandoId ? `Editar ${editandoId}` : 'Crear cotización'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">Completa los datos de la propuesta comercial.</p>
                        </div>
                        <button onClick={() => {
                            setMostrarFormulario(false);
                            setEditandoId(null);
                            setError('');
                        }} aria-label="Cerrar formulario" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                            <X size={19} />
                        </button>
                    </div>

                    <form onSubmit={guardarCotizacion} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <label className="text-sm font-medium text-gray-700">
                                Cliente
                                <input required value={formulario.cliente}
                                    onChange={(e) => setFormulario({ ...formulario, cliente: e.target.value })}
                                    placeholder="Nombre del cliente"
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400" />
                            </label>
                            <label className="text-sm font-medium text-gray-700">
                                Fecha de vencimiento
                                <input required type="date" min={hoy()} value={formulario.vencimiento}
                                    onChange={(e) => setFormulario({ ...formulario, vencimiento: e.target.value })}
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400" />
                            </label>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h3 className="font-semibold text-gray-800">Productos cotizados</h3>
                                <button type="button" onClick={agregarItem}
                                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    <Plus size={15} /> Agregar producto
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formulario.items.map((item, indice) => {
                                    const producto = productosDemo.find((p) => p.id === Number(item.productoId));
                                    const precio = producto?.precio || 0;

                                    return (
                                        <div key={indice} className="grid grid-cols-1 items-end gap-3 rounded-xl border border-gray-100 p-3 sm:grid-cols-[1fr_120px_140px_auto]">
                                            <label className="text-sm text-gray-600">
                                                Producto
                                                <select value={item.productoId}
                                                    onChange={(e) => actualizarItem(indice, 'productoId', e.target.value)}
                                                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5">
                                                    {productosDemo.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.nombre} — {moneda(p.precio)}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="text-sm text-gray-600">
                                                Cantidad
                                                <input type="number" min="1" step="1" value={item.cantidad}
                                                    onChange={(e) => actualizarItem(indice, 'cantidad', e.target.value)}
                                                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5" />
                                            </label>
                                            <div className="text-sm">
                                                <p className="text-gray-500">Subtotal</p>
                                                <p className="mt-2 font-semibold text-gray-800">{moneda(precio * Math.max(0, Number(item.cantidad) || 0))}</p>
                                            </div>
                                            <button type="button" disabled={formulario.items.length === 1}
                                                onClick={() => quitarItem(indice)} title="Quitar producto"
                                                className="rounded-lg p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-30">
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-gray-700">
                            Notas
                            <textarea rows="2" value={formulario.notas}
                                onChange={(e) => setFormulario({ ...formulario, notas: e.target.value })}
                                placeholder="Condiciones, entrega u observaciones..."
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400" />
                        </label>

                        <div className="flex flex-col justify-between gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center">
                            <div>
                                <p className="text-sm text-gray-500">Total estimado</p>
                                <p className="mt-1 text-2xl font-bold text-gray-800">
                                    {moneda(formulario.items.reduce((suma, item) => {
                                        const p = productosDemo.find((x) => x.id === Number(item.productoId));
                                        return suma + (p?.precio || 0) * Math.max(0, Number(item.cantidad) || 0);
                                    }, 0))}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => {
                                    setMostrarFormulario(false);
                                    setEditandoId(null);
                                    setError('');
                                }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-white">
                                    Cancelar
                                </button>
                                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">
                                    <Check size={17} /> {editandoId ? 'Guardar cambios' : 'Crear cotización'}
                                </button>
                            </div>
                        </div>
                    </form>
                </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                    <h2 className="font-semibold text-gray-800">Listado de cotizaciones</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="relative">
                            <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar código o cliente"
                                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
                        </div>
                        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm">
                            <option>Todos</option>
                            <option>Pendiente</option>
                            <option>Convertida</option>
                            <option>Vencida</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-3">Código</th>
                                <th className="px-5 py-3">Cliente</th>
                                <th className="px-5 py-3">Fecha</th>
                                <th className="px-5 py-3">Vencimiento</th>
                                <th className="px-5 py-3">Total</th>
                                <th className="px-5 py-3">Estado</th>
                                <th className="px-5 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {cotizacionesFiltradas.map((cotizacion) => (
                                <tr key={cotizacion.id} className="hover:bg-orange-50/30">
                                    <td className="px-5 py-4 font-semibold text-gray-800">{cotizacion.id}</td>
                                    <td className="px-5 py-4">{cotizacion.cliente}</td>
                                    <td className="px-5 py-4 text-gray-600">{cotizacion.fecha}</td>
                                    <td className="px-5 py-4 text-gray-600">
                                        <span className="inline-flex items-center gap-1"><CalendarDays size={14} />{cotizacion.vencimiento}</span>
                                    </td>
                                    <td className="px-5 py-4 font-semibold">{moneda(totalCotizacion(cotizacion))}</td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${estadoVisual(cotizacion.estado)}`}>
                                            {cotizacion.estado}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => setDetalle(cotizacion)} title="Ver detalle"
                                                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => abrirEdicion(cotizacion)} title="Editar cotización"
                                                disabled={cotizacion.estado !== 'Pendiente'}
                                                className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => eliminarCotizacion(cotizacion)} title="Eliminar cotización"
                                                disabled={cotizacion.estado === 'Convertida'}
                                                className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30">
                                                <Trash2 size={16} />
                                            </button>
                                            <button onClick={() => convertirOrden(cotizacion)} title="Convertir en orden"
                                                disabled={cotizacion.estado !== 'Pendiente' || cotizacion.vencimiento < hoy()}
                                                className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-30">
                                                <ArrowRightLeft size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!cotizacionesFiltradas.length && (
                                <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-500">No hay cotizaciones para mostrar.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {detalle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setDetalle(null)}>
                    <section role="dialog" aria-modal="true" aria-label="Detalle de cotización"
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500">Detalle de cotización</p>
                                <h2 className="mt-1 text-xl font-bold text-gray-800">{detalle.id}</h2>
                            </div>
                            <button onClick={() => setDetalle(null)} aria-label="Cerrar"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X size={20} /></button>
                        </div>
                        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                            <p><span className="text-gray-500">Cliente:</span> <strong>{detalle.cliente}</strong></p>
                            <p className="mt-2"><span className="text-gray-500">Fecha:</span> {detalle.fecha}</p>
                            <p className="mt-2"><span className="text-gray-500">Vence:</span> {detalle.vencimiento}</p>
                            {detalle.notas && <p className="mt-2"><span className="text-gray-500">Notas:</span> {detalle.notas}</p>}
                        </div>
                        <h3 className="mt-5 font-semibold text-gray-800">Detalle de productos</h3>
                        <div className="mt-3 space-y-3">
                            {detalle.items.map((item, i) => (
                                <div key={`${item.productoId}-${i}`} className="flex justify-between gap-3 border-b border-gray-100 pb-3 text-sm">
                                    <span className="text-gray-600">{nombreProducto(item.productoId)} × {item.cantidad}</span>
                                    <span className="font-medium">{moneda(item.cantidad * item.precio)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-between text-lg font-bold">
                            <span>Total estimado</span><span>{moneda(totalCotizacion(detalle))}</span>
                        </div>
                        <button onClick={() => setDetalle(null)}
                            className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cerrar detalle
                        </button>
                    </section>
                </div>
            )}

            {ordenesGeneradas.length > 0 && (
                <section className="rounded-2xl border border-green-100 bg-green-50/50 p-5">
                    <h2 className="font-semibold text-gray-800">Órdenes generadas en esta sesión</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Estas órdenes son una demostración local y todavía no se guardan en el módulo de órdenes.
                    </p>
                    <div className="mt-4 space-y-3">
                        {ordenesGeneradas.map((orden) => (
                            <div key={orden.id} className="flex flex-col justify-between gap-2 rounded-xl border border-green-100 bg-white p-4 sm:flex-row sm:items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{orden.id} · {orden.cliente}</p>
                                    <p className="mt-1 text-xs text-gray-500">Origen: {orden.cotizacionId} · {orden.fecha}</p>
                                </div>
                                <span className="font-bold text-gray-800">{moneda(orden.total)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <p className="text-xs text-gray-400">
                Demostración local: las cotizaciones y órdenes generadas no se guardan en la base de datos ni se sincronizan automáticamente con otros módulos.
            </p>
        </div>
    );
}
