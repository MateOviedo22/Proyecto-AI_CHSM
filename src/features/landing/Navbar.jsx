import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import { navLinks } from '../../data/landingData';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const link = 'rounded px-2 py-1 text-sm transition hover:text-sun';
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#inicio" aria-label="Sunshine Handmade, inicio"><Logo size={45} /></a>
        <nav aria-label="Principal" className="hidden items-center gap-4 md:flex">
          {navLinks.map((l) => <a key={l.href} href={l.href} className={link}>{l.label}</a>)}
          <Link to="/login"><Button size="sm">Ir al sistema</Button></Link>
        </nav>
        <button className="rounded p-2 hover:bg-black/5 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menú">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav aria-label="Principal móvil" className="flex flex-col gap-1 border-t border-gray-200 px-4 py-3 md:hidden">
          {navLinks.map((l) => <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={`${link} py-2`}>{l.label}</a>)}
          <Link to="/login" className="mt-1"><Button className="w-full">Ir al sistema</Button></Link>
        </nav>
      )}
    </header>
  );
}
