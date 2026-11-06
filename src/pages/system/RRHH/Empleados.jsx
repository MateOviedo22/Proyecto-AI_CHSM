
import { UserRound } from 'lucide-react';
import RRHHTabla from './RRHHTabla';

const datosIniciales = [
    { id: 1, codigo: 'EMP-001', nombre: 'Colaborador 001', puesto: 'Administración', area: 'Administración', telefono: '8888-0001', contratacion: '2022-03-15', estado: 'Activo' },
    { id: 2, codigo: 'EMP-002', nombre: 'Colaborador 002', puesto: 'Artesanía', area: 'Producción', telefono: '8888-0002', contratacion: '2023-06-01', estado: 'Activo' },
    { id: 3, codigo: 'EMP-003', nombre: 'Colaborador 003', puesto: 'Ventas', area: 'Comercial', telefono: '8888-0003', contratacion: '2024-01-10', estado: 'Activo' },
];

export default function Empleados() {
    return (
        <RRHHTabla
            titulo="Empleados"
            descripcion="Administra la información y el estado de los colaboradores."
            icono={UserRound}
            datosIniciales={datosIniciales}
            columnas={[
                { campo: 'codigo', titulo: 'Código' },
                { campo: 'nombre', titulo: 'Colaborador' },
                { campo: 'puesto', titulo: 'Puesto' },
                { campo: 'area', titulo: 'Área' },
                { campo: 'contratacion', titulo: 'Fecha de ingreso' },
                { campo: 'estado', titulo: 'Estado' },
            ]}
            campos={[
                { nombre: 'codigo', etiqueta: 'Código de empleado', placeholder: 'Ej. EMP-004' },
                { nombre: 'nombre', etiqueta: 'Nombre completo', placeholder: 'Nombre del colaborador' },
                { nombre: 'puesto', etiqueta: 'Puesto', placeholder: 'Cargo desempeñado' },
                { nombre: 'area', etiqueta: 'Área', opciones: ['Administración', 'Comercial', 'Producción', 'Logística', 'Tecnología'] },
                { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel', placeholder: 'Número de contacto' },
                { nombre: 'contratacion', etiqueta: 'Fecha de ingreso', tipo: 'date' },
                { nombre: 'estado', etiqueta: 'Estado laboral', opciones: ['Activo', 'Inactivo', 'Suspendido'] },
            ]}
            indicadores={[
                { titulo: 'Registros de muestra', valor: 3, detalle: 'Colaboradores ilustrativos' },
                { titulo: 'Estados disponibles', valor: '3', detalle: 'Activo, inactivo y suspendido' },
            ]}
            filtroEstado
            textoNuevo="Registrar empleado"
        />
    );
}
