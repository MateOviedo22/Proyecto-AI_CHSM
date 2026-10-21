import { useState } from 'react';
import { Mail, MapPin, Phone, Plus, ShoppingBag } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/data/DataTable';
import DetailPanel from '../../components/data/DetailPanel';
import QuickActionsPanel from '../../components/data/QuickActionsPanel';
import { useFilteredList } from '../../hooks/useFilteredList';
import { customers } from '../../data/mockData';
import { formatCurrency } from '../../utils/formatters';

const SEARCH_KEYS = ['name', 'user', 'email'];
const actions = [
  { label: 'Llamar', icon: Phone }, { label: 'Enviar campaña de correo', icon: Mail },
  { label: 'Realizar nuevo pedido', icon: ShoppingBag }, { label: 'Agendar Visita', icon: MapPin },
];

export default function CrmPage() {
  const [selected, setSelected] = useState(null);
  const { filtered, query, setQuery, filters, setFilter } = useFilteredList(customers, SEARCH_KEYS, { status: 'Todos' });

  const columns = [
    { key: 'name', header: 'Nombre del cliente' }, { key: 'user', header: 'Usuario' }, { key: 'email', header: 'Correo' },
    { key: 'status', header: 'Estado', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'lastPurchase', header: 'Última compra' },
    { key: 'total', header: 'Total comprado', render: (r) => <b>{formatCurrency(r.total)}</b> },
    { key: 'actions', header: 'Acciones', render: (r) => <button onClick={() => setSelected(r)} className="underline transition hover:text-brand-dark">Ver / Editar</button> },
  ];

  return (
    <>
      <PageHeader title="Directorio CRM" subtitle="Gestione relaciones con clientes y acuerdos B2B" action={<Button><Plus size={16} /> Añadir cliente</Button>} />
      <DataTable
        columns={columns} rows={filtered} selectedId={selected?.id} caption="Clientes"
        toolbar={
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar cliente..." />
            <Select id="crm-status" label="Estado" options={['Todos', 'Activo', 'Inactivo']} value={filters.status} onChange={(v) => setFilter('status', v)} />
          </div>
        }
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <DetailPanel emptyText="Selecciona un cliente para ver su perfil completo en el CRM, historial de pedidos y comunicaciones activas."
          title={selected?.name} fields={selected && [['Correo', selected.email], ['Usuario', selected.user], ['Última compra', selected.lastPurchase], ['Total comprado', formatCurrency(selected.total)]]} />
        <QuickActionsPanel actions={actions} />
      </div>
    </>
  );
}
