import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../ui/Card';

export default function IncomeExpenseChart({ data }) {
  return (
    <Card aria-labelledby="chart-title" className="lg:col-span-2">
      <h2 id="chart-title" className="text-lg font-semibold italic">Ingresos vs gastos</h2>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#2FBFAE" strokeWidth={2.5} fill="#2FBFAE" fillOpacity={0.25} />
            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#F28B82" strokeWidth={2.5} fill="#F6C945" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
