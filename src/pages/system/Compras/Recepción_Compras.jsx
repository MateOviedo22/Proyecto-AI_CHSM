import { useEffect, useMemo, useState } from 'react';

import {
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';

import {
    InboxOutlined,
    PlusOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons';

import {
    loadComprasData,
    saveComprasData,
    generateComprasId,
    getToday,
} from './comprasStorage';

const { Title, Text } = Typography;

const STATUS_COLORS = {
    Enviada: 'processing',
    Parcial: 'gold',
    Recibida: 'success',
};

export default function Recepcion_Compras() {
    const [data, setData] = useState(loadComprasData);
    const [form] = Form.useForm();

    const [modalOpen, setModalOpen] = useState(false);
    const [search, setSearch] = useState('');

    const selectedOrderId = Form.useWatch('orderId', form);

    useEffect(() => {
        const updateData = () => setData(loadComprasData());

        window.addEventListener('compras-data-updated', updateData);
        window.addEventListener('storage', updateData);

        return () => {
            window.removeEventListener('compras-data-updated', updateData);
            window.removeEventListener('storage', updateData);
        };
    }, []);

    const availableOrders = useMemo(() => {
        return data.ordenes.filter((order) => {
            const remaining =
                Number(order.cantidad || 0) -
                Number(order.cantidadRecibida || 0);

            return (
                ['Enviada', 'Parcial'].includes(order.estado) &&
                remaining > 0
            );
        });
    }, [data.ordenes]);

    const selectedOrder = data.ordenes.find(
        (order) => order.id === selectedOrderId
    );

    const remainingQuantity = selectedOrder
        ? Math.max(
            0,
            Number(selectedOrder.cantidad || 0) -
            Number(selectedOrder.cantidadRecibida || 0)
        )
        : 0;

    const openCreateModal = () => {
        if (availableOrders.length === 0) {
            message.info(
                'No existen órdenes enviadas con mercancía pendiente de recibir.'
            );
            return;
        }

        form.resetFields();
        form.setFieldsValue({
            fecha: getToday(),
            cantidadRecibida: 1,
        });

        setModalOpen(true);
    };

    const handleSubmit = (values) => {
        // Releer la información para validar contra los datos más recientes.
        const latestData = loadComprasData();

        const order = latestData.ordenes.find(
            (item) => item.id === values.orderId
        );

        if (!order || !['Enviada', 'Parcial'].includes(order.estado)) {
            message.error('La orden seleccionada no permite registrar recepción.');
            return;
        }

        const pending = Math.max(
            0,
            Number(order.cantidad || 0) -
            Number(order.cantidadRecibida || 0)
        );

        const quantity = Number(values.cantidadRecibida || 0);

        if (quantity <= 0 || quantity > pending) {
            message.error(
                `La cantidad debe ser mayor que cero y no superar las ${pending} unidades pendientes.`
            );
            return;
        }

        const newReception = {
            id: generateComprasId('REC'),
            orderId: order.id,
            proveedor: order.proveedor,
            producto: order.producto,
            fecha: values.fecha,
            cantidadRecibida: quantity,
            observaciones: values.observaciones || '',
            documentoReferencia: values.documentoReferencia || '',
        };

        const updatedReceivedQuantity =
            Number(order.cantidadRecibida || 0) + quantity;

        const updatedOrders = latestData.ordenes.map((item) =>
            item.id === order.id
                ? {
                    ...item,
                    cantidadRecibida: updatedReceivedQuantity,
                    estado:
                        updatedReceivedQuantity >= Number(item.cantidad || 0)
                            ? 'Recibida'
                            : 'Parcial',
                }
                : item
        );

        const newData = {
            ...latestData,
            ordenes: updatedOrders,
            recepciones: [
                newReception,
                ...(latestData.recepciones || []),
            ],
        };

        saveComprasData(newData);
        setData(newData);

        setModalOpen(false);
        form.resetFields();

        message.success(
            updatedReceivedQuantity >= Number(order.cantidad || 0)
                ? 'Recepción completada. La orden está totalmente recibida.'
                : 'Recepción parcial registrada correctamente.'
        );
    };

    const filteredReceptions = useMemo(() => {
        return (data.recepciones || []).filter((item) => {
            const searchText = search.toLowerCase();

            return [
                item.id,
                item.orderId,
                item.proveedor,
                item.producto,
                item.documentoReferencia,
            ].some((value) =>
                String(value || '').toLowerCase().includes(searchText)
            );
        });
    }, [data.recepciones, search]);

    const totalReceived = (data.recepciones || []).reduce(
        (total, item) => total + Number(item.cantidadRecibida || 0),
        0
    );

    const ordersPending = availableOrders.length;

    const completeOrders = data.ordenes.filter(
        (item) => item.estado === 'Recibida'
    ).length;

    const columns = [
        {
            title: 'Código de recepción',
            dataIndex: 'id',
            key: 'id',
            width: 160,
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: 'Orden de compra',
            dataIndex: 'orderId',
            key: 'orderId',
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
            title: 'Cantidad recibida',
            dataIndex: 'cantidadRecibida',
            key: 'cantidadRecibida',
        },
        {
            title: 'Documento de referencia',
            dataIndex: 'documentoReferencia',
            key: 'documentoReferencia',
            render: (value) => value || '—',
        },
        {
            title: 'Observaciones',
            dataIndex: 'observaciones',
            key: 'observaciones',
            render: (value) => value || '—',
        },
    ];

    const orderColumns = [
        {
            title: 'Orden',
            dataIndex: 'id',
            key: 'id',
            render: (value) => <Text strong>{value}</Text>,
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
            title: 'Solicitado',
            dataIndex: 'cantidad',
            key: 'cantidad',
        },
        {
            title: 'Recibido',
            dataIndex: 'cantidadRecibida',
            key: 'cantidadRecibida',
            render: (value) => Number(value || 0),
        },
        {
            title: 'Pendiente',
            key: 'pendiente',
            render: (_, record) =>
                Math.max(
                    0,
                    Number(record.cantidad || 0) -
                    Number(record.cantidadRecibida || 0)
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
                    <Title level={3} style={{ marginBottom: 4, color: '#374151' }}>
                        Recepción de compras
                    </Title>

                    <Text type="secondary">
                        Registra la mercancía recibida y controla las cantidades pendientes.
                    </Text>
                </div>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreateModal}
                    style={{
                        background: '#2E86C1',
                        borderColor: '#2E86C1',
                        borderRadius: 7,
                    }}
                >
                    Registrar recepción
                </Button>
            </div>

            {/* Indicadores */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={8}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            borderLeft: '4px solid #2E86C1',
                            boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                        }}
                    >
                        <Statistic
                            title="Recepciones registradas"
                            value={(data.recepciones || []).length}
                            prefix={<InboxOutlined />}
                            valueStyle={{ color: '#2E86C1' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={8}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            borderLeft: '4px solid #D4A72C',
                            boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                        }}
                    >
                        <Statistic
                            title="Órdenes pendientes de recepción"
                            value={ordersPending}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#D4A72C' }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={8}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 10,
                            borderLeft: '4px solid #52A675',
                            boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                        }}
                    >
                        <Statistic
                            title="Unidades recibidas"
                            value={totalReceived}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52A675' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Órdenes pendientes */}
            <Card
                title="Órdenes con mercancía pendiente"
                bordered={false}
                style={{
                    borderRadius: 12,
                    marginBottom: 18,
                    boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                }}
            >
                <Table
                    columns={orderColumns}
                    dataSource={data.ordenes.filter((item) =>
                        ['Enviada', 'Parcial'].includes(item.estado)
                    )}
                    rowKey="id"
                    pagination={{
                        pageSize: 5,
                        showTotal: (total) => `${total} órdenes`,
                    }}
                    scroll={{ x: 900 }}
                    locale={{
                        emptyText: 'No hay órdenes pendientes de recepción.',
                    }}
                />
            </Card>

            {/* Historial de recepciones */}
            <Card
                title="Historial de recepciones"
                bordered={false}
                style={{
                    borderRadius: 12,
                    boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                }}
            >
                <Input
                    allowClear
                    prefix={<SearchOutlined style={{ color: '#2E86C1' }} />}
                    placeholder="Buscar por recepción, orden, proveedor o producto..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    style={{ maxWidth: 500, marginBottom: 18 }}
                />

                <Table
                    columns={columns}
                    dataSource={filteredReceptions}
                    rowKey="id"
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: true,
                        showTotal: (total) => `${total} recepciones`,
                    }}
                    scroll={{ x: 1100 }}
                    locale={{
                        emptyText: 'Todavía no hay recepciones registradas.',
                    }}
                />
            </Card>

            {/* Modal de recepción */}
            <Modal
                title="Registrar recepción de mercancía"
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText="Guardar recepción"
                cancelText="Cancelar"
                width={650}
                destroyOnHidden
                okButtonProps={{
                    style: {
                        background: '#2E86C1',
                        borderColor: '#2E86C1',
                    },
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 20 }}
                >
                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Fecha de recepción"
                                name="fecha"
                                rules={[
                                    { required: true, message: 'Selecciona la fecha.' },
                                ]}
                            >
                                <Input type="date" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Orden de compra"
                                name="orderId"
                                rules={[
                                    { required: true, message: 'Selecciona una orden.' },
                                ]}
                            >
                                <Select
                                    placeholder="Seleccionar orden"
                                    options={availableOrders.map((order) => {
                                        const pending =
                                            Number(order.cantidad || 0) -
                                            Number(order.cantidadRecibida || 0);

                                        return {
                                            value: order.id,
                                            label: `${order.id} - ${order.proveedor} (${pending} pendientes)`,
                                        };
                                    })}
                                />
                            </Form.Item>
                        </Col>

                        {selectedOrder && (
                            <>
                                <Col span={24}>
                                    <div
                                        style={{
                                            background: '#EAF5FC',
                                            border: '1px solid #D5EAF7',
                                            borderRadius: 8,
                                            padding: 14,
                                            marginBottom: 16,
                                        }}
                                    >
                                        <Text type="secondary">Información de la orden</Text>

                                        <Title level={5} style={{ margin: '4px 0' }}>
                                            {selectedOrder.producto}
                                        </Title>

                                        <Text>
                                            Proveedor: <strong>{selectedOrder.proveedor}</strong>
                                        </Text>

                                        <br />

                                        <Text>
                                            Cantidad solicitada: {selectedOrder.cantidad}
                                        </Text>

                                        <br />

                                        <Text>
                                            Cantidad ya recibida:{' '}
                                            {Number(selectedOrder.cantidadRecibida || 0)}
                                        </Text>

                                        <br />

                                        <Text>
                                            Cantidad pendiente:{' '}
                                            <strong style={{ color: '#2E86C1' }}>
                                                {remainingQuantity}
                                            </strong>
                                        </Text>
                                    </div>
                                </Col>

                                <Col span={24}>
                                    <Form.Item
                                        label="Cantidad recibida en esta entrega"
                                        name="cantidadRecibida"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Ingresa la cantidad recibida.',
                                            },
                                            {
                                                type: 'number',
                                                min: 0.01,
                                                message: 'La cantidad debe ser mayor que cero.',
                                            },
                                            {
                                                validator: (_, value) => {
                                                    if (
                                                        value == null ||
                                                        Number(value) <= remainingQuantity
                                                    ) {
                                                        return Promise.resolve();
                                                    }

                                                    return Promise.reject(
                                                        new Error(
                                                            `Solo quedan ${remainingQuantity} unidades pendientes.`
                                                        )
                                                    );
                                                },
                                            },
                                        ]}
                                    >
                                        <InputNumber
                                            min={0.01}
                                            max={remainingQuantity}
                                            precision={2}
                                            style={{ width: '100%' }}
                                            placeholder="Cantidad recibida"
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item
                                        label="Número de factura o documento de referencia"
                                        name="documentoReferencia"
                                    >
                                        <Input
                                            placeholder="Ej. FACT-001 / Remisión 002"
                                            maxLength={80}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col span={24}>
                                    <Form.Item
                                        label="Observaciones"
                                        name="observaciones"
                                    >
                                        <Input.TextArea
                                            rows={3}
                                            maxLength={500}
                                            showCount
                                            placeholder="Describe el estado de la mercancía recibida..."
                                        />
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}