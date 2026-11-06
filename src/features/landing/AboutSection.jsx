import { values } from '../../data/landingData';

/** Incluye los valores de marca (ValuesSection de la propuesta original). */
export default function AboutSection() {
  return (
    <section id="nosotros" aria-labelledby="about-title" className="mx-auto max-w-6xl px-4 py-16">
      <h2 id="about-title" className="max-w-xl text-3xl font-semibold">Un taller pequeño, hecho para durar</h2>
      <p className="mt-4 max-w-2xl text-gray-700">Sunshine Handmade nace del trabajo artesanal nicaragüense. Diseñamos piezas de cuero sencillas y resistentes, y cuidamos cada paso, desde el corte hasta el último hilo.</p>
      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {values.map((v) => (
          <li key={v.title} className="border-l-4 border-sand pl-4">
            <h3 className="text-lg font-semibold">{v.title}</h3>
            <p className="mt-1 text-sm text-gray-700">{v.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
