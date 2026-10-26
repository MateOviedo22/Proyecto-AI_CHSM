
import { ArrowDownRight, ArrowUpRight, Wallet, Clock, ReceiptText } from 'lucide-react';

const moneda = (valor) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(valor);

const movimientos = [
    { id: 1, fecha: '2026-10-24', concepto: 'Venta de productos artesanales', tipo: 'Ingreso', monto: 12500, estado: 'Registrado' },
    { id: 2, fecha: '2026-10-23', concepto: 'Compra de materia prima', tipo: 'Gasto', monto: 4800, estado: 'Registrado' },
    { id: 3, fecha: '2026-10-22', concepto: 'Pago de pedido personalizado', tipo: 'Ingreso', monto: 7500, estado: 'Registrado' },
    { id: 4, fecha: '2026-10-21', concepto: 'Servicio de internet', tipo: 'Gasto', monto: 1200, estado: 'Registrado' },
];

const indicadores = [
    { titulo: 'Ingresos del período', valor: 128450, icono: ArrowUpRight, color: 'text-green-600', fondo: 'bg-green-50' },
    { titulo: 'Gastos del período', valor: 64280, icono: ArrowDownRight, color: 'text-red-600', fondo: 'bg-red-50' },
    { titulo: 'Utilidad estimada', valor: 64170, icono: Wallet, color: 'text-orange-600', fondo: 'bg-orange-50' },
    { titulo: 'Cuentas por cobrar', valor: 18500, icono: Clock, color: 'text-blue-600', fondo: 'bg-blue-50' },
];

export default function Panel_Finanzas() {
    return (
        <div className="space-y-6">
            <div>
                <p className="mb-2 text-sm font-medium text-orange-600">Gestión financiera</p>
                <h1 className="text-2xl font-bold text-gray-800">Panel de finanzas</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Consulta el estado financiero general de Sunshine Handmade.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {indicadores.map((item) => {
                    const Icono = item.icono;
                    return (
                        <div key={item.titulo} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">{item.titulo}</p>
                                <span className={`rounded-xl p-2 ${item.fondo} ${item.color}`}>
                                    <Icono size={20} />
                                </span>
                            </div>
                            <p className="mt-4 text-2xl font-bold text-gray-800">{moneda(item.valor)}</p>
                            <p className="mt-2 text-xs text-gray-400">Datos de demostración</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="mb-5 flex items-center gap-3">
                        <span className="rounded-xl bg-orange-50 p-2 text-orange-600">
                            <ReceiptText size={21} />
                        </span>
                        <div>
                            <h2 className="font-bold text-gray-800">Movimientos recientes</h2>
                            <p className="text-sm text-gray-500">Últimos ingresos y gastos registrados</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm">
                            <thead>
                                <tr className="border-b text-xs uppercase text-gray-500">
                                    <th className="px-3 py-3">Fecha</th>
                                    <th className="px-3 py-3">Concepto</th>
                                    <th className="px-3 py-3">Tipo</th>
                                    <th className="px-3 py-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {movimientos.map((movimiento) => (
                                    <tr key={movimiento.id}>
                                        <td className="px-3 py-4 text-gray-500">{movimiento.fecha}</td>
                                        <td className="px-3 py-4 font-medium text-gray-700">{movimiento.concepto}</td>
                                        <td className="px-3 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${movimiento.tipo === 'Ingreso'
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-red-50 text-red-700'
                                                }`}>
                                                {movimiento.tipo}
                                            </span>
                                        </td>
                                        <td className={`px-3 py-4 text-right font-semibold ${movimiento.tipo === 'Ingreso' ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                            {moneda(movimiento.monto)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h2 className="font-bold text-gray-800">Resumen del período</h2>
                    <p className="mt-1 text-sm text-gray-500">Balance ilustrativo</p>

                    <div className="mt-6 space-y-5">
                        <div>
                            <div className="flex justify-between gap-3 text-sm">
                                <span className="text-gray-500">Ingresos</span>
                                <span className="font-semibold text-green-700">{moneda(128450)}</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-gray-100">
                                <div className="h-2 w-full rounded-full bg-green-500" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between gap-3 text-sm">
                                <span className="text-gray-500">Gastos</span>
                                <span className="font-semibold text-red-700">{moneda(64280)}</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-gray-100">
                                <div className="h-2 w-1/2 rounded-full bg-red-400" />
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <p className="text-sm text-gray-500">Resultado estimado</p>
                            <p className="mt-1 text-2xl font-bold text-gray-800">{moneda(64170)}</p>
                            <p className="mt-2 text-xs text-gray-400">
                                Ingresos menos gastos registrados en este ejemplo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
