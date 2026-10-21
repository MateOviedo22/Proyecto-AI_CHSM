import { useMemo, useState } from 'react';
import { CircleDollarSign, ClipboardList, Package, Plus, TriangleAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import PageHeader from '../../components/layout/PageHeader';
import ProductCard from '../../components/data/ProductCard';
import { useFilteredList } from '../../hooks/useFilteredList';
import { usePagination } from '../../hooks/usePagination';
import { inventoryStats, products } from '../../data/mockData';
import { productDetails, stockStatus } from '../../utils/products';
import { formatCurrency } from '../../utils/formatters';

const SEARCH_KEYS = ['name'];
const items = products.map((p) => ({ ...p, status: stockStatus(p.stock) }));
const sorters = {
  'Nombre (A-Z)': (a, b) => a.name.localeCompare(b.name),
  'Existencias (ascendente)': (a, b) => a.stock - b.stock,
  'Existencias (descendente)': (a, b) => b.stock - a.stock,
};
const stats = [
  { label: 'Productos', value: inventoryStats.products, icon: Package, tint: 'bg-sand/60' },
  { label: 'Stock bajo', value: inventoryStats.lowStock, icon: TriangleAlert, tint: 'bg-status-warnBg' },
  { label: 'Valor del inventario', value: formatCurrency(inventoryStats.value), icon: CircleDollarSign, tint: 'bg-status-okBg' },
];

export default function InventoryPage() {
  const [order, setOrder] = useState('Nombre (A-Z)');
  const { filtered, query, setQuery, filters, setFilter } = useFilteredList(items, SEARCH_KEYS, { category: 'Todos', status: 'Todos' });
  const sorted = useMemo(() => [...filtered].sort(sorters[order]), [filtered, order]);
  const p = usePagination(sorted, 10);

  return (
    <>
      <PageHeader title="Inventario" subtitle="Consulta y controla las existencias de productos."
        action={<div className="flex gap-2"><Button variant="secondary"><ClipboardList size={16} /> Registrar movimiento</Button><Button><Plus size={16} /> Añadir Producto</Button></div>} />
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <Card as="article" key={label} className="flex items-center gap-3">
            <span className={`grid h-11 w-11 place-items-center rounded-lg ${tint}`}><Icon size={22} aria-hidden="true" /></span>
            <div><h3 className="font-sans text-xs text-gray-600">{label}</h3><p className="text-2xl font-bold">{value}</p></div>
          </Card>
        ))}
      </div>
      <div className="my-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_160px_160px_200px]">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar producto..." />
        <Select id="inv-cat" label="Categoría" options={['Todos', 'Bolsos', 'Accesorios']} value={filters.category} onChange={(v) => setFilter('category', v)} />
        <Select id="inv-status" label="Estado" options={['Todos', 'Normal', 'Bajo']} value={filters.status} onChange={(v) => setFilter('status', v)} />
        <Select id="inv-order" label="Ordenar por" options={Object.keys(sorters)} value={order} onChange={setOrder} />
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {p.pageItems.map((it) => <li key={it.id}><ProductCard name={it.name} image={it.image} details={productDetails(it)} /></li>)}
      </ul>
      {!sorted.length && <p className="py-10 text-center text-sm text-gray-600">No hay productos con esos filtros.</p>}
      <Pagination p={p} />
    </>
  );
}
