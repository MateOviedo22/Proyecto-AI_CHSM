import { Link } from "react-router-dom";
import {
    TrendingUp,
    ShoppingBag,
    Package,
    AlertTriangle,
    Factory,
    ClipboardList,
    ArrowUpRight,
    ArrowRight,
    CircleDollarSign,
    Users,
    ShoppingCart,
    Boxes,
    ClipboardPlus,
    FileWarning,
    Clock3,
    CheckCircle2,
} from "lucide-react";

// Datos de demostración. Más adelante se conectarán con el backend.
const ventas = {
    dia: 4250,
    mes: 128450,
    productosVendidos: 86,
};

const productosMasVendidos = [
    { nombre: "Cartera artesanal", unidades: 32, porcentaje: 90 },
    { nombre: "Billetera de cuero", unidades: 25, porcentaje: 70 },
    { nombre: "Bolso artesanal", unidades: 18, porcentaje: 50 },
    { nombre: "Cinturón de cuero", unidades: 11, porcentaje: 30 },
];

const evolucionIngresos = [
    { mes: "May", valor: 65 },
    { mes: "Jun", valor: 78 },
    { mes: "Jul", valor: 55 },
    { mes: "Ago", valor: 90 },
    { mes: "Sep", valor: 72 },
    { mes: "Oct", valor: 100 },
];

const inventario = {
    productosStockBajo: 6,
    materialesAgotados: 2,
    valorStock: 186500,
};

const produccion = {
    enProceso: 8,
    atrasadas: 2,
    unidadesProducidas: 145,
    mermas: 4,
};

const alertas = [
    {
        id: 1,
        tipo: "Inventario",
        titulo: "Existencias bajas",
        detalle: "6 productos necesitan revisión.",
        prioridad: "Alta",
        icono: Package,
        ruta: "/sistema/inventario",
    },
    {
        id: 2,
        tipo: "Producción",
        titulo: "Órdenes retrasadas",
        detalle: "2 órdenes requieren seguimiento.",
        prioridad: "Alta",
        icono: Factory,
        ruta: "/sistema/produccion",
    },
    {
        id: 3,
        tipo: "Ventas",
        titulo: "Pedidos pendientes",
        detalle: "Hay pedidos que todavía no se entregan.",
        prioridad: "Media",
        icono: ShoppingBag,
        ruta: "/sistema/ventas/ordenes-venta",
    },
    {
        id: 4,
        tipo: "Finanzas",
        titulo: "Facturas por vencer",
        detalle: "Revisá las cuentas pendientes de cobro.",
        prioridad: "Media",
        icono: FileWarning,
        ruta: "/sistema/finanzas/cuentas-por-cobrar",
    },
];

const accesosRapidos = [
    {
        titulo: "Registrar venta",
        descripcion: "Registrar una nueva venta",
        icono: ShoppingCart,
        ruta: "/sistema/ventas/punto-venta",
    },
    {
        titulo: "Crear cliente",
        descripcion: "Agregar un cliente al CRM",
        icono: Users,
        ruta: "/sistema/crm/clientes",
    },
    {
        titulo: "Registrar compra",
        descripcion: "Gestionar una compra de materiales",
        icono: ClipboardPlus,
        ruta: "/sistema/inventario",
    },
    {
        titulo: "Consultar inventario",
        descripcion: "Revisar productos y existencias",
        icono: Boxes,
        ruta: "/sistema/inventario",
    },
    {
        titulo: "Crear orden de producción",
        descripcion: "Planificar una nueva orden",
        icono: Factory,
        ruta: "/sistema/produccion/ordenes",
    },
];

function formatoMoneda(valor) {
    return new Intl.NumberFormat("es-NI", {
        style: "currency",
        currency: "NIO",
        maximumFractionDigits: 2,
    }).format(valor);
}

function TituloSeccion({ titulo, descripcion, icono: Icono }) {
    return (
        <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
                <Icono size={21} />
            </div>

            <div>
                <h2 className="text-lg font-bold text-gray-800">{titulo}</h2>
                <p className="mt-1 text-sm text-gray-500">{descripcion}</p>
            </div>
        </div>
    );
}

function TarjetaIndicador({ titulo, valor, descripcion, icono: Icono }) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-500">{titulo}</p>
                <div className="rounded-xl bg-orange-50 p-2 text-orange-600">
                    <Icono size={20} />
                </div>
            </div>

            <p className="mt-4 text-2xl font-bold text-gray-800">{valor}</p>
            <p className="mt-2 text-xs text-gray-500">{descripcion}</p>
        </div>
    );
}

// 1. INDICADORES COMERCIALES
function IndicadoresComerciales() {
    return (
        <section className="mb-8">
            <TituloSeccion
                titulo="Indicadores comerciales"
                descripcion="Resumen del desempeño de las ventas."
                icono={TrendingUp}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <TarjetaIndicador
                    titulo="Ventas del día"
                    valor={formatoMoneda(ventas.dia)}
                    descripcion="Total registrado durante el día"
                    icono={ShoppingCart}
                />

                <TarjetaIndicador
                    titulo="Ventas del mes"
                    valor={formatoMoneda(ventas.mes)}
                    descripcion="Ingresos por ventas registrados en el mes"
                    icono={CircleDollarSign}
                />

                <TarjetaIndicador
                    titulo="Productos vendidos"
                    valor={ventas.productosVendidos}
                    descripcion="Unidades vendidas durante el mes"
                    icono={ShoppingBag}
                />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-800">
                        Productos más vendidos
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Unidades vendidas por producto.
                    </p>

                    <div className="mt-5 space-y-5">
                        {productosMasVendidos.map((producto) => (
                            <div key={producto.nombre}>
                                <div className="mb-2 flex justify-between gap-3 text-sm">
                                    <span className="text-gray-700">{producto.nombre}</span>
                                    <span className="font-semibold text-gray-800">
                                        {producto.unidades} unidades
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-orange-500"
                                        style={{ width: `${producto.porcentaje}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-800">
                        Evolución de ingresos
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Comparación ilustrativa de los últimos seis meses.
                    </p>

                    <div className="mt-6 flex h-48 items-end justify-around gap-3">
                        {evolucionIngresos.map((dato) => (
                            <div
                                key={dato.mes}
                                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                            >
                                <div className="flex h-full w-full items-end justify-center">
                                    <div
                                        className="w-full max-w-10 rounded-t-lg bg-orange-400 transition-all hover:bg-orange-600"
                                        style={{ height: `${dato.valor}%` }}
                                        title={`${dato.mes}: valor ilustrativo`}
                                    />
                                </div>
                                <span className="text-xs text-gray-500">{dato.mes}</span>
                            </div>
                        ))}
                    </div>

                    <p className="mt-4 text-xs text-gray-400">
                        Los valores de la gráfica son demostrativos, no cifras contables.
                    </p>
                </div>
            </div>
        </section>
    );
}

// 2. INDICADORES DE INVENTARIO
function IndicadoresInventario() {
    return (
        <section className="mb-8">
            <TituloSeccion
                titulo="Indicadores de inventario"
                descripcion="Existencias y disponibilidad de materiales."
                icono={Package}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <TarjetaIndicador
                    titulo="Productos con stock bajo"
                    valor={inventario.productosStockBajo}
                    descripcion="Productos que necesitan reposición"
                    icono={AlertTriangle}
                />

                <TarjetaIndicador
                    titulo="Materiales agotados"
                    valor={inventario.materialesAgotados}
                    descripcion="Materiales que requieren revisión"
                    icono={Package}
                />

                <TarjetaIndicador
                    titulo="Valor del inventario"
                    valor={formatoMoneda(inventario.valorStock)}
                    descripcion="Valor ilustrativo de las existencias"
                    icono={CircleDollarSign}
                />
            </div>

            <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 shrink-0 text-orange-600" size={21} />
                    <div>
                        <h3 className="font-semibold text-gray-800">
                            Revisión de existencias
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Verificá los productos con stock bajo y los materiales agotados
                            antes de confirmar nuevas órdenes de producción.
                        </p>
                        <Link
                            to="/sistema/inventario"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800"
                        >
                            Consultar inventario <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

// 3. INDICADORES DE PRODUCCIÓN
function IndicadoresProduccion() {
    return (
        <section className="mb-8">
            <TituloSeccion
                titulo="Indicadores de producción"
                descripcion="Seguimiento de órdenes y elaboración de productos."
                icono={Factory}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaIndicador
                    titulo="Órdenes en proceso"
                    valor={produccion.enProceso}
                    descripcion="Órdenes que todavía se elaboran"
                    icono={ClipboardList}
                />

                <TarjetaIndicador
                    titulo="Órdenes atrasadas"
                    valor={produccion.atrasadas}
                    descripcion="Requieren seguimiento"
                    icono={Clock3}
                />

                <TarjetaIndicador
                    titulo="Unidades producidas"
                    valor={produccion.unidadesProducidas}
                    descripcion="Cantidad ilustrativa del período"
                    icono={CheckCircle2}
                />

                <TarjetaIndicador
                    titulo="Mermas registradas"
                    valor={produccion.mermas}
                    descripcion="Registros que deben revisarse"
                    icono={AlertTriangle}
                />
            </div>

            <div className="mt-4 flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                <div>
                    <h3 className="font-semibold text-gray-800">
                        Seguimiento de órdenes
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Consultá el avance y las fechas previstas de producción.
                    </p>
                </div>

                <Link
                    to="/sistema/produccion/ordenes"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                    Ver órdenes <ArrowUpRight size={17} />
                </Link>
            </div>
        </section>
    );
}

// 4. ALERTAS Y NOTIFICACIONES
function AlertasNotificaciones() {
    return (
        <section className="mb-8">
            <TituloSeccion
                titulo="Alertas y notificaciones"
                descripcion="Situaciones que necesitan atención."
                icono={AlertTriangle}
            />

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {alertas.map((alerta, indice) => {
                    const Icono = alerta.icono;

                    return (
                        <div
                            key={alerta.id}
                            className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${indice !== alertas.length - 1 ? "border-b border-gray-100" : ""
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                                    <Icono size={20} />
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-gray-800">
                                            {alerta.titulo}
                                        </h3>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${alerta.prioridad === "Alta"
                                                    ? "bg-red-50 text-red-700"
                                                    : "bg-amber-50 text-amber-700"
                                                }`}
                                        >
                                            Prioridad {alerta.prioridad.toLowerCase()}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm text-gray-500">
                                        {alerta.detalle}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400">{alerta.tipo}</p>
                                </div>
                            </div>

                            <Link
                                to={alerta.ruta}
                                className="inline-flex items-center gap-1 self-start text-sm font-semibold text-orange-700 hover:text-orange-800 sm:self-center"
                            >
                                Revisar <ArrowRight size={16} />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

// 5. ACCESOS RÁPIDOS
function AccesosRapidos() {
    return (
        <section className="mb-8">
            <TituloSeccion
                titulo="Accesos rápidos"
                descripcion="Atajos a las tareas más frecuentes."
                icono={ArrowUpRight}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {accesosRapidos.map((acceso) => {
                    const Icono = acceso.icono;

                    return (
                        <Link
                            key={acceso.titulo}
                            to={acceso.ruta}
                            className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                        >
                            <div className="rounded-xl bg-orange-50 p-3 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white">
                                <Icono size={22} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-gray-800">
                                    {acceso.titulo}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {acceso.descripcion}
                                </p>
                            </div>

                            <ArrowUpRight
                                size={18}
                                className="shrink-0 text-gray-400 transition group-hover:text-orange-600"
                            />
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

export default function SeccionesDashboard() {
    return (
        <div className="space-y-2">
            <IndicadoresComerciales />
            <IndicadoresInventario />
            <IndicadoresProduccion />
            <AlertasNotificaciones />
            <AccesosRapidos />
        </div>
    );
}
