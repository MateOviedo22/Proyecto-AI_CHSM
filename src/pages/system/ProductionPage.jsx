import { useState } from 'react';
import { CreditCard, Info, PackageX, PlusCircle } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import ProductCard from '../../components/data/ProductCard';
import DetailPanel from '../../components/data/DetailPanel';
import QuickActionsPanel from '../../components/data/QuickActionsPanel';
import Pagination from '../../components/ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { products } from '../../data/mockData';
import { productDetails } from '../../utils/products';
import { formatCurrency } from '../../utils/formatters';

const actions = [
  { label: 'Orden de producción', icon: PlusCircle }, { label: 'Registrar averiados', icon: PackageX },
  { label: 'Actualización de precio', icon: CreditCard },
];

export default function ProductionPage() {
  const [selected, setSelected] = useState(null);
  const p = usePagination(products, 10);

  return (
    <>
      <PageHeader title="Panel de Producción" subtitle="Gestione productos de una manera cómoda" />
      <ul className="grid gap-4 md:grid-cols-2">
        {p.pageItems.map((it) => (
          <li key={it.id}>
            <ProductCard layout="row" name={it.name} image={it.image} details={productDetails(it)} selected={selected?.id === it.id} onSelect={() => setSelected(it)} />
          </li>
        ))}
      </ul>
      <div className="mt-6 grid gap-4 md:grid-cols-[280px_1fr]">
        <QuickActionsPanel actions={actions} />
        <DetailPanel icon={Info} emptyText="Selecciona un Producto para ver su historial de movimientos, lista BOM y Umbral mínimo."
          title={selected?.name} fields={selected && [['Existencias', `${selected.stock} Unidades`], ['Umbral mínimo', `${selected.minStock} Unidades`], ['Costo unitario', formatCurrency(selected.unitCost)], ['Lista BOM', selected.bom]]} />
      </div>
      <Pagination p={p} />
    </>
  );
}
