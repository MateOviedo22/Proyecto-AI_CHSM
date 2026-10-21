import { Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/data/StatCard';
import DataTable from '../../components/data/DataTable';
import { useFilteredList } from '../../hooks/useFilteredList';
import { financeKpis, transactions } from '../../data/mockData';
import { formatCurrency, formatDate } from '../../utils/formatters';

const SEARCH_KEYS = ['description', 'category'];

export default function FinancePage() {
  const { filtered, query, setQuery, filters, setFilter } = useFilteredList(transactions, SEARCH_KEYS, { type: 'Todos', method: 'Todos' });

  const columns = [
    { key: 'date', header: 'Fecha', render: (r) => formatDate(r.date) },
    { key: 'description', header: 'Descripción' },
    { key: 'type', header: 'Tipo', render: (r) => <Badge>{r.type}</Badge> },
    { key: 'category', header: 'Categoría' }, { key: 'method', header: 'Método de pago' },
    { key: 'amount', header: 'Monto', align: 'right', render: (r) => <b>{formatCurrency(r.amount)}</b> },
    { key: 'status', header: 'Estado', render: (r) => <Badge>{r.status}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Finanzas" subtitle="Consulta y controla los ingresos, gastos y movimientos financieros." action={<Button><Download size={16} /> Exportar Reporte</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {financeKpis.map(({ id, ...k }) => <StatCard key={id} currency trendLabel="comparado al mes anterior" {...k} />)}
      </div>
      <div className="mt-6">
        <DataTable
          columns={columns} rows={filtered} caption="Movimientos financieros"
          toolbar={
            <div className="grid gap-3 sm:grid-cols-[1fr_150px_170px]">
              <SearchInput value={query} onChange={setQuery} placeholder="Buscar por descripción o referencia" />
              <Select id="fin-type" label="Tipo" options={['Todos', 'Ingreso', 'Gasto']} value={filters.type} onChange={(v) => setFilter('type', v)} />
              <Select id="fin-method" label="Método de pago" options={['Todos', 'Efectivo', 'Transferencia', 'Tarjeta']} value={filters.method} onChange={(v) => setFilter('method', v)} />
            </div>
          }
        />
      </div>
    </>
  );
}
