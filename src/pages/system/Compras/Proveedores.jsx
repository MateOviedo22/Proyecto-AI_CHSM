
import { useMemo, useState } from 'react';
import {
    Building2,
    Search,
    Plus,
    Filter,
    MoreHorizontal,
    Users,
    CheckCircle2,
    XCircle,
    Package,
    X,
    Pencil,
    Eye,
    Phone,
    Mail,
    MapPin,
} from 'lucide-react';

const initialSuppliers = [
    {
        id: 1,
        code: 'PROV-001',
        name: 'Curtidos del Norte',
        contact: 'Carlos Martínez',
        phone: '8888-1200',
        email: 'ventas@curtidosnorte.com',
        address: 'Managua, Nicaragua',
        materials: 2,
        status: 'Activo',
    },
    {
        id: 2,
        code: 'PROV-002',
        name: 'Suministros León',
        contact: 'María López',
        phone: '8888-2450',
        email: 'contacto@suministrosleon.com',
        address: 'León, Nicaragua',
        materials: 3,
        status: 'Activo',
    },
    {
        id: 3,
        code: 'PROV-003',
        name: 'Textiles Centro',
        contact: 'Ana Rodríguez',
        phone: '8888-3175',
        email: 'ventas@textilescentro.com',
        address: 'Managua, Nicaragua',
        materials: 2,
        status: 'Activo',
    },
    {
        id: 4,
        code: 'PROV-004',
        name: 'Herrajes Nicaragua',
        contact: 'José Pérez',
        phone: '8888-4210',
        email: 'herrajesnic@gmail.com',
        address: 'Masaya, Nicaragua',
        materials: 2,
        status: 'Activo',
    },
    {
        id: 5,
        code: 'PROV-005',
        name: 'Empaques S.A.',
        contact: 'Laura Gómez',
        phone: '8888-5290',
        email: 'ventas@empaques.com',
        address: 'Managua, Nicaragua',
        materials: 1,
        status: 'Inactivo',
    },
];

const statuses = [
    'Todos',
    'Activo',
    'Inactivo',
];

const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100';

const emptyForm = {
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    status: 'Activo',
};

export default function Proveedores() {
    const [suppliers, setSuppliers] = useState(initialSuppliers);

    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('Todos');

    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [editingSupplier, setEditingSupplier] = useState(null);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const [form, setForm] = useState(emptyForm);

    /*
     * Filtrado
     */
    const filteredSuppliers = useMemo(() => {
        const searchValue = search.toLowerCase();

        return suppliers.filter((supplier) => {
            const matchesSearch =
                supplier.name.toLowerCase().includes(searchValue) ||
                supplier.code.toLowerCase().includes(searchValue) ||
                supplier.contact.toLowerCase().includes(searchValue) ||
                supplier.phone.includes(searchValue) ||
                supplier.email.toLowerCase().includes(searchValue);

            const matchesStatus =
                status === 'Todos' ||
                supplier.status === status;

            return matchesSearch && matchesStatus;
        });
    }, [suppliers, search, status]);

    /*
     * KPIs
     */
    const activeSuppliers = suppliers.filter(
        (supplier) => supplier.status === 'Activo'
    ).length;

    const inactiveSuppliers = suppliers.filter(
        (supplier) => supplier.status === 'Inactivo'
    ).length;

    const suppliersWithMaterials = suppliers.filter(
        (supplier) => supplier.materials > 0
    ).length;

    /*
     * Abrir formulario para nuevo proveedor
     */
    const openCreateForm = () => {
        setEditingSupplier(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    /*
     * Abrir formulario para editar
     */
    const openEditForm = (supplier) => {
        setEditingSupplier(supplier);

        setForm({
            name: supplier.name,
            contact: supplier.contact,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            status: supplier.status,
        });

        setShowForm(true);
    };

    /*
     * Guardar proveedor
     */
    const saveSupplier = (event) => {
        event.preventDefault();

        if (!form.name.trim()) return;

        /*
         * EDICIÓN
         */
        if (editingSupplier) {
            setSuppliers((previous) =>
                previous.map((supplier) =>
                    supplier.id === editingSupplier.id
                        ? {
                              ...supplier,
                              ...form,
                          }
                        : supplier
                )
            );
        }

        /*
         * NUEVO
         */
        else {
            const newSupplier = {
                ...form,
                id: Date.now(),
                code: generateSupplierCode(
                    suppliers.length + 1
                ),
                materials: 0,
            };

            setSuppliers((previous) => [
                ...previous,
                newSupplier,
            ]);
        }

        closeForm();
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingSupplier(null);
        setForm(emptyForm);
    };

    /*
     * Ver detalle
     */
    const openDetails = (supplier) => {
        setSelectedSupplier(supplier);
        setShowDetails(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">

                {/* ENCABEZADO */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                        <p className="text-sm font-medium text-emerald-700">
                            Sunshine Handmade / Inventario
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                            Proveedores
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm text-gray-500">
                            Administra los proveedores relacionados con las
                            materias primas, insumos y materiales del negocio.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateForm}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800"
                    >
                        <Plus size={18} />
                        Nuevo proveedor
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <SummaryCard
                        icon={<Building2 size={20} />}
                        label="Proveedores registrados"
                        value={suppliers.length}
                        detail="Total de proveedores"
                        iconClass="bg-blue-50 text-blue-600"
                    />

                    <SummaryCard
                        icon={<CheckCircle2 size={20} />}
                        label="Proveedores activos"
                        value={activeSuppliers}
                        detail="Disponibles para compras"
                        iconClass="bg-emerald-50 text-emerald-600"
                    />

                    <SummaryCard
                        icon={<Package size={20} />}
                        label="Con materiales asociados"
                        value={suppliersWithMaterials}
                        detail="Tienen materiales registrados"
                        iconClass="bg-purple-50 text-purple-600"
                    />

                    <SummaryCard
                        icon={<XCircle size={20} />}
                        label="Inactivos"
                        value={inactiveSuppliers}
                        detail="No disponibles actualmente"
                        iconClass="bg-red-50 text-red-600"
                    />

                </div>

                {/* TABLA */}
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                    {/* CABECERA */}
                    <div className="border-b border-gray-100 p-5">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Proveedores registrados
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Consulta y administra la información de los proveedores.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">

                                {/* BUSCADOR */}
                                <div className="relative">
                                    <Search
                                        size={17}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Buscar proveedor..."
                                        className={`${inputClass} pl-9 sm:w-64`}
                                    />
                                </div>

                                {/* FILTRO */}
                                <div className="relative">
                                    <Filter
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <select
                                        value={status}
                                        onChange={(event) =>
                                            setStatus(event.target.value)
                                        }
                                        className={`${inputClass} appearance-none pl-9 pr-8 sm:w-40`}
                                    >
                                        {statuses.map((item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* TABLA */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left text-sm">

                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>

                                    <th className="px-5 py-3.5 font-medium">
                                        Código
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Proveedor
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Contacto
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Teléfono
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Correo
                                    </th>

                                    <th className="px-5 py-3.5 font-medium">
                                        Materiales
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

                                {filteredSuppliers.length > 0 ? (

                                    filteredSuppliers.map((supplier) => (

                                        <tr
                                            key={supplier.id}
                                            className="transition hover:bg-gray-50/80"
                                        >

                                            <td className="px-5 py-4">
                                                <span className="font-medium text-gray-700">
                                                    {supplier.code}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {supplier.name}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {supplier.address}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {supplier.contact}
                                            </td>

                                            <td className="px-5 py-4 text-gray-600">
                                                {supplier.phone}
                                            </td>

                                            <td className="px-5 py-4 text-gray-500">
                                                {supplier.email}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="font-semibold text-gray-800">
                                                    {supplier.materials}
                                                </span>

                                                <span className="ml-1 text-xs text-gray-500">
                                                    registrados
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={supplier.status}
                                                />
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <div className="flex justify-end gap-1">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDetails(supplier)
                                                        }
                                                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye size={17} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEditForm(supplier)
                                                        }
                                                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                                        title="Editar proveedor"
                                                    >
                                                        <Pencil size={17} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openDetails(supplier)
                                                        }
                                                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                                        title="Más opciones"
                                                    >
                                                        <MoreHorizontal size={17} />
                                                    </button>

                                                </div>
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
                                                    <Building2
                                                        size={22}
                                                        className="text-gray-400"
                                                    />
                                                </div>

                                                <p className="font-medium text-gray-700">
                                                    No se encontraron proveedores
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

                    {/* PIE */}
                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                        <p className="text-xs text-gray-500">
                            Mostrando{' '}
                            <span className="font-medium text-gray-700">
                                {filteredSuppliers.length}
                            </span>{' '}
                            de{' '}
                            <span className="font-medium text-gray-700">
                                {suppliers.length}
                            </span>{' '}
                            proveedores
                        </p>
                    </div>

                </section>
            </div>

            {/* MODAL CREAR / EDITAR */}
            {showForm && (
                <Modal
                    title={
                        editingSupplier
                            ? 'Editar proveedor'
                            : 'Nuevo proveedor'
                    }
                    onClose={closeForm}
                >

                    <form
                        onSubmit={saveSupplier}
                        className="space-y-4"
                    >

                        <Field label="Nombre del proveedor">
                            <input
                                required
                                value={form.name}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        name: event.target.value,
                                    })
                                }
                                className={inputClass}
                                placeholder="Ej. Curtidos del Norte"
                            />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">

                            <Field label="Persona de contacto">
                                <input
                                    value={form.contact}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            contact: event.target.value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="Nombre del contacto"
                                />
                            </Field>

                            <Field label="Teléfono">
                                <input
                                    value={form.phone}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            phone: event.target.value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="8888-0000"
                                />
                            </Field>

                            <Field label="Correo electrónico">
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            email: event.target.value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="correo@proveedor.com"
                                />
                            </Field>

                            <Field label="Estado">
                                <select
                                    value={form.status}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            status: event.target.value,
                                        })
                                    }
                                    className={inputClass}
                                >
                                    <option>Activo</option>
                                    <option>Inactivo</option>
                                </select>
                            </Field>

                        </div>

                        <Field label="Dirección">
                            <input
                                value={form.address}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        address: event.target.value,
                                    })
                                }
                                className={inputClass}
                                placeholder="Ciudad / dirección"
                            />
                        </Field>

                        <div className="flex justify-end gap-2 pt-2">

                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                            >
                                {editingSupplier
                                    ? 'Guardar cambios'
                                    : 'Registrar proveedor'}
                            </button>

                        </div>

                    </form>

                </Modal>
            )}

            {/* MODAL DETALLE */}
            {showDetails && selectedSupplier && (
                <Modal
                    title="Detalle del proveedor"
                    onClose={() => {
                        setShowDetails(false);
                        setSelectedSupplier(null);
                    }}
                >

                    <div className="space-y-5">

                        <div className="flex items-start justify-between gap-4">

                            <div>
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                    {selectedSupplier.code}
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-gray-900">
                                    {selectedSupplier.name}
                                </h3>
                            </div>

                            <StatusBadge
                                status={selectedSupplier.status}
                            />

                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">

                            <InfoItem
                                icon={<Users size={17} />}
                                label="Contacto"
                                value={selectedSupplier.contact}
                            />

                            <InfoItem
                                icon={<Phone size={17} />}
                                label="Teléfono"
                                value={selectedSupplier.phone}
                            />

                            <InfoItem
                                icon={<Mail size={17} />}
                                label="Correo"
                                value={selectedSupplier.email}
                            />

                            <InfoItem
                                icon={<MapPin size={17} />}
                                label="Dirección"
                                value={selectedSupplier.address}
                            />

                            <InfoItem
                                icon={<Package size={17} />}
                                label="Materiales asociados"
                                value={`${selectedSupplier.materials} materiales`}
                            />

                        </div>

                        <div className="flex justify-end gap-2">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowDetails(false);
                                    openEditForm(selectedSupplier);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <Pencil size={16} />
                                Editar
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowDetails(false);
                                    setSelectedSupplier(null);
                                }}
                                className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                            >
                                Cerrar
                            </button>

                        </div>

                    </div>

                </Modal>
            )}

        </div>
    );
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

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
                <div
                    className={`inline-flex rounded-xl p-2.5 ${iconClass}`}
                >
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
        Activo: 'bg-emerald-50 text-emerald-700',
        Inactivo: 'bg-red-50 text-red-700',
    };

    const icons = {
        Activo: <CheckCircle2 size={13} />,
        Inactivo: <XCircle size={13} />,
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

function Field({ label, children }) {
    return (
        <label className="block space-y-1.5 text-sm font-medium text-gray-700">
            <span>{label}</span>
            {children}
        </label>
    );
}

function InfoItem({ icon, label, value }) {
    return (
        <div className="rounded-xl bg-gray-50 p-3">

            <div className="flex items-center gap-2 text-gray-400">
                {icon}
                <span className="text-xs">
                    {label}
                </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-gray-800">
                {value || 'No registrado'}
            </p>

        </div>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">

                <div className="mb-5 flex items-center justify-between gap-4">

                    <h2 className="text-lg font-bold text-gray-900">
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Cerrar"
                    >
                        <X size={19} />
                    </button>

                </div>

                {children}

            </div>
        </div>
    );
}

function generateSupplierCode(number) {
    return `PROV-${String(number).padStart(3, '0')}`;
}
