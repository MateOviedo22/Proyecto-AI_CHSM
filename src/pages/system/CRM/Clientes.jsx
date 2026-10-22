
import { useMemo, useState } from 'react';
import {
    Search,
    UserPlus,
    Users,
    Eye,
    Pencil,
    X,
    Mail,
    Phone,
    MapPin,
    SlidersHorizontal,
} from 'lucide-react';

const initialClients = [
    {
        id: 'CLI-001',
        name: 'María González',
        type: 'Frecuente',
        email: 'maria@example.com',
        phone: '8888-1234',
        location: 'Managua',
        purchases: 8,
        status: 'Activo',
    },
    {
        id: 'CLI-002',
        name: 'Hotel Las Flores',
        type: 'Corporativo',
        email: 'compras@ejemplo.com',
        phone: '2222-4567',
        location: 'Granada',
        purchases: 12,
        status: 'Activo',
    },
    {
        id: 'CLI-003',
        name: 'Ana Martínez',
        type: 'Ocasional',
        email: 'ana@example.com',
        phone: '8777-3210',
        location: 'León',
        purchases: 2,
        status: 'Activo',
    },
    {
        id: 'CLI-004',
        name: 'Tienda Artesanal Granada',
        type: 'Mayorista',
        email: 'tienda@example.com',
        phone: '8555-7890',
        location: 'Granada',
        purchases: 15,
        status: 'Activo',
    },
    {
        id: 'CLI-005',
        name: 'Carlos López',
        type: 'Ocasional',
        email: 'carlos@example.com',
        phone: '8666-4567',
        location: 'Masaya',
        purchases: 1,
        status: 'Inactivo',
    },
];

const emptyForm = {
    name: '',
    type: 'Ocasional',
    email: '',
    phone: '',
    location: '',
};

export default function Clientes() {
    const [clients, setClients] = useState(initialClients);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('Todos');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [showForm, setShowForm] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    const filteredClients = useMemo(() => {
        const query = search.toLowerCase().trim();

        return clients.filter((client) => {
            const matchesSearch =
                client.name.toLowerCase().includes(query) ||
                client.id.toLowerCase().includes(query) ||
                client.email.toLowerCase().includes(query) ||
                client.phone.includes(query);

            const matchesType =
                typeFilter === 'Todos' || client.type === typeFilter;

            const matchesStatus =
                statusFilter === 'Todos' || client.status === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [clients, search, typeFilter, statusFilter]);

    function openCreateForm() {
        setForm(emptyForm);
        setEditingId(null);
        setError('');
        setShowForm(true);
    }

    function openEditForm(client) {
        setForm({
            name: client.name,
            type: client.type,
            email: client.email,
            phone: client.phone,
            location: client.location,
        });
        setEditingId(client.id);
        setError('');
        setShowForm(true);
        setSelectedClient(null);
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (!form.name.trim()) {
            setError('El nombre del cliente es obligatorio.');
            return;
        }

        if (
            form.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ) {
            setError('Introduce un correo electrónico válido.');
            return;
        }

        if (editingId) {
            setClients((previous) =>
                previous.map((client) =>
                    client.id === editingId
                        ? { ...client, ...form, name: form.name.trim() }
                        : client
                )
            );
        } else {
            const newClient = {
                ...form,
                name: form.name.trim(),
                id: `CLI-${String(
                    Math.max(0, ...clients.map((c) => Number(c.id.split('-')[1]))) + 1
                ).padStart(3, '0')}`,
                purchases: 0,
                status: 'Activo',
            };

            setClients((previous) => [newClient, ...previous]);
        }

        setShowForm(false);
        setForm(emptyForm);
        setEditingId(null);
        setError('');
    }

    function toggleStatus(client) {
        setClients((previous) =>
            previous.map((item) =>
                item.id === client.id
                    ? {
                        ...item,
                        status: item.status === 'Activo' ? 'Inactivo' : 'Activo',
                    }
                    : item
            )
        );
        setSelectedClient(null);
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-medium text-emerald-700">
                            Sunshine Handmade / CRM
                        </p>
                        <h1 className="mt-1 text-3xl font-bold text-gray-900">
                            Clientes
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Administra los datos y la relación comercial con tus clientes.
                        </p>
                    </div>

                    <button
                        onClick={openCreateForm}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                        <UserPlus size={18} />
                        Nuevo cliente
                    </button>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: 'Total de clientes',
                            value: clients.length,
                            icon: Users,
                        },
                        {
                            label: 'Clientes activos',
                            value: clients.filter((c) => c.status === 'Activo').length,
                            icon: Users,
                        },
                        {
                            label: 'Tipos de clientes',
                            value: new Set(clients.map((c) => c.type)).size,
                            icon: SlidersHorizontal,
                        },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.label}
                                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                            >
                                <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                                    <Icon size={23} />
                                </span>
                                <div>
                                    <p className="text-sm text-gray-500">{item.label}</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        {item.value}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-5 flex flex-col gap-3 lg:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={19}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Buscar por nombre, código, correo o teléfono..."
                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                            />
                        </div>

                        <select
                            value={typeFilter}
                            onChange={(event) => setTypeFilter(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
                        >
                            <option value="Todos">Todos los tipos</option>
                            <option value="Frecuente">Frecuente</option>
                            <option value="Ocasional">Ocasional</option>
                            <option value="Corporativo">Corporativo</option>
                            <option value="Mayorista">Mayorista</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
                        >
                            <option value="Todos">Todos los estados</option>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>

                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800">
                            Directorio de clientes
                        </h2>
                        <span className="text-xs text-gray-500">
                            {filteredClients.length} resultados
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                    <th className="px-4 py-3 font-medium">Cliente</th>
                                    <th className="px-4 py-3 font-medium">Contacto</th>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium">Compras</th>
                                    <th className="px-4 py-3 font-medium">Estado</th>
                                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {client.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        {client.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="flex items-center gap-2 text-gray-600">
                                                <Mail size={14} /> {client.email || 'Sin correo'}
                                            </p>
                                            <p className="mt-2 flex items-center gap-2 text-gray-500">
                                                <Phone size={14} /> {client.phone || 'Sin teléfono'}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 text-gray-600">{client.type}</td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {client.purchases}
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${client.status === 'Activo'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {client.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => setSelectedClient(client)}
                                                    title="Ver detalles"
                                                    className="rounded-lg p-2 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
                                                >
                                                    <Eye size={17} />
                                                </button>
                                                <button
                                                    onClick={() => openEditForm(client)}
                                                    title="Editar cliente"
                                                    className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    <Pencil size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredClients.length === 0 && (
                            <div className="py-12 text-center">
                                <Users className="mx-auto text-gray-300" size={35} />
                                <p className="mt-3 font-medium text-gray-700">
                                    No se encontraron clientes
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    Prueba con otro término o cambia los filtros.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

              
            </div>

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="client-form-title"
                        className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2 id="client-form-title" className="text-xl font-bold text-gray-900">
                                {editingId ? 'Editar cliente' : 'Registrar cliente'}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                                aria-label="Cerrar formulario"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Nombre o razón social *
                                </label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                                    placeholder="Nombre del cliente"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Tipo de cliente
                                </label>
                                <select
                                    value={form.type}
                                    onChange={(e) =>
                                        setForm({ ...form, type: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                                >
                                    <option>Ocasional</option>
                                    <option>Frecuente</option>
                                    <option>Corporativo</option>
                                    <option>Mayorista</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                                    placeholder="cliente@correo.com"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Teléfono
                                    </label>
                                    <input
                                        value={form.phone}
                                        onChange={(e) =>
                                            setForm({ ...form, phone: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                                        placeholder="8888-0000"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                        Ciudad
                                    </label>
                                    <input
                                        value={form.location}
                                        onChange={(e) =>
                                            setForm({ ...form, location: e.target.value })
                                        }
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                                        placeholder="Managua"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p role="alert" className="text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                                >
                                    {editingId ? 'Guardar cambios' : 'Guardar cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="client-detail-title"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-emerald-700">{selectedClient.id}</p>
                                <h2
                                    id="client-detail-title"
                                    className="mt-1 text-xl font-bold text-gray-900"
                                >
                                    {selectedClient.name}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                                aria-label="Cerrar detalles"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4 text-sm text-gray-600">
                            <p className="flex items-center gap-3">
                                <Mail size={17} /> {selectedClient.email || 'Sin correo registrado'}
                            </p>
                            <p className="flex items-center gap-3">
                                <Phone size={17} /> {selectedClient.phone || 'Sin teléfono registrado'}
                            </p>
                            <p className="flex items-center gap-3">
                                <MapPin size={17} /> {selectedClient.location || 'Sin ubicación registrada'}
                            </p>
                            <p>Tipo: {selectedClient.type}</p>
                            <p>Compras registradas: {selectedClient.purchases}</p>
                            <p>Estado: {selectedClient.status}</p>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button
                                onClick={() => openEditForm(selectedClient)}
                                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => toggleStatus(selectedClient)}
                                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                            >
                                {selectedClient.status === 'Activo' ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
