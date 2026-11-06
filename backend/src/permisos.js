import {fail,HttpError} from './http.js';
// Matriz de permisos por módulo. `admin` (administración/gerencia) tiene acceso total.
// `operador` es un rol heredado de solo lectura que se conserva para cuentas existentes.
export const ROLES={
  admin:'Administración / Gerencia',
  vendedor:'Ventas y atención al cliente',
  compras:'Encargado de compras',
  inventario:'Bodega, inventario y logística',
  produccion:'Producción y control de calidad',
  operador:'Consulta (solo lectura)'
};
export const MODULOS={
  crm:{nombre:'CRM y clientes',leer:['vendedor','operador'],escribir:['vendedor']},
  ventas:{nombre:'Ventas y facturación',leer:['vendedor','inventario','operador'],escribir:['vendedor']},
  compras:{nombre:'Compras y proveedores',leer:['compras','inventario','produccion','operador'],escribir:['compras']},
  inventario:{nombre:'Inventario y almacenes',leer:['vendedor','compras','inventario','produccion','operador'],escribir:['inventario']},
  productos:{nombre:'Catálogo de productos',leer:['vendedor','compras','inventario','produccion','operador'],escribir:['inventario','vendedor']},
  traslados:{nombre:'Traslados',leer:['vendedor','inventario','produccion','operador'],escribir:['inventario','produccion','vendedor']},
  produccion:{nombre:'Producción y calidad',leer:['produccion','inventario','compras','operador'],escribir:['produccion']},
  finanzas:{nombre:'Finanzas',leer:[],escribir:[]},
  rrhh:{nombre:'Recursos humanos',leer:[],escribir:[]},
  seguridad:{nombre:'Usuarios, roles y respaldos',leer:[],escribir:[]}
};
export function puede(user,modulo,accion='leer'){
  if(!user) return false; if(user.role==='admin') return true;
  const m=MODULOS[modulo]; if(!m) return false;
  return m[accion].includes(user.role) || (accion==='leer' && m.escribir.includes(user.role));
}
export function exigir(user,modulo,accion){ if(!puede(user,modulo,accion)) fail(403,'Tu rol no tiene permiso para esta operación.'); }
// Middleware: GET/HEAD leen, el resto escribe.
export const guard=modulo=>(req,res,next)=>{
  try{exigir(req.user,modulo,['GET','HEAD'].includes(req.method)?'leer':'escribir');next();}catch(e){next(e)}
};
export const soloAdmin=(req,res,next)=>{ if(req.user?.role!=='admin') return next(new HttpError(403,'Solo administración puede realizar esta operación.')); next(); };
// Separación de funciones: quien elabora un documento no puede revisarlo ni autorizarlo.
export function distinto(user,usuarioId,accion){ if(usuarioId!==null && usuarioId!==undefined && Number(usuarioId)===user.id) fail(403,`No puedes ${accion} un documento que tú mismo elaboraste o solicitaste.`); }
