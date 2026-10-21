import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { compose, minLength, required } from '../utils/validators';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';

const rules = {
  username: compose(required('El usuario'), minLength(3, 'El usuario')),
  password: compose(required('La contraseña'), minLength(6, 'La contraseña')),
};

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { values, errors, handleChange, handleBlur, handleSubmit } = useForm({ username: '', password: '' }, rules);
  const field = (id) => ({ id, value: values[id], onChange: handleChange, onBlur: handleBlur, error: errors[id] });

  if (user) return <Navigate to="/sistema/dashboard" replace />;

  return (
    <AuthLayout title="Inicio de sesión">
      <form onSubmit={handleSubmit(() => { login(); navigate('/sistema/dashboard'); })} noValidate>
        <div className="space-y-5">
          <FormField id="username" label="Nombre de Usuario" error={errors.username} onDark><Input {...field('username')} placeholder="Usuario..." autoComplete="username" /></FormField>
          <FormField id="password" label="Contraseña" error={errors.password} onDark><Input {...field('password')} type="password" placeholder="Contraseña..." autoComplete="current-password" /></FormField>
        </div>
        <div className="mt-2 text-right"><a href="#" className="text-xs font-semibold underline transition hover:text-brand-light">¿Olvidaste tu contraseña?</a></div>
        <div className="mt-6 flex justify-center"><Button type="submit" size="lg">Ingresar</Button></div>
        <p className="mt-6 text-center text-xs">¿Aún no tienes cuenta? <Link to="/registro" className="font-semibold underline hover:text-brand-light">Regístrate</Link></p>
        <p className="mt-3 text-center text-xs"><Link to="/" className="underline transition hover:text-brand-light">Volver al sitio web</Link></p>
      </form>
    </AuthLayout>
  );
}
