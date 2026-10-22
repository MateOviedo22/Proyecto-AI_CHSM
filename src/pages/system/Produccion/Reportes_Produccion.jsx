
import { useState } from 'react';
import { BarChart3, ClipboardCheck, PackageCheck, TrendingUp } from 'lucide-react';
import { productionReports } from '../../../data/mockData';

export default function Reportes_Produccion() {
    const [period, setPeriod] = useState('Mes actual');

    const report = productionReports[period];

    const kpis = [
        {
            label: 'Unidades planificadas',
            value: report.planned,
            icon: ClipboardCheck,
        },
        {
            label: 'Unidades producidas',
            value: report.produced,
            icon: PackageCheck,
        },
        {
            label: 'Cumplimiento',
            value: `${Math.round((report.produced / Math.max(report.planned, 1)) * 100)}%`,
            icon: TrendingUp,
        },
        {
            label: 'Órdenes completadas',
            value: report.completedOrders,
            icon: BarChart3,
        },
    ];

    const maxStageValue = Math.max(
        ...report.stages.map((stage) => stage.quantity),
        1
    );

    const downloadCsv = () => {
        const rows = [
            ['Etapa', 'Unidades producidas'],
            ...report.stages.map((stage) => [stage.name, stage.quantity]),
        ];

        const csv = rows
            .map((row) =>
                row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n');

        const blob = new Blob(['\uFEFF' + csv], {
            type: 'text/csv;charset=utf-8;',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `reporte-produccion-${period
            .toLowerCase()
            .replaceAll(' ', '-')}.csv`;

        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <main className="space-y-6 p-4 md:p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Reportes de producción
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Consulta el rendimiento y el cumplimiento de la fabricación.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                        {Object.keys(productionReports).map((key) => (
                            <option key={key}>{key}</option>
                        ))}
                    </select>

                    <button
                        onClick={downloadCsv}
                        className="rounded-lg bg-yellow-700 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-800"
                    >
                        Exportar CSV
                    </button>
                </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map(({ label, value, icon: Icon }) => (
                    <article key={label} className="rounded-xl border bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-gray-500">{label}</p>
                            <span className="rounded-lg bg-yellow-50 p-2 text-yellow-800">
                                <Icon size={20} />
                            </span>
                        </div>
                        <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
                        <p className="mt-1 text-xs text-gray-500">{period}</p>
                    </article>
                ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <article className="rounded-xl border bg-white p-5">
                    <h2 className="flex items-center gap-2 font-semibold">
                        <BarChart3 size={19} />
                        Producción por etapa
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Unidades registradas en cada etapa del proceso.
                    </p>

                    <div className="mt-6 space-y-5">
                        {report.stages.map((stage) => (
                            <div key={stage.name}>
                                <div className="mb-2 flex justify-between gap-3 text-sm">
                                    <span className="text-gray-700">{stage.name}</span>
                                    <span className="font-semibold">{stage.quantity} unidades</span>
                                </div>

                                <div
                                    className="h-3 overflow-hidden rounded-full bg-gray-100"
                                    role="progressbar"
                                    aria-label={stage.name}
                                    aria-valuemin={0}
                                    aria-valuemax={maxStageValue}
                                    aria-valuenow={stage.quantity}
                                >
                                    <div
                                        className="h-full rounded-full bg-yellow-700 transition-all"
                                        style={{
                                            width: `${(stage.quantity / maxStageValue) * 100}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="rounded-xl border bg-white p-5">
                    <h2 className="font-semibold">Resumen de cumplimiento</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Comparación entre las unidades planificadas y las producidas.
                    </p>

                    <div className="mt-6 rounded-xl bg-gray-50 p-5">
                        <p className="text-sm text-gray-500">Avance del período</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {Math.round((report.produced / Math.max(report.planned, 1)) * 100)}%
                        </p>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200">
                            <div
                                className="h-full rounded-full bg-green-600"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        (report.produced / Math.max(report.planned, 1)) * 100
                                    )}%`,
                                }}
                            />
                        </div>

                        <div className="mt-4 flex justify-between gap-3 text-sm">
                            <span className="text-gray-500">Producidas</span>
                            <span className="font-medium">{report.produced}</span>
                        </div>

                        <div className="mt-2 flex justify-between gap-3 text-sm">
                            <span className="text-gray-500">Pendientes de producir</span>
                            <span className="font-medium">
                                {Math.max(0, report.planned - report.produced)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-sm font-medium text-yellow-900">
                            Interpretación del período
                        </p>
                        <p className="mt-1 text-sm text-yellow-900">
                            {report.produced >= report.planned
                                ? 'Se alcanzó o superó la cantidad planificada.'
                                : 'La producción registrada aún no alcanza la cantidad planificada.'}
                        </p>
                    </div>
                </article>
            </section>

            <p className="text-xs text-gray-500">
                Reporte demostrativo basado en datos simulados. Los resultados no
                representan registros reales de Sunshine.
            </p>
        </main>
    );
}
