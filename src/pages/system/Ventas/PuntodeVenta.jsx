import {useApiCollection} from '../../../hooks/useApiCollection';
import {api,reportApiError} from '../../../services/api';
import {useApiList} from '../../../hooks/useApiList';
import {DocumentoModal,FacturaDoc} from '../../../components/erp/Documento';

import { useMemo, useState } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    Banknote,
    CheckCircle2,
    Receipt,
    X,
} from 'lucide-react';


const moneda = (valor) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(valor);

export default function PuntodeVenta() {
    const [catalogo, , reloadProductos] = useApiCollection('productos');
    const [almacenes] = useApiList('/almacenes');
    const [disponibilidad, reloadDisp] = useApiList('/disponibilidad');
    const [almacenSel, setAlmacenSel] = useState('');
    const almacenId = Number(almacenSel) || almacenes.find(a => a.tipo === 'Tienda' && a.activo)?.id;
    // El stock mostrado es la existencia del almacén de venta seleccionado (Tienda por defecto).
    const productos = catalogo.filter(p => p.activo).map(p=>({...p,precio:p.precioVigente,stock:disponibilidad.filter(d => d.productoId === p.id && d.almacenId === almacenId).reduce((s, d) => s + d.cantidad, 0)}));
    const [factura, setFactura] = useState(null);
    const [clientes] = useApiCollection('clientes');
    const [clienteId, setClienteId] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [carrito, setCarrito] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [cliente, setCliente] = useState('Cliente de mostrador');
    const [descuento, setDescuento] = useState(0);
    const [mensaje, setMensaje] = useState('');
    const [comprobante, setComprobante] = useState(null);

    const productosFiltrados = productos.filter((producto) =>
        `${producto.nombre} ${producto.codigo} ${producto.categoria}`
            .toLowerCase()
            .includes(busqueda.toLowerCase())
    );

    const subtotal = useMemo(
        () => carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0),
        [carrito]
    );

    const descuentoAplicado = Math.min(
        subtotal,
        Math.max(0, subtotal * (Math.min(100, Math.max(0, Number(descuento) || 0)) / 100))
    );
    const total = subtotal - descuentoAplicado;

    const agregarProducto = (producto) => {
        setMensaje('');
        setComprobante(null);

        const existente = carrito.find((item) => item.id === producto.id);
        const cantidadActual = existente?.cantidad || 0;

        if (cantidadActual >= producto.stock) {
            setMensaje(`Stock insuficiente para ${producto.nombre}.`);
            return;
        }

        if (existente) {
            setCarrito((actual) =>
                actual.map((item) =>
                    item.id === producto.id
                        ? { ...item, cantidad: item.cantidad + 1 }
                        : item
                )
            );
        } else {
            setCarrito((actual) => [...actual, { ...producto, cantidad: 1 }]);
        }
    };

    const cambiarCantidad = (id, cambio) => {
        const producto = productos.find((p) => p.id === id);
        const item = carrito.find((p) => p.id === id);
        if (!producto || !item) return;

        const nuevaCantidad = item.cantidad + cambio;

        if (nuevaCantidad > producto.stock) {
            setMensaje(`Solo hay ${producto.stock} unidad(es) disponibles.`);
            return;
        }

        setMensaje('');
        if (nuevaCantidad <= 0) {
            setCarrito((actual) => actual.filter((p) => p.id !== id));
        } else {
            setCarrito((actual) =>
                actual.map((p) =>
                    p.id === id ? { ...p, cantidad: nuevaCantidad } : p
                )
            );
        }
    };

    const finalizarVenta = async () => {
        if (!carrito.length) { setMensaje('Agrega al menos un producto antes de registrar la venta.'); return; }
        if (guardando) return;
        setGuardando(true);
        try {
            const respuesta = await api('/ventas', {method:'POST', body:{
                cliente: cliente.trim() || 'Cliente de mostrador', clienteId: clienteId || null,
                metodo: metodoPago, porcentajeDescuento: Number(descuento) || 0, almacenId,
                items: carrito.map(item => ({productoId:item.id,cantidad:item.cantidad}))
            }});
            setComprobante({...respuesta.data, fecha: new Date(respuesta.data.fecha).toLocaleString('es-NI')});
            setCarrito([]); setDescuento(0); setMensaje('Venta registrada correctamente.');
            await Promise.all([reloadProductos(), reloadDisp()]);
        } catch (error) { setMensaje(error.message); reportApiError(error); }
        finally { setGuardando(false); }
    };

    const limpiarCarrito = () => {
        setCarrito([]);
        setDescuento(0);
        setMensaje('El carrito se ha limpiado.');
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <p className="text-sm text-gray-500">Ventas y órdenes / Punto de venta</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-800">Punto de venta</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Los precios incluyen la promoción vigente; el descuento del carrito es adicional. El comprobante es interno.
                </p>
            </div>

            {mensaje && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-800">
                    <span>{mensaje}</span>
                    <button onClick={() => setMensaje('')} aria-label="Cerrar mensaje">
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="font-semibold text-gray-800">Productos disponibles</h2>
                        <div className="relative">
                            <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar producto..."
                                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 sm:w-64"
                            />
                        </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {productosFiltrados.map((producto) => (
                            <article key={producto.id} className="rounded-xl border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/30">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-gray-800">{producto.nombre}</p>
                                        <p className="mt-1 text-xs text-gray-400">{producto.codigo} · {producto.categoria}</p>
                                    </div>
                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                        Stock: {producto.stock}
                                    </span>
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-2">
                                    <span className="font-bold text-gray-800">{moneda(producto.precio)}</span>
                                    <button
                                        onClick={() => agregarProducto(producto)}
                                        disabled={producto.stock === 0}
                                        className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Plus size={16} /> Agregar
                                    </button>
                                </div>
                            </article>
                        ))}
                        {productosFiltrados.length === 0 && (
                            <p className="col-span-full py-8 text-center text-sm text-gray-500">
                                No se encontraron productos.
                            </p>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="flex items-center gap-2 font-semibold text-gray-800">
                            <ShoppingCart size={19} /> Carrito de venta
                        </h2>
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                            {carrito.reduce((s, item) => s + item.cantidad, 0)} artículo(s)
                        </span>
                    </div>

                    <label className="mt-5 block text-sm font-medium text-gray-700">
                        Almacén de venta
                        <select value={almacenSel || almacenId || ''} onChange={e => { setAlmacenSel(e.target.value); setCarrito([]); }} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5">
                            {almacenes.filter(a => a.activo).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                    </label>
                    <label className="mt-5 block text-sm font-medium text-gray-700">
                        Cliente registrado (opcional)
                        <select value={clienteId} onChange={e => { const c = clientes.find(x => x.id === e.target.value); setClienteId(e.target.value); if (c) setCliente(c.name); }} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5">
                            <option value="">Cliente de mostrador o nombre libre</option>
                            {clientes.filter(c => c.status === 'Activo').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                    <label className="mt-5 block text-sm font-medium text-gray-700">
                        Nombre para el comprobante
                        <input
                            value={cliente}
                            onChange={(e) => { setCliente(e.target.value); setClienteId(''); }}
                            placeholder="Nombre del cliente"
                            className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-orange-400"
                        />
                    </label>

                    <div className="mt-5 space-y-3">
                        {carrito.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-800">{item.nombre}</p>
                                    <p className="mt-1 text-xs text-gray-500">{moneda(item.precio)} por unidad</p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <button
                                            onClick={() => cambiarCantidad(item.id, -1)}
                                            aria-label={`Disminuir ${item.nombre}`}
                                            className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="text-sm font-semibold">{item.cantidad}</span>
                                        <button
                                            onClick={() => cambiarCantidad(item.id, 1)}
                                            aria-label={`Aumentar ${item.nombre}`}
                                            className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-800">{moneda(item.precio * item.cantidad)}</p>
                                    <button
                                        onClick={() => setCarrito((actual) => actual.filter((p) => p.id !== item.id))}
                                        className="mt-2 text-xs text-red-600 hover:underline"
                                    >
                                        <Trash2 size={14} className="inline" /> Quitar
                                    </button>
                                </div>
                            </div>
                        ))}
                        {carrito.length === 0 && (
                            <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
                                <ShoppingCart size={27} className="mx-auto text-gray-300" />
                                <p className="mt-2 text-sm text-gray-500">El carrito está vacío.</p>
                                <p className="mt-1 text-xs text-gray-400">Selecciona productos para comenzar.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Descuento general (%)
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={descuento}
                                onChange={(e) => setDescuento(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-orange-400"
                            />
                        </label>

                        <label className="block text-sm font-medium text-gray-700">
                            Método de pago
                            <select
                                value={metodoPago}
                                onChange={(e) => setMetodoPago(e.target.value)}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-orange-400"
                            >
                                <option>Efectivo</option>
                                <option>Transferencia</option>
                                <option>Tarjeta</option>
                            </select>
                        </label>

                        <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span><span>{moneda(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Descuento</span><span>- {moneda(descuentoAplicado)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-800">
                                <span>Total</span><span>{moneda(total)}</span>
                            </div>
                        </div>

                        <button
                            onClick={finalizarVenta}
                            disabled={guardando || carrito.length === 0}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <CreditCard size={18} /> Registrar venta
                        </button>
                        <button
                            onClick={limpiarCarrito}
                            disabled={carrito.length === 0}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Trash2 size={16} /> Limpiar carrito
                        </button>
                    </div>
                </section>
            </div>

            {comprobante && (
                <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-1 text-green-700" size={24} />
                            <div>
                                <h2 className="font-semibold text-green-900">Venta registrada</h2>
                                <p className="mt-1 text-sm text-green-800">
                                    Factura {comprobante.factura} · Venta {comprobante.id} · {comprobante.fecha}
                                </p>
                                <p className="mt-1 text-sm text-green-800">
                                    Cliente: {comprobante.cliente} · Pago: {comprobante.metodo}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={async () => { try { const v = await api(`/ventas/${comprobante.ventaId}`); setFactura((await api(`/facturas/${v.data.factura_id}`)).data); } catch (e) { reportApiError(e); } }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
                        >
                            <Receipt size={17} /> Ver e imprimir factura
                        </button>
                    </div>
                    <div className="mt-4 space-y-2 border-t border-green-200 pt-4">
                        {comprobante.productos.map((item) => (
                            <div key={item.id} className="flex justify-between gap-3 text-sm text-green-900">
                                <span>{item.nombre} × {item.cantidad}</span>
                                <span>{moneda(item.precio * item.cantidad)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between border-t border-green-200 pt-3 font-bold text-green-900">
                            <span>Total pagado</span><span>{moneda(comprobante.total)}</span>
                        </div>
                    </div>
                </section>
            )}

            {factura && <DocumentoModal titulo={`Factura ${factura.numero}`} onClose={() => setFactura(null)}><FacturaDoc f={factura} /></DocumentoModal>}
            <p className="text-xs text-gray-400">
                La factura es un comprobante interno y no sustituye la factura fiscal.
            </p>
        </div>
    );
}
