import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from '../hooks/useForm';
import { compose, hasNumber, isEmail, matches, minLength, required } from '../utils/validators';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import FormField from '../components/ui/FormField';
import Input from '../components/ui/Input';

const rules = {
  name: compose(required('El nombre'), minLength(3, 'El nombre')),
  email: compose(required('El correo'), isEmail),
  username: compose(required('El usuario'), minLength(3, 'El usuario')),
  password: compose(required('La contraseña'), minLength(8, 'La contraseña'), hasNumber),
  confirm: compose(required('La confirmación'), matches('password', 'Las contraseñas no coinciden.')),
};

export default function RegisterPage() {
  const [done, setDone] = useState(false);
  const { values, errors, handleChange, handleBlur, handleSubmit } = useForm({ name: '', email: '', username: '', password: '', confirm: '' }, rules);
  const field = (id) => ({ id, value: values[id], onChange: handleChange, onBlur: handleBlur, error: errors[id] });

  if (done) {
    return (
      <AuthLayout title="Cuenta creada">
        <p role="status" className="text-center text-sm">Tu cuenta quedó registrada. Ya puedes iniciar sesión.</p>
        <div className="mt-6 flex justify-center"><Link to="/login"><Button size="lg">Ir a iniciar sesión</Button></Link></div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crear cuenta">
      <form onSubmit={handleSubmit(() => setDone(true))} noValidate className="space-y-4">
        <FormField id="name" label="Nombre completo" error={errors.name} onDark><Input {...field('name')} placeholder="Tu nombre..." autoComplete="name" /></FormField>
        <FormField id="email" label="Correo" error={errors.email} onDark><Input {...field('email')} type="email" placeholder="nombre@correo.com" autoComplete="email" /></FormField>
        <FormField id="username" label="Nombre de Usuario" error={errors.username} onDark><Input {...field('username')} placeholder="Usuario..." autoComplete="username" /></FormField>
        <FormField id="password" label="Contraseña" error={errors.password} onDark><Input {...field('password')} type="password" placeholder="Mínimo 8 caracteres y un número" autoComplete="new-password" /></FormField>
        <FormField id="confirm" label="Confirmar contraseña" error={errors.confirm} onDark><Input {...field('confirm')} type="password" placeholder="Repite la contraseña" autoComplete="new-password" /></FormField>
        <div className="flex justify-center pt-2"><Button type="submit" size="lg">Registrarme</Button></div>
        <p className="text-center text-xs">¿Ya tienes cuenta? <Link to="/login" className="font-semibold underline hover:text-brand-light">Inicia sesión</Link></p>
      </form>
    </AuthLayout>
  );
}
