const STORAGE_KEY = 'comprasModuloData';

const INITIAL_DATA = {
  solicitudes: [
    {
      id: 'SOL-001',
      fecha: '2026-11-04',
      solicitante: 'María López',
      area: 'Producción',
      producto: 'Cuero natural',
      cantidad: 25,
      unidad: 'Pies cuadrados',
      prioridad: 'Alta',
      estado: 'Pendiente',
      justificacion: 'Material requerido para órdenes de producción.',
    },
    {
      id: 'SOL-002',
      fecha: '2026-11-03',
      solicitante: 'Carlos Ruiz',
      area: 'Administración',
      producto: 'Papel térmico',
      cantidad: 10,
      unidad: 'Rollos',
      prioridad: 'Media',
      estado: 'Aprobada',
      justificacion: 'Reposición de suministros.',
    },
  ],

  ordenes: [
    {
      id: 'OC-001',
      solicitudId: 'SOL-002',
      proveedor: 'Distribuidora Central',
      fecha: '2026-11-04',
      fechaEntrega: '2026-11-10',
      producto: 'Papel térmico',
      cantidad: 10,
      precioUnitario: 65,
      total: 650,
      estado: 'Enviada',
    },
  ],

  devoluciones: [],
};

export function loadComprasData() {
  if (typeof window === 'undefined') {
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }

    const parsedData = JSON.parse(savedData);

    return {
      solicitudes: Array.isArray(parsedData.solicitudes)
        ? parsedData.solicitudes
        : [],

      ordenes: Array.isArray(parsedData.ordenes)
        ? parsedData.ordenes
        : [],

      devoluciones: Array.isArray(parsedData.devoluciones)
        ? parsedData.devoluciones
        : [],
    };
  } catch (error) {
    console.error('Error al cargar los datos de Compras:', error);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

export function saveComprasData(data) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('compras-data-updated'));
  } catch (error) {
    console.error('Error al guardar los datos de Compras:', error);
  }
}

export function generateComprasId(prefix) {
  return `${prefix}-${Date.now()}`;
}

export function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatCurrency(value) {
  return `C$ ${Number(value || 0).toLocaleString('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}