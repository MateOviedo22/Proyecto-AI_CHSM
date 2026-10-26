
import { TrendingUp } from 'lucide-react';
import FinanzasTabla from './FinanzasTabla';

const datosIniciales = [
    { id: 1, fecha: '2026-10-24', concepto: 'Venta de bolsos', categoria: 'Ventas', monto: 12500, metodo: 'Transferencia', estado: 'Confirmado' },
    { id: 2, fecha: '2026-10-22', concepto: 'Pedido personalizado', categoria: 'Ventas', monto: 7500, metodo: 'Efectivo', estado: 'Confirmado' },
    { id: 3, fecha: '2026-10-20', concepto: 'Abono de cliente', categoria: 'Abonos', monto: 3500, metodo: 'Transferencia', estado: 'Pendiente' },
];

export default function Ingresos() {
    return (
        <FinanzasTabla
            titulo="Ingresos"
            descripcion="Registra y consulta las entradas de dinero del negocio."
            icono={TrendingUp}
            datosIniciales={datosIniciales}
            columnas={[
                { campo: 'fecha', titulo: 'Fecha' },
                { campo: 'concepto', titulo: 'Concepto' },
                { campo: 'categoria', titulo: 'Categoría' },
                { campo: 'monto', titulo: 'Monto' },
                { campo: 'metodo', titulo: 'Método de pago' },
                { campo: 'estado', titulo: 'Estado' },
            ]}
            campos={[
                { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'date' },
                { nombre: 'concepto', etiqueta: 'Concepto', placeholder: 'Ej. Venta de productos' },
                { nombre: 'categoria', etiqueta: 'Categoría', opciones: ['Ventas', 'Abonos', 'Servicios', 'Otros'] },
                { nombre: 'monto', etiqueta: 'Monto (C$)', tipo: 'number' },
                { nombre: 'metodo', etiqueta: 'Método de pago', opciones: ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'] },
                { nombre: 'estado', etiqueta: 'Estado', opciones: ['Confirmado', 'Pendiente', 'Anulado'] },
            ]}
            indicadores={[
                { titulo: 'Ingresos de ejemplo', valor: 23500, moneda: true, detalle: 'Suma de los registros de muestra' },
                { titulo: 'Movimientos', valor: 3, detalle: 'Registros iniciales de demostración' },
            ]}
            filtroEstado
            textoNuevo="Registrar ingreso"
        />
    );
}
