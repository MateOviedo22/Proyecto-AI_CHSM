import {Link} from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
export default function RegisterPage(){
  return <AuthLayout title="Cuentas de usuario"><div className="space-y-4 text-center text-sm">
    <p>Las cuentas del sistema deben ser creadas por la administración. El registro público está deshabilitado.</p>
    <p>Para preparar la cuenta inicial, sigue las instrucciones del archivo README del proyecto.</p>
    <Link to="/login" className="font-semibold underline">Volver al inicio de sesión</Link>
  </div></AuthLayout>;
}
