import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function InventoryAlerts({ alerts }) {
  return (
    <Card aria-labelledby="alerts-title">
      <div className="flex items-center justify-between">
        <h2 id="alerts-title" className="text-base font-semibold">Alertas de Inventario</h2>
        <Link to="/sistema/inventario" className="text-xs text-sun hover:underline">Ver todas</Link>
      </div>
      <ul className="mt-3 divide-y divide-gray-200">
        {alerts.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-2 py-3">
            <div>
              <p className="text-sm font-medium">{a.item}</p>
              <p className="text-xs text-gray-500">{a.detail}</p>
            </div>
            <Badge>{a.level}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
