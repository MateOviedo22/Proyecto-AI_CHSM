import { useEffect, useMemo, useState } from 'react';

import {
    Button,
    Card,
    Col,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
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
    PlusOutlined,
    EditOutlined,
    SearchOutlined,
    SendOutlined,
    StopOutlined,
    ShoppingCartOutlined,
} from '@ant-design/icons';

import {
    loadComprasData,
    saveComprasData,
    generateComprasId,
    getToday,
    formatCurrency,
} from './comprasStorage';

const { Title, Text } = Typography;

const STATUS_COLORS = {
    Borrador: 'default',
    Enviada: 'processing',
    Parcial: 'gold',
    Recibida: 'success',
    Cancelada: 'error',
};

export default function Ordenes_Compras() {
    const [data, setData] = useState(loadComprasData);
    const [form] = Form.useForm();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');

    useEffect(() => {
        const updateData = () => setData(loadComprasData());

        window.addEventListener('compras-data-updated', updateData);
        window.addEventListener('storage', updateData);

        return () => {
            window.removeEventListener('compras-data-updated', updateData);
            window.removeEventListener('storage', updateData);
        };
    }, []);

    const updateData = (newData) => {
        setData(newData);
        saveComprasData(newData);
    };

    const openCreateModal = () => {
        setEditing(null);
        form.resetFields();

        form.setFieldsValue({
            fecha: getToday(),
            fechaEntrega: getToday(),
            cantidad: 1,
            precioUnitario: 0,
        });

        setModalOpen(true);
    };

    const openEditModal = (record) => {
        if (record.estado !== 'Borrador') {
            message.warning('Solo puedes editar órdenes en estado Borrador.');
            return;
        }

        setEditing(record);

        form.setFieldsValue({
            solicitudId: record.solicitudId || undefined,
            proveedor: record.proveedor,
            fecha: record.fecha,
            fechaEntrega: record.fechaEntrega,
            producto: record.producto,
            cantidad: record.cantidad,
            precioUnitario: record.precioUnitario,
        });

        setModalOpen(true);
    };

    const handleSolicitudChange = (solicitudId) => {
        const solicitud = data.solicitudes.find(
            (item) => item.id === solicitudId
        );

        if (solicitud) {
            form.setFieldsValue({
                producto: solicitud.producto,
                cantidad: solicitud.cantidad,
            });
        }
    };

    const handleSubmit = (values) => {
        const cantidad = Number(values.cantidad || 0);
        const precioUnitario = Number(values.precioUnitario || 0);

        if (cantidad <= 0 || precioUnitario < 0) {
            message.error('Revisa la cantidad y el precio de la orden.');
            return;
        }

        const solicitudId = values.solicitudId || null;

        if (solicitudId) {
            const solicitud = data.solicitudes.find(
                (item) => item.id === solicitudId
            );

            if (!solicitud) {
                message.error('La solicitud seleccionada ya no existe.');
                return;
            }

            const solicitudYaTieneOrden = data.ordenes.some(
                (item) =>
                    item.solicitudId === solicitudId &&
                    item.id !== editing?.id &&
                    item.estado !== 'Cancelada'
            );

            if (solicitudYaTieneOrden) {
                message.error('Esta solicitud ya tiene una orden de compra.');
                return;
            }

            const esSolicitudActual =
                editing && editing.solicitudId === solicitudId;

            if (solicitud.estado !== 'Aprobada' && !esSolicitudActual) {
                message.error('Solo puedes utilizar solicitudes aprobadas.');
                return;
            }
        }

        const orderData = {
            ...values,
            solicitudId,
            cantidad,
            precioUnitario,
            total: cantidad * precioUnitario,
        };

        let newOrders = [...data.ordenes];
        let newSolicitudes = [...data.solicitudes];

        if (editing) {
            newOrders = newOrders.map((item) =>
                item.id === editing.id
                    ? {
                        ...item,
                        ...orderData,
                    }
                    : item
            );

            if (
                editing.solicitudId &&
                editing.solicitudId !== solicitudId
            ) {
                newSolicitudes = newSolicitudes.map((item) =>
                    item.id === editing.solicitudId &&
                        item.estado === 'Orden generada'
                        ? { ...item, estado: 'Aprobada' }
                        : item
                );
            }

            message.success('Orden actualizada correctamente.');
        } else {
            const newOrder = {
                id: generateComprasId('OC'),
                ...orderData,
                cantidadRecibida: 0,
                estado: 'Borrador',
            };

            newOrders = [newOrder, ...newOrders];

            message.success('Orden creada correctamente.');
        }

        if (solicitudId) {
            newSolicitudes = newSolicitudes.map((item) =>
                item.id === solicitudId
                    ? { ...item, estado: 'Orden generada' }
                    : item
            );
        }

        updateData({
            ...data,
            ordenes: newOrders,
            solicitudes: newSolicitudes,
        });

        setModalOpen(false);
        setEditing(null);
        form.resetFields();
    };

    const changeOrderStatus = (record, newStatus) => {
        if (newStatus === 'Enviada' && record.estado !== 'Borrador') {
            message.warning('Solo puedes enviar órdenes en estado Borrador.');
            return;
        }

        if (
            newStatus === 'Cancelada' &&
            !['Borrador', 'Enviada'].includes(record.estado)
        ) {
            message.warning(
                'No puedes cancelar una orden que ya tiene mercancía recibida.'
            );
            return;
        }

        const newOrders = data.ordenes.map((item) =>
            item.id === record.id
                ? { ...item, estado: newStatus }
                : item
        );

        let newSolicitudes = [...data.solicitudes];

        if (newStatus === 'Cancelada' && record.solicitudId) {
            newSolicitudes = newSolicitudes.map((item) =>
                item.id === record.solicitudId &&
                    item.estado === 'Orden generada'
                    ? { ...item, estado: 'Aprobada' }
                    : item
            );
        }

        updateData({
            ...data,
            ordenes: newOrders,
            solicitudes: newSolicitudes,
        });

        message.success(
            `Orden ${newStatus.toLowerCase()} correctamente.`
        );
    };

    const filteredOrders = useMemo(() => {
        return data.ordenes.filter((item) => {
            const matchesStatus =
                filterStatus === 'Todos' || item.estado === filterStatus;

            const searchText = search.toLowerCase();

            const matchesSearch = [
                item.id,
                item.proveedor,
                item.producto,
                item.solicitudId,
            ].some((value) =>
                String(value || '').toLowerCase().includes(searchText)
            );

            return matchesStatus && matchesSearch;
        });
    }, [data.ordenes, filterStatus, search]);

    const totalCompras = data.ordenes
        .filter((item) => item.estado !== 'Cancelada')
        .reduce((total, item) => total + Number(item.total || 0), 0);

    const pendientes = data.ordenes.filter(
        (item) => ['Borrador', 'Enviada', 'Parcial'].includes(item.estado)
    ).length;

    const recibidas = data.ordenes.filter(
        (item) => item.estado === 'Recibida'
    ).length;

    const columns = [
        {
            title: 'Código',
            dataIndex: 'id',
            key: 'id',
            width: 150,
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: 'Solicitud',
            dataIndex: 'solicitudId',
            key: 'solicitudId',
            render: (value) => value || 'Compra directa',
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
            render: (_, record) => (
                <span>
                    {Number(record.cantidadRecibida || 0)} / {record.cantidad}
                </span>
            ),
        },
        {
            title: 'Fecha de emisión',
            dataIndex: 'fecha',
            key: 'fecha',
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
        {
            title: 'Acciones',
            key: 'acciones',
            width: 160,
            fixed: 'right',
            render: (_, record) => (
                <Space wrap>
                    {record.estado === 'Borrador' && (
                        <>
                            <Button
                                type="text"
                                size="small"
                                title="Editar orden"
                                icon={<EditOutlined style={{ color: '#2E86C1' }} />}
                                onClick={() => openEditModal(record)}
                            />

                            <Button
                                type="text"
                                size="small"
                                title="Enviar al proveedor"
                                icon={<SendOutlined style={{ color: '#2E86C1' }} />}
                                onClick={() => changeOrderStatus(record, 'Enviada')}
                            />
                        </>
                    )}

                    {['Borrador', 'Enviada'].includes(record.estado) && (
                        <Popconfirm
                            title="¿Cancelar esta orden?"
                            description="La solicitud asociada volverá a estar aprobada."
                            onConfirm={() => changeOrderStatus(record, 'Cancelada')}
                            okText="Cancelar orden"
                            cancelText="Volver"
                        >
                            <Button
                                type="text"
                                danger
                                size="small"
                                title="Cancelar orden"
                                icon={<StopOutlined />}
                            />
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const solicitudesDisponibles = data.solicitudes.filter(
        (item) =>
            item.estado === 'Aprobada' ||
            (editing && item.id === editing.solicitudId)
    );

    return (
        <div style={{ padding: '8px 4px' }}>
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
                        Órdenes de compra
                    </Title>

                    <Text type="secondary">
                        Gestiona las órdenes generadas y su seguimiento con proveedores.
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
                    Nueva orden
                </Button>
            </div>

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
                            title="Total de órdenes"
                            value={data.ordenes.length}
                            prefix={<ShoppingCartOutlined />}
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
                            title="Órdenes en proceso"
                            value={pendientes}
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
                            title="Órdenes recibidas"
                            value={recibidas}
                            valueStyle={{ color: '#52A675' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card
                bordered={false}
                style={{
                    marginBottom: 20,
                    borderRadius: 10,
                    background: '#EAF5FC',
                    border: '1px solid #D5EAF7',
                }}
            >
                <Text type="secondary">Valor total de órdenes no canceladas</Text>

                <Title level={3} style={{ color: '#2E86C1', margin: '6px 0 0' }}>
                    {formatCurrency(totalCompras)}
                </Title>
            </Card>

            <Card
                bordered={false}
                style={{
                    borderRadius: 12,
                    boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                }}
            >
                <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
                    <Col xs={24} md={15}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined style={{ color: '#2E86C1' }} />}
                            placeholder="Buscar por código, proveedor o producto..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </Col>

                    <Col xs={24} md={9}>
                        <Select
                            style={{ width: '100%' }}
                            value={filterStatus}
                            onChange={setFilterStatus}
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
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredOrders}
                    rowKey="id"
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: true,
                        pageSizeOptions: ['8', '15', '30'],
                        showTotal: (total) => `${total} órdenes`,
                    }}
                    scroll={{ x: 1250 }}
                    locale={{
                        emptyText: 'No se encontraron órdenes de compra.',
                    }}
                />
            </Card>

            <Modal
                title={editing ? 'Editar orden de compra' : 'Nueva orden de compra'}
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    setEditing(null);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText={editing ? 'Guardar cambios' : 'Crear orden'}
                cancelText="Cancelar"
                width={700}
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
                        <Col span={24}>
                            <Form.Item
                                label="Solicitud aprobada relacionada"
                                name="solicitudId"
                            >
                                <Select
                                    allowClear
                                    placeholder="Seleccionar solicitud (opcional)"
                                    onChange={handleSolicitudChange}
                                    options={solicitudesDisponibles.map((item) => ({
                                        value: item.id,
                                        label: `${item.id} - ${item.producto} (${item.cantidad} ${item.unidad})`,
                                    }))}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Proveedor"
                                name="proveedor"
                                rules={[
                                    { required: true, message: 'Ingresa el proveedor.' },
                                ]}
                            >
                                <Input placeholder="Nombre del proveedor" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Fecha de emisión"
                                name="fecha"
                                rules={[
                                    { required: true, message: 'Ingresa la fecha de emisión.' },
                                ]}
                            >
                                <Input type="date" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Fecha estimada de entrega"
                                name="fechaEntrega"
                                rules={[
                                    { required: true, message: 'Ingresa la fecha de entrega.' },
                                ]}
                            >
                                <Input type="date" />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Producto o material"
                                name="producto"
                                rules={[
                                    { required: true, message: 'Ingresa el producto.' },
                                ]}
                            >
                                <Input placeholder="Producto solicitado" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Cantidad solicitada"
                                name="cantidad"
                                rules={[
                                    { required: true, message: 'Ingresa la cantidad.' },
                                    {
                                        type: 'number',
                                        min: 0.01,
                                        message: 'La cantidad debe ser mayor que cero.',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={0.01}
                                    precision={2}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Precio unitario (C$)"
                                name="precioUnitario"
                                rules={[
                                    { required: true, message: 'Ingresa el precio unitario.' },
                                    {
                                        type: 'number',
                                        min: 0,
                                        message: 'El precio no puede ser negativo.',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={0}
                                    precision={2}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                noStyle
                                shouldUpdate={(previous, current) =>
                                    previous.cantidad !== current.cantidad ||
                                    previous.precioUnitario !== current.precioUnitario
                                }
                            >
                                {({ getFieldValue }) => {
                                    const cantidad = Number(getFieldValue('cantidad') || 0);
                                    const precio = Number(
                                        getFieldValue('precioUnitario') || 0
                                    );

                                    return (
                                        <div
                                            style={{
                                                background: '#EAF5FC',
                                                border: '1px solid #D5EAF7',
                                                borderRadius: 8,
                                                padding: 14,
                                                textAlign: 'right',
                                            }}
                                        >
                                            <Text type="secondary">Total estimado</Text>

                                            <Title
                                                level={4}
                                                style={{ color: '#2E86C1', margin: '4px 0 0' }}
                                            >
                                                {formatCurrency(cantidad * precio)}
                                            </Title>
                                        </div>
                                    );
                                }}
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}