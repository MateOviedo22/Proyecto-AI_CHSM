import { useEffect, useMemo, useState } from 'react';

import {
    Button,
    Card,
    Col,
    Input,
    Row,
    Select,
    Statistic,
    Table,
    Tag,
    Typography,
    Space,
    Empty,
} from 'antd';

import {
    DownloadOutlined,
    FileExcelOutlined,
    ShoppingCartOutlined,
    DollarOutlined,
    InboxOutlined,
    RollbackOutlined,
    SearchOutlined,
} from '@ant-design/icons';

import {
    loadComprasData,
    formatCurrency,
} from './comprasStorage';

const { Title, Text } = Typography;

const STATUS_COLORS = {
    Borrador: 'default',
    Enviada: 'processing',
    Parcial: 'gold',
    Recibida: 'success',
    Cancelada: 'error',
    Pendiente: 'gold',
    Aceptada: 'success',
    Rechazada: 'error',
};

const isInsideDateRange = (date, from, to) => {
    if (!date) return true;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
};

const escapeCsv = (value) => {
    const text = String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
};

const downloadCsv = (rows, fileName) => {
    const csv = '\uFEFF' + rows
        .map((row) => row.map(escapeCsv).join(';'))
        .join('\r\n');

    const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
};

export default function Analisis_Compras() {
    const [data, setData] = useState(loadComprasData);

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const updateData = () => setData(loadComprasData());

        window.addEventListener('compras-data-updated', updateData);
        window.addEventListener('storage', updateData);

        return () => {
            window.removeEventListener('compras-data-updated', updateData);
            window.removeEventListener('storage', updateData);
        };
    }, []);

    const filteredOrders = useMemo(() => {
        return data.ordenes.filter((order) => {
            const matchesDate = isInsideDateRange(
                order.fecha,
                dateFrom,
                dateTo
            );

            const matchesStatus =
                statusFilter === 'Todos' ||
                order.estado === statusFilter;

            const searchText = search.toLowerCase();

            const matchesSearch = [
                order.id,
                order.proveedor,
                order.producto,
            ].some((value) =>
                String(value || '').toLowerCase().includes(searchText)
            );

            return matchesDate && matchesStatus && matchesSearch;
        });
    }, [data.ordenes, dateFrom, dateTo, statusFilter, search]);

    const filteredRecepciones = useMemo(() => {
        return (data.recepciones || []).filter((item) => {
            return isInsideDateRange(item.fecha, dateFrom, dateTo);
        });
    }, [data.recepciones, dateFrom, dateTo]);

    const filteredReturns = useMemo(() => {
        return (data.devoluciones || []).filter((item) => {
            return isInsideDateRange(item.fecha, dateFrom, dateTo);
        });
    }, [data.devoluciones, dateFrom, dateTo]);

    const validOrders = useMemo(() => {
        return filteredOrders.filter(
            (order) => order.estado !== 'Cancelada'
        );
    }, [filteredOrders]);

    const metrics = useMemo(() => {
        const totalOrdenado = validOrders.reduce(
            (total, order) =>
                total + Number(order.total || 0),
            0
        );

        const valorRecibido = validOrders.reduce(
            (total, order) => {
                const received = Math.min(
                    Number(order.cantidadRecibida || 0),
                    Number(order.cantidad || 0)
                );

                return (
                    total +
                    received * Number(order.precioUnitario || 0)
                );
            },
            0
        );

        const valorPendiente = validOrders.reduce(
            (total, order) => {
                const pending = Math.max(
                    0,
                    Number(order.cantidad || 0) -
                    Number(order.cantidadRecibida || 0)
                );

                return (
                    total +
                    pending * Number(order.precioUnitario || 0)
                );
            },
            0
        );

        const unidadesRecibidas = filteredRecepciones.reduce(
            (total, item) =>
                total + Number(item.cantidadRecibida || 0),
            0
        );

        const devolucionesAceptadas = filteredReturns
            .filter((item) => item.estado === 'Aceptada')
            .reduce(
                (total, item) => total + Number(item.total || 0),
                0
            );

        return {
            cantidadOrdenes: validOrders.length,
            totalOrdenado,
            valorRecibido,
            valorPendiente,
            unidadesRecibidas,
            devolucionesAceptadas,
            cantidadDevoluciones: filteredReturns.length,
        };
    }, [validOrders, filteredRecepciones, filteredReturns]);

    // Resumen de compras por proveedor.
    const providerSummary = useMemo(() => {
        const grouped = {};

        validOrders.forEach((order) => {
            const provider = order.proveedor || 'Sin proveedor';

            if (!grouped[provider]) {
                grouped[provider] = {
                    proveedor: provider,
                    ordenes: 0,
                    importe: 0,
                    unidadesSolicitadas: 0,
                    unidadesRecibidas: 0,
                };
            }

            grouped[provider].ordenes += 1;
            grouped[provider].importe += Number(order.total || 0);
            grouped[provider].unidadesSolicitadas += Number(
                order.cantidad || 0
            );
            grouped[provider].unidadesRecibidas += Math.min(
                Number(order.cantidadRecibida || 0),
                Number(order.cantidad || 0)
            );
        });

        return Object.values(grouped).sort(
            (a, b) => b.importe - a.importe
        );
    }, [validOrders]);

    // Agrupación mensual del importe de las órdenes.
    const monthlySummary = useMemo(() => {
        const grouped = {};

        validOrders.forEach((order) => {
            if (!order.fecha) return;

            const monthKey = order.fecha.slice(0, 7);

            if (!grouped[monthKey]) {
                grouped[monthKey] = {
                    key: monthKey,
                    cantidad: 0,
                    importe: 0,
                };
            }

            grouped[monthKey].cantidad += 1;
            grouped[monthKey].importe += Number(order.total || 0);
        });

        return Object.values(grouped)
            .sort((a, b) => a.key.localeCompare(b.key))
            .slice(-6)
            .map((item) => ({
                ...item,
                label: new Date(
                    `${item.key}-01T12:00:00`
                ).toLocaleDateString('es-NI', {
                    month: 'short',
                    year: 'numeric',
                }),
            }));
    }, [validOrders]);

    const maxMonthlyAmount = Math.max(
        1,
        ...monthlySummary.map((item) => item.importe)
    );

    const orderColumns = [
        {
            title: 'Código',
            dataIndex: 'id',
            key: 'id',
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: 'Fecha',
            dataIndex: 'fecha',
            key: 'fecha',
        },
        {
            title: 'Proveedor',
            dataIndex: 'proveedor',
            key: 'proveedor',
        },
        {
            title: 'Producto',
            dataIndex: 'producto',
            key: 'producto',
        },
        {
            title: 'Cantidad',
            key: 'cantidad',
            render: (_, record) =>
                `${Number(record.cantidadRecibida || 0)} / ${record.cantidad}`,
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (value) => (
                <Text strong style={{ color: '#2E86C1' }}>
                    {formatCurrency(value)}
                </Text>
            ),
        },
        {
            title: 'Estado',
            dataIndex: 'estado',
            key: 'estado',
            render: (value) => (
                <Tag color={STATUS_COLORS[value] || 'default'}>
                    {value}
                </Tag>
            ),
        },
    ];

    const providerColumns = [
        {
            title: 'Proveedor',
            dataIndex: 'proveedor',
            key: 'proveedor',
        },
        {
            title: 'Órdenes',
            dataIndex: 'ordenes',
            key: 'ordenes',
        },
        {
            title: 'Unidades solicitadas',
            dataIndex: 'unidadesSolicitadas',
            key: 'unidadesSolicitadas',
        },
        {
            title: 'Unidades recibidas',
            dataIndex: 'unidadesRecibidas',
            key: 'unidadesRecibidas',
        },
        {
            title: 'Importe de órdenes',
            dataIndex: 'importe',
            key: 'importe',
            render: (value) => (
                <Text strong style={{ color: '#2E86C1' }}>
                    {formatCurrency(value)}
                </Text>
            ),
        },
    ];

    const handleExport = () => {
        const rows = [
            [
                'Tipo',
                'Código',
                'Fecha',
                'Proveedor',
                'Producto',
                'Cantidad',
                'Importe',
                'Estado',
            ],
        ];

        filteredOrders.forEach((order) => {
            rows.push([
                'Orden',
                order.id,
                order.fecha,
                order.proveedor,
                order.producto,
                order.cantidad,
                order.total,
                order.estado,
            ]);
        });

        filteredRecepciones.forEach((item) => {
            rows.push([
                'Recepción',
                item.id,
                item.fecha,
                item.proveedor,
                item.producto,
                item.cantidadRecibida,
                '',
                'Registrada',
            ]);
        });

        filteredReturns.forEach((item) => {
            rows.push([
                'Devolución',
                item.id,
                item.fecha,
                item.proveedor,
                item.producto,
                item.cantidad,
                item.total,
                item.estado,
            ]);
        });

        downloadCsv(rows, 'reporte_compras.csv');
    };

    const clearFilters = () => {
        setDateFrom('');
        setDateTo('');
        setStatusFilter('Todos');
        setSearch('');
    };

    return (
        <div style={{ padding: '8px 4px' }}>
            {/* Encabezado */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 22,
                }}
            >
                <div>
                    <Title level={3} style={{ color: '#374151', marginBottom: 4 }}>
                        Análisis y reportes de compras
                    </Title>

                    <Text type="secondary">
                        Consulta el comportamiento de las compras, recepciones y devoluciones.
                    </Text>
                </div>

                <Space wrap>
                    <Button onClick={clearFilters}>
                        Limpiar filtros
                    </Button>

                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        style={{
                            background: '#2E86C1',
                            borderColor: '#2E86C1',
                            borderRadius: 7,
                        }}
                    >
                        Exportar CSV
                    </Button>
                </Space>
            </div>

            {/* Filtros */}
            <Card
                bordered={false}
                style={{
                    borderRadius: 12,
                    marginBottom: 20,
                    boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                }}
            >
                <Row gutter={[16, 12]} align="bottom">
                    <Col xs={24} sm={12} lg={5}>
                        <Text strong style={{ display: 'block', marginBottom: 7 }}>
                            Fecha inicial
                        </Text>

                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(event) => setDateFrom(event.target.value)}
                        />
                    </Col>

                    <Col xs={24} sm={12} lg={5}>
                        <Text strong style={{ display: 'block', marginBottom: 7 }}>
                            Fecha final
                        </Text>

                        <Input
                            type="date"
                            min={dateFrom || undefined}
                            value={dateTo}
                            onChange={(event) => setDateTo(event.target.value)}
                        />
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                        <Text strong style={{ display: 'block', marginBottom: 7 }}>
                            Estado de orden
                        </Text>

                        <Select
                            style={{ width: '100%' }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { label: 'Todos los estados', value: 'Todos' },
                                { label: 'Borrador', value: 'Borrador' },
                                { label: 'Enviada', value: 'Enviada' },
                                { label: 'Parcial', value: 'Parcial' },
                                { label: 'Recibida', value: 'Recibida' },
                                { label: 'Cancelada', value: 'Cancelada' },
                            ]}
                        />
                    </Col>

                    <Col xs={24} sm={12} lg={8}>
                        <Text strong style={{ display: 'block', marginBottom: 7 }}>
                            Buscar
                        </Text>

                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Proveedor, producto o código..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Indicadores */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            borderLeft: '4px solid #2E86C1',
                            boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                        }}
                    >
                        <Statistic
                            title="Órdenes no canceladas"
                            value={metrics.cantidadOrdenes}
                            prefix={<ShoppingCartOutlined />}
                            valueStyle={{ color: '#2E86C1' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            borderLeft: '4px solid #D4A72C',
                            boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                        }}
                    >
                        <Statistic
                            title="Importe ordenado"
                            value={metrics.totalOrdenado}
                            formatter={(value) => formatCurrency(value)}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#D4A72C', fontSize: 21 }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            borderLeft: '4px solid #52A675',
                            boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                        }}
                    >
                        <Statistic
                            title="Valor recibido"
                            value={metrics.valorRecibido}
                            formatter={(value) => formatCurrency(value)}
                            prefix={<InboxOutlined />}
                            valueStyle={{ color: '#52A675', fontSize: 21 }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            borderLeft: '4px solid #D4A72C',
                            boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                        }}
                    >
                        <Statistic
                            title="Valor pendiente de recibir"
                            value={metrics.valorPendiente}
                            formatter={(value) => formatCurrency(value)}
                            valueStyle={{ color: '#D4A72C', fontSize: 21 }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={12}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            borderLeft: '4px solid #2E86C1',
                            boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                        }}
                    >
                        <Statistic
                            title="Unidades recibidas en el período"
                            value={metrics.unidadesRecibidas}
                            prefix={<InboxOutlined />}
                            valueStyle={{ color: '#2E86C1' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            borderLeft: '4px solid #D4A72C',
                            boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                        }}
                    >
                        <Statistic
                            title="Devoluciones aceptadas"
                            value={metrics.devolucionesAceptadas}
                            formatter={(value) => formatCurrency(value)}
                            prefix={<RollbackOutlined />}
                            valueStyle={{ color: '#D4A72C', fontSize: 21 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Resumen mensual */}
            <Card
                title="Comportamiento mensual de compras"
                bordered={false}
                style={{
                    marginTop: 20,
                    borderRadius: 12,
                    boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                }}
            >
                {monthlySummary.length === 0 ? (
                    <Empty description="No hay órdenes para mostrar en este período." />
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-end',
                            gap: 18,
                            minHeight: 210,
                            overflowX: 'auto',
                            padding: '18px 8px 4px',
                        }}
                    >
                        {monthlySummary.map((month) => {
                            const height = Math.max(
                                8,
                                (month.importe / maxMonthlyAmount) * 150
                            );

                            return (
                                <div
                                    key={month.key}
                                    style={{
                                        minWidth: 85,
                                        flex: 1,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Text
                                        strong
                                        style={{
                                            display: 'block',
                                            fontSize: 11,
                                            marginBottom: 7,
                                        }}
                                    >
                                        {formatCurrency(month.importe)}
                                    </Text>

                                    <div
                                        style={{
                                            height: `${height}px`,
                                            maxWidth: 70,
                                            margin: '0 auto',
                                            borderRadius: '7px 7px 0 0',
                                            background:
                                                'linear-gradient(180deg, #2E86C1 0%, #A9D5F0 100%)',
                                        }}
                                    />

                                    <Text
                                        type="secondary"
                                        style={{
                                            display: 'block',
                                            marginTop: 8,
                                            fontSize: 12,
                                        }}
                                    >
                                        {month.label}
                                    </Text>

                                    <Text
                                        type="secondary"
                                        style={{ display: 'block', fontSize: 11 }}
                                    >
                                        {month.cantidad} órdenes
                                    </Text>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Resumen por proveedor */}
            <Card
                title="Resumen de compras por proveedor"
                bordered={false}
                style={{
                    marginTop: 20,
                    borderRadius: 12,
                    boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                }}
            >
                <Table
                    columns={providerColumns}
                    dataSource={providerSummary}
                    rowKey="proveedor"
                    pagination={{
                        pageSize: 8,
                        showTotal: (total) => `${total} proveedores`,
                    }}
                    scroll={{ x: 850 }}
                    locale={{
                        emptyText: 'No hay información de proveedores para mostrar.',
                    }}
                />
            </Card>

            {/* Detalle de órdenes */}
            <Card
                title="Detalle de órdenes"
                bordered={false}
                style={{
                    marginTop: 20,
                    borderRadius: 12,
                    boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                }}
            >
                <Table
                    columns={orderColumns}
                    dataSource={filteredOrders}
                    rowKey="id"
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: true,
                        showTotal: (total) => `${total} órdenes`,
                    }}
                    scroll={{ x: 1050 }}
                    locale={{
                        emptyText: 'No hay órdenes que coincidan con los filtros.',
                    }}
                />
            </Card>

            {/* Resumen de devoluciones */}
            <Card
                title="Resumen de devoluciones"
                bordered={false}
                style={{
                    marginTop: 20,
                    borderRadius: 12,
                    boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                }}
            >
                <Row gutter={[16, 12]}>
                    <Col xs={24} sm={8}>
                        <Text type="secondary">Devoluciones registradas</Text>
                        <Title level={3} style={{ margin: '6px 0', color: '#2E86C1' }}>
                            {metrics.cantidadDevoluciones}
                        </Title>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Text type="secondary">Aceptadas</Text>
                        <Title level={3} style={{ margin: '6px 0', color: '#52A675' }}>
                            {filteredReturns.filter(
                                (item) => item.estado === 'Aceptada'
                            ).length}
                        </Title>
                    </Col>

                    <Col xs={24} sm={8}>
                        <Text type="secondary">Pendientes de respuesta</Text>
                        <Title level={3} style={{ margin: '6px 0', color: '#D4A72C' }}>
                            {filteredReturns.filter(
                                (item) =>
                                    ['Pendiente', 'Enviada'].includes(item.estado)
                            ).length}
                        </Title>
                    </Col>
                </Row>
            </Card>

            <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Los reportes se calculan con los registros almacenados en el módulo de Compras.
                </Text>
            </div>
        </div>
    );
}