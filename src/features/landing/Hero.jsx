import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';

export default function Hero() {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="bg-login-panel text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div>
          <h1 id="hero-title" className="text-4xl font-semibold leading-tight sm:text-5xl">Cuero trabajado a mano en Nicaragua</h1>
          <p className="mt-5 max-w-md text-lg text-white/90">Bolsos, fajas y cosmetiqueras hechos en nuestro taller, para tu día a día o para tu tienda.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#productos"><Button size="lg">Ver productos</Button></a>
            <a href="#contacto"><Button size="lg" variant="secondary">Pedir al por mayor</Button></a>
          </div>
        </div>
        <div className="mx-auto grid aspect-square w-64 place-items-center rounded-full bg-white shadow-lift sm:w-80">
          <div className="text-center"><Logo size={200} withText={false} /><p className="font-serif text-xl text-brand-dark">Sunshine Handmade</p><p className="text-xs tracking-[0.3em] text-brand">NICARAGUA</p></div>
        </div>
      </div>
    </section>
  );
}
