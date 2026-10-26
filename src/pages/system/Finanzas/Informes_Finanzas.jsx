
import { useState } from 'react';
import { FileBarChart, Download } from 'lucide-react';

const moneda = (valor) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
    }).format(valor);

const movimientos = [
    { id: 1, fecha: '2026-10-24', concepto: 'Venta de productos', tipo: 'Ingreso', categoria: 'Ventas', monto: 12500 },
    { id: 2, fecha: '2026-10-23', concepto: 'Compra de materia prima', tipo: 'Gasto', categoria: 'Materia prima', monto: 4800 },
    { id: 3, fecha: '2026-10-22', concepto: 'Pedido personalizado', tipo: 'Ingreso', categoria: 'Ventas', monto: 7500 },
    { id: 4, fecha: '2026-10-21', concepto: 'Servicio de internet', tipo: 'Gasto', categoria: 'Servicios', monto: 1200 },
];

export default function Informes_Finanzas() {
    const [periodo, setPeriodo] = useState('Octubre 2026');

    const descargarCSV = () => {
        const encabezados = ['Fecha', 'Concepto', 'Tipo', 'Categoría', 'Monto'];
        const filas = movimientos.map((item) => [
            item.fecha,
            item.concepto,
            item.tipo,
            item.categoria,
            item.monto,
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
        enlace.download = 'informe_financiero.csv';
        enlace.click();
        URL.revokeObjectURL(url);
    };

    const ingresos = movimientos
        .filter((item) => item.tipo === 'Ingreso')
        .reduce((suma, item) => suma + item.monto, 0);

    const gastos = movimientos
        .filter((item) => item.tipo === 'Gasto')
        .reduce((suma, item) => suma + item.monto, 0);

    const utilidad = ingresos - gastos;

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-orange-600">
                        <FileBarChart size={18} />
                        Informes financieros
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Informes financieros</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Consulta el resumen de ingresos, gastos y movimientos del negocio.
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

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <label className="block max-w-xs space-y-2 text-sm">
                    <span className="font-medium text-gray-700">Período del informe</span>
                    <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-400"
                    >
                        <option>Octubre 2026</option>
                        <option>Septiembre 2026</option>
                        <option>Agosto 2026</option>
                        <option>Últimos 30 días</option>
                    </select>
                </label>
                <p className="mt-3 text-xs text-gray-400">
                    Período seleccionado: {periodo}. Los datos de ejemplo no cambian con el filtro.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total de ingresos</p>
                    <p className="mt-2 text-2xl font-bold text-green-700">{moneda(ingresos)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total de gastos</p>
                    <p className="mt-2 text-2xl font-bold text-red-700">{moneda(gastos)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Resultado del período</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">{moneda(utilidad)}</p>
                    <p className="mt-2 text-xs text-gray-400">Ingresos menos gastos de muestra</p>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="mb-4 font-bold text-gray-800">Detalle de movimientos</h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                        <thead>
                            <tr className="border-b text-xs uppercase text-gray-500">
                                <th className="px-3 py-3">Fecha</th>
                                <th className="px-3 py-3">Concepto</th>
                                <th className="px-3 py-3">Tipo</th>
                                <th className="px-3 py-3">Categoría</th>
                                <th className="px-3 py-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {movimientos.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-3 py-4 text-gray-500">{item.fecha}</td>
                                    <td className="px-3 py-4 font-medium text-gray-700">{item.concepto}</td>
                                    <td className="px-3 py-4">
                                        <span className={`rounded-full px-3 py-1 text-xs ${item.tipo === 'Ingreso'
                                                ? 'bg-green-50 text-green-700'
                                                : 'bg-red-50 text-red-700'
                                            }`}>
                                            {item.tipo}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4 text-gray-600">{item.categoria}</td>
                                    <td className="px-3 py-4 text-right font-semibold text-gray-800">
                                        {moneda(item.monto)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
