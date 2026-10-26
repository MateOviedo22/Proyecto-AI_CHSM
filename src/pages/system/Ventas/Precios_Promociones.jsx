
import { useMemo, useState } from 'react';
import {
    Tag,
    Search,
    Plus,
    Pencil,
    Check,
    X,
    Trash2,
    PauseCircle,
    PlayCircle,
    BadgePercent,
    CircleDollarSign,
    CalendarDays,
} from 'lucide-react';

const productosIniciales = [
    { id: 1, nombre: 'Billetera clásica', codigo: 'BIL-001', precio: 850, categoria: 'Billeteras' },
    { id: 2, nombre: 'Bolso artesanal', codigo: 'BOL-001', precio: 2450, categoria: 'Bolsos' },
    { id: 3, nombre: 'Monedero pequeño', codigo: 'MON-001', precio: 450, categoria: 'Monederos' },
    { id: 4, nombre: 'Cartera elegante', codigo: 'CAR-001', precio: 3200, categoria: 'Carteras' },
    { id: 5, nombre: 'Porta documentos', codigo: 'POR-001', precio: 1150, categoria: 'Accesorios' },
];

const promocionesIniciales = [
    {
        id: 1,
        nombre: 'Descuento de temporada',
        productoId: 2,
        tipo: 'porcentaje',
        valor: 10,
        inicio: '2026-10-20',
        fin: '2026-11-30',
        activa: true,
    },
    {
        id: 2,
        nombre: 'Precio especial en billeteras',
        productoId: 1,
        tipo: 'fijo',
        valor: 100,
        inicio: '2026-10-01',
        fin: '2026-10-31',
        activa: false,
    },
];

const moneda = (valor) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(valor);

const fechaActual = () => new Date().toLocaleDateString('en-CA');

const formularioVacio = {
    nombre: '',
    productoId: '1',
    tipo: 'porcentaje',
    valor: '',
    inicio: fechaActual(),
    fin: fechaActual(),
};

export default function Precios_Promociones() {
    const [productos, setProductos] = useState(productosIniciales);
    const [promociones, setPromociones] = useState(promocionesIniciales);
    const [busqueda, setBusqueda] = useState('');
    const [editandoPrecio, setEditandoPrecio] = useState(null);
    const [nuevoPrecio, setNuevoPrecio] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [formulario, setFormulario] = useState(formularioVacio);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');

    const productosFiltrados = productos.filter((producto) =>
        `${producto.nombre} ${producto.codigo} ${producto.categoria}`
            .toLowerCase()
            .includes(busqueda.toLowerCase())
    );

    const promocionesActivas = promociones.filter((p) => p.activa).length;

    const promocionesVigentes = useMemo(() => {
        const hoy = fechaActual();
        return promociones.filter(
            (p) => p.activa && p.inicio <= hoy && p.fin >= hoy
        );
    }, [promociones]);

    const calcularPrecio = (producto) => {
        const promocion = promocionesVigentes.find(
            (p) => String(p.productoId) === String(producto.id)
        );

        if (!promocion) return producto.precio;

        if (promocion.tipo === 'porcentaje') {
            return Math.max(0, producto.precio * (1 - promocion.valor / 100));
        }

        return Math.max(0, producto.precio - promocion.valor);
    };

    const guardarPrecio = (producto) => {
        const precio = Number(nuevoPrecio);

        if (nuevoPrecio.trim() === '' || !Number.isFinite(precio) || precio <= 0) {
            setError('Ingresa un precio mayor que cero.');
            return;
        }

        setProductos((actuales) =>
            actuales.map((p) => p.id === producto.id ? { ...p, precio } : p)
        );

        setEditandoPrecio(null);
        setNuevoPrecio('');
        setError('');
        setMensaje(`Precio de "${producto.nombre}" actualizado en la demostración.`);
    };

    const crearPromocion = (e) => {
        e.preventDefault();
        const valor = Number(formulario.valor);
        const producto = productos.find(
            (p) => String(p.id) === String(formulario.productoId)
        );

        if (!formulario.nombre.trim()) {
            setError('Escribe un nombre para la promoción.');
            return;
        }

        if (!producto) {
            setError('Selecciona un producto válido.');
            return;
        }

        if (!Number.isFinite(valor) || valor <= 0) {
            setError('El descuento debe ser mayor que cero.');
            return;
        }

        if (formulario.inicio > formulario.fin) {
            setError('La fecha de inicio no puede ser posterior a la fecha final.');
            return;
        }

        if (formulario.tipo === 'porcentaje' && valor > 100) {
            setError('El porcentaje no puede superar el 100 %.');
            return;
        }

        if (formulario.tipo === 'fijo' && valor >= producto.precio) {
            setError('El descuento fijo debe ser menor que el precio del producto.');
            return;
        }

        const nueva = {
            ...formulario,
            id: Date.now(),
            productoId: Number(formulario.productoId),
            nombre: formulario.nombre.trim(),
            valor,
            activa: true,
        };

        setPromociones((actuales) => [nueva, ...actuales]);
        setFormulario(formularioVacio);
        setMostrarFormulario(false);
        setError('');
        setMensaje('Promoción creada y activada correctamente.');
    };

    const cambiarEstado = (id) => {
        setPromociones((actuales) =>
            actuales.map((p) => p.id === id ? { ...p, activa: !p.activa } : p)
        );
        setMensaje('Estado de la promoción actualizado.');
    };

    const eliminarPromocion = (id) => {
        const confirmacion = window.confirm(
            '¿Deseas eliminar esta promoción de la demostración?'
        );
        if (!confirmacion) return;

        setPromociones((actuales) => actuales.filter((p) => p.id !== id));
        setMensaje('Promoción eliminada.');
    };

    const nombreProducto = (id) =>
        productos.find((p) => p.id === Number(id))?.nombre || 'Producto no disponible';

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm text-gray-500">Ventas y órdenes / Precios y promociones</p>
                    <h1 className="mt-1 text-2xl font-bold text-gray-800">Precios y promociones</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Administra precios de venta y descuentos de los productos.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setMostrarFormulario((actual) => !actual);
                        setError('');
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-medium text-white hover:opacity-90"
                >
                    {mostrarFormulario ? <X size={18} /> : <Plus size={18} />}
                    {mostrarFormulario ? 'Cancelar' : 'Nueva promoción'}
                </button>
            </div>

            {mensaje && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-800">
                    <span>{mensaje}</span>
                    <button onClick={() => setMensaje('')} aria-label="Cerrar mensaje">
                        <X size={17} />
                    </button>
                </div>
            )}

            {error && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                    <span>{error}</span>
                    <button onClick={() => setError('')} aria-label="Cerrar error">
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Productos en catálogo</p>
                        <CircleDollarSign className="text-orange-700" size={22} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{productos.length}</p>
                    <p className="mt-1 text-xs text-gray-400">Con precio de venta definido</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Promociones activadas</p>
                        <Tag className="text-orange-700" size={22} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{promocionesActivas}</p>
                    <p className="mt-1 text-xs text-gray-400">Incluye promociones fuera de vigencia</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Promociones vigentes</p>
                        <BadgePercent className="text-orange-700" size={22} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{promocionesVigentes.length}</p>
                    <p className="mt-1 text-xs text-gray-400">Según fechas y estado actual</p>
                </div>
            </div>

            {mostrarFormulario && (
                <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                    <h2 className="mb-1 font-semibold text-gray-800">Crear promoción</h2>
                    <p className="mb-5 text-sm text-gray-500">
                        Define el descuento, el producto y el período de vigencia.
                    </p>

                    <form onSubmit={crearPromocion} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="text-sm font-medium text-gray-700">
                            Nombre de la promoción
                            <input
                                required
                                value={formulario.nombre}
                                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                                placeholder="Ej. Oferta de fin de mes"
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400"
                            />
                        </label>

                        <label className="text-sm font-medium text-gray-700">
                            Producto
                            <select
                                value={formulario.productoId}
                                onChange={(e) => setFormulario({ ...formulario, productoId: e.target.value })}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400"
                            >
                                {productos.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} — {moneda(p.precio)}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="text-sm font-medium text-gray-700">
                            Tipo de descuento
                            <select
                                value={formulario.tipo}
                                onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400"
                            >
                                <option value="porcentaje">Porcentaje (%)</option>
                                <option value="fijo">Monto fijo (C$)</option>
                            </select>
                        </label>

                        <label className="text-sm font-medium text-gray-700">
                            Valor del descuento
                            <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={formulario.valor}
                                onChange={(e) => setFormulario({ ...formulario, valor: e.target.value })}
                                placeholder={formulario.tipo === 'porcentaje' ? 'Ej. 15' : 'Ej. 100'}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400"
                            />
                        </label>

                        <label className="text-sm font-medium text-gray-700">
                            Fecha de inicio
                            <input
                                required
                                type="date"
                                value={formulario.inicio}
                                onChange={(e) => setFormulario({ ...formulario, inicio: e.target.value })}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400"
                            />
                        </label>

                        <label className="text-sm font-medium text-gray-700">
                            Fecha de finalización
                            <input
                                required
                                type="date"
                                min={formulario.inicio}
                                value={formulario.fin}
                                onChange={(e) => setFormulario({ ...formulario, fin: e.target.value })}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400"
                            />
                        </label>

                        <div className="flex justify-end gap-3 md:col-span-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setMostrarFormulario(false);
                                    setFormulario(formularioVacio);
                                    setError('');
                                }}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                            >
                                <Check size={17} /> Guardar promoción
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                    <h2 className="font-semibold text-gray-800">Catálogo de precios</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Modifica los precios y consulta el precio promocional cuando exista una oferta vigente.
                    </p>
                    <div className="relative mt-4 max-w-md">
                        <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar por nombre, código o categoría"
                            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-3">Producto</th>
                                <th className="px-5 py-3">Precio base</th>
                                <th className="px-5 py-3">Precio promocional</th>
                                <th className="px-5 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {productosFiltrados.map((producto) => {
                                const precioPromocional = calcularPrecio(producto);
                                const enPromocion = precioPromocional < producto.precio;
                                const editando = editandoPrecio === producto.id;

                                return (
                                    <tr key={producto.id} className="hover:bg-orange-50/30">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-800">{producto.nombre}</p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                {producto.codigo} · {producto.categoria}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {editando ? (
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={nuevoPrecio}
                                                    onChange={(e) => setNuevoPrecio(e.target.value)}
                                                    className="w-32 rounded-lg border border-gray-200 px-2 py-2 outline-none focus:border-orange-400"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-medium text-gray-700">
                                                    {moneda(producto.precio)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            {enPromocion ? (
                                                <div>
                                                    <p className="font-semibold text-green-700">{moneda(precioPromocional)}</p>
                                                    <p className="mt-1 text-xs text-green-600">Descuento aplicado</p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Sin promoción vigente</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            {editando ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => guardarPrecio(producto)}
                                                        title="Guardar precio"
                                                        className="rounded-lg bg-green-50 p-2 text-green-700 hover:bg-green-100"
                                                    >
                                                        <Check size={17} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditandoPrecio(null);
                                                            setNuevoPrecio('');
                                                            setError('');
                                                        }}
                                                        title="Cancelar edición"
                                                        className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                                                    >
                                                        <X size={17} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setEditandoPrecio(producto.id);
                                                        setNuevoPrecio(String(producto.precio));
                                                        setError('');
                                                    }}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    <Pencil size={14} /> Editar precio
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {productosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-5 py-10 text-center text-gray-500">
                                        No se encontraron productos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                    <h2 className="font-semibold text-gray-800">Gestión de promociones</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Activa, pausa o elimina las promociones registradas.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-3">Promoción</th>
                                <th className="px-5 py-3">Producto</th>
                                <th className="px-5 py-3">Descuento</th>
                                <th className="px-5 py-3">Vigencia</th>
                                <th className="px-5 py-3">Estado</th>
                                <th className="px-5 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {promociones.map((promocion) => {
                                const vigente =
                                    promocion.activa &&
                                    promocion.inicio <= fechaActual() &&
                                    promocion.fin >= fechaActual();

                                return (
                                    <tr key={promocion.id} className="hover:bg-orange-50/30">
                                        <td className="px-5 py-4 font-medium text-gray-800">
                                            {promocion.nombre}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {nombreProducto(promocion.productoId)}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-gray-700">
                                            {promocion.tipo === 'porcentaje'
                                                ? `${promocion.valor}%`
                                                : moneda(promocion.valor)}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            <span className="inline-flex items-center gap-1">
                                                <CalendarDays size={14} />
                                                {promocion.inicio} — {promocion.fin}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${vigente
                                                    ? 'bg-green-50 text-green-700'
                                                    : promocion.activa
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {vigente ? 'Vigente' : promocion.activa ? 'Fuera de vigencia' : 'Pausada'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => cambiarEstado(promocion.id)}
                                                    title={promocion.activa ? 'Pausar promoción' : 'Activar promoción'}
                                                    className={`rounded-lg p-2 ${promocion.activa
                                                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                        }`}
                                                >
                                                    {promocion.activa
                                                        ? <PauseCircle size={17} />
                                                        : <PlayCircle size={17} />}
                                                </button>
                                                <button
                                                    onClick={() => eliminarPromocion(promocion.id)}
                                                    title="Eliminar promoción"
                                                    className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {promociones.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-5 py-10 text-center text-gray-500">
                                        Todavía no hay promociones registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <p className="text-xs text-gray-400">
                Los precios y promociones son datos de prueba. Los descuentos se calculan para mostrar
                el precio promocional, pero todavía no se aplican automáticamente al punto de venta.
            </p>
        </div>
    );
}
