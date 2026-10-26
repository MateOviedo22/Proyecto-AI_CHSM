
import { Clock3 } from 'lucide-react';
import RRHHTabla from './RRHHTabla';

const datosIniciales = [
    { id: 1, empleado: 'Colaborador 001', fecha: '2026-10-25', entrada: '08:00', salida: '17:00', horario: 'Diurno', estado: 'Presente' },
    { id: 2, empleado: 'Colaborador 002', fecha: '2026-10-25', entrada: '08:10', salida: '17:00', horario: 'Diurno', estado: 'Tardanza' },
    { id: 3, empleado: 'Colaborador 003', fecha: '2026-10-25', entrada: '—', salida: '—', horario: 'Diurno', estado: 'Ausente' },
];

export default function Asistencias_Horiario() {
    return (
        <RRHHTabla
            titulo="Asistencias y horario"
            descripcion="Controla los registros de entrada, salida y cumplimiento de jornada."
            icono={Clock3}
            datosIniciales={datosIniciales}
            columnas={[
                { campo: 'empleado', titulo: 'Empleado' },
                { campo: 'fecha', titulo: 'Fecha' },
                { campo: 'entrada', titulo: 'Entrada' },
                { campo: 'salida', titulo: 'Salida' },
                { campo: 'horario', titulo: 'Jornada' },
                { campo: 'estado', titulo: 'Asistencia' },
            ]}
            campos={[
                { nombre: 'empleado', etiqueta: 'Empleado', placeholder: 'Código o nombre del colaborador' },
                { nombre: 'fecha', etiqueta: 'Fecha', tipo: 'date' },
                { nombre: 'entrada', etiqueta: 'Hora de entrada', tipo: 'time', requerido: false },
                { nombre: 'salida', etiqueta: 'Hora de salida', tipo: 'time', requerido: false },
                { nombre: 'horario', etiqueta: 'Jornada', opciones: ['Diurno', 'Mixto', 'Nocturno', 'Parcial'] },
                { nombre: 'estado', etiqueta: 'Estado de asistencia', opciones: ['Presente', 'Tardanza', 'Ausente', 'Justificado'] },
            ]}
            indicadores={[
                { titulo: 'Registros de muestra', valor: 3, detalle: 'Asistencias ilustrativas' },
                { titulo: 'Jornadas disponibles', valor: 4, detalle: 'Diurna, mixta, nocturna y parcial' },
            ]}
            filtroEstado
            textoNuevo="Registrar asistencia"
        />
    );
}
