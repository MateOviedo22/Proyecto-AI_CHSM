
import { TrendingDown } from 'lucide-react';
import FinanzasTabla from './FinanzasTabla';

const datosIniciales = [
    { id: 1, fecha: '2026-10-23', concepto: 'Compra de cuero y materiales', categoria: 'Materia prima', monto: 4800, proveedor: 'Proveedor de materiales', estado: 'Pagado' },
    { id: 2, fecha: '2026-10-21', concepto: 'Servicio de internet', categoria: 'Servicios', monto: 1200, proveedor: 'Proveedor de internet', estado: 'Pagado' },
    { id: 3, fecha: '2026-10-20', concepto: 'Compra de empaques', categoria: 'Insumos', monto: 2500, proveedor: 'Proveedor de empaques', estado: 'Pendiente' },
];

export default function Gastos() {
    return (
        <FinanzasTabla
            titulo="Gastos"
            descripcion="Administra los desembolsos y compromisos económicos del negocio."
            icono={TrendingDown}
            datosIniciales={datosIniciales}
            columnas={[
                { campo: 'fecha', titulo: 'Fecha' },
                { campo: 'concepto', titulo: 'Concepto' },
                { campo: 'categoria', titulo: 'Categoría' },
                { campo: 'proveedor', titulo: 'Proveedor' },
                { campo: 'monto', titulo: 'Monto' },
                { campo: 'estado', titulo: 'Estado' },
            ]}
            campos={[
                { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'date' },
                { nombre: 'concepto', etiqueta: 'Concepto', placeholder: 'Descripción del gasto' },
                { nombre: 'categoria', etiqueta: 'Categoría', opciones: ['Materia prima', 'Insumos', 'Servicios', 'Transporte', 'Nómina', 'Otros'] },
                { nombre: 'proveedor', etiqueta: 'Proveedor', placeholder: 'Nombre del proveedor' },
                { nombre: 'monto', etiqueta: 'Monto (C$)', tipo: 'number' },
                { nombre: 'estado', etiqueta: 'Estado', opciones: ['Pagado', 'Pendiente', 'Anulado'] },
            ]}
            indicadores={[
                { titulo: 'Gastos de ejemplo', valor: 8500, moneda: true, detalle: 'Suma de los registros de muestra' },
                { titulo: 'Pendientes', valor: 2500, moneda: true, detalle: 'Obligaciones aún no pagadas' },
            ]}
            filtroEstado
            textoNuevo="Registrar gasto"
        />
    );
}
