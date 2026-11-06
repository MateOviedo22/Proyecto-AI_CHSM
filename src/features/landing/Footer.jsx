import { Link } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import { navLinks } from '../../data/landingData';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-gray-600 md:flex-row">
        <Logo size={32} />
        <nav aria-label="Pie de página" className="flex flex-wrap justify-center gap-4">
          {navLinks.map((l) => <a key={l.href} href={l.href} className="transition hover:text-sun">{l.label}</a>)}
          <Link to="/login" className="font-medium text-wine transition hover:underline">Ir al sistema</Link>
        </nav>
        <p>© 2026 Sunshine Handmade Nicaragua</p>
      </div>
    </footer>
  );
}
