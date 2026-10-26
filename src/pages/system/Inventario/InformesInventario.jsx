import { useState } from 'react';
import {
    FileText,
    Download,
    Package,
    AlertTriangle,
    TrendingUp,
    Warehouse,
    BarChart3,
} from 'lucide-react';

const inventory = [
    {
        item: 'Bolso artesanal clásico',
        category: 'Producto terminado',
        stock: 24,
        minimum: 10,
        value: 36000,
    },
    {
        item: 'Cartera de cuero natural',
        category: 'Producto terminado',
        stock: 18,
        minimum: 8,
        value: 27000,
    },
    {
        item: 'Cuero tratado café',
        category: 'Materia prima',
        stock: 45,
        minimum: 50,
        value: 33750,
    },
    {
        item: 'Cuero natural',
        category: 'Materia prima',
        stock: 85,
        minimum: 40,
        value: 42500,
    },
    {
        item: 'Hilo negro',
        category: 'Insumo',
        stock: 5,
        minimum: 15,
        value: 1500,
    },
    {
        item: 'Herrajes metálicos',
        category: 'Insumo',
        stock: 320,
        minimum: 100,
        value: 9600,
    },
];

export default function InformesInventario() {
    const [reportType, setReportType] = useState('Existencias');
    const [category, setCategory] = useState('Todas');

    const filteredInventory = inventory.filter(
        (item) =>
            category === 'Todas' || item.category === category
    );

    const totalValue = filteredInventory.reduce(
        (total, item) => total + item.value,
        0
    );

    const lowStock = filteredInventory.filter(
        (item) => item.stock < item.minimum
    ).length;

    const generateReport = () => {
        alert(
            `Informe generado: ${reportType} (${filteredInventory.length} registros)`
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-emerald-700">
                            Sunshine Handmade / Inventario
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                            Informes de Inventario
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Consulta información consolidada sobre existencias,
                            movimientos y valor del inventario.
                        </p>
                    </div>

                    <button
                        onClick={generateReport}
                        className="inline-flex items-center justify-center gap-2
                        rounded-xl bg-emerald-700 px-4 py-2.5 text-sm
                        font-medium text-white shadow-sm transition
                        hover:bg-emerald-800"
                    >
                        <Download size={18} />
                        Generar informe
                    </button>
                </div>

                {/* Indicadores */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        icon={<Package size={20} />}
                        label="Artículos"
                        value={filteredInventory.length}
                        detail="Registros incluidos"
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <SummaryCard
                        icon={<TrendingUp size={20} />}
                        label="Valor inventario"
                        value={`C$ ${totalValue.toLocaleString()}`}
                        detail="Valor estimado"
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <SummaryCard
                        icon={<AlertTriangle size={20} />}
                        label="Stock bajo"
                        value={lowStock}
                        detail="Requieren atención"
                        iconClass="bg-amber-50 text-amber-600"
                    />

                    <SummaryCard
                        icon={<Warehouse size={20} />}
                        label="Ubicaciones"
                        value="3"
                        detail="Almacenes activos"
                        iconClass="bg-purple-50 text-purple-600"
                    />
                </div>

                {/* Configuración */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                            <FileText size={20} />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Configurar informe
                            </h2>

                            <p className="text-sm text-gray-500">
                                Selecciona la información que deseas consultar.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Tipo de informe
                            </label>

                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50
                                px-3 py-2.5 text-sm outline-none
                                focus:border-emerald-500 focus:bg-white
                                focus:ring-2 focus:ring-emerald-100"
                            >
                                <option>Existencias</option>
                                <option>Stock bajo</option>
                                <option>Valor del inventario</option>
                                <option>Movimientos</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                                Categoría
                            </label>

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50
                                px-3 py-2.5 text-sm outline-none
                                focus:border-emerald-500 focus:bg-white
                                focus:ring-2 focus:ring-emerald-100"
                            >
                                <option>Todas</option>
                                <option>Producto terminado</option>
                                <option>Materia prima</option>
                                <option>Insumo</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Resultado */}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 p-5">
                        <div className="flex items-center gap-3">
                            <BarChart3
                                size={20}
                                className="text-emerald-600"
                            />

                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    {reportType}
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Resultado del informe seleccionado.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-3.5">Artículo</th>
                                    <th className="px-5 py-3.5">Categoría</th>
                                    <th className="px-5 py-3.5">Existencia</th>
                                    <th className="px-5 py-3.5">Mínimo</th>
                                    <th className="px-5 py-3.5">Valor</th>
                                    <th className="px-5 py-3.5">Estado</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {filteredInventory.map((item) => {
                                    const isLow = item.stock < item.minimum;

                                    return (
                                        <tr
                                            key={item.item}
                                            className="transition hover:bg-gray-50/70"
                                        >
                                            <td className="px-5 py-4 font-medium text-gray-900">
                                                {item.item}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                                                    {item.category}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 font-semibold">
                                                {item.stock}
                                            </td>

                                            <td className="px-5 py-4 text-gray-500">
                                                {item.minimum}
                                            </td>

                                            <td className="px-5 py-4">
                                                C$ {item.value.toLocaleString()}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                        isLow
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-emerald-50 text-emerald-700'
                                                    }`}
                                                >
                                                    {isLow
                                                        ? 'Stock bajo'
                                                        : 'Normal'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

function SummaryCard({ icon, label, value, detail, iconClass }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={`mb-4 inline-flex rounded-xl p-2.5 ${iconClass}`}>
                {icon}
            </div>

            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
    );
}