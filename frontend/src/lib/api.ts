const API_BASE_URL = 'http://localhost:3001/api';

// Productos
export const getProductos = async () => {
    const response = await fetch(`${API_BASE_URL}/productos`);
    if (!response.ok) {
        throw new Error('Error al obtener productos');
    }
    return response.json();
};

export const getProductoById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener producto');
    }
    return response.json();
};

export const createProducto = async (producto) => {
    const response = await fetch(`${API_BASE_URL}/productos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(producto),
    });
    if (!response.ok) {
        throw new Error('Error al crear producto');
    }
    return response.json();
};

export const updateProducto = async (id, producto) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(producto),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar producto');
    }
    return response.json();
};

export const deleteProducto = async (id) => {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar producto');
    }
    return response.json();
};

// Categorias_Producto
export const getCategoriasProducto = async () => {
    const response = await fetch(`${API_BASE_URL}/categorias-producto`);
    if (!response.ok) {
        throw new Error('Error al obtener categorías de producto');
    }
    return response.json();
};

export const getCategoriaProductoById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/categorias-producto/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener categoría de producto');
    }
    return response.json();
};

export const createCategoriaProducto = async (categoria) => {
    const response = await fetch(`${API_BASE_URL}/categorias-producto`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoria),
    });
    if (!response.ok) {
        throw new Error('Error al crear categoría de producto');
    }
    return response.json();
};

export const updateCategoriaProducto = async (id, categoria) => {
    const response = await fetch(`${API_BASE_URL}/categorias-producto/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoria),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar categoría de producto');
    }
    return response.json();
};

export const deleteCategoriaProducto = async (id) => {
    const response = await fetch(`${API_BASE_URL}/categorias-producto/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar categoría de producto');
    }
    return response.json();
};

// Pedidos
export const getPedidos = async () => {
    const response = await fetch(`${API_BASE_URL}/pedidos`);
    if (!response.ok) {
        throw new Error('Error al obtener pedidos');
    }
    return response.json();
};

export const getPedidoById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener pedido');
    }
    return response.json();
};

export const createPedido = async (pedido) => {
    const response = await fetch(`${API_BASE_URL}/pedidos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(pedido),
    });
    if (!response.ok) {
        throw new Error('Error al crear pedido');
    }
    return response.json();
};

export const updatePedido = async (id, pedido) => {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(pedido),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar pedido');
    }
    return response.json();
};

export const deletePedido = async (id) => {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar pedido');
    }
    return response.json();
};

// Detalles_Pedidos
export const getDetallesPedidos = async () => {
    const response = await fetch(`${API_BASE_URL}/detalles-pedidos`);
    if (!response.ok) {
        throw new Error('Error al obtener detalles de pedidos');
    }
    return response.json();
};

export const getDetallePedidoById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/detalles-pedidos/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener detalle de pedido');
    }
    return response.json();
};

export const createDetallePedido = async (detalle) => {
    const response = await fetch(`${API_BASE_URL}/detalles-pedidos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(detalle),
    });
    if (!response.ok) {
        throw new Error('Error al crear detalle de pedido');
    }
    return response.json();
};

export const updateDetallePedido = async (id, detalle) => {
    const response = await fetch(`${API_BASE_URL}/detalles-pedidos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(detalle),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar detalle de pedido');
    }
    return response.json();
};

export const deleteDetallePedido = async (id) => {
    const response = await fetch(`${API_BASE_URL}/detalles-pedidos/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar detalle de pedido');
    }
    return response.json();
};

// Clientes
export const getClientes = async () => {
    const response = await fetch(`${API_BASE_URL}/clientes`);
    if (!response.ok) {
        throw new Error('Error al obtener clientes');
    }
    return response.json();
};

export const getClienteById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener cliente');
    }
    return response.json();
};

export const createCliente = async (cliente) => {
    const response = await fetch(`${API_BASE_URL}/clientes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cliente),
    });
    if (!response.ok) {
        throw new Error('Error al crear cliente');
    }
    return response.json();
};

export const updateCliente = async (id, cliente) => {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(cliente),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar cliente');
    }
    return response.json();
};

export const deleteCliente = async (id) => {
    const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar cliente');
    }
    return response.json();
};

// Mesas
export const getMesas = async () => {
    const response = await fetch(`${API_BASE_URL}/mesas`);
    if (!response.ok) {
        throw new Error('Error al obtener mesas');
    }
    return response.json();
};

export const getMesaById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/mesas/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener mesa');
    }
    return response.json();
};

export const createMesa = async (mesa) => {
    const response = await fetch(`${API_BASE_URL}/mesas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(mesa),
    });
    if (!response.ok) {
        throw new Error('Error al crear mesa');
    }
    return response.json();
};

export const updateMesa = async (id, mesa) => {
    const response = await fetch(`${API_BASE_URL}/mesas/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(mesa),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar mesa');
    }
    return response.json();
};

export const deleteMesa = async (id) => {
    const response = await fetch(`${API_BASE_URL}/mesas/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar mesa');
    }
    return response.json();
};

// Empleados
export const getEmpleados = async () => {
    const response = await fetch(`${API_BASE_URL}/empleados`);
    if (!response.ok) {
        throw new Error('Error al obtener empleados');
    }
    return response.json();
};

export const getEmpleadoById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener empleado');
    }
    return response.json();
};

export const createEmpleado = async (empleado) => {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(empleado),
    });
    if (!response.ok) {
        throw new Error('Error al crear empleado');
    }
    return response.json();
};

export const updateEmpleado = async (id, empleado) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(empleado),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar empleado');
    }
    return response.json();
};

export const deleteEmpleado = async (id) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar empleado');
    }
    return response.json();
};

// Roles
export const getRoles = async () => {
    const response = await fetch(`${API_BASE_URL}/roles`);
    if (!response.ok) {
        throw new Error('Error al obtener roles');
    }
    return response.json();
};

export const getRolById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener rol');
    }
    return response.json();
};

export const createRol = async (rol) => {
    const response = await fetch(`${API_BASE_URL}/roles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(rol),
    });
    if (!response.ok) {
        throw new Error('Error al crear rol');
    }
    return response.json();
};

export const updateRol = async (id, rol) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(rol),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar rol');
    }
    return response.json();
};

export const deleteRol = async (id) => {
    const response = await fetch(`${API_BASE_URL}/roles/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar rol');
    }
    return response.json();
};

// Reservas
export const getReservas = async () => {
    const response = await fetch(`${API_BASE_URL}/reservas`);
    if (!response.ok) {
        throw new Error('Error al obtener reservas');
    }
    return response.json();
};

export const getReservaById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/reservas/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener reserva');
    }
    return response.json();
};

export const createReserva = async (reserva) => {
    const response = await fetch(`${API_BASE_URL}/reservas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reserva),
    });
    if (!response.ok) {
        throw new Error('Error al crear reserva');
    }
    return response.json();
};

export const updateReserva = async (id, reserva) => {
    const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reserva),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar reserva');
    }
    return response.json();
};

export const deleteReserva = async (id) => {
    const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar reserva');
    }
    return response.json();
};

// Pagos
export const getPagos = async () => {
    const response = await fetch(`${API_BASE_URL}/pagos`);
    if (!response.ok) {
        throw new Error('Error al obtener pagos');
    }
    return response.json();
};

export const getPagoById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/pagos/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener pago');
    }
    return response.json();
};

export const createPago = async (pago) => {
    const response = await fetch(`${API_BASE_URL}/pagos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(pago),
    });
    if (!response.ok) {
        throw new Error('Error al crear pago');
    }
    return response.json();
};

export const updatePago = async (id, pago) => {
    const response = await fetch(`${API_BASE_URL}/pagos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(pago),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar pago');
    }
    return response.json();
};

export const deletePago = async (id) => {
    const response = await fetch(`${API_BASE_URL}/pagos/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar pago');
    }
    return response.json();
};

// Metodos_Pago
export const getMetodosPago = async () => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago`);
    if (!response.ok) {
        throw new Error('Error al obtener métodos de pago');
    }
    return response.json();
};

export const getMetodoPagoById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago/${id}`);
    if (!response.ok) {
        throw new Error('Error al obtener método de pago');
    }
    return response.json();
};

export const createMetodoPago = async (metodoPago) => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(metodoPago),
    });
    if (!response.ok) {
        throw new Error('Error al crear método de pago');
    }
    return response.json();
};

export const updateMetodoPago = async (id, metodoPago) => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(metodoPago),
    });
    if (!response.ok) {
        throw new Error('Error al actualizar método de pago');
    }
    return response.json();
};

export const deleteMetodoPago = async (id) => {
    const response = await fetch(`${API_BASE_URL}/metodos-pago/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Error al eliminar método de pago');
    }
    return response.json();
};