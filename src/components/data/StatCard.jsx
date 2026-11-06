import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

export default function StatCard({ label, value, unit, currency, trend, trendLabel, icon: Icon }) {
  const up = trend >= 0;
  return (
    <Card as="article" className="transition hover:shadow-lift">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <h3 className="font-sans font-medium">{label}</h3>
        {Icon && <Icon size={16} aria-hidden="true" />}
      </div>
      <p className="mt-1 text-3xl font-bold">
        {currency ? formatCurrency(value) : value.toLocaleString('es-NI')}
        {unit && <span className="ml-1 text-lg font-semibold">{unit}</span>}
      </p>
      <p className={`mt-2 flex items-center gap-1 text-xs ${up ? 'text-status-ok' : 'text-status-bad'}`}>
        {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span className="font-semibold">{up ? '+' : ''}{trend}%</span>
        <span className="text-gray-500">{trendLabel}</span>
      </p>
    </Card>
  );
}
