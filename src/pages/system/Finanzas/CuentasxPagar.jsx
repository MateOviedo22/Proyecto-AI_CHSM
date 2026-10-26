
import { CreditCard } from 'lucide-react';
import FinanzasTabla from './FinanzasTabla';

const datosIniciales = [
  { id: 1, proveedor: 'Proveedor de cuero', documento: 'COMP-001', fecha: '2026-10-12', vencimiento: '2026-10-28', monto: 12000, abonado: 4000, saldo: 8000, estado: 'Pendiente' },
  { id: 2, proveedor: 'Proveedor de empaques', documento: 'COMP-002', fecha: '2026-10-16', vencimiento: '2026-10-27', monto: 3500, abonado: 3500, saldo: 0, estado: 'Pagado' },
  { id: 3, proveedor: 'Servicios generales', documento: 'COMP-003', fecha: '2026-10-20', vencimiento: '2026-11-02', monto: 2800, abonado: 0, saldo: 2800, estado: 'Pendiente' },
];

export default function CuentasxPagar() {
  return (
    <FinanzasTabla
      titulo="Cuentas por pagar"
      descripcion="Gestiona las obligaciones pendientes con proveedores y otros acreedores."
      icono={CreditCard}
      datosIniciales={datosIniciales}
      columnas={[
        { campo: 'proveedor', titulo: 'Proveedor' },
        { campo: 'documento', titulo: 'Documento' },
        { campo: 'fecha', titulo: 'Fecha de emisión' },
        { campo: 'vencimiento', titulo: 'Vencimiento' },
        { campo: 'monto', titulo: 'Monto original' },
        { campo: 'abonado', titulo: 'Abonado' },
        { campo: 'saldo', titulo: 'Saldo pendiente' },
        { campo: 'estado', titulo: 'Estado' },
      ]}
      campos={[
        { nombre: 'proveedor', etiqueta: 'Proveedor', placeholder: 'Nombre del proveedor' },
        { nombre: 'documento', etiqueta: 'Documento', placeholder: 'Ej. COMP-004' },
        { nombre: 'fecha', etiqueta: 'Fecha de emisión', tipo: 'date' },
        { nombre: 'vencimiento', etiqueta: 'Fecha de vencimiento', tipo: 'date' },
        { nombre: 'monto', etiqueta: 'Monto original (C$)', tipo: 'number' },
        { nombre: 'abonado', etiqueta: 'Monto abonado (C$)', tipo: 'number' },
        { nombre: 'saldo', etiqueta: 'Saldo pendiente (C$)', tipo: 'number' },
        { nombre: 'estado', etiqueta: 'Estado', opciones: ['Pendiente', 'Vencido', 'Pagado'] },
      ]}
      indicadores={[
        { titulo: 'Saldo pendiente de ejemplo', valor: 10800, moneda: true },
        { titulo: 'Obligaciones', valor: 3, detalle: 'Registros iniciales de muestra' },
      ]}
      filtroEstado
      textoNuevo="Registrar cuenta"
    />
  );
}
