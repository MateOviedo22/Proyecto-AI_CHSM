import {useEffect,useState} from 'react';
import {api,reportApiError} from '../../services/api';
import {Table,Cell,Badge,money,num,imprimir} from './Erp';
// Interfaz de producto: datos, ficha técnica vigente por partes, componentes, proveedores y existencias por almacén/lote.
export default function ProductoDetalle({productoId,onClose}){
  const [d,setD]=useState(null);
  useEffect(()=>{let ok=true;api(`/productos/${productoId}/detalle`).then(r=>ok&&setD(r.data)).catch(reportApiError);return()=>{ok=false}},[productoId]);
  const partes=d?.ficha?[...new Set([...d.ficha.materiales,...d.ficha.componentes].map(x=>x.parte))]:[];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:static print:bg-white print:p-0">
    <section role="dialog" aria-modal="true" aria-label="Detalle del producto" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 text-sm shadow-xl print:max-h-none print:shadow-none">
      {!d?<p>Cargando...</p>:<div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-gray-400">{d.producto.codigo} · {d.producto.categoria}</p><h2 className="text-xl font-bold text-gray-900">{d.producto.nombre}</h2><p className="text-gray-600">{d.producto.descripcion}</p></div><Badge value={d.producto.activo?'Activo':'Inactivo'}/></div>
        <div className="grid gap-3 sm:grid-cols-4">
          <p className="rounded-lg border p-3"><span className="block text-xs text-gray-500">Precio</span><b>{money(d.producto.precio)}</b></p>
          <p className="rounded-lg border p-3"><span className="block text-xs text-gray-500">Existencia total</span><b>{d.producto.existencia} {d.producto.unidad}</b></p>
          <p className="rounded-lg border p-3"><span className="block text-xs text-gray-500">Stock mínimo</span><b>{d.producto.minimo}</b></p>
          <p className="rounded-lg border p-3"><span className="block text-xs text-gray-500">Costo de materiales</span><b>{d.ficha?money(d.ficha.costoMateriales):'—'}</b></p>
        </div>
        <div><h3 className="mb-2 font-semibold">Ficha técnica vigente {d.ficha&&<span className="font-normal text-gray-500">({d.ficha.codigo} · v{d.ficha.versionFicha} · {d.ficha.tiempoMinutos} min)</span>}</h3>
          {!d.ficha?<p className="text-gray-500">El producto no tiene una ficha técnica vigente.</p>:partes.map(parte=><div key={parte} className="mb-3"><p className="mb-1 text-xs font-semibold uppercase text-amber-700">{parte}</p>
            <Table headers={['Material / componente','Cantidad por unidad','Merma']} min={480}>
              {d.ficha.materiales.filter(m=>m.parte===parte).map(m=><tr key={`m${m.materialId}`}><Cell>{m.nombre}</Cell><Cell>{num(m.cantidad,3)} {m.unidad}</Cell><Cell>{m.mermaPct}%</Cell></tr>)}
              {d.ficha.componentes.filter(c=>c.parte===parte).map(c=><tr key={`c${c.productoId}`}><Cell>{c.nombre} (componente)</Cell><Cell>{num(c.cantidad,3)} unidad</Cell><Cell>—</Cell></tr>)}
            </Table></div>)}</div>
        {d.proveedores.length>0&&<div><h3 className="mb-2 font-semibold">Proveedores de los materiales</h3>
          <Table headers={['Material','Proveedor','Razón social','Precio ref.','Plazo','Preferido']} min={640}>{d.proveedores.map(p=><tr key={`${p.material_id}-${p.id}`}><Cell>{p.material}</Cell><Cell>{p.nombre}</Cell><Cell>{p.razon_social}</Cell><Cell>{money(p.precio_ref)}</Cell><Cell>{p.plazo_entrega_dias} días</Cell><Cell>{p.preferido?'Sí':'—'}</Cell></tr>)}</Table></div>}
        <div><h3 className="mb-2 font-semibold">Existencias por almacén y lote</h3>
          <Table headers={['Almacén','Lote','Cantidad']} min={420} empty={d.existencias.length?null:'Sin existencias registradas.'}>{d.existencias.map((e,i)=><tr key={i}><Cell>{e.almacen}</Cell><Cell>{e.lote||'Sin lote'}</Cell><Cell>{e.cantidad}</Cell></tr>)}</Table></div>
        {d.versiones.length>1&&<p className="text-xs text-gray-500">Versiones de ficha: {d.versiones.map(v=>`${v.codigo} (${v.estado})`).join(' · ')}</p>}
        <div className="flex justify-end gap-2 print:hidden"><button onClick={imprimir} className="rounded-lg border px-4 py-2">Imprimir</button><button onClick={onClose} className="rounded-lg bg-gray-900 px-4 py-2 text-white">Cerrar</button></div>
      </div>}
    </section></div>;
}
