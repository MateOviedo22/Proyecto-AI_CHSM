
import { Network } from 'lucide-react';
import RRHHTabla from './RRHHTabla';

const datosIniciales = [
    { id: 1, codigo: 'PUE-001', area: 'Administración', puesto: 'Responsable administrativo', plazas: '1', estado: 'Activo' },
    { id: 2, codigo: 'PUE-002', area: 'Producción', puesto: 'Artesano/a', plazas: '6', estado: 'Activo' },
    { id: 3, codigo: 'PUE-003', area: 'Comercial', puesto: 'Asesor/a de ventas', plazas: '2', estado: 'Activo' },
    { id: 4, codigo: 'PUE-004', area: 'Logística', puesto: 'Control de inventario', plazas: '2', estado: 'Activo' },
];

export default function Areas_Puestos() {
    return (
        <RRHHTabla
            titulo="Áreas y puestos"
            descripcion="Organiza las áreas de trabajo, los cargos y las plazas asignadas."
            icono={Network}
            datosIniciales={datosIniciales}
            columnas={[
                { campo: 'codigo', titulo: 'Código' },
                { campo: 'area', titulo: 'Área' },
                { campo: 'puesto', titulo: 'Puesto' },
                { campo: 'plazas', titulo: 'Plazas asignadas' },
                { campo: 'estado', titulo: 'Estado' },
            ]}
            campos={[
                { nombre: 'codigo', etiqueta: 'Código del puesto', placeholder: 'Ej. PUE-005' },
                { nombre: 'area', etiqueta: 'Área', opciones: ['Administración', 'Comercial', 'Producción', 'Logística', 'Tecnología', 'Recursos Humanos'] },
                { nombre: 'puesto', etiqueta: 'Nombre del puesto', placeholder: 'Ej. Responsable de producción' },
                { nombre: 'plazas', etiqueta: 'Cantidad de plazas', tipo: 'number' },
                { nombre: 'estado', etiqueta: 'Estado', opciones: ['Activo', 'Inactivo'] },
            ]}
            indicadores={[
                { titulo: 'Puestos de ejemplo', valor: 4, detalle: 'Registros iniciales' },
                { titulo: 'Áreas contempladas', valor: 4, detalle: 'Administración, producción, comercial y logística' },
            ]}
            filtroEstado
            textoNuevo="Agregar puesto"
        />
    );
}
