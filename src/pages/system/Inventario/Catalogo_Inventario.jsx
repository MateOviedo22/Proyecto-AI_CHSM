import { useState } from 'react';
import {
    Package,
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    Boxes,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';

const initialProducts = [
    {
        id: 1,
        code: 'PRD-001',
        name: 'Bolso artesanal clásico',
        category: 'Productos terminados',
        stock: 24,
        minimum: 10,
        unit: 'unidades',
        location: 'Almacén principal',
        status: 'Disponible',
    },
    {
        id: 2,
        code: 'PRD-002',
        name: 'Cartera de cuero natural',
        category: 'Productos terminados',
        stock: 18,
        minimum: 8,
        unit: 'unidades',
        location: 'Almacén principal',
        status: 'Disponible',
    },
    {
        id: 3,
        code: 'MAT-001',
        name: 'Cuero tratado café',
        category: 'Materia prima',
        stock: 45,
        minimum: 50,
        unit: 'm²',
        location: 'Almacén principal',
        status: 'Bajo',
    },
    {
        id: 4,
        code: 'MAT-002',
        name: 'Hilo negro',
        category: 'Insumos',
        stock: 5,
        minimum: 15,
        unit: 'carretes',
        location: 'Taller de producción',
        status: 'Crítico',
    },
    {
        id: 5,
        code: 'INS-001',
        name: 'Botones de presión 25mm',
        category: 'Insumos',
        stock: 100,
        minimum: 200,
        unit: 'unidades',
        location: 'Almacén principal',
        status: 'Bajo',
    },
    {
        id: 6,
        code: 'MAT-003',
        name: 'Herrajes metálicos',
        category: 'Insumos',
        stock: 320,
        minimum: 100,
        unit: 'unidades',
        location: 'Almacén principal',
        status: 'Disponible',
    },
];

const categories = [
    'Todas',
    'Productos terminados',
    'Materia prima',
    'Insumos',
];

export default function Catalogo_Inventario() {
    const [products] = useState(initialProducts);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Todas');

    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.code.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
            category === 'Todas' || product.category === category;

        return matchesSearch && matchesCategory;
    });

    const totalProducts = products.filter(
        (product) => product.category === 'Productos terminados'
    ).length;

    const totalMaterials = products.filter(
        (product) =>
            product.category === 'Materia prima' ||
            product.category === 'Insumos'
    ).length;

    const lowStock = products.filter(
        (product) => product.status === 'Bajo'
    ).length;

    const criticalStock = products.filter(
        (product) => product.status === 'Crítico'
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
                            Catálogo de Inventario
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm text-gray-500">
                            Consulta y administra los productos, materiales e
                            insumos registrados en el inventario.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 rounded-xl
                        bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white
                        shadow-sm transition hover:bg-emerald-800"
                    >
                        <Plus size={18} />
                        Nuevo registro
                    </button>
                </div>

                {/* Resumen */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        icon={<Package size={20} />}
                        label="Productos terminados"
                        value={totalProducts}
                        detail="Registrados en catálogo"
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <SummaryCard
                        icon={<Boxes size={20} />}
                        label="Materiales e insumos"
                        value={totalMaterials}
                        detail="Materias primas e insumos"
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <SummaryCard
                        icon={<AlertTriangle size={20} />}
                        label="Stock bajo"
                        value={lowStock}
                        detail="Requieren reposición"
                        iconClass="bg-amber-50 text-amber-600"
                    />

                    <SummaryCard
                        icon={<AlertTriangle size={20} />}
                        label="Stock crítico"
                        value={criticalStock}
                        detail="Atención inmediata"
                        iconClass="bg-red-50 text-red-600"
                    />
                </div>

                {/* Catálogo */}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                    {/* Encabezado de sección */}
                    <div className="border-b border-gray-100 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Registros de inventario
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Productos y materiales disponibles en el sistema.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">

                                {/* Buscar */}
                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Buscar producto..."
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50
                                        py-2.5 pl-9 pr-3 text-sm outline-none transition
                                        placeholder:text-gray-400
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
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="appearance-none rounded-xl border border-gray-200
                                        bg-gray-50 py-2.5 pl-9 pr-8 text-sm text-gray-700
                                        outline-none transition
                                        focus:border-emerald-500 focus:bg-white
                                        focus:ring-2 focus:ring-emerald-100"
                                    >
                                        {categories.map((item) => (
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
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-5 py-3.5 font-medium">
                                        Código
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Producto / Material
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Categoría
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Existencia
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Ubicación
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
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="transition hover:bg-gray-50/80"
                                        >
                                            <td className="px-5 py-4">
                                                <span className="font-medium text-gray-700">
                                                    {product.code}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {product.name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        Mínimo: {product.minimum} {product.unit}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                                                    {product.category}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-gray-900">
                                                    {product.stock}
                                                </span>
                                                <span className="ml-1 text-xs text-gray-500">
                                                    {product.unit}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-gray-500">
                                                {product.location}
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge status={product.status} />
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-gray-400
                                                    transition hover:bg-gray-100
                                                    hover:text-gray-700"
                                                    aria-label={`Más opciones para ${product.name}`}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-5 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="mb-3 rounded-full bg-gray-100 p-3">
                                                    <Package
                                                        size={22}
                                                        className="text-gray-400"
                                                    />
                                                </div>

                                                <p className="font-medium text-gray-700">
                                                    No se encontraron registros
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

                    {/* Footer */}
                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                        <p className="text-xs text-gray-500">
                            Mostrando{' '}
                            <span className="font-medium text-gray-700">
                                {filteredProducts.length}
                            </span>{' '}
                            de{' '}
                            <span className="font-medium text-gray-700">
                                {products.length}
                            </span>{' '}
                            registros
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