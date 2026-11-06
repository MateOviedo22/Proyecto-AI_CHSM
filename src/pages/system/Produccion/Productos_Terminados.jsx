import { useState } from 'react';
import { PackageCheck, Plus, Search, CheckCircle2 } from 'lucide-react';
import { finishedProducts as initialProducts } from '../../../data/mockData';

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-yellow-700';

export default function Producto_terminados() {
    const [products, setProducts] = useState(initialProducts);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        product: '',
        orderId: '',
        quantity: '',
        rejected: '0',
        finishedDate: '',
    });

    const updateForm = (field, value) =>
        setForm((previous) => ({ ...previous, [field]: value }));

    const addProduct = (event) => {
        event.preventDefault();

        const quantity = Number(form.quantity);
        const rejected = Number(form.rejected);

        if (rejected > quantity) {
            alert('Las unidades rechazadas no pueden superar la cantidad fabricada.');
            return;
        }

        setProducts((previous) => [
            {
                id: `PT-${Date.now()}`,
                ...form,
                quantity,
                rejected,
                approved: quantity - rejected,
                inventoryStatus: 'Pendiente',
            },
            ...previous,
        ]);

        setForm({
            product: '',
            orderId: '',
            quantity: '',
            rejected: '0',
            finishedDate: '',
        });

        setShowForm(false);
    };

    const filtered = products.filter((product) =>
        `${product.product} ${product.orderId} ${product.id}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const totalApproved = products.reduce((sum, p) => sum + p.approved, 0);
    const totalRejected = products.reduce((sum, p) => sum + p.rejected, 0);
    const pending = products.filter((p) => p.inventoryStatus === 'Pendiente').length;

    const sendToInventory = (id) => {
        setProducts((previous) =>
            previous.map((product) =>
                product.id === id
                    ? { ...product, inventoryStatus: 'Enviado al inventario' }
                    : product
            )
        );
    };

    return (
        <main className="space-y-6 p-4 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Productos terminados
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Control de lotes fabricados y unidades aprobadas para inventario.
                    </p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 rounded-lg bg-yellow-700 px-4 py-2.5 text-sm text-white hover:bg-yellow-800"
                >
                    <Plus size={18} />
                    Registrar lote
                </button>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: 'Unidades aprobadas', value: totalApproved },
                    { label: 'Unidades rechazadas', value: totalRejected },
                    { label: 'Lotes pendientes de inventario', value: pending },
                ].map((item) => (
                    <article key={item.label} className="rounded-xl border bg-white p-4">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="mt-2 text-2xl font-bold">{item.value}</p>
                    </article>
                ))}
            </section>

            {showForm && (
                <form
                    onSubmit={addProduct}
                    className="grid gap-4 rounded-xl border bg-white p-5 md:grid-cols-2 lg:grid-cols-3"
                >
                    <h2 className="font-semibold md:col-span-2 lg:col-span-3">
                        Registrar producción terminada
                    </h2>

                    <label className="space-y-1 text-sm">
                        <span>Producto</span>
                        <input
                            required
                            className={inputClass}
                            value={form.product}
                            onChange={(e) => updateForm('product', e.target.value)}
                            placeholder="Ej. Bolso Elipse"
                        />
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Código de orden</span>
                        <input
                            required
                            className={inputClass}
                            value={form.orderId}
                            onChange={(e) => updateForm('orderId', e.target.value)}
                            placeholder="Ej. OP-001"
                        />
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Unidades fabricadas</span>
                        <input
                            required
                            type="number"
                            min="1"
                            className={inputClass}
                            value={form.quantity}
                            onChange={(e) => updateForm('quantity', e.target.value)}
                        />
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Unidades rechazadas</span>
                        <input
                            required
                            type="number"
                            min="0"
                            max={form.quantity || undefined}
                            className={inputClass}
                            value={form.rejected}
                            onChange={(e) => updateForm('rejected', e.target.value)}
                        />
                    </label>

                    <label className="space-y-1 text-sm">
                        <span>Fecha de finalización</span>
                        <input
                            required
                            type="date"
                            className={inputClass}
                            value={form.finishedDate}
                            onChange={(e) => updateForm('finishedDate', e.target.value)}
                        />
                    </label>

                    <div className="flex items-end gap-2">
                        <button className="rounded-lg bg-yellow-700 px-4 py-2 text-sm text-white">
                            Guardar lote
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-lg border px-4 py-2 text-sm"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            <section className="overflow-hidden rounded-xl border bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <PackageCheck size={19} />
                        Registro de lotes
                    </h2>

                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            className={`${inputClass} pl-9`}
                            placeholder="Buscar producto u orden..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                {['Lote', 'Producto', 'Orden', 'Fabricadas', 'Aprobadas', 'Rechazadas', 'Fecha', 'Inventario'].map((heading) => (
                                    <th key={heading} className="whitespace-nowrap px-4 py-3 font-medium">
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {filtered.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="whitespace-nowrap px-4 py-3 font-medium">{product.id}</td>
                                    <td className="px-4 py-3">{product.product}</td>
                                    <td className="px-4 py-3">{product.orderId}</td>
                                    <td className="px-4 py-3">{product.quantity}</td>
                                    <td className="px-4 py-3 font-medium text-green-700">{product.approved}</td>
                                    <td className="px-4 py-3 text-red-700">{product.rejected}</td>
                                    <td className="whitespace-nowrap px-4 py-3">{product.finishedDate}</td>
                                    <td className="whitespace-nowrap px-4 py-3">
                                        {product.inventoryStatus === 'Pendiente' ? (
                                            <button
                                                onClick={() => sendToInventory(product.id)}
                                                className="rounded-lg border border-yellow-700 px-3 py-1.5 text-xs text-yellow-800 hover:bg-yellow-50"
                                            >
                                                Enviar al inventario
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                                                <CheckCircle2 size={15} />
                                                Enviado
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filtered.length === 0 && (
                        <p className="p-8 text-center text-sm text-gray-500">
                            No se encontraron lotes terminados.
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}
