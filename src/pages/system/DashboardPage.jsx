import * as Lucide from 'lucide-react';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/data/StatCard';
import IncomeExpenseChart from '../../components/data/IncomeExpenseChart';
import InventoryAlerts from '../../components/data/InventoryAlerts';
import { dashboardKpis, incomeVsExpenses, inventoryAlerts } from '../../data/mockData';

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Resumen" subtitle="Rendimiento de la fábrica y métricas clave." action={<Button>Exportar Reporte</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map(({ id, icon, ...k }) => <StatCard key={id} icon={Lucide[icon]} {...k} />)}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <IncomeExpenseChart data={incomeVsExpenses} />
        <InventoryAlerts alerts={inventoryAlerts} />
      </div>
    </>
  );
}
