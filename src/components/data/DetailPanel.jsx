import { CircleUserRound } from 'lucide-react';
import Card from '../ui/Card';

/** Estado vacío cuando no hay selección; ficha con campos cuando sí. */
export default function DetailPanel({ emptyText, title, fields, icon: Icon = CircleUserRound }) {
  return (
    <Card aria-live="polite" className="flex min-h-40 flex-col items-center justify-center text-center">
      {!title ? (
        <>
          <Icon size={36} strokeWidth={1.2} aria-hidden="true" />
          <p className="mt-3 max-w-xs text-sm text-gray-600">{emptyText}</p>
        </>
      ) : (
        <div className="w-full text-left">
          <h2 className="mb-3 text-lg font-semibold">{title}</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {fields.map(([k, v]) => <div key={k}><dt className="text-xs text-gray-500">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
        </div>
      )}
    </Card>
  );
}
