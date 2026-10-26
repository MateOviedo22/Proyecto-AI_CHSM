import { useState } from 'react';
import {
    Warehouse,
    Plus,
    Search,
    MapPin,
    Package,
    Boxes,
    MoreHorizontal,
    CheckCircle2,
} from 'lucide-react';

const initialWarehouses = [
    {
        id: 1,
        code: 'ALM-001',
        name: 'Almacén principal',
        location: 'Área administrativa',
        capacity: '500 m²',
        occupied: 72,
        items: 485,
        status: 'Activo',
    },
    {
        id: 2,
        code: 'ALM-002',
        name: 'Taller de producción',
        location: 'Área de producción',
        capacity: '300 m²',
        occupied: 58,
        items: 320,
        status: 'Activo',
    },
    {
        id: 3,
        code: 'ALM-003',
        name: 'Almacén de empaques',
        location: 'Área de despacho',
        capacity: '150 m²',
        occupied: 41,
        items: 175,
        status: 'Activo',
    },
];

export default function Almacenes_Ubicaciones() {
    const [warehouses, setWarehouses] = useState(initialWarehouses);
    const [search, setSearch] = useState('');

    const filteredWarehouses = warehouses.filter((warehouse) =>
        `${warehouse.name} ${warehouse.code} ${warehouse.location}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const totalItems = warehouses.reduce(
        (total, warehouse) => total + warehouse.items,
        0
    );

    const averageOccupation = Math.round(
        warehouses.reduce(
            (total, warehouse) => total + warehouse.occupied,
            0
        ) / warehouses.length
    );

    const addWarehouse = () => {
        const newWarehouse = {
            id: warehouses.length + 1,
            code: `ALM-00${warehouses.length + 1}`,
            name: `Nuevo almacén ${warehouses.length + 1}`,
            location: 'Por definir',
            capacity: '100 m²',
            occupied: 0,
            items: 0,
            status: 'Activo',
        };

        setWarehouses([...warehouses, newWarehouse]);
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
                            Almacenes y Ubicaciones
                        </h1>

                        <p className="mt-2 text-sm text-gray-500">
                            Administra los almacenes y espacios donde se
                            encuentran los productos y materiales.
                        </p>
                    </div>

                    <button
                        onClick={addWarehouse}
                        className="inline-flex items-center justify-center gap-2 rounded-xl
                        bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white
                        shadow-sm transition hover:bg-emerald-800"
                    >
                        <Plus size={18} />
                        Nuevo almacén
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <SummaryCard
                        icon={<Warehouse size={20} />}
                        label="Almacenes"
                        value={warehouses.length}
                        detail="Espacios registrados"
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <SummaryCard
                        icon={<Boxes size={20} />}
                        label="Artículos almacenados"
                        value={totalItems}
                        detail="Productos y materiales"
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <SummaryCard
                        icon={<Package size={20} />}
                        label="Ocupación promedio"
                        value={`${averageOccupation}%`}
                        detail="Capacidad utilizada"
                        iconClass="bg-purple-50 text-purple-600"
                    />
                </div>

                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                    <div className="border-b border-gray-100 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Almacenes registrados
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Consulta la distribución y capacidad disponible.
                                </p>
                            </div>

                            <div className="relative">
                                <Search
                                    size={17}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar almacén..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50
                                    py-2.5 pl-9 pr-3 text-sm outline-none
                                    focus:border-emerald-500 focus:bg-white
                                    focus:ring-2 focus:ring-emerald-100 sm:w-64"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredWarehouses.map((warehouse) => (
                            <div
                                key={warehouse.id}
                                className="rounded-2xl border border-gray-100 p-5 transition
                                hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                                        <Warehouse size={21} />
                                    </div>

                                    <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>

                                <p className="mt-4 text-xs font-medium text-gray-400">
                                    {warehouse.code}
                                </p>

                                <h3 className="mt-1 font-semibold text-gray-900">
                                    {warehouse.name}
                                </h3>

                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                                    <MapPin size={15} />
                                    {warehouse.location}
                                </div>

                                <div className="mt-5">
                                    <div className="mb-2 flex justify-between text-xs">
                                        <span className="text-gray-500">
                                            Ocupación
                                        </span>
                                        <span className="font-medium text-gray-700">
                                            {warehouse.occupied}%
                                        </span>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-emerald-600"
                                            style={{
                                                width: `${warehouse.occupied}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Capacidad
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-gray-700">
                                            {warehouse.capacity}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Artículos
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-gray-700">
                                            {warehouse.items}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                        <CheckCircle2 size={13} />
                                        {warehouse.status}
                                    </span>
                                </div>
                            </div>
                        ))}
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