
import { CalendarDays } from 'lucide-react';
import RRHHTabla from './RRHHTabla';

const datosIniciales = [
    { id: 1, empleado: 'Colaborador 002', tipo: 'Permiso personal', inicio: '2026-10-26', fin: '2026-10-26', motivo: 'Trámite personal', estado: 'Pendiente' },
    { id: 2, empleado: 'Colaborador 003', tipo: 'Vacaciones', inicio: '2026-10-20', fin: '2026-10-22', motivo: 'Descanso programado', estado: 'Aprobado' },
    { id: 3, empleado: 'Colaborador 001', tipo: 'Cita médica', inicio: '2026-10-18', fin: '2026-10-18', motivo: 'Atención médica', estado: 'Aprobado' },
];

export default function Permisos_Ausencias() {
    return (
        <RRHHTabla
            titulo="Permisos y ausencias"
            descripcion="Gestiona solicitudes de permisos, vacaciones y ausencias del personal."
            icono={CalendarDays}
            datosIniciales={datosIniciales}
            columnas={[
                { campo: 'empleado', titulo: 'Empleado' },
                { campo: 'tipo', titulo: 'Tipo de solicitud' },
                { campo: 'inicio', titulo: 'Fecha de inicio' },
                { campo: 'fin', titulo: 'Fecha de finalización' },
                { campo: 'motivo', titulo: 'Motivo' },
                { campo: 'estado', titulo: 'Estado' },
            ]}
            campos={[
                { nombre: 'empleado', etiqueta: 'Empleado', placeholder: 'Código o nombre del colaborador' },
                { nombre: 'tipo', etiqueta: 'Tipo de solicitud', opciones: ['Permiso personal', 'Vacaciones', 'Cita médica', 'Ausencia justificada', 'Otro'] },
                { nombre: 'inicio', etiqueta: 'Fecha de inicio', tipo: 'date' },
                { nombre: 'fin', etiqueta: 'Fecha de finalización', tipo: 'date' },
                { nombre: 'motivo', etiqueta: 'Motivo', placeholder: 'Descripción breve' },
                { nombre: 'estado', etiqueta: 'Estado de la solicitud', opciones: ['Pendiente', 'Aprobado', 'Rechazado'] },
            ]}
            indicadores={[
                { titulo: 'Solicitudes de muestra', valor: 3, detalle: 'Registros ilustrativos' },
                { titulo: 'Pendientes de revisión', valor: 1, detalle: 'Requieren revisión administrativa' },
            ]}
            filtroEstado
            textoNuevo="Registrar solicitud"
        />
    );
}
