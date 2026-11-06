import { useEffect, useMemo, useState } from 'react';
import {
    Card,
    Col,
    Empty,
    Progress,
    Row,
    Statistic,
    Table,
    Tag,
    Typography,
} from 'antd';

import {
    ShoppingCartOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    InboxOutlined,
} from '@ant-design/icons';

import {
    loadComprasData,
    formatCurrency,
} from './comprasStorage.js';

const { Title, Text } = Typography;

const getStatusColor = (status) => {
    const colors = {
        Pendiente: 'gold',
        Aprobada: 'green',
        Rechazada: 'red',
        'Orden generada': 'blue',
        Borrador: 'default',
        Enviada: 'processing',
        Recibida: 'success',
        Cancelada: 'error',
    };

    return colors[status] || 'default';
};

export default function PanelCompras() {
    const [data, setData] = useState(loadComprasData);

    useEffect(() => {
        const updateData = () => {
            setData(loadComprasData());
        };

        window.addEventListener('compras-data-updated', updateData);
        window.addEventListener('storage', updateData);

        return () => {
            window.removeEventListener('compras-data-updated', updateData);
            window.removeEventListener('storage', updateData);
        };
    }, []);

    const metrics = useMemo(() => {
        const solicitudes = data.solicitudes;
        const ordenes = data.ordenes;

        const pendientes = solicitudes.filter(
            (item) => item.estado === 'Pendiente'
        ).length;

        const aprobadas = solicitudes.filter(
            (item) => item.estado === 'Aprobada'
        ).length;

        const ordenesProceso = ordenes.filter(
            (item) => ['Borrador', 'Enviada'].includes(item.estado)
        ).length;

        const totalCompras = ordenes
            .filter((item) => item.estado !== 'Cancelada')
            .reduce((total, item) => total + Number(item.total || 0), 0);

        return {
            totalSolicitudes: solicitudes.length,
            pendientes,
            aprobadas,
            ordenesProceso,
            totalCompras,
        };
    }, [data]);

    const solicitudesRecientes = useMemo(
        () =>
            [...data.solicitudes]
                .sort((a, b) => b.fecha.localeCompare(a.fecha))
                .slice(0, 5),
        [data.solicitudes]
    );

    const ordenesRecientes = useMemo(
        () =>
            [...data.ordenes]
                .sort((a, b) => b.fecha.localeCompare(a.fecha))
                .slice(0, 5),
        [data.ordenes]
    );

    const solicitudColumns = [
        {
            title: 'Código',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Solicitante',
            dataIndex: 'solicitante',
            key: 'solicitante',
        },
        {
            title: 'Producto',
            dataIndex: 'producto',
            key: 'producto',
        },
        {
            title: 'Prioridad',
            dataIndex: 'prioridad',
            key: 'prioridad',
            render: (value) => (
                <Tag color={value === 'Alta' ? 'red' : value === 'Media' ? 'gold' : 'blue'}>
                    {value}
                </Tag>
            ),
        },
        {
            title: 'Estado',
            dataIndex: 'estado',
            key: 'estado',
            render: (value) => (
                <Tag color={getStatusColor(value)}>{value}</Tag>
            ),
        },
    ];

    const ordenColumns = [
        {
            title: 'Código',
            dataIndex: 'id',
            key: 'id',
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
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (value) => (
                <Text strong>{formatCurrency(value)}</Text>
            ),
        },
        {
            title: 'Estado',
            dataIndex: 'estado',
            key: 'estado',
            render: (value) => (
                <Tag color={getStatusColor(value)}>{value}</Tag>
            ),
        },
    ];

    const cardStyle = {
        borderRadius: 12,
        border: '1px solid #E5EEF5',
        boxShadow: '0 3px 12px rgba(46, 134, 193, 0.06)',
        height: '100%',
    };

    const statisticStyle = {
        color: '#2E86C1',
        fontWeight: 600,
    };

    return (
        <div style={{ padding: '8px 4px' }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ color: '#374151', marginBottom: 4 }}>
                    Panel de Compras
                </Title>

                <Text type="secondary">
                    Resumen general de solicitudes y órdenes de compra.
                </Text>
            </div>

            {/* Indicadores principales */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title="Solicitudes registradas"
                            value={metrics.totalSolicitudes}
                            prefix={<FileTextOutlined />}
                            valueStyle={statisticStyle}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title="Solicitudes pendientes"
                            value={metrics.pendientes}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#D4A72C', fontWeight: 600 }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title="Órdenes en proceso"
                            value={metrics.ordenesProceso}
                            prefix={<ShoppingCartOutlined />}
                            valueStyle={statisticStyle}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Card style={cardStyle}>
                        <Statistic
                            title="Total en órdenes"
                            value={metrics.totalCompras}
                            formatter={(value) => formatCurrency(value)}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#D4A72C', fontWeight: 600 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Resumen de actividad */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} lg={8}>
                    <Card
                        title="Resumen de solicitudes"
                        style={cardStyle}
                    >
                        <div style={{ marginBottom: 18 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 8,
                                }}
                            >
                                <Text>Solicitudes pendientes</Text>
                                <Text strong>{metrics.pendientes}</Text>
                            </div>

                            <Progress
                                percent={
                                    metrics.totalSolicitudes
                                        ? Math.round(
                                            (metrics.pendientes / metrics.totalSolicitudes) * 100
                                        )
                                        : 0
                                }
                                strokeColor="#D4A72C"
                                showInfo={false}
                            />
                        </div>

                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: 8,
                                }}
                            >
                                <Text>Solicitudes aprobadas</Text>
                                <Text strong>{metrics.aprobadas}</Text>
                            </div>

                            <Progress
                                percent={
                                    metrics.totalSolicitudes
                                        ? Math.round(
                                            (metrics.aprobadas / metrics.totalSolicitudes) * 100
                                        )
                                        : 0
                                }
                                strokeColor="#2E86C1"
                                showInfo={false}
                            />
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <span>
                                <InboxOutlined style={{ color: '#2E86C1', marginRight: 8 }} />
                                Solicitudes recientes
                            </span>
                        }
                        style={cardStyle}
                    >
                        <Table
                            columns={solicitudColumns}
                            dataSource={solicitudesRecientes}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            locale={{
                                emptyText: <Empty description="No hay solicitudes registradas" />,
                            }}
                            scroll={{ x: 600 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Órdenes recientes */}
            <Row style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card
                        title={
                            <span>
                                <ShoppingCartOutlined
                                    style={{ color: '#2E86C1', marginRight: 8 }}
                                />
                                Órdenes de compra recientes
                            </span>
                        }
                        style={cardStyle}
                    >
                        <Table
                            columns={ordenColumns}
                            dataSource={ordenesRecientes}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            locale={{
                                emptyText: <Empty description="No hay órdenes registradas" />,
                            }}
                            scroll={{ x: 600 }}
                        />
                    </Card>
                </Col>
            </Row>

            <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    Los indicadores se actualizan según los registros del módulo.
                </Text>
            </div>
        </div>
    );
}