import {useApiRead} from '../../../hooks/useApiRead';
import {Header,Section,Table,Cell} from '../../../components/erp/Erp';
// Vista de los roles y de lo que cada uno puede consultar o modificar (matriz servida por el backend).
export default function Roles(){
  const data=useApiRead('/roles');
  const roles=Object.entries(data?.roles||{}), modulos=Object.entries(data?.modulos||{});
  const nivel=(rol,m)=>rol==='admin'?'Total':m.escribir.includes(rol)?'Consulta y registro':m.leer.includes(rol)?'Consulta':'—';
  return <div className="space-y-6">
    <Header modulo="Administración" title="Roles y permisos" subtitle="La administración asigna un rol a cada cuenta; el servidor aplica estos permisos en cada operación."/>
    <Section title="Roles del sistema"><div className="grid gap-3 md:grid-cols-3">{roles.map(([k,v])=><div key={k} className="rounded-lg border border-gray-200 p-3"><p className="font-semibold text-gray-800">{v}</p><p className="text-xs text-gray-500">Código: {k}</p></div>)}</div></Section>
    <Section title="Matriz de permisos por módulo">
      <Table headers={['Módulo',...roles.map(([,v])=>v)]} min={900}>{modulos.map(([k,m])=><tr key={k}><Cell className="font-medium">{m.nombre}</Cell>{roles.map(([r])=><Cell key={r}>{nivel(r,m)}</Cell>)}</tr>)}</Table>
      <p className="mt-3 text-xs text-gray-500">Las autorizaciones de planes, órdenes de producción y traslados exigen que revise o autorice una persona distinta de quien elaboró el documento.</p>
    </Section>
  </div>;
}
