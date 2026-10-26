
import { useState } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';

const empleados = [
    { id: 1, codigo: 'EMP-001', nombre: 'Colaborador 001', area: 'Administración', puesto: 'Responsable administrativo', ingreso: '2022-03-15', estado: 'Activo' },
    { id: 2, codigo: 'EMP-002', nombre: 'Colaborador 002', area: 'Producción', puesto: 'Artesano/a', ingreso: '2023-06-01', estado: 'Activo' },
    { id: 3, codigo: 'EMP-003', nombre: 'Colaborador 003', area: 'Comercial', puesto: 'Ventas', ingreso: '2024-01-10', estado: 'Activo' },
    { id: 4, codigo: 'EMP-004', nombre: 'Colaborador 004', area: 'Logística', puesto: 'Control de inventario', ingreso: '2024-05-20', estado: 'Inactivo' },
];

export default function Reportes_Empleados() {
    const [area, setArea] = useState('Todas');
    const [estado, setEstado] = useState('Todos');

    const filtrados = empleados.filter((empleado) =>
        (area === 'Todas' || empleado.area === area) &&
        (estado === 'Todos' || empleado.estado === estado)
    );

    const descargarCSV = () => {
        const encabezados = [
            'Código',
            'Nombre',
            'Área',
            'Puesto',
            'Fecha de ingreso',
            'Estado',
        ];

        const filas = filtrados.map((empleado) => [
            empleado.codigo,
            empleado.nombre,
            empleado.area,
            empleado.puesto,
            empleado.ingreso,
            empleado.estado,
        ]);

        const escapar = (valor) =>
            `"${String(valor).replace(/"/g, '""')}"`;

        const contenido = [encabezados, ...filas]
            .map((fila) => fila.map(escapar).join(';'))
            .join('\n');

        const archivo = new Blob(['\uFEFF' + contenido], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'reporte_empleados.csv';
        enlace.click();
        URL.revokeObjectURL(url);
    };

    const activos = filtrados.filter((item) => item.estado === 'Activo').length;
    const inactivos = filtrados.filter((item) => item.estado === 'Inactivo').length;
    const areas = new Set(filtrados.map((item) => item.area)).size;

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-orange-600">
                        <FileSpreadsheet size={18} />
                        Reportes de RRHH
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Reportes de empleados</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Consulta y exporta información general del personal.
                    </p>
                </div>

                <button
                    onClick={descargarCSV}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    <Download size={18} />
                    Exportar CSV
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { titulo: 'Empleados en el reporte', valor: filtrados.length },
                    { titulo: 'Personal activo', valor: activos },
                    { titulo: 'Áreas representadas', valor: areas },
                ].map((item) => (
                    <div key={item.titulo} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-500">{item.titulo}</p>
                        <p className="mt-2 text-2xl font-bold text-gray-800">{item.valor}</p>
                        <p className="mt-2 text-xs text-gray-400">Datos de demostración</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-gray-800">Filtros del reporte</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm">
                        <span className="font-medium text-gray-700">Área de trabajo</span>
                        <select
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400"
                        >
                            <option>Todas</option>
                            <option>Administración</option>
                            <option>Producción</option>
                            <option>Comercial</option>
                            <option>Logística</option>
                        </select>
                    </label>

                    <label className="space-y-2 text-sm">
                        <span className="font-medium text-gray-700">Estado laboral</span>
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400"
                        >
                            <option>Todos</option>
                            <option>Activo</option>
                            <option>Inactivo</option>
                        </select>
                    </label>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-bold text-gray-800">Listado de empleados</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {filtrados.length} registros encontrados
                        </p>
                    </div>
                    <span className="text-sm text-gray-500">
                        Inactivos: {inactivos}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                        <thead>
                            <tr className="border-b text-xs uppercase text-gray-500">
                                <th className="px-3 py-3">Código</th>
                                <th className="px-3 py-3">Empleado</th>
                                <th className="px-3 py-3">Área</th>
                                <th className="px-3 py-3">Puesto</th>
                                <th className="px-3 py-3">Fecha de ingreso</th>
                                <th className="px-3 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtrados.map((empleado) => (
                                <tr key={empleado.id}>
                                    <td className="px-3 py-4 text-gray-500">{empleado.codigo}</td>
                                    <td className="px-3 py-4 font-medium text-gray-800">{empleado.nombre}</td>
                                    <td className="px-3 py-4 text-gray-600">{empleado.area}</td>
                                    <td className="px-3 py-4 text-gray-600">{empleado.puesto}</td>
                                    <td className="px-3 py-4 text-gray-600">{empleado.ingreso}</td>
                                    <td className="px-3 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs ${empleado.estado === 'Activo'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {empleado.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filtrados.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-10 text-center text-gray-500">
                                        No hay empleados que coincidan con los filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
