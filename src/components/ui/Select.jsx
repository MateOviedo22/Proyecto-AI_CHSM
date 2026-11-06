export default function Select({ id, label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-gray-600">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-field border border-gray-300 bg-white px-3 py-2 text-sm transition hover:border-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
