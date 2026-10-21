import { useState } from 'react';
import { History, Pencil, Plus, RefreshCw, UserRound } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/data/DataTable';
import DetailPanel from '../../components/data/DetailPanel';
import QuickActionsPanel from '../../components/data/QuickActionsPanel';
import { useFilteredList } from '../../hooks/useFilteredList';
import { employees } from '../../data/mockData';

const SEARCH_KEYS = ['name', 'role', 'area'];
const actions = [
  { label: 'Ver perfil', icon: UserRound }, { label: 'Editar', icon: Pencil },
  { label: 'Cambiar estado', icon: RefreshCw }, { label: 'Ver Historial', icon: History },
];

export default function HrPage() {
  const [selected, setSelected] = useState(null);
  const { filtered, query, setQuery, filters, setFilter } = useFilteredList(employees, SEARCH_KEYS, { status: 'Todos' });

  const columns = [
    { key: 'name', header: 'Nombre del Colaborador' }, { key: 'role', header: 'Cargo' }, { key: 'area', header: 'Área' },
    { key: 'status', header: 'Estado', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'hired', header: 'Fecha Ingreso' }, { key: 'phone', header: 'Teléfono', render: (r) => <b>{r.phone}</b> },
    { key: 'actions', header: 'Acciones', render: (r) => <button onClick={() => setSelected(r)} className="underline transition hover:text-brand-dark">Ver / Editar</button> },
  ];

  return (
    <>
      <PageHeader title="Gestión de R.R.H.H" subtitle="Gestione las funciones y estado de colaboradores" action={<Button><Plus size={16} /> Añadir colaborador</Button>} />
      <DataTable
        columns={columns} rows={filtered} selectedId={selected?.id} caption="Colaboradores"
        toolbar={
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <SearchInput value={query} onChange={setQuery} placeholder="Buscar personal..." />
            <Select id="hr-status" label="Estado" options={['Todos', 'Activo', 'Inactivo']} value={filters.status} onChange={(v) => setFilter('status', v)} />
          </div>
        }
      />
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <DetailPanel emptyText="Selecciona un colaborador para ver el detalle de su perfil completo, roles y comunicaciones activas."
          title={selected?.name} fields={selected && [['Cargo', selected.role], ['Área', selected.area], ['Estado', selected.status], ['Fecha de ingreso', selected.hired], ['Teléfono', selected.phone]]} />
        <QuickActionsPanel actions={actions} />
      </div>
    </>
  );
}
