import { FileText, CreditCard, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/data/DataTable';
import { useFilteredList } from '../../hooks/useFilteredList';
import { orders, salesStats } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/formatters';

const SEARCH_KEYS = ['customer', 'id'];
const stats = [['Ventas de hoy', salesStats.today], ['Órdenes pendientes', salesStats.pending], ['Ventas del mes', formatCurrency(salesStats.month)]];

export default function SalesPage() {
  const { filtered, query, setQuery, filters, setFilter } = useFilteredList(orders, SEARCH_KEYS, { status: 'Todos', method: 'Todos' });

  const columns = [
    { key: 'id', header: 'N.º de orden' }, { key: 'customer', header: 'Cliente' },
    { key: 'date', header: 'Fecha', render: (r) => formatDate(r.date, { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'items', header: 'Productos', render: (r) => `${r.items} producto${r.items > 1 ? 's' : ''}` },
    { key: 'total', header: 'Total', render: (r) => <b>{formatCurrency(r.total)}</b> },
    { key: 'method', header: 'Método de pago' },
    { key: 'status', header: 'Estado', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'actions', header: 'Acciones', render: () => <button aria-label="Más acciones" className="px-2 transition hover:text-brand-dark">•••</button> },
  ];

  return (
    <>
      <PageHeader title="Ventas y Órdenes" subtitle="Consulta, registra y administra las ventas realizadas en Sunshine." />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <Card key={label} as="article"><h3 className="font-sans text-xs text-gray-600">{label}</h3><p className="text-2xl font-bold">{value}</p></Card>
        ))}
      </div>
      <div className="my-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm"><Plus size={14} /> Nueva venta</Button>
        <Button variant="secondary" size="sm"><CreditCard size={14} /> Registrar pago</Button>
        <Button variant="secondary" size="sm"><FileText size={14} /> Generar reporte</Button>
      </div>
      <DataTable
        title="Órdenes recientes" columns={columns} rows={filtered} caption="Órdenes recientes"
        toolbar={
          <div className="grid gap-3 sm:grid-cols-[1fr_160px_160px]">
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar por cliente, número de orden..." />
            <Select id="so-status" label="Estado" options={['Todos', 'Completada', 'Pendiente', 'En proceso', 'Cancelada']} value={filters.status} onChange={(v) => setFilter('status', v)} />
            <Select id="so-method" label="Método de pago" options={['Todos', 'Efectivo', 'Transferencia', 'Tarjeta']} value={filters.method} onChange={(v) => setFilter('method', v)} />
          </div>
        }
      />
    </>
  );
}
