import { services } from '../../data/landingData';

export default function ServicesSection() {
  return (
    <section id="servicios" aria-labelledby="services-title" className="mx-auto max-w-6xl px-4 py-16">
      <h2 id="services-title" className="text-3xl font-semibold">Cómo puedes comprar</h2>
      <ul className="mt-8 grid gap-6 md:grid-cols-3">
        {services.map((s) => (
          <li key={s.title} className="rounded-card bg-brand-light/60 p-6 transition hover:bg-brand-light">
            <h3 className="text-xl font-semibold text-brand-dark">{s.title}</h3>
            <p className="mt-2 text-sm text-gray-800">{s.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
