import { useMemo, useState } from 'react';
import {
    Search,
    Package,
    Eye,
    X,
    Filter,
    ShoppingBag,
    CheckCircle2,
    AlertCircle,
    Clock3,
    Tag,
} from 'lucide-react';

const productosIniciales = [
    {
        id: 'PR-001',
        nombre: 'Bolso artesanal clásico',
        categoria: 'Bolsos',
        precio: 1850,
        stock: 12,
        estado: 'Disponible',
        descripcion: 'Bolso de cuero artesanal con acabado clásico y compartimento principal.',
        material: 'Cuero genuino',
    },
    {
        id: 'PR-002',
        nombre: 'Billetera de cuero',
        categoria: 'Billeteras',
        precio: 650,
        stock: 20,
        estado: 'Disponible',
        descripcion: 'Billetera compacta con espacios para tarjetas y efectivo.',
        material: 'Cuero genuino',
    },
    {
        id: 'PR-003',
        nombre: 'Cartera de mano',
        categoria: 'Carteras',
        precio: 1250,
        stock: 7,
        estado: 'Disponible',
        descripcion: 'Cartera de mano elaborada artesanalmente, ideal para uso diario.',
        material: 'Cuero y forro textil',
    },
    {
        id: 'PR-004',
        nombre: 'Mochila urbana',
        categoria: 'Mochilas',
        precio: 2400,
        stock: 0,
        estado: 'Agotado',
        descripcion: 'Mochila de diseño urbano con correas ajustables.',
        material: 'Cuero genuino',
    },
    {
        id: 'PR-005',
        nombre: 'Monedero artesanal',
        categoria: 'Billeteras',
        precio: 420,
        stock: 3,
        estado: 'Stock bajo',
        descripcion: 'Monedero pequeño con cierre y acabado hecho a mano.',
        material: 'Cuero genuino',
    },
    {
        id: 'PR-006',
        nombre: 'Bolso de hombro',
        categoria: 'Bolsos',
        precio: 2100,
        stock: 9,
        estado: 'Disponible',
        descripcion: 'Bolso de hombro con correa ajustable y diseño artesanal.',
        material: 'Cuero genuino',
    },
];

const moneda = (valor) =>
    new Intl.NumberFormat('es-NI', {
        style: 'currency',
        currency: 'NIO',
        maximumFractionDigits: 2,
    }).format(valor);

const colorEstado = {
    Disponible: 'bg-green-100 text-green-700',
    'Stock bajo': 'bg-amber-100 text-amber-700',
    Agotado: 'bg-red-100 text-red-700',
};

export default function CatalogoVentas() {
    const [productos] = useState(productosIniciales);
    const [busqueda, setBusqueda] = useState('');
    const [categoria, setCategoria] = useState('Todas');
    const [disponibilidad, setDisponibilidad] = useState('Todos');
    const [orden, setOrden] = useState('nombre');
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    const categorias = [
        'Todas',
        ...new Set(productos.map((producto) => producto.categoria)),
    ];

    const productosFiltrados = useMemo(() => {
        return productos
            .filter((producto) => {
                const coincideBusqueda =
                    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                    producto.id.toLowerCase().includes(busqueda.toLowerCase());

                const coincideCategoria =
                    categoria === 'Todas' || producto.categoria === categoria;

                const coincideDisponibilidad =
                    disponibilidad === 'Todos' ||
                    producto.estado === disponibilidad;

                return (
                    coincideBusqueda &&
                    coincideCategoria &&
                    coincideDisponibilidad
                );
            })
            .sort((a, b) => {
                if (orden === 'precio-menor') return a.precio - b.precio;
                if (orden === 'precio-mayor') return b.precio - a.precio;
                if (orden === 'stock') return b.stock - a.stock;
                return a.nombre.localeCompare(b.nombre);
            });
    }, [productos, busqueda, categoria, disponibilidad, orden]);

    const totalProductos = productos.length;
    const disponibles = productos.filter((p) => p.stock > 0).length;
    const agotados = productos.filter((p) => p.stock === 0).length;

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-500">Ventas / Catálogo comercial</p>
                    <h1 className="mt-1 text-2xl font-bold text-gray-800">
                        Catálogo de ventas
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Consulta los productos terminados, sus precios y su disponibilidad.
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                    <ShoppingBag size={20} />
                    <span>Catálogo de Sunshine Handmade</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Productos registrados</p>
                        <Package className="text-orange-500" size={21} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">
                        {totalProductos}
                    </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Con existencias</p>
                        <CheckCircle2 className="text-green-600" size={21} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{disponibles}</p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Agotados</p>
                        <AlertCircle className="text-red-500" size={21} />
                    </div>
                    <p className="mt-3 text-2xl font-bold text-gray-800">{agotados}</p>
                </div>
            </div>

            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
                <div className="mb-4 flex items-center gap-2">
                    <Filter size={19} className="text-orange-500" />
                    <h2 className="font-semibold text-gray-800">Buscar y filtrar</h2>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar producto o código..."
                            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                    >
                        {categorias.map((item) => (
                            <option key={item} value={item}>
                                {item === 'Todas' ? 'Todas las categorías' : item}
                            </option>
                        ))}
                    </select>

                    <select
                        value={disponibilidad}
                        onChange={(e) => setDisponibilidad(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                    >
                        <option value="Todos">Todas las disponibilidades</option>
                        <option value="Disponible">Disponible</option>
                        <option value="Stock bajo">Stock bajo</option>
                        <option value="Agotado">Agotado</option>
                    </select>

                    <select
                        value={orden}
                        onChange={(e) => setOrden(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-orange-400"
                    >
                        <option value="nombre">Ordenar por nombre</option>
                        <option value="precio-menor">Precio: menor a mayor</option>
                        <option value="precio-mayor">Precio: mayor a menor</option>
                        <option value="stock">Mayor existencia</option>
                    </select>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 className="font-semibold text-gray-800">Productos</h2>
                    <span className="text-sm text-gray-500">
                        {productosFiltrados.length} resultado(s)
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Producto</th>
                                <th className="px-5 py-3 font-semibold">Categoría</th>
                                <th className="px-5 py-3 font-semibold">Precio</th>
                                <th className="px-5 py-3 font-semibold">Existencias</th>
                                <th className="px-5 py-3 font-semibold">Estado</th>
                                <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {productosFiltrados.map((producto) => (
                                <tr key={producto.id} className="hover:bg-orange-50/40">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                                                <ShoppingBag size={19} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">
                                                    {producto.nombre}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {producto.id}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600">
                                        {producto.categoria}
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-gray-800">
                                        {moneda(producto.precio)}
                                    </td>
                                    <td className="px-5 py-4 text-gray-600">{producto.stock}</td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${colorEstado[producto.estado]}`}
                                        >
                                            {producto.estado}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => setProductoSeleccionado(producto)}
                                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                                        >
                                            <Eye size={15} />
                                            Ver detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {productosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <Package className="mx-auto mb-3 text-gray-300" size={32} />
                                        <p className="font-medium text-gray-700">
                                            No se encontraron productos
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Prueba con otro nombre o cambia los filtros.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {productoSeleccionado && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                        <div className="flex items-start justify-between border-b border-gray-100 p-5">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Código {productoSeleccionado.id}
                                </p>
                                <h2 className="mt-1 text-xl font-bold text-gray-800">
                                    {productoSeleccionado.nombre}
                                </h2>
                            </div>
                            <button
                                onClick={() => setProductoSeleccionado(null)}
                                aria-label="Cerrar detalle"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-4">
                                <div className="rounded-xl bg-white p-3 text-orange-600">
                                    <Tag size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Precio de venta</p>
                                    <p className="text-xl font-bold text-gray-800">
                                        {moneda(productoSeleccionado.precio)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-gray-100 p-3">
                                    <p className="text-xs text-gray-500">Categoría</p>
                                    <p className="mt-1 font-medium text-gray-800">
                                        {productoSeleccionado.categoria}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-100 p-3">
                                    <p className="text-xs text-gray-500">Existencias</p>
                                    <p className="mt-1 font-medium text-gray-800">
                                        {productoSeleccionado.stock} unidad(es)
                                    </p>
                                </div>
                                <div className="col-span-2 rounded-xl border border-gray-100 p-3">
                                    <p className="text-xs text-gray-500">Material</p>
                                    <p className="mt-1 font-medium text-gray-800">
                                        {productoSeleccionado.material}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700">Descripción</p>
                                <p className="mt-1 text-sm leading-6 text-gray-600">
                                    {productoSeleccionado.descripcion}
                                </p>
                            </div>

                            <div>
                                <span
                                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${colorEstado[productoSeleccionado.estado]}`}
                                >
                                    {productoSeleccionado.estado}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-gray-100 p-5">
                            <button
                                onClick={() => setProductoSeleccionado(null)}
                                className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}