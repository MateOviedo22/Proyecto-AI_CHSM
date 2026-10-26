
import { Users, UserCheck, CalendarCheck, ClipboardList } from 'lucide-react';

const empleados = [
    { id: 1, nombre: 'Colaborador 001', puesto: 'Administración', area: 'Administración', estado: 'Activo' },
    { id: 2, nombre: 'Colaborador 002', puesto: 'Artesanía', area: 'Producción', estado: 'Activo' },
    { id: 3, nombre: 'Colaborador 003', puesto: 'Ventas', area: 'Comercial', estado: 'Activo' },
    { id: 4, nombre: 'Colaborador 004', puesto: 'Control de inventario', area: 'Logística', estado: 'Activo' },
];

const indicadores = [
    { titulo: 'Total de empleados', valor: '17', icono: Users, color: 'bg-orange-50 text-orange-600' },
    { titulo: 'Personal activo', valor: '16', icono: UserCheck, color: 'bg-green-50 text-green-600' },
    { titulo: 'Asistencias de hoy', valor: '14', icono: CalendarCheck, color: 'bg-blue-50 text-blue-600' },
    { titulo: 'Solicitudes pendientes', valor: '3', icono: ClipboardList, color: 'bg-amber-50 text-amber-600' },
];

export default function Panel_RRHH() {
    return (
        <div className="space-y-6">
            <div>
                <p className="mb-2 text-sm font-medium text-orange-600">Gestión del personal</p>
                <h1 className="text-2xl font-bold text-gray-800">Panel de Recursos Humanos</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Resumen del personal, las asistencias y las solicitudes de Sunshine Handmade.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {indicadores.map((item) => {
                    const Icono = item.icono;
                    return (
                        <div key={item.titulo} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">{item.titulo}</p>
                                <span className={`rounded-xl p-2 ${item.color}`}><Icono size={20} /></span>
                            </div>
                            <p className="mt-4 text-2xl font-bold text-gray-800">{item.valor}</p>
                            <p className="mt-2 text-xs text-gray-400">Dato ilustrativo</p>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                    <h2 className="font-bold text-gray-800">Personal registrado</h2>
                    <p className="mt-1 text-sm text-gray-500">Vista general de algunos colaboradores de ejemplo.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                        <thead>
                            <tr className="border-b text-xs uppercase text-gray-500">
                                <th className="px-3 py-3">Colaborador</th>
                                <th className="px-3 py-3">Área</th>
                                <th className="px-3 py-3">Puesto</th>
                                <th className="px-3 py-3">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {empleados.map((empleado) => (
                                <tr key={empleado.id}>
                                    <td className="px-3 py-4 font-medium text-gray-800">{empleado.nombre}</td>
                                    <td className="px-3 py-4 text-gray-600">{empleado.area}</td>
                                    <td className="px-3 py-4 text-gray-600">{empleado.puesto}</td>
                                    <td className="px-3 py-4">
                                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                                            {empleado.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
                <h2 className="font-semibold text-gray-800">Seguimiento recomendado</h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                    Revisa las solicitudes pendientes, confirma los registros de asistencia y mantén actualizada
                    la información de las áreas y puestos.
                </p>
            </div>
        </div>
    );
}
