import {createPortal} from 'react-dom';
import {money,fecha,fechaHora} from './Erp';
// Vista previa imprimible: al imprimir se oculta la aplicación (#root) y solo se imprime el documento.
export function imprimirDocumento(){document.body.classList.add('imprimiendo-documento');const fin=()=>{document.body.classList.remove('imprimiendo-documento');window.removeEventListener('afterprint',fin);};window.addEventListener('afterprint',fin);window.print();setTimeout(fin,1500);}
export function DocumentoModal({titulo,onClose,children}){
  return createPortal(<div className="documento-imprimible fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4">
    <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
      <div className="no-imprimir flex items-center justify-between border-b p-4"><h2 className="font-bold">{titulo}</h2><div className="flex gap-2"><button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white" onClick={imprimirDocumento}>Imprimir</button><button className="rounded-lg border px-4 py-2 text-sm" onClick={onClose}>Cerrar</button></div></div>
      <div className="p-8 text-sm text-gray-800">{children}</div></div></div>,document.body);
}
function Encabezado({tipo,numero,fechaDoc,extra}){return <div className="mb-6 flex items-start justify-between border-b pb-4"><div><p className="text-2xl font-bold text-amber-700">Sunshine Handmade</p><p className="text-xs text-gray-500">Productos artesanales de cuero · Nicaragua</p></div>
  <div className="text-right"><p className="text-lg font-bold uppercase">{tipo}</p><p className="font-mono">{numero}</p><p className="text-xs text-gray-500">{fechaDoc}</p>{extra}</div></div>}
function Lineas({lineas}){return <table className="w-full text-left"><thead className="border-b text-xs uppercase text-gray-500"><tr><th className="py-2">Código</th><th>Descripción</th><th className="text-right">Cant.</th><th className="text-right">Precio</th><th className="text-right">Importe</th></tr></thead>
  <tbody>{lineas.map((l,i)=><tr key={i} className="border-b border-gray-100"><td className="py-2">{l.codigo}</td><td>{l.nombre}</td><td className="text-right">{l.cantidad}</td><td className="text-right">{money(l.precio)}</td><td className="text-right">{money(l.precio*l.cantidad)}</td></tr>)}</tbody></table>}
function Totales({subtotal,descuento,total}){return <div className="ml-auto mt-4 w-64 space-y-1"><p className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></p><p className="flex justify-between"><span>Descuento</span><span>- {money(descuento)}</span></p><p className="flex justify-between border-t pt-1 text-base font-bold"><span>Total</span><span>{money(total)}</span></p></div>}
export function FacturaDoc({f}){
  return <div><Encabezado tipo="Factura interna" numero={f.numero} fechaDoc={fechaHora(f.fecha)} extra={f.estado==='Anulada'&&<p className="mt-1 font-bold text-red-700">ANULADA</p>}/>
    <div className="mb-4 grid grid-cols-2 gap-4"><div><p className="text-xs uppercase text-gray-500">Cliente</p><p className="font-semibold">{f.cliente}</p>{f.direccion&&<p>{f.direccion}</p>}{f.telefono&&<p>{f.telefono}</p>}</div>
      <div className="text-right"><p className="text-xs uppercase text-gray-500">Pago</p><p>{f.metodo}</p><p className="text-xs text-gray-500">Venta #{f.ventaId}{f.ordenVentaId?` · Orden ${f.ordenVentaId}`:''} · {f.almacen||''}</p><p className="text-xs text-gray-500">Atendió: {f.vendedor||'—'}</p></div></div>
    <Lineas lineas={f.lineas||[]}/><Totales {...f}/>
    {f.anuladaMotivo&&<p className="mt-4 text-red-700">Motivo de anulación: {f.anuladaMotivo}</p>}
    <p className="mt-8 border-t pt-3 text-center text-xs text-gray-500">Comprobante interno de Sunshine Handmade. No sustituye la factura fiscal.</p></div>;
}
export function CotizacionDoc({c,productos}){
  const lineas=c.items.map(i=>{const p=productos.find(x=>x.id===i.productoId)||{};return {codigo:p.codigo||i.productoId,nombre:p.nombre||'Producto',cantidad:i.cantidad,precio:i.precio};});
  const total=lineas.reduce((s,l)=>s+l.precio*l.cantidad,0);
  return <div><Encabezado tipo="Cotización" numero={c.id} fechaDoc={fecha(c.fecha)} extra={<p className="text-xs">Válida hasta {fecha(c.vencimiento)}</p>}/>
    <div className="mb-4"><p className="text-xs uppercase text-gray-500">Cliente</p><p className="font-semibold">{c.cliente}</p><p className="text-xs text-gray-500">Estado: {c.estado}</p></div>
    <Lineas lineas={lineas}/><Totales subtotal={total} descuento={0} total={total}/>
    {c.notas&&<p className="mt-4"><span className="text-xs uppercase text-gray-500">Notas: </span>{c.notas}</p>}
    <p className="mt-8 border-t pt-3 text-center text-xs text-gray-500">Precios en córdobas. Sujeto a disponibilidad al momento de confirmar el pedido.</p></div>;
}
