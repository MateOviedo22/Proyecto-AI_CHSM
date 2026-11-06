
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
    X,
    ShoppingCart,
} from 'lucide-react';

const initialMaterials = [
    {
        id: 1,
        code: 'MAT-CUE-001',
        name: 'Cuero tratado café',
        type: 'Materia prima',
        category: 'Cuero',
        unit: 'm²',
        stock: 45,
        minimum: 50,
        cost: 380,
        location: 'Almacén principal',
        supplier: 'Curtidos del Norte',
    },
    {
        id: 2,
        code: 'MAT-CUE-002',
        name: 'Cuero natural',
        type: 'Materia prima',
        category: 'Cuero',
        unit: 'm²',
        stock: 85,
        minimum: 40,
        cost: 420,
        location: 'Almacén principal',
        supplier: 'Curtidora Nacional',
    },
    {
        id: 3,
        code: 'MAT-HIL-001',
        name: 'Carrete de hilo negro',
        type: 'Insumo',
        category: 'Costura',
        unit: 'carrete',
        stock: 5,
        minimum: 15,
        cost: 95,
        location: 'Taller de producción',
        supplier: 'Textiles Centro',
    },
    {
        id: 4,
        code: 'MAT-HIL-002',
        name: 'Carrete de hilo café',
        type: 'Insumo',
        category: 'Costura',
        unit: 'carrete',
        stock: 24,
        minimum: 10,
        cost: 95,
        location: 'Taller de producción',
        supplier: 'Textiles Centro',
    },
    {
        id: 5,
        code: 'MAT-HER-001',
        name: 'Botones de presión 25 mm',
        type: 'Insumo',
        category: 'Herrajes',
        unit: 'unidad',
        stock: 100,
        minimum: 200,
        cost: 8.5,
        location: 'Almacén principal',
        supplier: 'Suministros León',
    },
    {
        id: 6,
        code: 'MAT-HER-002',
        name: 'Herrajes metálicos',
        type: 'Insumo',
        category: 'Herrajes',
        unit: 'unidad',
        stock: 320,
        minimum: 100,
        cost: 22,
        location: 'Almacén principal',
        supplier: 'Herrajes Nicaragua',
    },
    {
        id: 7,
        code: 'MAT-TEX-001',
        name: 'Forro textil beige',
        type: 'Materia prima',
        category: 'Textil',
        unit: 'm',
        stock: 85,
        minimum: 25,
        cost: 65,
        location: 'Almacén principal',
        supplier: 'Textiles Centro',
    },
    {
        id: 8,
        code: 'MAT-EMP-001',
        name: 'Caja de cartón mediana',
        type: 'Empaque',
        category: 'Empaque',
        unit: 'unidad',
        stock: 75,
        minimum: 30,
        cost: 18,
        location: 'Almacén de empaques',
        supplier: 'Empaques S.A.',
    },
];

const types = [
    'Todos',
    'Materia prima',
    'Insumo',
    'Empaque',
];

const categories = [
    'Todas',
    'Cuero',
    'Herrajes',
    'Costura',
    'Textil',
    'Empaque',
    'Otro',
];

const units = [
    'unidad',
    'm²',
    'm',
    'carrete',
    'kg',
    'litro',
];

const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100';

const money = (value) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(value);

export default function Catalogo_Materiales() {
    const [materials, setMaterials] = useState(initialMaterials);

    const [search, setSearch] = useState('');
    const [type, setType] = useState('Todos');
    const [category, setCategory] = useState('Todas');

    // Modal nuevo material
    const [showForm, setShowForm] = useState(false);

    // Modal detalles
    const [showDetails, setShowDetails] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    // Modal registrar compra
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);

    const emptyForm = {
        name: '',
        type: 'Materia prima',
        category: 'Cuero',
        unit: 'unidad',
        stock: 0,
        minimum: 0,
        cost: 0,
        location: 'Almacén principal',
        supplier: '',
    };

    const [form, setForm] = useState(emptyForm);

    const emptyPurchaseForm = {
        materialId: '',
        supplier: '',
        quantity: '',
        unitCost: '',
        invoice: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    };

    const [purchaseForm, setPurchaseForm] =
        useState(emptyPurchaseForm);

    /*
     * Determina automáticamente el estado
     * según la existencia y el mínimo.
     */
    const getStatus = (material) => {
        const stock = Number(material.stock);
        const minimum = Number(material.minimum);

        if (stock === 0) return 'Crítico';
        if (stock <= minimum) return 'Bajo';

        return 'Disponible';
    };

    /*
     * Filtrado del catálogo.
     */
    const filteredMaterials = materials.filter((material) => {
        const searchValue = search.toLowerCase();

        const matchesSearch =
            material.name.toLowerCase().includes(searchValue) ||
            material.code.toLowerCase().includes(searchValue) ||
            material.supplier.toLowerCase().includes(searchValue);

        const matchesType =
            type === 'Todos' || material.type === type;

        const matchesCategory =
            category === 'Todas' ||
            material.category === category;

        return (
            matchesSearch &&
            matchesType &&
            matchesCategory
        );
    });

    /*
     * Indicadores.
     */
    const rawMaterials = materials.filter(
        (material) => material.type === 'Materia prima'
    ).length;

    const supplies = materials.filter(
        (material) => material.type === 'Insumo'
    ).length;

    const lowStock = materials.filter(
        (material) => getStatus(material) === 'Bajo'
    ).length;

    const criticalStock = materials.filter(
        (material) => getStatus(material) === 'Crítico'
    ).length;

    /*
     * Valor total estimado del inventario.
     */
    const inventoryValue = materials.reduce(
        (total, material) =>
            total +
            Number(material.stock) *
                Number(material.cost),
        0
    );

    /*
     * Agregar material.
     */
    const saveMaterial = (event) => {
        event.preventDefault();

        if (!form.name.trim()) return;

        const newMaterial = {
            ...form,
            id: Date.now(),
            code: generateMaterialCode(
                form.type,
                materials.length + 1
            ),
            stock: Number(form.stock),
            minimum: Number(form.minimum),
            cost: Number(form.cost),
        };

        setMaterials((previous) => [
            ...previous,
            newMaterial,
        ]);

        setForm(emptyForm);
        setShowForm(false);
    };

    /*
     * Abrir detalles.
     */
    const openDetails = (material) => {
        setSelectedMaterial(material);
        setShowDetails(true);
    };

    /*
     * Abrir modal de compra.
     */
    const openPurchaseForm = () => {
        setPurchaseForm(emptyPurchaseForm);
        setShowPurchaseForm(true);
    };

    /*
     * Registrar compra.
     *
     * La compra aumenta el stock y calcula
     * un nuevo costo promedio ponderado.
     */
    const savePurchase = (event) => {
        event.preventDefault();

        const materialId = Number(
            purchaseForm.materialId
        );

        const quantity = Number(
            purchaseForm.quantity
        );

        const unitCost = Number(
            purchaseForm.unitCost
        );

        if (
            !materialId ||
            quantity <= 0 ||
            unitCost < 0
        ) {
            return;
        }

        setMaterials((previousMaterials) =>
            previousMaterials.map((material) => {
                if (material.id !== materialId) {
                    return material;
                }

                const currentStock =
                    Number(material.stock);

                const currentCost =
                    Number(material.cost);

                // Valor actual del inventario
                const currentInventoryValue =
                    currentStock * currentCost;

                // Valor de la nueva compra
                const purchaseValue =
                    quantity * unitCost;

                // Nueva existencia
                const newStock =
                    currentStock + quantity;

                // Nuevo costo promedio
                const newAverageCost =
                    newStock > 0
                        ? (
                              currentInventoryValue +
                              purchaseValue
                          ) / newStock
                        : unitCost;

                return {
                    ...material,

                    stock: newStock,

                    cost: Number(
                        newAverageCost.toFixed(2)
                    ),

                    supplier:
                        purchaseForm.supplier ||
                        material.supplier,
                };
            })
        );

        setPurchaseForm(emptyPurchaseForm);
        setShowPurchaseForm(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-7">

                {/* =====================================================
                    ENCABEZADO
                ====================================================== */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                        <p className="text-sm font-medium text-emerald-700">
                            Sunshine Handmade / Inventario
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                            Catálogo de Materiales
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm text-gray-500">
                            Administra las materias primas,
                            insumos y materiales utilizados en
                            los procesos de producción.
                        </p>
                    </div>

                    {/* BOTONES */}
                    <div className="flex flex-col gap-2 sm:flex-row">

                        {/* REGISTRAR COMPRA */}
                        <button
                            type="button"
                            onClick={openPurchaseForm}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                        >
                            <ShoppingCart size={18} />
                            Registrar compra
                        </button>

                        {/* NUEVO MATERIAL */}
                        <button
                            type="button"
                            onClick={() =>
                                setShowForm(true)
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800"
                        >
                            <Plus size={18} />
                            Nuevo material
                        </button>

                    </div>
                </div>

                {/* =====================================================
                    KPIs
                ====================================================== */}

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
                        icon={
                            <AlertTriangle size={20} />
                        }
                        label="Stock bajo"
                        value={lowStock}
                        detail="Necesitan reposición"
                        iconClass="bg-amber-50 text-amber-600"
                    />

                    <SummaryCard
                        icon={
                            <AlertTriangle size={20} />
                        }
                        label="Stock crítico"
                        value={criticalStock}
                        detail="Requieren atención"
                        iconClass="bg-red-50 text-red-600"
                    />

                </div>

                {/* =====================================================
                    VALOR DEL INVENTARIO
                ====================================================== */}

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <div>
                            <p className="text-sm text-gray-500">
                                Valor estimado de materiales
                            </p>

                            <p className="mt-1 text-2xl font-bold text-gray-900">
                                {money(inventoryValue)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                            <Package size={22} />
                        </div>

                    </div>
                </div>

                {/* =====================================================
                    TABLA
                ====================================================== */}

                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

                    {/* CABECERA */}
                    <div className="border-b border-gray-100 p-5">

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Materiales registrados
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Consulta las existencias y
                                    datos asociados a cada material.
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
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Buscar material..."
                                        className={`${inputClass} pl-9 sm:w-64`}
                                    />

                                </div>

                                {/* FILTRO TIPO */}
                                <div className="relative">

                                    <Filter
                                        size={16}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />

                                    <select
                                        value={type}
                                        onChange={(event) =>
                                            setType(
                                                event.target.value
                                            )
                                        }
                                        className={`${inputClass} appearance-none pl-9 pr-8 sm:w-48`}
                                    >
                                        {types.map((item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        ))}
                                    </select>

                                </div>

                                {/* FILTRO CATEGORÍA */}
                                <select
                                    value={category}
                                    onChange={(event) =>
                                        setCategory(
                                            event.target.value
                                        )
                                    }
                                    className={`${inputClass} sm:w-40`}
                                >
                                    {categories.map((item) => (
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

                    {/* TABLA */}
                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1150px] text-left text-sm">

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
                                        Costo unitario
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

                                    filteredMaterials.map(
                                        (material) => {

                                            const status =
                                                getStatus(
                                                    material
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        material.id
                                                    }
                                                    className="transition hover:bg-gray-50/80"
                                                >

                                                    <td className="px-5 py-4">
                                                        <span className="font-medium text-gray-700">
                                                            {
                                                                material.code
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {
                                                                    material.name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-gray-400">
                                                                Mínimo:{' '}
                                                                {
                                                                    material.minimum
                                                                }{' '}
                                                                {
                                                                    material.unit
                                                                }
                                                            </p>
                                                        </div>

                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <TypeBadge
                                                            type={
                                                                material.type
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4">

                                                        <span className="font-semibold text-gray-900">
                                                            {
                                                                material.stock
                                                            }
                                                        </span>

                                                        <span className="ml-1 text-xs text-gray-500">
                                                            {
                                                                material.unit
                                                            }
                                                        </span>

                                                    </td>

                                                    <td className="px-5 py-4 font-medium text-gray-700">
                                                        {money(
                                                            material.cost
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-gray-500">
                                                        {
                                                            material.location
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-gray-500">
                                                        {
                                                            material.supplier ||
                                                            'Sin proveedor'
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <StatusBadge
                                                            status={
                                                                status
                                                            }
                                                        />
                                                    </td>

                                                    <td className="px-5 py-4 text-right">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDetails(
                                                                    material
                                                                )
                                                            }
                                                            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                                            aria-label={`Ver ${material.name}`}
                                                        >
                                                            <MoreHorizontal
                                                                size={
                                                                    18
                                                                }
                                                            />
                                                        </button>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="9"
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
                                                    Intenta cambiar los
                                                    filtros de búsqueda.
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

            {/* =========================================================
                MODAL REGISTRAR COMPRA
            ========================================================== */}

            {showPurchaseForm && (
                <Modal
                    title="Registrar compra"
                    onClose={() => {
                        setShowPurchaseForm(false);
                        setPurchaseForm(
                            emptyPurchaseForm
                        );
                    }}
                >

                    <form
                        onSubmit={savePurchase}
                        className="space-y-4"
                    >

                        {/* INFORMACIÓN */}
                        <div className="rounded-xl bg-emerald-50 p-4">

                            <div className="flex items-start gap-3">

                                <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                                    <ShoppingCart
                                        size={20}
                                    />
                                </div>

                                <div>

                                    <p className="font-semibold text-emerald-900">
                                        Entrada de materiales
                                    </p>

                                    <p className="mt-1 text-sm text-emerald-700">
                                        Registra una compra para
                                        aumentar automáticamente
                                        la existencia del material.
                                    </p>

                                </div>

                            </div>

                        </div>

                        {/* MATERIAL */}
                        <Field label="Material">

                            <select
                                required
                                value={
                                    purchaseForm.materialId
                                }
                                onChange={(event) => {

                                    const materialId =
                                        Number(
                                            event.target.value
                                        );

                                    const material =
                                        materials.find(
                                            (item) =>
                                                item.id ===
                                                materialId
                                        );

                                    setPurchaseForm({
                                        ...purchaseForm,

                                        materialId:
                                            event.target.value,

                                        supplier:
                                            material?.supplier ||
                                            '',

                                        unitCost:
                                            material?.cost ||
                                            '',
                                    });
                                }}
                                className={inputClass}
                            >

                                <option value="">
                                    Seleccionar material
                                </option>

                                {materials.map(
                                    (material) => (
                                        <option
                                            key={
                                                material.id
                                            }
                                            value={
                                                material.id
                                            }
                                        >
                                            {material.code} —{' '}
                                            {material.name}
                                        </option>
                                    )
                                )}

                            </select>

                        </Field>

                        {/* DATOS PRINCIPALES */}
                        <div className="grid gap-4 sm:grid-cols-2">

                            <Field label="Proveedor">

                                <input
                                    required
                                    value={
                                        purchaseForm.supplier
                                    }
                                    onChange={(event) =>
                                        setPurchaseForm({
                                            ...purchaseForm,
                                            supplier:
                                                event.target
                                                    .value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="Nombre del proveedor"
                                />

                            </Field>

                            <Field label="Fecha de compra">

                                <input
                                    type="date"
                                    required
                                    value={
                                        purchaseForm.date
                                    }
                                    onChange={(event) =>
                                        setPurchaseForm({
                                            ...purchaseForm,
                                            date: event.target
                                                .value,
                                        })
                                    }
                                    className={inputClass}
                                />

                            </Field>

                            <Field label="Cantidad comprada">

                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={
                                        purchaseForm.quantity
                                    }
                                    onChange={(event) =>
                                        setPurchaseForm({
                                            ...purchaseForm,
                                            quantity:
                                                event.target
                                                    .value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="Ej. 25"
                                />

                            </Field>

                            <Field label="Costo unitario (C$)">

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={
                                        purchaseForm.unitCost
                                    }
                                    onChange={(event) =>
                                        setPurchaseForm({
                                            ...purchaseForm,
                                            unitCost:
                                                event.target
                                                    .value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="Ej. 380.00"
                                />

                            </Field>

                            <Field label="Factura / documento">

                                <input
                                    value={
                                        purchaseForm.invoice
                                    }
                                    onChange={(event) =>
                                        setPurchaseForm({
                                            ...purchaseForm,
                                            invoice:
                                                event.target
                                                    .value,
                                        })
                                    }
                                    className={inputClass}
                                    placeholder="Ej. FAC-00125"
                                />

                            </Field>

                        </div>

                        {/* OBSERVACIONES */}
                        <Field label="Observaciones">

                            <textarea
                                value={
                                    purchaseForm.notes
                                }
                                onChange={(event) =>
                                    setPurchaseForm({
                                        ...purchaseForm,
                                        notes: event.target
                                            .value,
                                    })
                                }
                                rows={3}
                                className={inputClass}
                                placeholder="Observaciones de la compra..."
                            />

                        </Field>

                        {/* TOTAL */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

                            <div className="flex items-center justify-between">

                                <span className="text-sm text-gray-500">
                                    Total de compra
                                </span>

                                <span className="text-xl font-bold text-gray-900">
                                    {money(
                                        Number(
                                            purchaseForm.quantity ||
                                                0
                                        ) *
                                            Number(
                                                purchaseForm.unitCost ||
                                                    0
                                            )
                                    )}
                                </span>

                            </div>

                            {/* EXISTENCIA ACTUAL */}
                            {purchaseForm.materialId && (

                                <div className="mt-3 border-t border-gray-200 pt-3">

                                    {(() => {

                                        const material =
                                            materials.find(
                                                (item) =>
                                                    item.id ===
                                                    Number(
                                                        purchaseForm.materialId
                                                    )
                                            );

                                        if (!material) {
                                            return null;
                                        }

                                        const quantity =
                                            Number(
                                                purchaseForm.quantity ||
                                                    0
                                            );

                                        return (
                                            <div className="space-y-2 text-xs">

                                                <div className="flex items-center justify-between text-gray-500">

                                                    <span>
                                                        Existencia actual
                                                    </span>

                                                    <span className="font-medium text-gray-700">
                                                        {
                                                            material.stock
                                                        }{' '}
                                                        {
                                                            material.unit
                                                        }
                                                    </span>

                                                </div>

                                                <div className="flex items-center justify-between text-gray-500">

                                                    <span>
                                                        Existencia después de compra
                                                    </span>

                                                    <span className="font-semibold text-emerald-700">

                                                        {(
                                                            Number(
                                                                material.stock
                                                            ) +
                                                            quantity
                                                        ).toFixed(
                                                            2
                                                        )}{' '}

                                                        {
                                                            material.unit
                                                        }

                                                    </span>

                                                </div>

                                            </div>
                                        );

                                    })()}

                                </div>
                            )}

                        </div>

                        {/* BOTONES */}
                        <div className="flex justify-end gap-2 pt-2">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowPurchaseForm(
                                        false
                                    );
                                    setPurchaseForm(
                                        emptyPurchaseForm
                                    );
                                }}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                            >
                                <ShoppingCart size={17} />
                                Registrar compra
                            </button>

                        </div>

                    </form>

                </Modal>
            )}

            {/* =========================================================
                MODAL NUEVO MATERIAL
            ========================================================== */}

            {showForm && (
                <Modal
                    title="Nuevo material"
                    onClose={() => {
                        setShowForm(false);
                        setForm(emptyForm);
                    }}
                >

                    <form
                        onSubmit={saveMaterial}
                        className="space-y-4"
                    >

                        <Field label="Nombre del material">

                            <input
                                required
                                value={form.name}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        name: event.target
                                            .value,
                                    })
                                }
                                className={inputClass}
                                placeholder="Ej. Cuero natural"
                            />

                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">

                            <Field label="Tipo">

                                <select
                                    value={form.type}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            type: event.target
                                                .value,
                                        })
                                    }
                                    className={inputClass}
                                >

                                    <option>
                                        Materia prima
                                    </option>

                                    <option>
                                        Insumo
                                    </option>

                                    <option>
                                        Empaque
                                    </option>

                                </select>

                            </Field>

                            <Field label="Categoría">

                                <select
                                    value={
                                        form.category
                                    }
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            category:
                                                event.target
                                                    .value,
                                        })
                                    }
                                    className={inputClass}
                                >

                                    {categories
                                        .filter(
                                            (item) =>
                                                item !==
                                                'Todas'
                                        )
                                        .map((item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        ))}

                                </select>

                            </Field>

                            <Field label="Unidad de medida">

                                <select
                                    value={form.unit}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            unit: event.target
                                                .value,
                                        })
                                    }
                                    className={inputClass}
                                >

                                    {units.map((unit) => (
                                        <option
                                            key={unit}
                                            value={unit}
                                        >
                                            {unit}
                                        </option>
                                    ))}

                                </select>

                            </Field>

                            <Field label="Existencia actual">

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={form.stock}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            stock: event.target
                                                .value,
                                        })
                                    }
                                    className={inputClass}
                                />

                            </Field>

                            <Field label="Stock mínimo">

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={form.minimum}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            minimum:
                                                event.target
                                                    .value,
                                        })
                                    }
                                    className={inputClass}
                                />

                            </Field>

                            <Field label="Costo unitario (C$)">

                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={form.cost}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            cost: event.target
                                                .value,
                                        })
                                    }
                                    className={inputClass}
                                />

                            </Field>

                        </div>

                        <Field label="Ubicación">

                            <input
                                value={form.location}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        location:
                                            event.target
                                                .value,
                                    })
                                }
                                className={inputClass}
                                placeholder="Ej. Almacén principal"
                            />

                        </Field>

                        <Field label="Proveedor">

                            <input
                                value={form.supplier}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        supplier:
                                            event.target
                                                .value,
                                    })
                                }
                                className={inputClass}
                                placeholder="Nombre del proveedor"
                            />

                        </Field>

                        <div className="flex justify-end gap-2 pt-2">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setForm(emptyForm);
                                }}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                            >
                                Guardar material
                            </button>

                        </div>

                    </form>

                </Modal>
            )}

            {/* =========================================================
                MODAL DETALLE
            ========================================================== */}

            {showDetails &&
                selectedMaterial && (
                    <Modal
                        title="Detalle del material"
                        onClose={() => {
                            setShowDetails(false);
                            setSelectedMaterial(null);
                        }}
                    >

                        <div className="space-y-5">

                            <div className="flex items-start justify-between gap-4">

                                <div>

                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                        {
                                            selectedMaterial.code
                                        }
                                    </p>

                                    <h3 className="mt-1 text-xl font-bold text-gray-900">
                                        {
                                            selectedMaterial.name
                                        }
                                    </h3>

                                </div>

                                <StatusBadge
                                    status={getStatus(
                                        selectedMaterial
                                    )}
                                />

                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">

                                <DetailItem
                                    label="Tipo"
                                    value={
                                        selectedMaterial.type
                                    }
                                />

                                <DetailItem
                                    label="Categoría"
                                    value={
                                        selectedMaterial.category
                                    }
                                />

                                <DetailItem
                                    label="Existencia"
                                    value={`${selectedMaterial.stock} ${selectedMaterial.unit}`}
                                />

                                <DetailItem
                                    label="Stock mínimo"
                                    value={`${selectedMaterial.minimum} ${selectedMaterial.unit}`}
                                />

                                <DetailItem
                                    label="Costo unitario"
                                    value={money(
                                        selectedMaterial.cost
                                    )}
                                />

                                <DetailItem
                                    label="Valor en existencia"
                                    value={money(
                                        selectedMaterial.stock *
                                            selectedMaterial.cost
                                    )}
                                />

                                <DetailItem
                                    label="Ubicación"
                                    value={
                                        selectedMaterial.location
                                    }
                                />

                                <DetailItem
                                    label="Proveedor"
                                    value={
                                        selectedMaterial.supplier ||
                                        'Sin proveedor'
                                    }
                                />

                            </div>

                            <div className="flex justify-end">

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDetails(
                                            false
                                        );
                                        setSelectedMaterial(
                                            null
                                        );
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

function TypeBadge({ type }) {
    const styles = {
        'Materia prima':
            'bg-blue-50 text-blue-700',

        Insumo:
            'bg-emerald-50 text-emerald-700',

        Empaque:
            'bg-purple-50 text-purple-700',
    };

    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
                styles[type] ||
                'bg-gray-100 text-gray-600'
            }`}
        >
            {type}
        </span>
    );
}

function StatusBadge({ status }) {
    const styles = {
        Disponible:
            'bg-emerald-50 text-emerald-700',

        Bajo:
            'bg-amber-50 text-amber-700',

        Crítico:
            'bg-red-50 text-red-700',
    };

    const icons = {
        Disponible: <CheckCircle2 size={13} />,
        Bajo: <AlertTriangle size={13} />,
        Crítico: <AlertTriangle size={13} />,
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                styles[status] ||
                'bg-gray-100 text-gray-600'
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

function DetailItem({ label, value }) {
    return (
        <div className="rounded-xl bg-gray-50 p-3">

            <p className="text-xs text-gray-400">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-800">
                {value}
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

function generateMaterialCode(type, number) {
    const prefixes = {
        'Materia prima': 'MAT',
        Insumo: 'INS',
        Empaque: 'EMP',
    };

    const prefix =
        prefixes[type] || 'MAT';

    return `${prefix}-NUE-${String(
        number
    ).padStart(3, '0')}`;
}
