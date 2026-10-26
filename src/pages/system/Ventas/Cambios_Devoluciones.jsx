import { useMemo, useState } from 'react';
import {
    Search,
    RefreshCcw,
    RotateCcw,
    CheckCircle2,
    Clock3,
    XCircle,
    Eye,
    X,
    Plus,
    Filter,
    UserRound,
    CalendarDays,
    FileText,
} from 'lucide-react';

const solicitudesIniciales = [
    {
        id: 'CD-1001',
        fecha: '2026-10-20',
        cliente: 'María López',
        producto: 'Bolso artesanal clásico',
        tipo: 'Cambio',
        motivo: 'El cliente solicita otro color.',
        estado: 'Pendiente',
        responsable: 'Usuaria Admin',
        observaciones: 'Verificar disponibilidad del color solicitado.',
    },
    {
        id: 'CD-1002',
        fecha: '2026-10-21',
        cliente: 'Carlos Mendoza',
        producto: 'Billetera de cuero',
        tipo: 'Devolución',
        motivo: 'El producto no corresponde a lo solicitado.',
        estado: 'En revisión',
        responsable: 'Usuaria Admin',
        observaciones: 'Revisar el producto y la factura de venta.',
    },
    {
        id: 'CD-1003',
        fecha: '2026-10-22',
        cliente: 'Ana Martínez',
        producto: 'Cartera de mano',
        tipo: 'Cambio',
        motivo: 'Solicita un modelo diferente.',
        estado: 'Aprobada',
        responsable: 'Usuaria Admin',
        observaciones: 'Cambio autorizado, sujeto a disponibilidad.',
    },
    {
        id: 'CD-1004',
        fecha: '2026-10-23',
        cliente: 'José Ramírez',
        producto: 'Monedero artesanal',
        tipo: 'Devolución',
        motivo: 'Presenta un defecto de fabricación.',
        estado: 'Completada',
        responsable: 'Usuaria Admin',
        observaciones: 'Caso resuelto según revisión de demostración.',
    },
    {
        id: 'CD-1005',
        fecha: '2026-10-24',
        cliente: 'Lucía Torres',
        producto: 'Bolso de hombro',
        tipo: 'Cambio',
        motivo: 'Solicita una revisión del producto recibido.',
        estado: 'Rechazada',
        responsable: 'Usuaria Admin',
        observaciones: 'No cumple con los criterios de cambio de ejemplo.',
    },
];

const estados = [
    'Pendiente',
    'En revisión',
    'Aprobada',
    'Rechazada',
    'Completada',
];

const moneda = (valor) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(valor);

const estiloEstado = {
    Pendiente: 'bg-amber-100 text-amber-700',
    'En revisión': 'bg-blue-100 text-blue-700',
    Aprobada: 'bg-green-100 text-green-700',
    Rechazada: 'bg-red-100 text-red-700',
    Completada: 'bg-gray-100 text-gray-700',
};

const fechaHoy = () => {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
};

const formularioVacio = () => ({
    cliente: '',
    producto: '',
    tipo: 'Cambio',
    motivo: '',
    observaciones: '',
});

export default function Cambios_Devoluciones() {
    const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('Todos');
    const [filtroEstado, setFiltroEstado] = useState('Todos');
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [modalNueva, setModalNueva] = useState(false);
    const [formulario, setFormulario] = useState(formularioVacio);
    const [error, setError] = useState('');

    const solicitudesFiltradas = useMemo(() => {
        return solicitudes
            .filter((solicitud) => {
                const texto = busqueda.toLowerCase();

                const coincideTexto =
                    solicitud.id.toLowerCase().includes(texto) ||
                    solicitud.cliente.toLowerCase().includes(texto) ||
                    solicitud.producto.toLowerCase().includes(texto);

                const coincideTipo =
                    filtroTipo === 'Todos' || solicitud.tipo === filtroTipo;

                const coincideEstado =
                    filtroEstado === 'Todos' || solicitud.estado === filtroEstado;

                return coincideTexto && coincideTipo && coincideEstado;
            })
            .sort((a, b) => b.fecha.localeCompare(a.fecha));
    }, [solicitudes, busqueda, filtroTipo, filtroEstado]);

    const pendientes = solicitudes.filter(
        (s) => s.estado === 'Pendiente' || s.estado === 'En revisión',
    ).length;

    const aprobadas = solicitudes.filter(
        (s) => s.estado === 'Aprobada',
    ).length;

    const completadas = solicitudes.filter(
        (s) => s.estado === 'Completada',
    ).length;

    const actualizaciones = (id, cambios) => {
        setSolicitudes((actuales) =>
            actuales.map((solicitud) =>
                solicitud.id === id ? { ...solicitud, ...cambios } : solicitud,
            ),
        );

        setSolicitudSeleccionada((actual) =>
            actual?.id === id ? { ...actual, ...cambios } : actual,
        );
    };

    const registrarSolicitud = (e) => {
        e.preventDefault();
        setError('');

        if (
            !formulario.cliente.trim() ||
            !formulario.producto.trim() ||
            !formulario.motivo.trim()
        ) {
            setError('Completa el nombre del cliente, producto y motivo.');
            return;
        }

        const siguienteNumero =
            Math.max(
                1000,
                ...solicitudes.map((s) => Number(s.id.replace('CD-', '')) || 0),
            ) + 1;

        const nuevaSolicitud = {
            id: `CD-${siguienteNumero}`,
            fecha: fechaHoy(),
            cliente: formulario.cliente.trim(),
            producto: formulario.producto.trim(),
            tipo: formulario.tipo,
            motivo: formulario.motivo.trim(),
            estado: 'Pendiente',
            responsable: 'Usuaria Admin',
            observaciones: formulario.observaciones.trim() || 'Sin observaciones.',
        };

        setSolicitudes((actuales) => [nuevaSolicitud, ...actuales]);
        setFormulario(formularioVacio());
        setModalNueva(false);
    };

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-500">
                        Ventas / Cambios y devoluciones
                    </p>
                    <h1 className="mt-1 text-2xl font-bold text-gray-800">
                        Cambios y devoluciones
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Registra solicitudes y da seguimiento a su resolución.
                    </p>
                </div>

                <button
                    onClick={() => {
                        setError('');
                        setFormulario(formularioVacio());
                        setModalNueva(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                >
                    <Plus size={18} />
                    Registrar solicitud
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Solicitudes registradas</p>
                        <FileText size={21} className="text-orange-500" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">
                        {solicitudes.length}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">Total de casos</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">En proceso</p>
                        <Clock3 size={21} className="text-amber-500" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{pendientes}</p>
                    <p className="mt-1 text-xs text-gray-400">Pendientes o en revisión</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Aprobadas</p>
                        <CheckCircle2 size={21} className="text-green-600" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{aprobadas}</p>
                    <p className="mt-1 text-xs text-gray-400">Esperan resolución final</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Completadas</p>
                        <RotateCcw size={21} className="text-blue-600" />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{completadas}</p>
                    <p className="mt-1 text-xs text-gray-400">Casos finalizados</p>
                </div>
            </div>

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
                <div className="mb-4 flex items-center gap-2">
                    <Filter size={19} className="text-orange-500" />
                    <h2 className="font-semibold text-gray-800">Buscar y filtrar</h2>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Código, cliente o producto..."
                            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                    >
                        <option value="Todos">Todos los tipos</option>
                        <option value="Cambio">Cambios</option>
                        <option value="Devolución">Devoluciones</option>
                    </select>

                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                    >
                        <option value="Todos">Todos los estados</option>
                        {estados.map((estado) => (
                            <option key={estado} value={estado}>
                                {estado}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="font-semibold text-gray-800">Registro de solicitudes</h2>
                    <span className="text-sm text-gray-500">
                        {solicitudesFiltradas.length} caso(s)
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Solicitud</th>
                                <th className="px-5 py-3 font-semibold">Cliente / Producto</th>
                                <th className="px-5 py-3 font-semibold">Tipo</th>
                                <th className="px-5 py-3 font-semibold">Fecha</th>
                                <th className="px-5 py-3 font-semibold">Estado</th>
                                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {solicitudesFiltradas.map((solicitud) => (
                                <tr key={solicitud.id} className="hover:bg-orange-50/40">
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-gray-800">{solicitud.id}</p>
                                        <p className="mt-1 text-xs text-gray-400">
                                            {solicitud.motivo}
                                        </p>
                                    </td>

                                    <td className="px-5 py-4">
                                        <p className="font-medium text-gray-800">
                                            {solicitud.cliente}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {solicitud.producto}
                                        </p>
                                    </td>

                                    <td className="px-5 py-4">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${solicitud.tipo === 'Cambio'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-purple-100 text-purple-700'
                                                }`}
                                        >
                                            {solicitud.tipo}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4 text-gray-600">
                                        {solicitud.fecha}
                                    </td>

                                    <td className="px-5 py-4">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${estiloEstado[solicitud.estado]}`}
                                        >
                                            {solicitud.estado}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => setSolicitudSeleccionada(solicitud)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                                        >
                                            <Eye size={15} />
                                            Ver / gestionar
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {solicitudesFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <RefreshCcw
                                            className="mx-auto mb-3 text-gray-300"
                                            size={32}
                                        />
                                        <p className="font-medium text-gray-700">
                                            No hay solicitudes coincidentes
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Cambia los filtros o registra una nueva solicitud.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {modalNueva && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
                    <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-start justify-between border-b border-gray-100 p-5">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    Registrar solicitud
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Ingresa los datos del cambio o devolución.
                                </p>
                            </div>
                            <button
                                onClick={() => setModalNueva(false)}
                                aria-label="Cerrar formulario"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={registrarSolicitud} className="space-y-4 p-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Cliente *
                                    </label>
                                    <input
                                        value={formulario.cliente}
                                        onChange={(e) =>
                                            setFormulario({
                                                ...formulario,
                                                cliente: e.target.value,
                                            })
                                        }
                                        placeholder="Nombre del cliente"
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Producto *
                                    </label>
                                    <input
                                        value={formulario.producto}
                                        onChange={(e) =>
                                            setFormulario({
                                                ...formulario,
                                                producto: e.target.value,
                                            })
                                        }
                                        placeholder="Producto involucrado"
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Tipo de solicitud *
                                </label>
                                <select
                                    value={formulario.tipo}
                                    onChange={(e) =>
                                        setFormulario({ ...formulario, tipo: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                                >
                                    <option value="Cambio">Cambio</option>
                                    <option value="Devolución">Devolución</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Motivo *
                                </label>
                                <textarea
                                    value={formulario.motivo}
                                    onChange={(e) =>
                                        setFormulario({ ...formulario, motivo: e.target.value })
                                    }
                                    placeholder="Describe brevemente el motivo de la solicitud"
                                    rows={3}
                                    className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Observaciones
                                </label>
                                <textarea
                                    value={formulario.observaciones}
                                    onChange={(e) =>
                                        setFormulario({
                                            ...formulario,
                                            observaciones: e.target.value,
                                        })
                                    }
                                    placeholder="Notas adicionales (opcional)"
                                    rows={2}
                                    className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                                />
                            </div>

                            {error && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {error}
                                </p>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModalNueva(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                                >
                                    Guardar solicitud
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {solicitudSeleccionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
                    <div className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-start justify-between border-b border-gray-100 p-5">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Solicitud {solicitudSeleccionada.id}
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-gray-800">
                                    Detalle y seguimiento
                                </h2>
                            </div>
                            <button
                                onClick={() => setSolicitudSeleccionada(null)}
                                aria-label="Cerrar detalle"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-gray-100 p-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <UserRound size={15} />
                                        Cliente
                                    </div>
                                    <p className="mt-1 font-medium text-gray-800">
                                        {solicitudSeleccionada.cliente}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-100 p-3">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <CalendarDays size={15} />
                                        Fecha de registro
                                    </div>
                                    <p className="mt-1 font-medium text-gray-800">
                                        {solicitudSeleccionada.fecha}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">Producto</p>
                                <p className="mt-1 font-medium text-gray-800">
                                    {solicitudSeleccionada.producto}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">Tipo de solicitud</p>
                                <p className="mt-1 font-medium text-gray-800">
                                    {solicitudSeleccionada.tipo}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">Motivo</p>
                                <p className="mt-1 text-sm leading-6 text-gray-700">
                                    {solicitudSeleccionada.motivo}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">Observaciones</p>
                                <p className="mt-1 text-sm leading-6 text-gray-700">
                                    {solicitudSeleccionada.observaciones || 'Sin observaciones.'}
                                </p>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-4">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Actualizar estado
                                </label>
                                <select
                                    value={solicitudSeleccionada.estado}
                                    onChange={(e) =>
                                        actualizaciones(solicitudSeleccionada.id, {
                                            estado: e.target.value,
                                        })
                                    }
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                                >
                                    {estados.map((estado) => (
                                        <option key={estado} value={estado}>
                                            {estado}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-2 text-xs text-gray-500">
                                    El estado se actualiza en esta sesión de demostración.
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Observaciones de seguimiento
                                </label>
                                <textarea
                                    key={solicitudSeleccionada.id}
                                    defaultValue={solicitudSeleccionada.observaciones}
                                    onBlur={(e) =>
                                        actualizaciones(solicitudSeleccionada.id, {
                                            observaciones: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                                    placeholder="Añade notas sobre la revisión o resolución"
                                />
                            </div>

                            {solicitudSeleccionada.estado === 'Completada' && (
                                <p className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                                    <CheckCircle2 size={18} />
                                    Esta solicitud figura como completada.
                                </p>
                            )}

                            {solicitudSeleccionada.estado === 'Rechazada' && (
                                <p className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    <XCircle size={18} />
                                    Esta solicitud figura como rechazada.
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-gray-100 p-5">
                            <button
                                onClick={() => setSolicitudSeleccionada(null)}
                                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}