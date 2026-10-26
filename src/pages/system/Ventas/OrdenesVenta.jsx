
import { useState } from 'react';
import {
    Search,
    Eye,
    PackageCheck,
    ShoppingBag,
    Clock3,
    X,
    CheckCircle2,
    Truck,
    Ban,
} from 'lucide-react';

const ordenesIniciales = [
    {
        id: 'OV-1001',
        fecha: '2026-10-25',
        cliente: 'María López',
        telefono: '8888-1001',
        productos: [
            { nombre: 'Billetera clásica', cantidad: 2, precio: 850 },
            { nombre: 'Llavero de cuero', cantidad: 1, precio: 180 },
        ],
        metodo: 'Efectivo',
        estado: 'Pendiente',
        notas: 'Entrega en tienda',
    },
    {
        id: 'OV-1002',
        fecha: '2026-10-24',
        cliente: 'Ana Martínez',
        telefono: '8888-1002',
        productos: [{ nombre: 'Bolso artesanal', cantidad: 1, precio: 2450 }],
        metodo: 'Transferencia',
        estado: 'En preparación',
        notas: 'Empaque para regalo',
    },
    {
        id: 'OV-1003',
        fecha: '2026-10-23',
        cliente: 'Lucía García',
        telefono: '8888-1003',
        productos: [{ nombre: 'Cartera elegante', cantidad: 1, precio: 3200 }],
        metodo: 'Tarjeta',
        estado: 'Enviada',
        notas: 'Coordinar entrega con cliente',
    },
    {
        id: 'OV-1004',
        fecha: '2026-10-21',
        cliente: 'Carolina Ruiz',
        telefono: '8888-1004',
        productos: [
            { nombre: 'Monedero pequeño', cantidad: 2, precio: 450 },
            { nombre: 'Porta documentos', cantidad: 1, precio: 1150 },
        ],
        metodo: 'Transferencia',
        estado: 'Completada',
        notas: '',
    },
    {
        id: 'OV-1005',
        fecha: '2026-10-20',
        cliente: 'Elena Pérez',
        telefono: '8888-1005',
        productos: [{ nombre: 'Bolso artesanal', cantidad: 1, precio: 2450 }],
        metodo: 'Efectivo',
        estado: 'Cancelada',
        notas: 'Cancelación solicitada por el cliente',
    },
];

const estados = ['Pendiente', 'En preparación', 'Enviada', 'Completada', 'Cancelada'];

const moneda = (valor) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(valor);

const totalOrden = (orden) =>
    orden.productos.reduce((suma, p) => suma + p.cantidad * p.precio, 0);

const colorEstado = (estado) => ({
    Pendiente: 'bg-amber-50 text-amber-700',
    'En preparación': 'bg-blue-50 text-blue-700',
    Enviada: 'bg-violet-50 text-violet-700',
    Completada: 'bg-green-50 text-green-700',
    Cancelada: 'bg-red-50 text-red-700',
}[estado] || 'bg-gray-100 text-gray-600');

export default function OrdenesVentas() {
    const [ordenes, setOrdenes] = useState(ordenesIniciales);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
    const [mensaje, setMensaje] = useState('');

    const ordenesFiltradas = ordenes.filter((orden) => {
        const texto = `${orden.id} ${orden.cliente}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase()) &&
            (filtroEstado === 'Todos' || orden.estado === filtroEstado);
    });

    const cambiarEstado = (id, nuevoEstado) => {
        const orden = ordenes.find((o) => o.id === id);

        if (orden?.estado === 'Cancelada' || orden?.estado === 'Completada') {
            setMensaje('Esta orden ya tiene un estado final y no puede modificarse.');
            return;
        }

        if (nuevoEstado === 'Pendiente' && orden?.estado !== 'Pendiente') {
            setMensaje('No se puede regresar una orden a estado pendiente.');
            return;
        }

        setOrdenes((actuales) =>
            actuales.map((o) => o.id === id ? { ...o, estado: nuevoEstado } : o)
        );
        setOrdenSeleccionada((actual) =>
            actual?.id === id ? { ...actual, estado: nuevoEstado } : actual
        );
        setMensaje(`La orden ${id} ahora está: ${nuevoEstado}.`);
    };

    const indicadores = [
        { titulo: 'Total de órdenes', valor: ordenes.length, Icon: ShoppingBag },
        { titulo: 'Pendientes', valor: ordenes.filter((o) => o.estado === 'Pendiente').length, Icon: Clock3 },
        { titulo: 'En preparación', valor: ordenes.filter((o) => o.estado === 'En preparación').length, Icon: PackageCheck },
        { titulo: 'Completadas', valor: ordenes.filter((o) => o.estado === 'Completada').length, Icon: CheckCircle2 },
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div>
                <p className="text-sm text-gray-500">Ventas y órdenes / Órdenes de venta</p>
                <h1 className="mt-1 text-2xl font-bold text-gray-800">Órdenes de venta</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Consulta las órdenes y da seguimiento a su proceso de entrega.
                </p>
            </div>

            {mensaje && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-800">
                    <span>{mensaje}</span>
                    <button onClick={() => setMensaje('')} aria-label="Cerrar mensaje"><X size={17} /></button>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {indicadores.map(({ titulo, valor, Icon }) => (
                    <article key={titulo} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{titulo}</p>
                            <Icon size={21} className="text-orange-700" />
                        </div>
                        <p className="mt-3 text-2xl font-bold text-gray-800">{valor}</p>
                    </article>
                ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 p-5">
                    <h2 className="font-semibold text-gray-800">Listado de órdenes</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="relative">
                            <Search size={17} className="absolute left-3 top-3 text-gray-400" />
                            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por código o cliente"
                                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
                        </div>
                        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400">
                            <option>Todos</option>
                            {estados.map((estado) => <option key={estado}>{estado}</option>)}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-3">Orden</th>
                                <th className="px-5 py-3">Fecha</th>
                                <th className="px-5 py-3">Cliente</th>
                                <th className="px-5 py-3">Artículos</th>
                                <th className="px-5 py-3">Total</th>
                                <th className="px-5 py-3">Estado</th>
                                <th className="px-5 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {ordenesFiltradas.map((orden) => (
                                <tr key={orden.id} className="hover:bg-orange-50/30">
                                    <td className="px-5 py-4 font-semibold text-gray-800">{orden.id}</td>
                                    <td className="px-5 py-4 text-gray-600">{orden.fecha}</td>
                                    <td className="px-5 py-4 text-gray-700">{orden.cliente}</td>
                                    <td className="px-5 py-4 text-gray-600">
                                        {orden.productos.reduce((s, p) => s + p.cantidad, 0)}
                                    </td>
                                    <td className="px-5 py-4 font-semibold">{moneda(totalOrden(orden))}</td>
                                    <td className="px-5 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${colorEstado(orden.estado)}`}>
                                            {orden.estado}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button onClick={() => setOrdenSeleccionada(orden)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                                            <Eye size={15} /> Ver detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!ordenesFiltradas.length && (
                                <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-500">No hay órdenes para estos filtros.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {ordenSeleccionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setOrdenSeleccionada(null)}>
                    <section role="dialog" aria-modal="true" aria-label="Detalle de orden"
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl md:p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm text-gray-500">Detalle de orden</p>
                                <h2 className="mt-1 text-xl font-bold text-gray-800">{ordenSeleccionada.id}</h2>
                            </div>
                            <button onClick={() => setOrdenSeleccionada(null)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Cerrar">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                            <p className="text-sm text-gray-600">Cliente: <strong className="text-gray-800">{ordenSeleccionada.cliente}</strong></p>
                            <p className="text-sm text-gray-600">Teléfono: <strong className="text-gray-800">{ordenSeleccionada.telefono}</strong></p>
                            <p className="text-sm text-gray-600">Fecha: <strong className="text-gray-800">{ordenSeleccionada.fecha}</strong></p>
                            <p className="text-sm text-gray-600">Pago: <strong className="text-gray-800">{ordenSeleccionada.metodo}</strong></p>
                        </div>

                        <h3 className="mt-5 font-semibold text-gray-800">Productos</h3>
                        <div className="mt-3 space-y-3">
                            {ordenSeleccionada.productos.map((p, i) => (
                                <div key={`${p.nombre}-${i}`} className="flex justify-between gap-3 border-b border-gray-100 pb-3 text-sm">
                                    <span className="text-gray-600">{p.nombre} × {p.cantidad}</span>
                                    <span className="font-medium text-gray-800">{moneda(p.precio * p.cantidad)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-between text-lg font-bold text-gray-800">
                            <span>Total</span><span>{moneda(totalOrden(ordenSeleccionada))}</span>
                        </div>

                        {ordenSeleccionada.notas && (
                            <p className="mt-4 rounded-xl bg-orange-50 p-3 text-sm text-orange-800">
                                <strong>Nota:</strong> {ordenSeleccionada.notas}
                            </p>
                        )}

                        <label className="mt-5 block text-sm font-medium text-gray-700">
                            Actualizar estado
                            <select
                                value={ordenSeleccionada.estado}
                                disabled={['Completada', 'Cancelada'].includes(ordenSeleccionada.estado)}
                                onChange={(e) => cambiarEstado(ordenSeleccionada.id, e.target.value)}
                                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 disabled:bg-gray-100"
                            >
                                {estados.map((estado) => <option key={estado}>{estado}</option>)}
                            </select>
                        </label>

                        {!['Completada', 'Cancelada'].includes(ordenSeleccionada.estado) && (
                            <div className="mt-4 flex flex-wrap justify-end gap-2">
                                {ordenSeleccionada.estado !== 'Completada' && (
                                    <button onClick={() => cambiarEstado(ordenSeleccionada.id, 'Completada')}
                                        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                                        <CheckCircle2 size={16} /> Marcar completada
                                    </button>
                                )}
                                <button onClick={() => cambiarEstado(ordenSeleccionada.id, 'Cancelada')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                                    <Ban size={16} /> Cancelar orden
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            )}

            <p className="text-xs text-gray-400">
                Simulación local: los cambios de estado se mantienen en memoria mientras la página está abierta.
            </p>
        </div>
    );
}
