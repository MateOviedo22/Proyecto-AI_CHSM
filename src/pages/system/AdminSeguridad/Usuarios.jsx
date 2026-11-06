import {useState} from 'react';
import {useApiList} from '../../../hooks/useApiList';
import {useAuth} from '../../../context/AuthContext';
import {ROL_LABEL} from '../../../utils/permisos';
import {Header,Section,Field,Table,Cell,Badge,Notice,input,button,buttonLight,useAction,fecha} from '../../../components/erp/Erp';
const empty={nombre:'',usuario:'',correo:'',rol:'vendedor',password:''};
// RF-01..RF-05: alta, edición, rol, activación y contraseña de cuentas individuales.
export default function Usuarios(){
  const {user}=useAuth();
  const [rows,reload]=useApiList('/usuarios');
  const {busy,notice,run}=useAction(reload);
  const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[pwd,setPwd]=useState({id:null,password:''});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async e=>{e.preventDefault();
    const ok=editing?await run(`/usuarios/${editing.id}`,{method:'PUT',body:{...form,_version:editing._version}},'Usuario actualizado.'):await run('/usuarios',{body:form},'Usuario creado.');
    if(ok){setForm(empty);setEditing(null);}};
  return <div className="space-y-6">
    <Header modulo="Administración" title="Usuarios" subtitle="Cuentas individuales, roles y estado de acceso."/>
    <Notice notice={notice}/>
    <Section title={editing?`Editar ${editing.usuario}`:'Nuevo usuario'}>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-3">
        <Field label="Nombre completo"><input className={input} required value={form.nombre} onChange={e=>set('nombre',e.target.value)}/></Field>
        <Field label="Usuario"><input className={input} required disabled={!!editing} value={form.usuario} onChange={e=>set('usuario',e.target.value)}/></Field>
        <Field label="Correo"><input type="email" className={input} required value={form.correo} onChange={e=>set('correo',e.target.value)}/></Field>
        <Field label="Rol"><select className={input} value={form.rol} onChange={e=>set('rol',e.target.value)}>{Object.entries(ROL_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field>
        {!editing&&<Field label="Contraseña inicial (mín. 10)"><input type="password" minLength={10} className={input} required value={form.password} onChange={e=>set('password',e.target.value)}/></Field>}
        <div className="flex items-end gap-2"><button className={button} disabled={busy}>{editing?'Guardar cambios':'Crear usuario'}</button>{editing&&<button type="button" className={buttonLight} onClick={()=>{setEditing(null);setForm(empty)}}>Cancelar</button>}</div>
      </form>
    </Section>
    <Section title="Cuentas registradas">
      <Table headers={['Nombre','Usuario','Correo','Rol','Estado','Creado','Acciones']} empty={rows.length?null:'No hay usuarios.'}>
        {rows.map(u=><tr key={u.id}><Cell>{u.nombre}</Cell><Cell>{u.usuario}</Cell><Cell>{u.correo}</Cell><Cell>{ROL_LABEL[u.rol]||u.rol}</Cell><Cell><Badge value={u.activo?'Activo':'Inactivo'}/></Cell><Cell>{fecha(u.creadoEn)}</Cell>
          <Cell><div className="flex flex-wrap gap-2">
            <button className={buttonLight} onClick={()=>{setEditing(u);setForm({nombre:u.nombre,usuario:u.usuario,correo:u.correo,rol:u.rol,password:''})}}>Editar</button>
            {u.id!==user?.id&&<button className={buttonLight} disabled={busy} onClick={()=>run(`/usuarios/${u.id}/estado`,{method:'PATCH',body:{activo:!u.activo}},u.activo?'Cuenta desactivada.':'Cuenta activada.')}>{u.activo?'Desactivar':'Activar'}</button>}
            <button className={buttonLight} onClick={()=>setPwd({id:u.id,password:''})}>Contraseña</button>
          </div>
          {pwd.id===u.id&&<form className="mt-2 flex gap-2" onSubmit={async e=>{e.preventDefault();if(await run(`/usuarios/${u.id}/password`,{method:'PATCH',body:{password:pwd.password}},'Contraseña actualizada.'))setPwd({id:null,password:''})}}>
            <input type="password" minLength={10} required placeholder="Nueva contraseña" className={input} value={pwd.password} onChange={e=>setPwd({id:u.id,password:e.target.value})}/><button className={button} disabled={busy}>Guardar</button></form>}
          </Cell></tr>)}
      </Table>
    </Section>
  </div>;
}
