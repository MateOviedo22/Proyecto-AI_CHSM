// Réplica de backend/src/permisos.js solo para mostrar u ocultar opciones; el backend es quien valida.
export const MODULOS={
  crm:{leer:['vendedor','operador'],escribir:['vendedor']},
  ventas:{leer:['vendedor','inventario','operador'],escribir:['vendedor']},
  compras:{leer:['compras','inventario','produccion','operador'],escribir:['compras']},
  inventario:{leer:['vendedor','compras','inventario','produccion','operador'],escribir:['inventario']},
  productos:{leer:['vendedor','compras','inventario','produccion','operador'],escribir:['inventario','vendedor']},
  traslados:{leer:['vendedor','inventario','produccion','operador'],escribir:['inventario','produccion','vendedor']},
  produccion:{leer:['produccion','inventario','compras','operador'],escribir:['produccion']},
  finanzas:{leer:[],escribir:[]}, rrhh:{leer:[],escribir:[]}, seguridad:{leer:[],escribir:[]}
};
export function puede(user,modulo,accion='leer'){
  if(!user) return false; if(user.role==='admin' || !modulo) return true;
  const m=MODULOS[modulo]; if(!m) return false;
  return m[accion].includes(user.role) || (accion==='leer' && m.escribir.includes(user.role));
}
export const ROL_LABEL={admin:'Administración / Gerencia',vendedor:'Ventas',compras:'Encargado de compras',inventario:'Inventario y logística',produccion:'Producción y calidad',operador:'Consulta'};
