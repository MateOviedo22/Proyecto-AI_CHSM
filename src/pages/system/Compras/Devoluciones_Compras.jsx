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
    DeleteOutlined,
    SearchOutlined,
    SendOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    RollbackOutlined,
} from '@ant-design/icons';

import {
    loadComprasData,
    saveComprasData,
    generateComprasId,
    getToday,
    formatCurrency,
} from './comprasStorage';

const { Title, Text } = Typography;

// Colores para los estados de las devoluciones.
const STATUS_COLORS = {
    Pendiente: 'gold',
    Enviada: 'processing',
    Aceptada: 'success',
    Rechazada: 'error',
};

/*
|--------------------------------------------------------------------------
| Calcular cantidad disponible para devolución
|--------------------------------------------------------------------------
|
| Se toma como referencia la cantidad realmente recibida,
| no la cantidad originalmente solicitada.
|
| Las devoluciones pendientes, enviadas y aceptadas reservan
| unidades. Las rechazadas liberan esas unidades.
|
*/

const getAvailableQuantity = (
    order,
    devoluciones = [],
    excludeId = null
) => {
    if (!order) return 0;

    const cantidadRecibida = Number(
        order.cantidadRecibida ??
        (order.estado === 'Recibida' ? order.cantidad : 0)
    );

    const cantidadDevuelta = devoluciones
        .filter(
            (item) =>
                item.orderId === order.id &&
                item.id !== excludeId &&
                item.estado !== 'Rechazada'
        )
        .reduce(
            (total, item) =>
                total + Number(item.cantidad || 0),
            0
        );

    return Math.max(
        0,
        cantidadRecibida - cantidadDevuelta
    );
};


export default function Devoluciones_Compras() {

    const [data, setData] = useState(loadComprasData);

    const [form] = Form.useForm();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');

    // Detecta la orden seleccionada en el formulario.
    const selectedOrderId = Form.useWatch('orderId', form);


    /*
    |--------------------------------------------------------------------------
    | Actualización de información
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const updateData = () => {
            setData(loadComprasData());
        };

        window.addEventListener(
            'compras-data-updated',
            updateData
        );

        window.addEventListener(
            'storage',
            updateData
        );

        return () => {
            window.removeEventListener(
                'compras-data-updated',
                updateData
            );

            window.removeEventListener(
                'storage',
                updateData
            );
        };

    }, []);


    const updateData = (newData) => {

        setData(newData);

        saveComprasData(newData);

    };


    /*
    |--------------------------------------------------------------------------
    | Órdenes disponibles
    |--------------------------------------------------------------------------
    */

    const availableOrders = useMemo(() => {

        const returns = data.devoluciones || [];

        return data.ordenes.filter((order) => {

            // Solo se admiten órdenes que tengan mercancía recibida.
            if (
                !['Parcial', 'Recibida'].includes(order.estado)
            ) {
                return false;
            }

            const available = getAvailableQuantity(
                order,
                returns,
                editing?.id
            );

            return (
                available > 0 ||
                (editing && editing.orderId === order.id)
            );

        });

    }, [
        data.ordenes,
        data.devoluciones,
        editing,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Orden seleccionada
    |--------------------------------------------------------------------------
    */

    const selectedOrder = data.ordenes.find(
        (order) => order.id === selectedOrderId
    );

    const availableQuantity = selectedOrder
        ? getAvailableQuantity(
            selectedOrder,
            data.devoluciones || [],
            editing?.id
        )
        : 0;


    /*
    |--------------------------------------------------------------------------
    | Abrir formulario de creación
    |--------------------------------------------------------------------------
    */

    const openCreateModal = () => {

        const ordersWithAvailableQuantity = data.ordenes.filter(
            (order) => {

                return (
                    ['Parcial', 'Recibida'].includes(order.estado) &&
                    getAvailableQuantity(
                        order,
                        data.devoluciones || []
                    ) > 0
                );

            }
        );

        if (ordersWithAvailableQuantity.length === 0) {

            message.info(
                'No hay órdenes con cantidades recibidas disponibles para devolución.'
            );

            return;
        }

        setEditing(null);

        form.resetFields();

        form.setFieldsValue({
            fecha: getToday(),
            cantidad: 1,
        });

        setModalOpen(true);

    };


    /*
    |--------------------------------------------------------------------------
    | Abrir formulario de edición
    |--------------------------------------------------------------------------
    */

    const openEditModal = (record) => {

        if (record.estado !== 'Pendiente') {

            message.warning(
                'Solo puedes editar devoluciones pendientes.'
            );

            return;
        }

        setEditing(record);

        form.resetFields();

        form.setFieldsValue({
            orderId: record.orderId,
            fecha: record.fecha,
            cantidad: record.cantidad,
            motivo: record.motivo,
            observaciones: record.observaciones,
        });

        setModalOpen(true);

    };


    /*
    |--------------------------------------------------------------------------
    | CAMBIAR ORDEN SELECCIONADA
    |--------------------------------------------------------------------------
    |
    | Esta función corrige el error:
    | ReferenceError: handleOrderChange is not defined
    |
    */

    const handleOrderChange = (orderId) => {

        const order = data.ordenes.find(
            (item) => item.id === orderId
        );

        if (!order) {

            form.setFieldsValue({
                cantidad: undefined,
            });

            return;
        }

        const available = getAvailableQuantity(
            order,
            data.devoluciones || [],
            editing?.id
        );

        form.setFieldsValue({
            cantidad: available > 0
                ? Math.min(1, available)
                : undefined,
        });

    };


    /*
    |--------------------------------------------------------------------------
    | Registrar o actualizar devolución
    |--------------------------------------------------------------------------
    */

    const handleSubmit = (values) => {

        // Recuperar la información más reciente.
        const latestData = loadComprasData();

        const latestReturns = latestData.devoluciones || [];

        const order = latestData.ordenes.find(
            (item) => item.id === values.orderId
        );

        if (
            !order ||
            !['Parcial', 'Recibida'].includes(order.estado)
        ) {

            message.error(
                'La devolución debe estar asociada a una orden con mercancía recibida.'
            );

            return;
        }

        // Validar cantidad disponible.
        const available = getAvailableQuantity(
            order,
            latestReturns,
            editing?.id
        );

        const quantity = Number(values.cantidad || 0);

        if (quantity <= 0 || quantity > available) {

            message.error(
                `La cantidad debe ser mayor que cero y no superar las ${available} unidades disponibles.`
            );

            return;
        }

        // Información de la devolución.
        const newReturnData = {

            ...values,

            proveedor: order.proveedor,

            producto: order.producto,

            precioUnitario: Number(
                order.precioUnitario || 0
            ),

            cantidad: quantity,

            total:
                quantity *
                Number(order.precioUnitario || 0),

        };

        let newReturns;

        if (editing) {

            newReturns = latestReturns.map((item) =>

                item.id === editing.id
                    ? {
                        ...item,
                        ...newReturnData,
                    }
                    : item

            );

            message.success(
                'Devolución actualizada correctamente.'
            );

        } else {

            const newReturn = {

                id: generateComprasId('DEV'),

                ...newReturnData,

                estado: 'Pendiente',

            };

            newReturns = [
                newReturn,
                ...latestReturns,
            ];

            message.success(
                'Devolución registrada correctamente.'
            );

        }

        const newData = {
            ...latestData,
            devoluciones: newReturns,
        };

        updateData(newData);

        setModalOpen(false);

        setEditing(null);

        form.resetFields();

    };


    /*
    |--------------------------------------------------------------------------
    | Cambiar estado de devolución
    |--------------------------------------------------------------------------
    */

    const changeStatus = (record, newStatus) => {

        const latestData = loadComprasData();

        const latestReturns = latestData.devoluciones || [];

        const currentReturn = latestReturns.find(
            (item) => item.id === record.id
        );

        if (!currentReturn) {

            message.error(
                'No se encontró la devolución seleccionada.'
            );

            return;
        }

        if (currentReturn.estado !== 'Enviada') {

            message.warning(
                'Solo puedes aceptar o rechazar devoluciones enviadas.'
            );

            return;
        }

        const newReturns = latestReturns.map((item) =>

            item.id === record.id
                ? {
                    ...item,
                    estado: newStatus,
                }
                : item

        );

        updateData({
            ...latestData,
            devoluciones: newReturns,
        });

        message.success(
            `Devolución marcada como ${newStatus.toLowerCase()}.`
        );

    };


    /*
    |--------------------------------------------------------------------------
    | Eliminar devolución
    |--------------------------------------------------------------------------
    */

    const deleteReturn = (record) => {

        const latestData = loadComprasData();

        const latestReturns = latestData.devoluciones || [];

        const currentReturn = latestReturns.find(
            (item) => item.id === record.id
        );

        if (!currentReturn) {

            message.error(
                'No se encontró la devolución.'
            );

            return;
        }

        if (currentReturn.estado !== 'Pendiente') {

            message.warning(
                'Solo puedes eliminar devoluciones pendientes.'
            );

            return;
        }

        const newReturns = latestReturns.filter(
            (item) => item.id !== record.id
        );

        updateData({
            ...latestData,
            devoluciones: newReturns,
        });

        message.success(
            'Devolución eliminada correctamente.'
        );

    };


    /*
    |--------------------------------------------------------------------------
    | Búsqueda y filtros
    |--------------------------------------------------------------------------
    */

    const filteredReturns = useMemo(() => {

        const returns = data.devoluciones || [];

        return returns.filter((item) => {

            const matchesStatus =
                filterStatus === 'Todos' ||
                item.estado === filterStatus;

            const searchText = search.toLowerCase();

            const matchesSearch = [

                item.id,
                item.orderId,
                item.proveedor,
                item.producto,
                item.motivo,

            ].some((value) =>

                String(value || '')
                    .toLowerCase()
                    .includes(searchText)

            );

            return matchesStatus && matchesSearch;

        });

    }, [
        data.devoluciones,
        filterStatus,
        search,
    ]);


    /*
    |--------------------------------------------------------------------------
    | Indicadores
    |--------------------------------------------------------------------------
    */

    const devoluciones = data.devoluciones || [];

    const totalDevoluciones = devoluciones
        .filter((item) => item.estado !== 'Rechazada')
        .reduce(
            (total, item) =>
                total + Number(item.total || 0),
            0
        );

    const pendientes = devoluciones.filter(
        (item) => item.estado === 'Pendiente'
    ).length;

    const enviadas = devoluciones.filter(
        (item) => item.estado === 'Enviada'
    ).length;

    const aceptadas = devoluciones.filter(
        (item) => item.estado === 'Aceptada'
    ).length;

    const rechazadas = devoluciones.filter(
        (item) => item.estado === 'Rechazada'
    ).length;


    /*
    |--------------------------------------------------------------------------
    | Columnas de la tabla
    |--------------------------------------------------------------------------
    */

    const columns = [

        {
            title: 'Código',
            dataIndex: 'id',
            key: 'id',
            width: 150,

            render: (value) => (
                <Text strong>{value}</Text>
            ),
        },

        {
            title: 'Orden de compra',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 145,
        },

        {
            title: 'Fecha',
            dataIndex: 'fecha',
            key: 'fecha',
            width: 110,
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
            dataIndex: 'cantidad',
            key: 'cantidad',
        },

        {
            title: 'Motivo',
            dataIndex: 'motivo',
            key: 'motivo',
        },

        {
            title: 'Valor',
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
            fixed: 'right',
            width: 190,

            render: (_, record) => (

                <Space wrap>

                    {record.estado === 'Pendiente' && (

                        <>

                            <Button
                                type="text"
                                size="small"
                                title="Editar"
                                icon={
                                    <EditOutlined
                                        style={{ color: '#2E86C1' }}
                                    />
                                }
                                onClick={() => openEditModal(record)}
                            />

                            <Button
                                type="text"
                                size="small"
                                title="Enviar al proveedor"
                                icon={
                                    <SendOutlined
                                        style={{ color: '#2E86C1' }}
                                    />
                                }
                                onClick={() =>
                                    changeStatus(record, 'Enviada')
                                }
                            />

                            <Popconfirm
                                title="¿Eliminar devolución?"
                                description="Esta acción no se puede deshacer."
                                onConfirm={() => deleteReturn(record)}
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

                        </>

                    )}

                    {record.estado === 'Enviada' && (

                        <>

                            <Popconfirm
                                title="¿Confirmar devolución?"
                                description="El proveedor ha aceptado la devolución."
                                onConfirm={() =>
                                    changeStatus(record, 'Aceptada')
                                }
                                okText="Confirmar"
                                cancelText="Volver"
                            >

                                <Button
                                    type="text"
                                    size="small"
                                    title="Aceptar devolución"
                                    icon={
                                        <CheckCircleOutlined
                                            style={{ color: '#389e0d' }}
                                        />
                                    }
                                />

                            </Popconfirm>

                            <Popconfirm
                                title="¿Rechazar devolución?"
                                description="Las unidades quedarán disponibles nuevamente."
                                onConfirm={() =>
                                    changeStatus(record, 'Rechazada')
                                }
                                okText="Rechazar"
                                cancelText="Volver"
                            >

                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    title="Rechazar devolución"
                                    icon={<CloseCircleOutlined />}
                                />

                            </Popconfirm>

                        </>

                    )}

                </Space>

            ),
        },

    ];


    /*
    |--------------------------------------------------------------------------
    | Interfaz
    |--------------------------------------------------------------------------
    */

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

                    <Title
                        level={3}
                        style={{
                            marginBottom: 4,
                            color: '#374151',
                        }}
                    >
                        Devoluciones de compras
                    </Title>

                    <Text type="secondary">
                        Registra y da seguimiento a las devoluciones realizadas a proveedores.
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
                    Nueva devolución
                </Button>

            </div>


            {/* Indicadores principales */}

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>

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
                            title="Total de devoluciones"
                            value={devoluciones.length}
                            prefix={<RollbackOutlined />}
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
                            title="Pendientes"
                            value={pendientes}
                            valueStyle={{ color: '#D4A72C' }}
                        />

                    </Card>

                </Col>


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
                            title="Enviadas al proveedor"
                            value={enviadas}
                            valueStyle={{ color: '#2E86C1' }}
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
                            title="Aceptadas"
                            value={aceptadas}
                            valueStyle={{ color: '#52A675' }}
                        />

                    </Card>

                </Col>

            </Row>


            {/* Valor de devoluciones */}

            <Card
                bordered={false}
                style={{
                    marginBottom: 20,
                    borderRadius: 10,
                    background: '#EAF5FC',
                    border: '1px solid #D5EAF7',
                }}
            >

                <Text type="secondary">
                    Valor de devoluciones no rechazadas
                </Text>

                <Title
                    level={3}
                    style={{
                        color: '#2E86C1',
                        margin: '6px 0 0',
                    }}
                >
                    {formatCurrency(totalDevoluciones)}
                </Title>

            </Card>


            {/* Tabla de devoluciones */}

            <Card
                bordered={false}
                style={{
                    borderRadius: 12,
                    boxShadow: '0 3px 12px rgba(46,134,193,0.06)',
                }}
            >

                <Row
                    gutter={[12, 12]}
                    style={{ marginBottom: 18 }}
                >

                    <Col xs={24} md={15}>

                        <Input
                            allowClear
                            prefix={
                                <SearchOutlined
                                    style={{ color: '#2E86C1' }}
                                />
                            }
                            placeholder="Buscar por código, orden, proveedor o producto..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />

                    </Col>


                    <Col xs={24} md={9}>

                        <Select
                            style={{ width: '100%' }}
                            value={filterStatus}
                            onChange={setFilterStatus}
                            options={[
                                {
                                    label: 'Todos los estados',
                                    value: 'Todos',
                                },
                                {
                                    label: 'Pendiente',
                                    value: 'Pendiente',
                                },
                                {
                                    label: 'Enviada',
                                    value: 'Enviada',
                                },
                                {
                                    label: 'Aceptada',
                                    value: 'Aceptada',
                                },
                                {
                                    label: 'Rechazada',
                                    value: 'Rechazada',
                                },
                            ]}
                        />

                    </Col>

                </Row>


                <Table
                    columns={columns}
                    dataSource={filteredReturns}
                    rowKey="id"
                    pagination={{
                        pageSize: 8,
                        showSizeChanger: true,
                        pageSizeOptions: ['8', '15', '30'],
                        showTotal: (total) =>
                            `${total} devoluciones`,
                    }}
                    scroll={{ x: 1300 }}
                    locale={{
                        emptyText: 'No se encontraron devoluciones.',
                    }}
                />

            </Card>


            {/* Modal de creación y edición */}

            <Modal
                title={
                    editing
                        ? 'Editar devolución'
                        : 'Registrar devolución de compra'
                }
                open={modalOpen}
                onCancel={() => {

                    setModalOpen(false);

                    setEditing(null);

                    form.resetFields();

                }}
                onOk={() => form.submit()}
                okText={
                    editing
                        ? 'Guardar cambios'
                        : 'Registrar devolución'
                }
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

                        {/* Fecha */}

                        <Col xs={24} md={12}>

                            <Form.Item
                                label="Fecha de devolución"
                                name="fecha"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Selecciona la fecha.',
                                    },
                                ]}
                            >

                                <Input type="date" />

                            </Form.Item>

                        </Col>


                        {/* Orden de compra */}

                        <Col xs={24} md={12}>

                            <Form.Item
                                label="Orden de compra recibida"
                                name="orderId"
                                rules={[
                                    {
                                        required: true,
                                        message: 'Selecciona una orden de compra.',
                                    },
                                ]}
                            >

                                <Select
                                    placeholder="Seleccionar orden"
                                    onChange={handleOrderChange}
                                    disabled={Boolean(editing)}
                                    options={availableOrders.map((order) => ({

                                        value: order.id,

                                        label: `${order.id} - ${order.proveedor} - ${order.producto}`,

                                    }))}
                                />

                            </Form.Item>

                        </Col>


                        {/* Información de la orden */}

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

                                        <Text type="secondary">
                                            Producto de la orden
                                        </Text>

                                        <Title
                                            level={5}
                                            style={{ margin: '4px 0' }}
                                        >
                                            {selectedOrder.producto}
                                        </Title>


                                        <Text>
                                            Proveedor:{' '}
                                            <strong>
                                                {selectedOrder.proveedor}
                                            </strong>
                                        </Text>

                                        <br />

                                        <Text>
                                            Cantidad solicitada:{' '}
                                            {selectedOrder.cantidad}
                                        </Text>

                                        <br />

                                        <Text>
                                            Cantidad recibida:{' '}
                                            <strong>
                                                {Number(
                                                    selectedOrder.cantidadRecibida ??
                                                    (
                                                        selectedOrder.estado === 'Recibida'
                                                            ? selectedOrder.cantidad
                                                            : 0
                                                    )
                                                )}
                                            </strong>
                                        </Text>

                                        <br />

                                        <Text>
                                            Cantidad disponible para devolución:{' '}
                                            <strong style={{ color: '#2E86C1' }}>
                                                {availableQuantity}
                                            </strong>
                                        </Text>

                                    </div>

                                </Col>


                                {/* Cantidad */}

                                <Col xs={24} md={12}>

                                    <Form.Item
                                        label="Cantidad a devolver"
                                        name="cantidad"
                                        rules={[

                                            {
                                                required: true,
                                                message: 'Ingresa la cantidad.',
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
                                                        Number(value) <= availableQuantity
                                                    ) {
                                                        return Promise.resolve();
                                                    }

                                                    return Promise.reject(
                                                        new Error(
                                                            `Solo hay ${availableQuantity} unidades disponibles.`
                                                        )
                                                    );

                                                },
                                            },

                                        ]}
                                    >

                                        <InputNumber
                                            min={0.01}
                                            max={availableQuantity}
                                            precision={2}
                                            style={{ width: '100%' }}
                                            placeholder="Cantidad"
                                        />

                                    </Form.Item>

                                </Col>


                                {/* Precio unitario */}

                                <Col xs={24} md={12}>

                                    <Form.Item label="Precio unitario">

                                        <Input
                                            disabled
                                            value={formatCurrency(
                                                selectedOrder.precioUnitario
                                            )}
                                        />

                                    </Form.Item>

                                </Col>


                                {/* Motivo */}

                                <Col span={24}>

                                    <Form.Item
                                        label="Motivo de devolución"
                                        name="motivo"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Selecciona el motivo.',
                                            },
                                        ]}
                                    >

                                        <Select
                                            placeholder="Seleccionar motivo"
                                            options={[
                                                {
                                                    label: 'Producto defectuoso',
                                                    value: 'Producto defectuoso',
                                                },
                                                {
                                                    label: 'Producto dañado durante el transporte',
                                                    value: 'Producto dañado durante el transporte',
                                                },
                                                {
                                                    label: 'Cantidad incorrecta',
                                                    value: 'Cantidad incorrecta',
                                                },
                                                {
                                                    label: 'Producto equivocado',
                                                    value: 'Producto equivocado',
                                                },
                                                {
                                                    label: 'Producto diferente al solicitado',
                                                    value: 'Producto diferente al solicitado',
                                                },
                                                {
                                                    label: 'Otro',
                                                    value: 'Otro',
                                                },
                                            ]}
                                        />

                                    </Form.Item>

                                </Col>


                                {/* Observaciones */}

                                <Col span={24}>

                                    <Form.Item
                                        label="Observaciones"
                                        name="observaciones"
                                    >

                                        <Input.TextArea
                                            rows={3}
                                            maxLength={500}
                                            showCount
                                            placeholder="Describe los detalles de la devolución..."
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