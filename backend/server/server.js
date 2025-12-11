const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your_jwt_secret'; // ¡Cambia esto por una clave secreta real en producción!

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a la base de datos
const dbPath = path.join(__dirname, '../../restaurante.db');
const db = new Database(dbPath, { verbose: console.log });
db.pragma('foreign_keys = ON');

// Función de ayuda para ejecutar consultas
const runQuery = (sql, params = []) => {
    console.log('Executing query:', sql, params);
    try {
        const stmt = db.prepare(sql);
        if (sql.trim().toLowerCase().startsWith('select')) {
            return stmt.all(params);
        } else {
            return stmt.run(params);
        }
    } catch (error) {
        console.error('Database error:', error.message);
        throw new Error('Database operation failed');
    }
};

// Rutas de la API

// Registro de usuario
app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = runQuery(
            'INSERT INTO Usuarios (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        res.status(201).json({ id_usuario: result.lastInsertRowid });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(409).json({ message: 'El usuario ya existe' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Inicio de sesión de usuario
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
        }

        const user = runQuery('SELECT * FROM Usuarios WHERE username = ?', [username]);
        if (user.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const passwordMatch = bcrypt.compareSync(password, user[0].password);
        if (passwordMatch) {
            const token = jwt.sign({ id_usuario: user[0].id_usuario, username: user[0].username }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Productos
app.get('/api/productos', (req, res) => {
    try {
        const productos = runQuery('SELECT * FROM Productos');
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/productos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const producto = runQuery('SELECT * FROM Productos WHERE id_producto = ?', [id]);
        if (producto.length > 0) {
            res.json(producto[0]);
        } else {
            res.status(404).json({ message: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/productos', (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, id_categoria } = req.body;
        const result = runQuery(
            'INSERT INTO Productos (nombre, descripcion, precio, stock, id_categoria) VALUES (?, ?, ?, ?, ?)',
            [nombre, descripcion, precio, stock, id_categoria]
        );
        res.status(201).json({ id_producto: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/productos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock, id_categoria } = req.body;
        const result = runQuery(
            'UPDATE Productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, id_categoria = ? WHERE id_producto = ?',
            [nombre, descripcion, precio, stock, id_categoria, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Producto actualizado' });
        } else {
            res.status(404).json({ message: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/productos/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.transaction(() => {
            try {
                // First, delete all associated Detalles_Pedidos
                runQuery('DELETE FROM Detalles_Pedidos WHERE id_producto = ?', [id]);

                // Then, delete the Producto
                const result = runQuery('DELETE FROM Productos WHERE id_producto = ?', [id]);
                if (result.changes > 0) {
                    res.json({ message: 'Producto y sus detalles eliminados' });
                } else {
                    res.status(404).json({ message: 'Producto no encontrado' });
                }
            } catch (error) {
                console.error('Transaction error:', error);
                res.status(500).json({ error: 'Database operation failed' });
            }
        })(); // Execute the transaction
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Categorías de Producto
app.get('/api/categorias-producto', (req, res) => {
    try {
        const categorias = runQuery('SELECT * FROM Categorias_Producto');
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/categorias-producto/:id', (req, res) => {
    try {
        const { id } = req.params;
        const categoria = runQuery('SELECT * FROM Categorias_Producto WHERE id_categoria = ?', [id]);
        if (categoria.length > 0) {
            res.json(categoria[0]);
        } else {
            res.status(404).json({ message: 'Categoría no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/categorias-producto', (req, res) => {
    try {
        const { nombre } = req.body;
        const result = runQuery(
            'INSERT INTO Categorias_Producto (nombre) VALUES (?)',
            [nombre]
        );
        res.status(201).json({ id_categoria: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/categorias-producto/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const result = runQuery(
            'UPDATE Categorias_Producto SET nombre = ? WHERE id_categoria = ?',
            [nombre, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Categoría actualizada' });
        } else {
            res.status(404).json({ message: 'Categoría no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/categorias-producto/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Categorias_Producto WHERE id_categoria = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Categoría eliminada' });
        } else {
            res.status(404).json({ message: 'Categoría no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pedidos
app.get('/api/pedidos', (req, res) => {
    try {
        const pedidos = runQuery('SELECT * FROM Pedidos');
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/pedidos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const pedido = runQuery('SELECT * FROM Pedidos WHERE id_pedido = ?', [id]);
        if (pedido.length > 0) {
            res.json(pedido[0]);
        } else {
            res.status(404).json({ message: 'Pedido no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pedidos', (req, res) => {
    try {
        const { id_cliente, id_empleado, id_mesa, fecha, total, estado } = req.body;
        const result = runQuery(
            'INSERT INTO Pedidos (id_cliente, id_empleado, id_mesa, fecha, total, estado) VALUES (?, ?, ?, ?, ?, ?)',
            [id_cliente, id_empleado, id_mesa, fecha, total, estado]
        );
        res.status(201).json({ id_pedido: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/pedidos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { id_cliente, id_empleado, id_mesa, fecha, total, estado } = req.body;

        if (Object.keys(req.body).length === 1 && req.body.estado) {
            // Only updating the status
            const result = runQuery(
                'UPDATE Pedidos SET estado = ? WHERE id_pedido = ?',
                [estado, id]
            );
            if (result.changes > 0) {
                res.json({ message: 'Estado del pedido actualizado' });
            } else {
                res.status(404).json({ message: 'Pedido no encontrado' });
            }
        } else {
            // Updating the entire order
            const result = runQuery(
                'UPDATE Pedidos SET id_cliente = ?, id_empleado = ?, id_mesa = ?, fecha = ?, total = ?, estado = ? WHERE id_pedido = ?',
                [id_cliente, id_empleado, id_mesa, fecha, total, estado, id]
            );
            if (result.changes > 0) {
                res.json({ message: 'Pedido actualizado' });
            } else {
                res.status(404).json({ message: 'Pedido no encontrado' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/pedidos/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.transaction(() => {
            // First, delete all associated Pagos
            runQuery('DELETE FROM Pagos WHERE id_pedido = ?', [id]);
            
            // Then, delete all associated Detalles_Pedidos
            runQuery('DELETE FROM Detalles_Pedidos WHERE id_pedido = ?', [id]);

            // Finally, delete the Pedido
            const result = runQuery('DELETE FROM Pedidos WHERE id_pedido = ?', [id]);
            if (result.changes > 0) {
                res.json({ message: 'Pedido y sus detalles eliminados' });
            } else {
                res.status(404).json({ message: 'Pedido no encontrado' });
            }
        })(); // Execute the transaction
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Detalles de Pedidos
app.get('/api/detalles-pedidos', (req, res) => {
    try {
        const detalles = runQuery('SELECT * FROM Detalles_Pedidos');
        res.json(detalles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/detalles-pedidos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const detalle = runQuery('SELECT * FROM Detalles_Pedidos WHERE id_detalle = ?', [id]);
        if (detalle.length > 0) {
            res.json(detalle[0]);
        } else {
            res.status(404).json({ message: 'Detalle de pedido no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/detalles-pedidos', (req, res) => {
    try {
        const { id_pedido, id_producto, cantidad, precio_unitario } = req.body;
        const result = runQuery(
            'INSERT INTO Detalles_Pedidos (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
            [id_pedido, id_producto, cantidad, precio_unitario]
        );
        res.status(201).json({ id_detalle: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/detalles-pedidos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { id_pedido, id_producto, cantidad, precio_unitario } = req.body;
        const result = runQuery(
            'UPDATE Detalles_Pedidos SET id_pedido = ?, id_producto = ?, cantidad = ?, precio_unitario = ? WHERE id_detalle = ?',
            [id_pedido, id_producto, cantidad, precio_unitario, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Detalle de pedido actualizado' });
        } else {
            res.status(404).json({ message: 'Detalle de pedido no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/detalles-pedidos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Detalles_Pedidos WHERE id_detalle = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Detalle de pedido eliminado' });
        } else {
            res.status(404).json({ message: 'Detalle de pedido no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clientes
app.get('/api/clientes', (req, res) => {
    try {
        const clientes = runQuery('SELECT * FROM Clientes');
        res.json(clientes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/clientes/:id', (req, res) => {
    try {
        const { id } = req.params;
        const cliente = runQuery('SELECT * FROM Clientes WHERE id_cliente = ?', [id]);
        if (cliente.length > 0) {
            res.json(cliente[0]);
        } else {
            res.status(404).json({ message: 'Cliente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clientes', (req, res) => {
    try {
        const { nombre, apellido, email, telefono, fecha_registro } = req.body;
        const result = runQuery(
            'INSERT INTO Clientes (nombre, apellido, email, telefono, fecha_registro) VALUES (?, ?, ?, ?, ?)',
            [nombre, apellido, email, telefono, fecha_registro]
        );
        res.status(201).json({ id_cliente: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/clientes/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, email, telefono, fecha_registro } = req.body;
        const result = runQuery(
            'UPDATE Clientes SET nombre = ?, apellido = ?, email = ?, telefono = ?, fecha_registro = ? WHERE id_cliente = ?',
            [nombre, apellido, email, telefono, fecha_registro, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Cliente actualizado' });
        } else {
            res.status(404).json({ message: 'Cliente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/clientes/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Clientes WHERE id_cliente = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Cliente eliminado' });
        } else {
            res.status(404).json({ message: 'Cliente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mesas
app.get('/api/mesas', (req, res) => {
    try {
        const mesas = runQuery('SELECT * FROM Mesas');
        res.json(mesas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/mesas/:id', (req, res) => {
    try {
        const { id } = req.params;
        const mesa = runQuery('SELECT * FROM Mesas WHERE id_mesa = ?', [id]);
        if (mesa.length > 0) {
            res.json(mesa[0]);
        } else {
            res.status(404).json({ message: 'Mesa no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/mesas', (req, res) => {
    try {
        const { numero_mesa, capacidad, estado, currentGuests = 0 } = req.body;
        const result = runQuery(
            'INSERT INTO Mesas (numero_mesa, capacidad, estado, currentGuests) VALUES (?, ?, ?, ?)',
            [numero_mesa, capacidad, estado, currentGuests]
        );
        res.status(201).json({ id_mesa: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.put('/api/mesas/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { numero_mesa, capacidad, estado, currentGuests } = req.body;
        const result = runQuery(
            'UPDATE Mesas SET numero_mesa = ?, capacidad = ?, estado = ?, currentGuests = ? WHERE id_mesa = ?',
            [numero_mesa, capacidad, estado, currentGuests, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Mesa actualizada' });
        } else {
            res.status(404).json({ message: 'Mesa no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/mesas/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Mesas WHERE id_mesa = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Mesa eliminada' });
        } else {
            res.status(404).json({ message: 'Mesa no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Empleados
app.get('/api/empleados', (req, res) => {
    try {
        const empleados = runQuery('SELECT * FROM Empleados');
        res.json(empleados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/empleados/:id', (req, res) => {
    try {
        const { id } = req.params;
        const empleado = runQuery('SELECT * FROM Empleados WHERE id_empleado = ?', [id]);
        if (empleado.length > 0) {
            res.json(empleado[0]);
        } else {
            res.status(404).json({ message: 'Empleado no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/empleados', (req, res) => {
    try {
        const { nombre, apellido, id_rol, fecha_contratacion } = req.body;
        const result = runQuery(
            'INSERT INTO Empleados (nombre, apellido, id_rol, fecha_contratacion) VALUES (?, ?, ?, ?)',
            [nombre, apellido, id_rol, fecha_contratacion]
        );
        res.status(201).json({ id_empleado: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/empleados/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, id_rol, fecha_contratacion } = req.body;
        const result = runQuery(
            'UPDATE Empleados SET nombre = ?, apellido = ?, id_rol = ?, fecha_contratacion = ? WHERE id_empleado = ?',
            [nombre, apellido, id_rol, fecha_contratacion, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Empleado actualizado' });
        } else {
            res.status(404).json({ message: 'Empleado no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/empleados/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Empleados WHERE id_empleado = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Empleado eliminado' });
        } else {
            res.status(404).json({ message: 'Empleado no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Roles
app.get('/api/roles', (req, res) => {
    try {
        const roles = runQuery('SELECT * FROM Roles');
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/roles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const rol = runQuery('SELECT * FROM Roles WHERE id_rol = ?', [id]);
        if (rol.length > 0) {
            res.json(rol[0]);
        } else {
            res.status(404).json({ message: 'Rol no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/roles', (req, res) => {
    try {
        const { nombre_rol } = req.body;
        const result = runQuery(
            'INSERT INTO Roles (nombre_rol) VALUES (?)',
            [nombre_rol]
        );
        res.status(201).json({ id_rol: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/roles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_rol } = req.body;
        const result = runQuery(
            'UPDATE Roles SET nombre_rol = ? WHERE id_rol = ?',
            [nombre_rol, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Rol actualizado' });
        } else {
            res.status(404).json({ message: 'Rol no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/roles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Roles WHERE id_rol = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Rol eliminado' });
        } else {
            res.status(404).json({ message: 'Rol no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Roles
app.get('/api/roles', (req, res) => {
    try {
        const roles = runQuery('SELECT * FROM Roles');
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/roles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const rol = runQuery('SELECT * FROM Roles WHERE id_rol = ?', [id]);
        if (rol.length > 0) {
            res.json(rol[0]);
        } else {
            res.status(404).json({ message: 'Rol no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/roles', (req, res) => {
    try {
        const { nombre_rol } = req.body;
        const result = runQuery(
            'INSERT INTO Roles (nombre_rol) VALUES (?)',
            [nombre_rol]
        );
        res.status(201).json({ id_rol: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/roles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_rol } = req.body;
        const result = runQuery(
            'UPDATE Roles SET nombre_rol = ? WHERE id_rol = ?',
            [nombre_rol, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Rol actualizado' });
        } else {
            res.status(404).json({ message: 'Rol no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/roles/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Roles WHERE id_rol = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Rol eliminado' });
        } else {
            res.status(404).json({ message: 'Rol no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pagos
app.get('/api/pagos', (req, res) => {
    try {
        const pagos = runQuery('SELECT * FROM Pagos');
        res.json(pagos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/pagos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const pago = runQuery('SELECT * FROM Pagos WHERE id_pago = ?', [id]);
        if (pago.length > 0) {
            res.json(pago[0]);
        } else {
            res.status(404).json({ message: 'Pago no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pagos', (req, res) => {
    try {
        const { id_pedido, id_metodo_pago, monto, fecha } = req.body;
        const result = runQuery(
            'INSERT INTO Pagos (id_pedido, id_metodo_pago, monto, fecha) VALUES (?, ?, ?, ?)',
            [id_pedido, id_metodo_pago, monto, fecha]
        );
        res.status(201).json({ id_pago: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/pagos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { id_pedido, id_metodo_pago, monto, fecha } = req.body;
        const result = runQuery(
            'UPDATE Pagos SET id_pedido = ?, id_metodo_pago = ?, monto = ?, fecha = ? WHERE id_pago = ?',
            [id_pedido, id_metodo_pago, monto, fecha, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Pago actualizado' });
        } else {
            res.status(404).json({ message: 'Pago no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/pagos/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Pagos WHERE id_pago = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Pago eliminado' });
        } else {
            res.status(404).json({ message: 'Pago no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Métodos de Pago
app.get('/api/metodos-pago', (req, res) => {
    try {
        const metodosPago = runQuery('SELECT * FROM Metodos_Pago');
        res.json(metodosPago);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/metodos-pago/:id', (req, res) => {
    try {
        const { id } = req.params;
        const metodoPago = runQuery('SELECT * FROM Metodos_Pago WHERE id_metodo_pago = ?', [id]);
        if (metodoPago.length > 0) {
            res.json(metodoPago[0]);
        } else {
            res.status(404).json({ message: 'Método de pago no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/metodos-pago', (req, res) => {
    try {
        const { nombre } = req.body;
        const result = runQuery(
            'INSERT INTO Metodos_Pago (nombre) VALUES (?)',
            [nombre]
        );
        res.status(201).json({ id_metodo_pago: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/metodos-pago/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const result = runQuery(
            'UPDATE Metodos_Pago SET nombre = ? WHERE id_metodo_pago = ?',
            [nombre, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Método de pago actualizado' });
        } else {
            res.status(404).json({ message: 'Método de pago no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/metodos-pago/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Metodos_Pago WHERE id_metodo_pago = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Método de pago eliminado' });
        } else {
            res.status(404).json({ message: 'Método de pago no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Métodos de Pago
app.get('/api/metodos-pago', (req, res) => {
    try {
        const metodosPago = runQuery('SELECT * FROM Metodos_Pago');
        res.json(metodosPago);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/metodos-pago/:id', (req, res) => {
    try {
        const { id } = req.params;
        const metodoPago = runQuery('SELECT * FROM Metodos_Pago WHERE id_metodo_pago = ?', [id]);
        if (metodoPago.length > 0) {
            res.json(metodoPago[0]);
        } else {
            res.status(404).json({ message: 'Método de pago no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/metodos-pago', (req, res) => {
    try {
        const { nombre } = req.body;
        const result = runQuery(
            'INSERT INTO Metodos_Pago (nombre) VALUES (?)',
            [nombre]
        );
        res.status(201).json({ id_metodo_pago: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/metodos-pago/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        const result = runQuery(
            'UPDATE Metodos_Pago SET nombre = ? WHERE id_metodo_pago = ?',
            [nombre, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Método de pago actualizado' });
        } else {
            res.status(404).json({ message: 'Método de pago no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/metodos-pago/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Metodos_Pago WHERE id_metodo_pago = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Método de pago eliminado' });
        } else {
            res.status(404).json({ message: 'Método de pago no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reservas
app.get('/api/reservas', (req, res) => {
    try {
        const reservas = runQuery('SELECT * FROM Reservas');
        res.json(reservas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reservas/:id', (req, res) => {
    try {
        const { id } = req.params;
        const reserva = runQuery('SELECT * FROM Reservas WHERE id_reserva = ?', [id]);
        if (reserva.length > 0) {
            res.json(reserva[0]);
        } else {
            res.status(404).json({ message: 'Reserva no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reservas', (req, res) => {
    try {
        const { id_cliente, id_mesa, fecha_hora, numero_personas, estado } = req.body;
        const result = runQuery(
            'INSERT INTO Reservas (id_cliente, id_mesa, fecha_hora, numero_personas, estado) VALUES (?, ?, ?, ?, ?)',
            [id_cliente, id_mesa, fecha_hora, numero_personas, estado]
        );
        res.status(201).json({ id_reserva: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/reservas/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { id_cliente, id_mesa, fecha_hora, numero_personas, estado } = req.body;
        const result = runQuery(
            'UPDATE Reservas SET id_cliente = ?, id_mesa = ?, fecha_hora = ?, numero_personas = ?, estado = ? WHERE id_reserva = ?',
            [id_cliente, id_mesa, fecha_hora, numero_personas, estado, id]
        );
        if (result.changes > 0) {
            res.json({ message: 'Reserva actualizada' });
        } else {
            res.status(404).json({ message: 'Reserva no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/reservas/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = runQuery('DELETE FROM Reservas WHERE id_reserva = ?', [id]);
        if (result.changes > 0) {
            res.json({ message: 'Reserva eliminada' });
        } else {
            res.status(404).json({ message: 'Reserva no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Cerrar la conexión a la base de datos cuando la aplicación se cierra
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(1));
process.on('SIGINT', () => process.exit(1));
process.on('SIGTERM', () => process.exit(1));
