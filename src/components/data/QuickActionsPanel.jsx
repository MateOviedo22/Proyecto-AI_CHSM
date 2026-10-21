import Card from '../ui/Card';

export default function QuickActionsPanel({ actions }) {
  return (
    <Card aria-labelledby="qa-title">
      <h2 id="qa-title" className="border-b border-gray-300 pb-2 text-base font-semibold">Acciones Rápidas</h2>
      <ul className="mt-2">
        {actions.map(({ label, icon: Icon, onClick }) => (
          <li key={label}>
            <button onClick={onClick} className="flex w-full items-center gap-3 rounded px-1 py-2 text-left text-sm transition hover:bg-black/5">
              <Icon size={16} aria-hidden="true" /> {label}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
