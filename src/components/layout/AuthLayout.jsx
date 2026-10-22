import Logo from '../ui/Logo';

/** Panel turquesa con el formulario (children) + panel blanco con la marca. */
export default function AuthLayout({ title, children }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <main className="flex items-center justify-center bg-login-panel p-8 text-white">
        <div className="w-full max-w-xs">
          <h1 className="mb-8 text-center text-3xl font-medium">{title}</h1>
          {children}
        </div>
      </main>
      <section className="hidden flex-col items-center justify-center gap-2 bg-white p-8 text-center md:flex">
        <p className="text-brand">Es bueno volverte a ver</p>
        <h2 className="4px text-3xl font-medium text-brand">Bienvenido(a)</h2>
        <Logo size={250} withText={false} />
        <p className="font-serif text-2xl text-brand-dark">Sunshine Handmade</p>
        <p className="text-xs tracking-[0.3em] text-brand">NICARAGUA</p>
      </section>
    </div>
  );
}
