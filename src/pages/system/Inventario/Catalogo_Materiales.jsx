import { useState } from 'react';
import {
    Boxes,
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    AlertTriangle,
    CheckCircle2,
    Package,
} from 'lucide-react';

const initialMaterials = [
    {
        id: 1,
        code: 'MAT-001',
        name: 'Cuero tratado café',
        type: 'Materia prima',
        unit: 'm²',
        stock: 45,
        minimum: 50,
        location: 'Almacén principal',
        supplier: 'Curtidora Nacional',
        status: 'Bajo',
    },
    {
        id: 2,
        code: 'MAT-002',
        name: 'Cuero natural',
        type: 'Materia prima',
        unit: 'm²',
        stock: 85,
        minimum: 40,
        location: 'Almacén principal',
        supplier: 'Curtidora Nacional',
        status: 'Disponible',
    },
    {
        id: 3,
        code: 'INS-001',
        name: 'Hilo negro',
        type: 'Insumo',
        unit: 'carretes',
        stock: 5,
        minimum: 15,
        location: 'Taller de producción',
        supplier: 'Distribuidora Textil',
        status: 'Crítico',
    },
    {
        id: 4,
        code: 'INS-002',
        name: 'Hilo café',
        type: 'Insumo',
        unit: 'carretes',
        stock: 24,
        minimum: 10,
        location: 'Taller de producción',
        supplier: 'Distribuidora Textil',
        status: 'Disponible',
    },
    {
        id: 5,
        code: 'INS-003',
        name: 'Botones de presión 25mm',
        type: 'Insumo',
        unit: 'unidades',
        stock: 100,
        minimum: 200,
        location: 'Almacén principal',
        supplier: 'Herrajes Nicaragua',
        status: 'Bajo',
    },
    {
        id: 6,
        code: 'INS-004',
        name: 'Herrajes metálicos',
        type: 'Insumo',
        unit: 'unidades',
        stock: 320,
        minimum: 100,
        location: 'Almacén principal',
        supplier: 'Herrajes Nicaragua',
        status: 'Disponible',
    },
    {
        id: 7,
        code: 'EMP-001',
        name: 'Caja de cartón mediana',
        type: 'Empaque',
        unit: 'unidades',
        stock: 75,
        minimum: 30,
        location: 'Almacén de empaques',
        supplier: 'Empaques S.A.',
        status: 'Disponible',
    },
];

const types = [
    'Todos',
    'Materia prima',
    'Insumo',
    'Empaque',
];

export default function Catalogo_Materiales() {
    const [materials] = useState(initialMaterials);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('Todos');

    const filteredMaterials = materials.filter((material) => {
        const matchesSearch =
            material.name.toLowerCase().includes(search.toLowerCase()) ||
            material.code.toLowerCase().includes(search.toLowerCase());

        const matchesType =
            type === 'Todos' || material.type === type;

        return matchesSearch && matchesType;
    });

    const rawMaterials = materials.filter(
        (material) => material.type === 'Materia prima'
    ).length;

    const supplies = materials.filter(
        (material) => material.type === 'Insumo'
    ).length;

    const lowStock = materials.filter(
        (material) => material.status === 'Bajo'
    ).length;

    const criticalStock = materials.filter(
        (material) => material.status === 'Crítico'
    ).length;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">

                {/* Encabezado */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-emerald-700">
                            Sunshine Handmade / Inventario
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                            Catálogo de Materiales
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm text-gray-500">
                            Administra las materias primas, insumos y materiales
                            utilizados en los procesos de producción.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2
                        rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium
                        text-white shadow-sm transition hover:bg-emerald-800"
                    >
                        <Plus size={18} />
                        Nuevo material
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        icon={<Boxes size={20} />}
                        label="Materias primas"
                        value={rawMaterials}
                        detail="Materiales principales"
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <SummaryCard
                        icon={<Package size={20} />}
                        label="Insumos"
                        value={supplies}
                        detail="Materiales auxiliares"
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <SummaryCard
                        icon={<AlertTriangle size={20} />}
                        label="Stock bajo"
                        value={lowStock}
                        detail="Necesitan reposición"
                        iconClass="bg-amber-50 text-amber-600"
                    />

                    <SummaryCard
                        icon={<AlertTriangle size={20} />}
                        label="Stock crítico"
                        value={criticalStock}
                        detail="Requieren atención"
                        iconClass="bg-red-50 text-red-600"
                    />
                </div>

                {/* Tabla */}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                    {/* Cabecera */}
                    <div className="border-b border-gray-100 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Materiales registrados
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Consulta las existencias y datos asociados a cada material.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">

                                {/* Buscador */}
                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar material..."
                                        className="w-full rounded-xl border border-gray-200
                                        bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none
                                        transition placeholder:text-gray-400
                                        focus:border-emerald-500 focus:bg-white
                                        focus:ring-2 focus:ring-emerald-100
                                        sm:w-64"
                                    />
                                </div>

                                {/* Filtro */}
                                <div className="relative">
                                    <Filter
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="appearance-none rounded-xl border border-gray-200
                                        bg-gray-50 py-2.5 pl-9 pr-8 text-sm text-gray-700
                                        outline-none transition
                                        focus:border-emerald-500 focus:bg-white
                                        focus:ring-2 focus:ring-emerald-100"
                                    >
                                        {types.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">
                                        Código
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Material
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Tipo
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Existencia
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Ubicación
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Proveedor
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Estado
                                    </th>

                                    <th className="px-5 py-3.5 text-right font-medium">
                                        Acción
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {filteredMaterials.length > 0 ? (
                                    filteredMaterials.map((material) => (
                                        <tr
                                            key={material.id}
                                            className="transition hover:bg-gray-50/80"
                                        >
                                            <td className="px-5 py-4">
                                                <span className="font-medium text-gray-700">
                                                    {material.code}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {material.name}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        Mínimo: {material.minimum} {material.unit}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <TypeBadge type={material.type} />
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-gray-900">
                                                    {material.stock}
                                                </span>

                                                <span className="ml-1 text-xs text-gray-500">
                                                    {material.unit}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-gray-500">
                                                {material.location}
                                            </td>

                                            <td className="px-5 py-4 text-gray-500">
                                                {material.supplier}
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge status={material.status} />
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-gray-400
                                                    transition hover:bg-gray-100
                                                    hover:text-gray-700"
                                                    aria-label={`Más opciones para ${material.name}`}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="px-5 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="mb-3 rounded-full bg-gray-100 p-3">
                                                    <Boxes
                                                        size={22}
                                                        className="text-gray-400"
                                                    />
                                                </div>

                                                <p className="font-medium text-gray-700">
                                                    No se encontraron materiales
                                                </p>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    Intenta cambiar los filtros de búsqueda.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pie */}
                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                        <p className="text-xs text-gray-500">
                            Mostrando{' '}
                            <span className="font-medium text-gray-700">
                                {filteredMaterials.length}
                            </span>{' '}
                            de{' '}
                            <span className="font-medium text-gray-700">
                                {materials.length}
                            </span>{' '}
                            materiales
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

function SummaryCard({
    icon,
    label,
    value,
    detail,
    iconClass,
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <div className={`inline-flex rounded-xl p-2.5 ${iconClass}`}>
                    {icon}
                </div>
            </div>

            <p className="text-sm text-gray-500">
                {label}
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
                {value}
            </p>

            <p className="mt-1 text-xs text-gray-500">
                {detail}
            </p>
        </div>
    );
}

function TypeBadge({ type }) {
    const styles = {
        'Materia prima': 'bg-blue-50 text-blue-700',
        Insumo: 'bg-emerald-50 text-emerald-700',
        Empaque: 'bg-purple-50 text-purple-700',
    };

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
                styles[type] || 'bg-gray-100 text-gray-600'
            }`}
        >
            {type}
        </span>
    );
}

function StatusBadge({ status }) {
    const styles = {
        Disponible: 'bg-emerald-50 text-emerald-700',
        Bajo: 'bg-amber-50 text-amber-700',
        Crítico: 'bg-red-50 text-red-700',
    };

    const icons = {
        Disponible: <CheckCircle2 size={13} />,
        Bajo: <AlertTriangle size={13} />,
        Crítico: <AlertTriangle size={13} />,
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                styles[status] || 'bg-gray-100 text-gray-600'
            }`}
        >
            {icons[status]}
            {status}
        </span>
    );
}