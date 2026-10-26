import { useState } from 'react';
import {
    ArrowRight,
    ArrowLeftRight,
    Plus,
    Search,
    CheckCircle2,
    Package,
} from 'lucide-react';

const initialTransfers = [
    {
        id: 1,
        code: 'TR-001',
        item: 'Herrajes metálicos',
        quantity: 30,
        unit: 'unidades',
        origin: 'Almacén principal',
        destination: 'Taller de producción',
        date: '2026-10-24',
        user: 'Usuaria Admin',
        status: 'Completado',
    },
    {
        id: 2,
        code: 'TR-002',
        item: 'Hilo negro',
        quantity: 5,
        unit: 'carretes',
        origin: 'Almacén principal',
        destination: 'Taller de producción',
        date: '2026-10-23',
        user: 'Usuaria Admin',
        status: 'Completado',
    },
];

const materials = [
    {
        name: 'Cuero tratado café',
        unit: 'm²',
        stock: 45,
    },
    {
        name: 'Cuero natural',
        unit: 'm²',
        stock: 85,
    },
    {
        name: 'Hilo negro',
        unit: 'carretes',
        stock: 5,
    },
    {
        name: 'Herrajes metálicos',
        unit: 'unidades',
        stock: 320,
    },
];

const warehouses = [
    'Almacén principal',
    'Taller de producción',
    'Almacén de empaques',
];

export default function Traslados() {
    const [transfers, setTransfers] = useState(initialTransfers);
    const [item, setItem] = useState('');
    const [quantity, setQuantity] = useState('');
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');

    const selectedMaterial = materials.find(
        (material) => material.name === item
    );

    const createTransfer = () => {
        if (
            !item ||
            !quantity ||
            !origin ||
            !destination ||
            origin === destination
        ) {
            return;
        }

        const newTransfer = {
            id: transfers.length + 1,
            code: `TR-${String(transfers.length + 1).padStart(3, '0')}`,
            item,
            quantity: Number(quantity),
            unit: selectedMaterial?.unit || 'unidades',
            origin,
            destination,
            date: new Date().toISOString().split('T')[0],
            user: 'Usuaria Admin',
            status: 'Completado',
        };

        setTransfers([newTransfer, ...transfers]);

        setItem('');
        setQuantity('');
        setOrigin('');
        setDestination('');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">

                <div>
                    <p className="text-sm font-medium text-emerald-700">
                        Sunshine Handmade / Inventario
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                        Traslados de Inventario
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Registra el movimiento de productos y materiales entre
                        diferentes almacenes y ubicaciones.
                    </p>
                </div>

                {/* Formulario */}
                <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                            <ArrowLeftRight size={20} />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                Nuevo traslado
                            </h2>

                            <p className="text-sm text-gray-500">
                                Registra una transferencia entre ubicaciones.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

                        <Field label="Material">
                            <select
                                value={item}
                                onChange={(e) => setItem(e.target.value)}
                                className="input"
                            >
                                <option value="">Seleccionar</option>
                                {materials.map((material) => (
                                    <option
                                        key={material.name}
                                        value={material.name}
                                    >
                                        {material.name}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Cantidad">
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="Cantidad"
                                className="input"
                            />
                        </Field>

                        <Field label="Origen">
                            <select
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                className="input"
                            >
                                <option value="">Seleccionar</option>
                                {warehouses.map((warehouse) => (
                                    <option key={warehouse}>
                                        {warehouse}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Destino">
                            <select
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="input"
                            >
                                <option value="">Seleccionar</option>
                                {warehouses.map((warehouse) => (
                                    <option key={warehouse}>
                                        {warehouse}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <div className="flex items-end">
                            <button
                                onClick={createTransfer}
                                className="inline-flex w-full items-center justify-center
                                gap-2 rounded-xl bg-emerald-700 px-4 py-2.5
                                text-sm font-medium text-white transition
                                hover:bg-emerald-800"
                            >
                                <Plus size={18} />
                                Registrar
                            </button>
                        </div>
                    </div>

                    {selectedMaterial && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
                            <Package size={16} />

                            Existencia disponible:
                            <span className="font-semibold text-gray-700">
                                {selectedMaterial.stock} {selectedMaterial.unit}
                            </span>
                        </div>
                    )}
                </section>

                {/* Historial */}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                    <div className="border-b border-gray-100 p-5">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Historial de traslados
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Últimos movimientos entre ubicaciones.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-3.5">Código</th>
                                    <th className="px-5 py-3.5">Material</th>
                                    <th className="px-5 py-3.5">Cantidad</th>
                                    <th className="px-5 py-3.5">Origen</th>
                                    <th className="px-5 py-3.5">Destino</th>
                                    <th className="px-5 py-3.5">Fecha</th>
                                    <th className="px-5 py-3.5">Estado</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {transfers.map((transfer) => (
                                    <tr
                                        key={transfer.id}
                                        className="transition hover:bg-gray-50/70"
                                    >
                                        <td className="px-5 py-4 font-medium text-gray-700">
                                            {transfer.code}
                                        </td>

                                        <td className="px-5 py-4 font-medium text-gray-900">
                                            {transfer.item}
                                        </td>

                                        <td className="px-5 py-4">
                                            {transfer.quantity} {transfer.unit}
                                        </td>

                                        <td className="px-5 py-4 text-gray-500">
                                            {transfer.origin}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <ArrowRight size={15} />
                                                {transfer.destination}
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-gray-500">
                                            {transfer.date}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                                <CheckCircle2 size={13} />
                                                {transfer.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {label}
            </label>
            {children}
        </div>
    );
}