import { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { compose, isEmail, isPhone, minLength, required } from '../../utils/validators';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';

const rules = {
  name: compose(required('El nombre'), minLength(3, 'El nombre')),
  email: compose(required('El correo'), isEmail),
  phone: (v) => (v.trim() ? isPhone(v) : ''), // opcional
  message: compose(required('El mensaje'), minLength(10, 'El mensaje')),
};

export default function ContactSection() {
  const [sent, setSent] = useState(null);
  const { values, errors, handleChange, handleBlur, handleSubmit, reset } = useForm({ name: '', email: '', phone: '', message: '' }, rules);
  const field = (id) => ({ id, value: values[id], onChange: handleChange, onBlur: handleBlur, error: errors[id] });

  return (
    <section id="contacto" aria-labelledby="contact-title" className="bg-gray-100 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
        <div>
          <h2 id="contact-title" className="text-3xl font-semibold">Cuéntanos qué necesitas</h2>
          <p className="mt-4 max-w-sm text-gray-700">Escríbenos para pedidos al por mayor, productos personalizados o cualquier duda. Respondemos por correo.</p>
        </div>
        {sent ? (
          <div role="status" className="self-start rounded-card bg-white p-6 shadow-card">
            <h3 className="text-xl font-semibold text-brand-dark">¡Mensaje enviado, {sent.name}!</h3>
            <p className="mt-2 text-sm text-gray-700">Te escribiremos a {sent.email}.</p>
            <Button className="mt-4" variant="secondary" onClick={() => { reset(); setSent(null); }}>Enviar otro mensaje</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(setSent)} noValidate className="space-y-4 rounded-card bg-white p-6 shadow-card">
            <FormField id="name" label="Nombre" error={errors.name}><Input {...field('name')} placeholder="Tu nombre" autoComplete="name" /></FormField>
            <FormField id="email" label="Correo" error={errors.email}><Input {...field('email')} type="email" placeholder="nombre@correo.com" autoComplete="email" /></FormField>
            <FormField id="phone" label="Teléfono (opcional)" error={errors.phone}><Input {...field('phone')} type="tel" placeholder="8888-0000" autoComplete="tel" /></FormField>
            <FormField id="message" label="Mensaje" error={errors.message}><Input {...field('message')} as="textarea" rows={4} placeholder="¿Qué productos y qué cantidad necesitas?" /></FormField>
            <Button type="submit">Enviar mensaje</Button>
          </form>
        )}
      </div>
    </section>
  );
}
