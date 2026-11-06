import {useCallback,useEffect,useState} from 'react';
import {api,reportApiError} from '../../services/api';
import {useApiList} from '../../hooks/useApiList';
import {useAuth} from '../../context/AuthContext';
import {Notice,input,button,buttonLight,useAction} from './Erp';
// Varios proveedores por material: precio de referencia, plazo de entrega y proveedor preferido.
export default function MaterialProveedores({materialId}){
  const {user}=useAuth(); const editable=['admin','compras','inventario'].includes(user?.role);
  const [proveedores]=useApiList('/recursos/proveedores');
  const [rows,setRows]=useState([]);
  const load=useCallback(async()=>setRows((await api(`/materiales/${materialId}/proveedores`)).data),[materialId]);
  useEffect(()=>{load().catch(reportApiError)},[load]);
  const {busy,notice,run}=useAction(load);
  const set=(i,k,v)=>setRows(r=>r.map((x,j)=>j===i?{...x,[k]:v}:k==='preferido'&&v?{...x,preferido:false}:x));
  return <div className="mt-4 space-y-2 text-sm"><h3 className="font-semibold text-gray-800">Proveedores del material</h3>
    {rows.map((r,i)=><div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto_auto] items-center gap-2">
      <select disabled={!editable} className={input} value={r.proveedorId} onChange={e=>set(i,'proveedorId',Number(e.target.value))}><option value="">Proveedor...</option>{proveedores.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <input disabled={!editable} type="number" min="0" step="0.01" className={input} title="Precio de referencia" value={r.precioRef} onChange={e=>set(i,'precioRef',e.target.value)}/>
      <input disabled={!editable} type="number" min="0" className={input} title="Plazo de entrega (días)" value={r.plazoEntregaDias} onChange={e=>set(i,'plazoEntregaDias',e.target.value)}/>
      <label className="flex items-center gap-1 text-xs"><input disabled={!editable} type="radio" checked={r.preferido} onChange={()=>set(i,'preferido',true)}/>Preferido</label>
      {editable&&<button type="button" className={buttonLight} onClick={()=>setRows(rows.filter((_,j)=>j!==i))}>Quitar</button>}
    </div>)}
    {!rows.length&&<p className="text-gray-500">Sin proveedores asignados.</p>}
    {editable&&<div className="flex gap-2"><button type="button" className={buttonLight} onClick={()=>setRows([...rows,{proveedorId:'',precioRef:0,plazoEntregaDias:0,preferido:!rows.length}])}>+ Agregar proveedor</button>
      <button type="button" className={button} disabled={busy} onClick={()=>run(`/materiales/${materialId}/proveedores`,{method:'PUT',body:{proveedores:rows.map(r=>({...r,proveedorId:Number(r.proveedorId),precioRef:Number(r.precioRef),plazoEntregaDias:Number(r.plazoEntregaDias)}))}},'Proveedores guardados.')}>Guardar proveedores</button></div>}
    <Notice notice={notice}/></div>;
}
