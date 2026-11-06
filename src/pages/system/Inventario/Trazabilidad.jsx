import { useState } from 'react';
import {
    Search,
    Package,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    Clock3,
    User,
} from 'lucide-react';

const records = [
    {
        id: 1,
        item: 'Cuero tratado café',
        code: 'MAT-001',
        type: 'Entrada',
        quantity: '+25 m²',
        location: 'Almacén principal',
        date: '2026-10-24',
        time: '09:15',
        user: 'Usuaria Admin',
        reference: 'OC-2026-034',
    },
    {
        id: 2,
        item: 'Cuero tratado café',
        code: 'MAT-001',
        type: 'Salida',
        quantity: '-10 m²',
        location: 'Taller de producción',
        date: '2026-10-24',
        time: '11:30',
        user: 'Usuaria Admin',
        reference: 'OP-2026-021',
    },
    {
        id: 3,
        item: 'Cuero tratado café',
        code: 'MAT-001',
        type: 'Traslado',
        quantity: '15 m²',
        location: 'Almacén → Taller',
        date: '2026-10-23',
        time: '14:20',
        user: 'Usuaria Admin',
        reference: 'TR-015',
    },
];

export default function Trazabilidad() {
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    const searchItem = () => {
        const result = records.find(
            (record) =>
                record.item.toLowerCase().includes(search.toLowerCase()) ||
                record.code.toLowerCase() === search.toLowerCase()
        );

        setSelectedItem(result || null);
    };

    const itemRecords = selectedItem
        ? records.filter((record) => record.code === selectedItem.code)
        : [];

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-7">

                <div>
                    <p className="text-sm font-medium text-emerald-700">
                        Sunshine Handmade / Inventario
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                        Trazabilidad
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Consulta el historial de movimientos y ubicaciones de
                        productos y materiales.
                    </p>
                </div>

                {/* Buscador */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                            <Search size={20} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-gray-800">
                                Consultar artículo
                            </h2>

                            <p className="text-sm text-gray-500">
                                Busca por nombre o código.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') searchItem();
                            }}
                            placeholder="Ej. MAT-001 o Cuero tratado café"
                            className="flex-1 rounded-xl border border-gray-200 bg-gray-50
                            px-4 py-2.5 text-sm outline-none transition
                            focus:border-emerald-500 focus:bg-white
                            focus:ring-2 focus:ring-emerald-100"
                        />

                        <button
                            onClick={searchItem}
                            className="inline-flex items-center justify-center gap-2
                            rounded-xl bg-emerald-700 px-5 py-2.5 text-sm
                            font-medium text-white transition hover:bg-emerald-800"
                        >
                            <Search size={17} />
                            Consultar
                        </button>
                    </div>
                </section>

                {selectedItem && (
                    <>
                        {/* Información del artículo */}
                        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                    <Package size={24} />
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-gray-400">
                                        {selectedItem.code}
                                    </p>

                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {selectedItem.item}
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Historial de movimientos registrados.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Timeline */}
                        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Historial de movimientos
                            </h2>

                            <div className="mt-6 space-y-6">
                                {itemRecords.map((record, index) => (
                                    <div
                                        key={record.id}
                                        className="relative flex gap-4"
                                    >
                                        {index < itemRecords.length - 1 && (
                                            <div className="absolute left-5 top-11 h-full w-px bg-gray-200" />
                                        )}

                                        <div
                                            className={`relative z-10 flex h-10 w-10 shrink-0
                                            items-center justify-center rounded-full ${
                                                record.type === 'Entrada'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : record.type === 'Salida'
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'bg-purple-50 text-purple-600'
                                            }`}
                                        >
                                            {record.type === 'Entrada' && (
                                                <ArrowDownToLine size={18} />
                                            )}

                                            {record.type === 'Salida' && (
                                                <ArrowUpFromLine size={18} />
                                            )}

                                            {record.type === 'Traslado' && (
                                                <ArrowLeftRight size={18} />
                                            )}
                                        </div>

                                        <div className="flex-1 rounded-xl border border-gray-100 p-4">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <span className="font-medium text-gray-900">
                                                        {record.type}
                                                    </span>

                                                    <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                                        {record.quantity}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <Clock3 size={13} />
                                                    {record.date} · {record.time}
                                                </div>
                                            </div>

                                            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                                <p className="text-gray-500">
                                                    Ubicación:{' '}
                                                    <span className="font-medium text-gray-700">
                                                        {record.location}
                                                    </span>
                                                </p>

                                                <p className="flex items-center gap-1 text-gray-500">
                                                    <User size={14} />
                                                    {record.user}
                                                </p>
                                            </div>

                                            <p className="mt-2 text-xs text-gray-400">
                                                Referencia: {record.reference}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                {!selectedItem && search && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                        <Package
                            size={30}
                            className="mx-auto text-gray-300"
                        />

                        <p className="mt-3 font-medium text-gray-700">
                            No se encontró el artículo
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Verifica el nombre o código ingresado.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}