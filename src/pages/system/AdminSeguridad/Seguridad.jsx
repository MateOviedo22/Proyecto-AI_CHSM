import {useApiRead} from '../../../hooks/useApiRead';
import {Header,Section,Table,Cell,Badge,fechaHora,num} from '../../../components/erp/Erp';
// RF-37..RF-39: historial de respaldos y bitácora de acciones relevantes.
export default function Seguridad(){
  const respaldos=useApiRead('/respaldos'), bitacora=useApiRead('/auditoria');
  return <div className="space-y-6">
    <Header modulo="Administración" title="Respaldos y bitácora" subtitle="Los respaldos se generan desde el servidor con npm run db:backup y se restauran con npm run db:restore."/>
    <Section title="Respaldos registrados">
      <Table headers={['Fecha','Archivo','Tipo','Tamaño','Estado','Usuario']} empty={respaldos.length?null:'Aún no se han registrado respaldos.'}>
        {respaldos.map(r=><tr key={r.id}><Cell>{fechaHora(r.fecha)}</Cell><Cell>{r.archivo}</Cell><Cell>{r.tipo}</Cell><Cell>{num(Number(r.tamano)/1024,1)} KB</Cell><Cell><Badge value={r.estado}/></Cell><Cell>{r.usuario}</Cell></tr>)}
      </Table>
    </Section>
    <Section title="Bitácora de acciones (últimas 300)">
      <Table headers={['Fecha','Usuario','Acción','Recurso','Registro']} empty={bitacora.length?null:'Sin acciones registradas.'}>
        {bitacora.map(a=><tr key={a.id}><Cell>{fechaHora(a.fecha)}</Cell><Cell>{a.usuario||'—'}</Cell><Cell>{a.accion}</Cell><Cell>{a.recurso}</Cell><Cell>{a.registro}</Cell></tr>)}
      </Table>
    </Section>
  </div>;
}
