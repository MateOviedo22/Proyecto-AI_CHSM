import { Search } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Buscar...', label = 'Buscar' }) {
  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-field border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm transition hover:border-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
      />
    </div>
  );
}
