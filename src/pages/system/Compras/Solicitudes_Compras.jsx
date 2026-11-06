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
    Table,
    Tag,
    Typography,
    message,
} from 'antd';

import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckOutlined,
    CloseOutlined,
    SearchOutlined,
} from '@ant-design/icons';

import {
    loadComprasData,
    saveComprasData,
    generateComprasId,
    getToday,
} from './comprasStorage';

const { Title, Text } = Typography;

const statusColors = {
    Pendiente: 'gold',
    Aprobada: 'green',
    Rechazada: 'red',
    'Orden generada': 'blue',
};

const priorityColors = {
    Baja: 'blue',
    Media: 'gold',
    Alta: 'red',
};

export default function Solicitudes_Compras() {
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
            prioridad: 'Media',
            unidad: 'Unidad',
            cantidad: 1,
        });

        setModalOpen(true);
    };

    const openEditModal = (record) => {
        setEditing(record);

        form.setFieldsValue({
            fecha: record.fecha,
            solicitante: record.solicitante,
            area: record.area,
            producto: record.producto,
            cantidad: record.cantidad,
            unidad: record.unidad,
            prioridad: record.prioridad,
            justificacion: record.justificacion,
        });

        setModalOpen(true);
    };

    const handleSubmit = (values) => {
        let newSolicitudes;

        if (editing) {
            newSolicitudes = data.solicitudes.map((item) =>
                item.id === editing.id
                    ? {
                        ...item,
                        ...values,
                    }
                    : item
            );

            message.success('Solicitud actualizada correctamente.');
        } else {
            const newSolicitud = {
                id: generateComprasId('SOL'),
                ...values,
                estado: 'Pendiente',
            };

            newSolicitudes = [newSolicitud, ...data.solicitudes];

            message.success('Solicitud registrada correctamente.');
        }

        updateData({
            ...data,
            solicitudes: newSolicitudes,
        });

        setModalOpen(false);
        form.resetFields();
        setEditing(null);
    };

    const changeStatus = (record, newStatus) => {
        const newSolicitudes = data.solicitudes.map((item) =>
            item.id === record.id
                ? { ...item, estado: newStatus }
                : item
        );

        updateData({
            ...data,
            solicitudes: newSolicitudes,
        });

        message.success(`Solicitud ${newStatus.toLowerCase()}.`);
    };

    const handleDelete = (record) => {
        const hasOrder = data.ordenes.some(
            (order) => order.solicitudId === record.id
        );

        if (hasOrder) {
            message.warning(
                'No puedes eliminar esta solicitud porque tiene una orden relacionada.'
            );
            return;
        }

        updateData({
            ...data,
            solicitudes: data.solicitudes.filter(
                (item) => item.id !== record.id
            ),
        });

        message.success('Solicitud eliminada correctamente.');
    };

    const filteredSolicitudes = useMemo(() => {
        return data.solicitudes.filter((item) => {
            const matchesStatus =
                filterStatus === 'Todos' || item.estado === filterStatus;

            const searchText = search.toLowerCase();

            const matchesSearch = [
                item.id,
                item.solicitante,
                item.area,
                item.producto,
            ].some((value) =>
                String(value || '').toLowerCase().includes(searchText)
            );

            return matchesStatus && matchesSearch;
        });
    }, [data.solicitudes, filterStatus, search]);

    const columns = [
        {
            title: 'Código',
            dataIndex: 'id',
            key: 'id',
            width: 130,
            render: (value) => <Text strong>{value}</Text>,
        },
        {
            title: 'Fecha',
            dataIndex: 'fecha',
            key: 'fecha',
            width: 110,
        },
        {
            title: 'Solicitante',
            dataIndex: 'solicitante',
            key: 'solicitante',
        },
        {
            title: 'Área',
            dataIndex: 'area',
            key: 'area',
        },
        {
            title: 'Producto o material',
            dataIndex: 'producto',
            key: 'producto',
        },
        {
            title: 'Cantidad',
            key: 'cantidad',
            render: (_, record) =>
                `${record.cantidad} ${record.unidad}`,
        },
        {
            title: 'Prioridad',
            dataIndex: 'prioridad',
            key: 'prioridad',
            render: (value) => (
                <Tag color={priorityColors[value] || 'default'}>
                    {value}
                </Tag>
            ),
        },
        {
            title: 'Estado',
            dataIndex: 'estado',
            key: 'estado',
            render: (value) => (
                <Tag color={statusColors[value] || 'default'}>
                    {value}
                </Tag>
            ),
        },
        {
            title: 'Acciones',
            key: 'acciones',
            width: 210,
            fixed: 'right',
            render: (_, record) => (
                <Space wrap>
                    {record.estado === 'Pendiente' && (
                        <>
                            <Button
                                type="text"
                                size="small"
                                title="Aprobar"
                                icon={<CheckOutlined style={{ color: '#389e0d' }} />}
                                onClick={() => changeStatus(record, 'Aprobada')}
                            />

                            <Button
                                type="text"
                                size="small"
                                title="Rechazar"
                                icon={<CloseOutlined style={{ color: '#cf1322' }} />}
                                onClick={() => changeStatus(record, 'Rechazada')}
                            />
                        </>
                    )}

                    <Button
                        type="text"
                        size="small"
                        title="Editar"
                        icon={<EditOutlined style={{ color: '#2E86C1' }} />}
                        disabled={record.estado === 'Orden generada'}
                        onClick={() => openEditModal(record)}
                    />

                    <Popconfirm
                        title="¿Eliminar solicitud?"
                        description="Esta acción no se puede deshacer."
                        onConfirm={() => handleDelete(record)}
                        okText="Eliminar"
                        cancelText="Cancelar"
                    >
                        <Button
                            type="text"
                            danger
                            size="small"
                            title="Eliminar"
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
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
                        Solicitudes de compra
                    </Title>

                    <Text type="secondary">
                        Gestiona las solicitudes internas de materiales y productos.
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
                    Nueva solicitud
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
                        <Text type="secondary">Total de solicitudes</Text>
                        <Title level={3} style={{ margin: '6px 0 0' }}>
                            {data.solicitudes.length}
                        </Title>
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
                        <Text type="secondary">Pendientes de aprobación</Text>
                        <Title level={3} style={{ margin: '6px 0 0', color: '#D4A72C' }}>
                            {
                                data.solicitudes.filter(
                                    (item) => item.estado === 'Pendiente'
                                ).length
                            }
                        </Title>
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
                        <Text type="secondary">Aprobadas</Text>
                        <Title level={3} style={{ margin: '6px 0 0', color: '#52A675' }}>
                            {
                                data.solicitudes.filter(
                                    (item) => item.estado === 'Aprobada'
                                ).length
                            }
                        </Title>
                    </Card>
                </Col>
            </Row>

            {/* Tabla */}
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
                            placeholder="Buscar por código, solicitante, área o producto..."
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
                                { label: 'Pendiente', value: 'Pendiente' },
                                { label: 'Aprobada', value: 'Aprobada' },
                                { label: 'Rechazada', value: 'Rechazada' },
                                { label: 'Orden generada', value: 'Orden generada' },
                            ]}
                        />
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={filteredSolicitudes}
                    rowKey="id"
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: true,
                        pageSizeOptions: ['8', '15', '30'],
                        showTotal: (total) => `${total} solicitudes`,
                    }}
                    scroll={{ x: 1100 }}
                    locale={{
                        emptyText: 'No se encontraron solicitudes.',
                    }}
                />
            </Card>

            {/* Modal de registro y edición */}
            <Modal
                title={editing ? 'Editar solicitud' : 'Nueva solicitud de compra'}
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    setEditing(null);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText={editing ? 'Guardar cambios' : 'Registrar solicitud'}
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
                                label="Fecha de solicitud"
                                name="fecha"
                                rules={[{ required: true, message: 'Ingresa la fecha.' }]}
                            >
                                <Input type="date" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Nombre del solicitante"
                                name="solicitante"
                                rules={[
                                    { required: true, message: 'Ingresa el solicitante.' },
                                ]}
                            >
                                <Input placeholder="Nombre completo" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Área solicitante"
                                name="area"
                                rules={[{ required: true, message: 'Selecciona un área.' }]}
                            >
                                <Select
                                    placeholder="Seleccionar área"
                                    options={[
                                        { label: 'Administración', value: 'Administración' },
                                        { label: 'Producción', value: 'Producción' },
                                        { label: 'Ventas', value: 'Ventas' },
                                        { label: 'Inventario', value: 'Inventario' },
                                        { label: 'Tecnología', value: 'Tecnología' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Prioridad"
                                name="prioridad"
                                rules={[{ required: true, message: 'Selecciona la prioridad.' }]}
                            >
                                <Select
                                    options={[
                                        { label: 'Baja', value: 'Baja' },
                                        { label: 'Media', value: 'Media' },
                                        { label: 'Alta', value: 'Alta' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Producto o material solicitado"
                                name="producto"
                                rules={[
                                    { required: true, message: 'Ingresa el producto o material.' },
                                ]}
                            >
                                <Input placeholder="Ej. Cuero natural" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Cantidad"
                                name="cantidad"
                                rules={[
                                    { required: true, message: 'Ingresa la cantidad.' },
                                    {
                                        type: 'number',
                                        min: 1,
                                        message: 'La cantidad debe ser mayor que cero.',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={1}
                                    precision={2}
                                    style={{ width: '100%' }}
                                    placeholder="Cantidad requerida"
                                />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                label="Unidad de medida"
                                name="unidad"
                                rules={[
                                    { required: true, message: 'Selecciona una unidad.' },
                                ]}
                            >
                                <Select
                                    options={[
                                        { label: 'Unidad', value: 'Unidad' },
                                        { label: 'Pares', value: 'Pares' },
                                        { label: 'Pies cuadrados', value: 'Pies cuadrados' },
                                        { label: 'Metros', value: 'Metros' },
                                        { label: 'Kilogramos', value: 'Kilogramos' },
                                        { label: 'Rollos', value: 'Rollos' },
                                        { label: 'Litros', value: 'Litros' },
                                    ]}
                                />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item
                                label="Justificación de la solicitud"
                                name="justificacion"
                                rules={[
                                    { required: true, message: 'Escribe una justificación.' },
                                ]}
                            >
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Describe por qué se necesita el producto..."
                                    maxLength={500}
                                    showCount
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}