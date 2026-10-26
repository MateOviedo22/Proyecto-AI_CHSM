
import { HandCoins } from 'lucide-react';
import FinanzasTabla from './FinanzasTabla';

const datosIniciales = [
    { id: 1, cliente: 'Cliente 001', documento: 'FAC-001', fecha: '2026-10-10', vencimiento: '2026-10-30', monto: 8500, abonado: 3000, saldo: 5500, estado: 'Pendiente' },
    { id: 2, cliente: 'Cliente 002', documento: 'FAC-002', fecha: '2026-10-15', vencimiento: '2026-10-25', monto: 5000, abonado: 5000, saldo: 0, estado: 'Pagado' },
    { id: 3, cliente: 'Cliente 003', documento: 'FAC-003', fecha: '2026-10-18', vencimiento: '2026-11-05', monto: 7500, abonado: 1500, saldo: 6000, estado: 'Pendiente' },
];

export default function CuentasxCobrar() {
    return (
        <FinanzasTabla
            titulo="Cuentas por cobrar"
            descripcion="Controla los saldos pendientes de los clientes y sus fechas de vencimiento."
            icono={HandCoins}
            datosIniciales={datosIniciales}
            columnas={[
                { campo: 'cliente', titulo: 'Cliente' },
                { campo: 'documento', titulo: 'Documento' },
                { campo: 'fecha', titulo: 'Fecha de emisión' },
                { campo: 'vencimiento', titulo: 'Vencimiento' },
                { campo: 'monto', titulo: 'Monto original' },
                { campo: 'abonado', titulo: 'Abonado' },
                { campo: 'saldo', titulo: 'Saldo pendiente' },
                { campo: 'estado', titulo: 'Estado' },
            ]}
            campos={[
                { nombre: 'cliente', etiqueta: 'Cliente', placeholder: 'Nombre o código del cliente' },
                { nombre: 'documento', etiqueta: 'Documento', placeholder: 'Ej. FAC-004' },
                { nombre: 'fecha', etiqueta: 'Fecha de emisión', tipo: 'date' },
                { nombre: 'vencimiento', etiqueta: 'Fecha de vencimiento', tipo: 'date' },
                { nombre: 'monto', etiqueta: 'Monto original (C$)', tipo: 'number' },
                { nombre: 'abonado', etiqueta: 'Monto abonado (C$)', tipo: 'number' },
                { nombre: 'saldo', etiqueta: 'Saldo pendiente (C$)', tipo: 'number' },
                { nombre: 'estado', etiqueta: 'Estado', opciones: ['Pendiente', 'Vencido', 'Pagado'] },
            ]}
            indicadores={[
                { titulo: 'Saldo pendiente de ejemplo', valor: 11500, moneda: true },
                { titulo: 'Documentos', valor: 3, detalle: 'Registros iniciales de muestra' },
            ]}
            filtroEstado
            textoNuevo="Registrar cuenta"
        />
    );
}
