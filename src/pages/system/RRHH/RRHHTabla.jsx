
import { useMemo, useState } from 'react';
import { Plus, Search, X, Users } from 'lucide-react';

export default function RRHHTabla({
    titulo,
    descripcion,
    icono: Icono = Users,
    columnas,
    campos,
    datosIniciales = [],
    indicadores = [],
    filtroEstado = false,
    textoNuevo = 'Nuevo registro',
}) {
    const [datos, setDatos] = useState(datosIniciales);
    const [busqueda, setBusqueda] = useState('');
    const [estado, setEstado] = useState('Todos');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [seleccionado, setSeleccionado] = useState(null);
    const [formulario, setFormulario] = useState({});

    const estados = useMemo(
        () => [...new Set(datos.map((item) => item.estado).filter(Boolean))],
        [datos]
    );

    const datosFiltrados = datos.filter((item) => {
        const coincideBusqueda = Object.values(item).some((valor) =>
            String(valor ?? '').toLowerCase().includes(busqueda.toLowerCase())
        );
        return coincideBusqueda &&
            (estado === 'Todos' || item.estado === estado);
    });

    const guardarRegistro = (e) => {
        e.preventDefault();
        setDatos((actuales) => [
            { ...formulario, id: Date.now() },
            ...actuales,
        ]);
        setFormulario({});
        setMostrarFormulario(false);
    };

    const actualizarCampo = (nombre, valor) => {
        setFormulario((actual) => ({ ...actual, [nombre]: valor }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-orange-600">
                        <Icono size={18} />
                        Gestión de recursos humanos
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">{titulo}</h1>
                    <p className="mt-1 text-sm text-gray-500">{descripcion}</p>
                </div>

                <button
                    onClick={() => {
                        setFormulario({});
                        setMostrarFormulario(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    <Plus size={18} />
                    {textoNuevo}
                </button>
            </div>

            {indicadores.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {indicadores.map((item) => (
                        <div
                            key={item.titulo}
                            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                        >
                            <p className="text-sm text-gray-500">{item.titulo}</p>
                            <p className="mt-2 text-2xl font-bold text-gray-800">{item.valor}</p>
                            {item.detalle && (
                                <p className="mt-2 text-xs text-gray-400">{item.detalle}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar registros..."
                            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    {filtroEstado && (
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                        >
                            <option value="Todos">Todos los estados</option>
                            {estados.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                                {columnas.map((columna) => (
                                    <th key={columna.campo} className="px-4 py-3 font-semibold">
                                        {columna.titulo}
                                    </th>
                                ))}
                                <th className="px-4 py-3 font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {datosFiltrados.map((fila) => (
                                <tr key={fila.id} className="hover:bg-orange-50/40">
                                    {columnas.map((columna) => (
                                        <td key={columna.campo} className="px-4 py-4 text-gray-700">
                                            {columna.campo === 'estado' ? (
                                                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                    {fila[columna.campo] || 'Sin estado'}
                                                </span>
                                            ) : (
                                                fila[columna.campo] || '—'
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => setSeleccionado(fila)}
                                            className="font-medium text-orange-600 hover:text-orange-700"
                                        >
                                            Ver detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {datosFiltrados.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={columnas.length + 1}
                                        className="px-4 py-10 text-center text-gray-500"
                                    >
                                        No se encontraron registros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="mt-4 text-xs text-gray-400">
                    Mostrando {datosFiltrados.length} de {datos.length} registros de demostración.
                </p>
            </div>

            {mostrarFormulario && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">{textoNuevo}</h2>
                            <button
                                type="button"
                                onClick={() => setMostrarFormulario(false)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                                aria-label="Cerrar formulario"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={guardarRegistro} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {campos.map((campo) => (
                                    <label key={campo.nombre} className="space-y-1 text-sm">
                                        <span className="font-medium text-gray-700">{campo.etiqueta}</span>
                                        {campo.opciones ? (
                                            <select
                                                required={campo.requerido !== false}
                                                value={formulario[campo.nombre] ?? ''}
                                                onChange={(e) => actualizarCampo(campo.nombre, e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-orange-400"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {campo.opciones.map((opcion) => (
                                                    <option key={opcion} value={opcion}>{opcion}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                required={campo.requerido !== false}
                                                type={campo.tipo || 'text'}
                                                value={formulario[campo.nombre] ?? ''}
                                                onChange={(e) => actualizarCampo(campo.nombre, e.target.value)}
                                                placeholder={campo.placeholder || ''}
                                                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-orange-400"
                                            />
                                        )}
                                    </label>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setMostrarFormulario(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                                >
                                    Guardar registro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {seleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">Detalle del registro</h2>
                            <button
                                onClick={() => setSeleccionado(null)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                                aria-label="Cerrar detalle"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {columnas.map((columna) => (
                                <div key={columna.campo} className="flex justify-between gap-4 border-b border-gray-100 py-2">
                                    <span className="text-sm text-gray-500">{columna.titulo}</span>
                                    <span className="text-right text-sm font-medium text-gray-800">
                                        {seleccionado[columna.campo] || '—'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setSeleccionado(null)}
                            className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
