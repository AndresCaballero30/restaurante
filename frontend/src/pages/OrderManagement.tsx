import { useEffect, useState } from "react";
import { Clock, CheckCircle, Flame, Package, Plus, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPedidos,
  getDetallesPedidos,
  getProductos,
  getMesas,
  getClientes,
  getEmpleados,
  createPedido,
  updatePedido,
  deletePedido,
  createDetallePedido,
  updateDetallePedido,
  deleteDetallePedido,
} from "../lib/api";

interface Pedido {
  id_pedido: number;
  id_cliente: number;
  id_empleado: number;
  id_mesa: number;
  fecha: string;
  total: number;
  estado: "pendiente" | "preparando" | "listo" | "entregado" | "cancelado";
}

interface DetallePedido {
  id_detalle: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
}

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  id_categoria: number;
}

interface Mesa {
  id_mesa: number;
  numero_mesa: number;
  capacidad: number;
  estado: string;
}

interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
}

interface Empleado {
  id_empleado: number;
  nombre: string;
  apellido: string;
}

interface EnhancedOrder extends Pedido {
  items: { id_detalle?: number; id_producto: number; nombre: string; cantidad: number; precio_unitario: number }[];
  tableNumber: number | string;
  clientName: string;
  employeeName: string;
}

const OrderManagement = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [detallesPedidos, setDetallesPedidos] = useState<DetallePedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<EnhancedOrder | null>(null);
  const [newOrderData, setNewOrderData] = useState({
    id_cliente: "",
    id_empleado: "",
    id_mesa: "",
    fecha: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
    total: 0,
    estado: "pendiente",
  });
  const [newOrderItems, setNewOrderItems] = useState<
    { id_producto: string; cantidad: number; precio_unitario: number }[]
  >([]);
  const [currentOrderItem, setCurrentOrderItem] = useState({
    id_producto: "",
    cantidad: 1,
    precio_unitario: 0,
  });

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const [
        fetchedPedidos,
        fetchedDetallesPedidos,
        fetchedProductos,
        fetchedMesas,
        fetchedClientes,
        fetchedEmpleados,
      ] = await Promise.all([
        getPedidos(),
        getDetallesPedidos(),
        getProductos(),
        getMesas(),
        getClientes(),
        getEmpleados(),
      ]);

      setPedidos(fetchedPedidos);
      setDetallesPedidos(fetchedDetallesPedidos);
      setProductos(fetchedProductos);
      setMesas(fetchedMesas);
      setClientes(fetchedClientes);
      setEmpleados(fetchedEmpleados);
    } catch (err) {
      setError("Error al cargar los datos de pedidos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  const getProductName = (id_producto: number) => {
    const producto = productos.find((p) => p.id_producto === id_producto);
    return producto ? producto.nombre : "Producto Desconocido";
  };

  const getTableNumber = (id_mesa: number) => {
    const mesa = mesas.find((m) => m.id_mesa === id_mesa);
    return mesa ? mesa.numero_mesa : "N/A";
  };

  const getClientName = (id_cliente: number) => {
    const cliente = clientes.find((c) => c.id_cliente === id_cliente);
    return cliente ? `${cliente.nombre} ${cliente.apellido || ""}`.trim() : "Cliente Desconocido";
  };

  const getEmployeeName = (id_empleado: number) => {
    const empleado = empleados.find((e) => e.id_empleado === id_empleado);
    return empleado ? `${empleado.nombre} ${empleado.apellido || ""}`.trim() : "Empleado Desconocido";
  };

  const enhancedOrders: EnhancedOrder[] = pedidos.map((pedido) => {
    const items = detallesPedidos
      .filter((detalle) => detalle.id_pedido === pedido.id_pedido)
      .map((detalle) => ({
        id_detalle: detalle.id_detalle,
        id_producto: detalle.id_producto,
        nombre: getProductName(detalle.id_producto),
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
      }));

    return {
      ...pedido,
      items,
      tableNumber: getTableNumber(pedido.id_mesa),
      clientName: getClientName(pedido.id_cliente),
      employeeName: getEmployeeName(pedido.id_empleado),
    };
  });

  const getStatusColor = (status: Pedido["estado"]) => {
    switch (status) {
      case "pendiente":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "preparando":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "listo":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "entregado":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "cancelado":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: Pedido["estado"]) => {
    switch (status) {
      case "pendiente":
        return Clock;
      case "preparando":
        return Flame;
      case "listo":
        return CheckCircle;
      case "entregado":
        return Package;
      case "cancelado":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const pendingOrders = enhancedOrders.filter(order => order.estado === "pendiente").length;
  const preparingOrders = enhancedOrders.filter(order => order.estado === "preparando").length;
  const readyOrders = enhancedOrders.filter(order => order.estado === "listo").length;
  const deliveredOrdersToday = enhancedOrders.filter(order => order.estado === "entregado" && new Date(order.fecha).toDateString() === new Date().toDateString()).length;

  const handleUpdateOrderStatus = async (id_pedido: number, estado: Pedido["estado"]) => {
    try {
      await updatePedido(id_pedido, { estado });
      fetchOrderData();
    } catch (err) {
      setError("Error al actualizar el estado del pedido.");
      console.error(err);
    }
  };

  const handleAddOrderClick = () => {
    setEditingOrder(null);
    setNewOrderData({
      id_cliente: "",
      id_empleado: "",
      id_mesa: "",
      fecha: new Date().toISOString().slice(0, 16),
      total: 0,
      estado: "pendiente",
    });
    setNewOrderItems([]);
    setCurrentOrderItem({ id_producto: "", cantidad: 1, precio_unitario: 0 });
    setIsDialogOpen(true);
  };

  const handleEditOrderClick = (order: EnhancedOrder) => {
    setEditingOrder(order);
    setNewOrderData({
      id_cliente: order.id_cliente.toString(),
      id_empleado: order.id_empleado.toString(),
      id_mesa: order.id_mesa.toString(),
      fecha: new Date(order.fecha).toISOString().slice(0, 16),
      total: order.total,
      estado: order.estado,
    });
    setNewOrderItems(
      order.items.map((item) => ({
        id_producto: item.id_producto.toString(),
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      }))
    );
    setCurrentOrderItem({ id_producto: "", cantidad: 1, precio_unitario: 0 });
    setIsDialogOpen(true);
  };

  const handleDeleteOrder = async (id_pedido: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este pedido? Esto también eliminará sus detalles.")) {
      try {
        // First delete order details
        const detailsToDelete = detallesPedidos.filter(d => d.id_pedido === id_pedido);
        await Promise.all(detailsToDelete.map(d => deleteDetallePedido(d.id_detalle)));
        
        // Then delete the order
        await deletePedido(id_pedido);
        fetchOrderData();
      } catch (err) {
        setError("Error al eliminar el pedido.");
        console.error(err);
      }
    }
  };

  const handleSaveOrder = async () => {
    try {
      const orderToSave = {
        ...newOrderData,
        id_cliente: parseInt(newOrderData.id_cliente),
        id_empleado: parseInt(newOrderData.id_empleado),
        id_mesa: parseInt(newOrderData.id_mesa),
        total: newOrderItems.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0),
      };

      let savedOrder: Pedido;
      if (editingOrder) {
        await updatePedido(editingOrder.id_pedido, orderToSave);
        savedOrder = { ...orderToSave, id_pedido: editingOrder.id_pedido };

        // Delete existing details for the order
        const existingDetails = detallesPedidos.filter(d => d.id_pedido === editingOrder.id_pedido);
        await Promise.all(existingDetails.map(d => deleteDetallePedido(d.id_detalle)));
      } else {
        const result = await createPedido(orderToSave);
        savedOrder = { ...orderToSave, id_pedido: result.id_pedido };
      }

      // Create new order details
      await Promise.all(
        newOrderItems.map((item) =>
          createDetallePedido({
            id_pedido: savedOrder.id_pedido,
            id_producto: parseInt(item.id_producto),
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
          })
        )
      );

      setIsDialogOpen(false);
      fetchOrderData();
    } catch (err) {
      setError("Error al guardar el pedido.");
      console.error(err);
    }
  };

  const handleAddOrderItem = () => {
    if (currentOrderItem.id_producto && currentOrderItem.cantidad > 0) {
      const product = productos.find(p => p.id_producto === parseInt(currentOrderItem.id_producto));
      if (product) {
        setNewOrderItems([
          ...newOrderItems,
          {
            ...currentOrderItem,
            id_producto: currentOrderItem.id_producto,
            nombre: product.nombre,
            precio_unitario: product.precio, // Use product's current price
          },
        ]);
        setCurrentOrderItem({ id_producto: "", cantidad: 1, precio_unitario: 0 });
      }
    }
  };

  const handleRemoveOrderItem = (index: number) => {
    setNewOrderItems(newOrderItems.filter((_, i) => i !== index));
  };

  const handleProductSelectForOrderItem = (value: string) => {
    const product = productos.find(p => p.id_producto === parseInt(value));
    setCurrentOrderItem({
      ...currentOrderItem,
      id_producto: value,
      precio_unitario: product ? product.precio : 0,
    });
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl">Cargando pedidos...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gestión de Pedidos</h1>
            <p className="text-muted-foreground">Rastrea y gestiona todos los pedidos del restaurante</p>
          </div>
          <Button className="gap-2" onClick={handleAddOrderClick}>
            <Plus className="h-4 w-4" />
            Agregar Nuevo Pedido
          </Button>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{pendingOrders}</p>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Flame className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{preparingOrders}</p>
                  <p className="text-sm text-muted-foreground">En Cocina</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{readyOrders}</p>
                  <p className="text-sm text-muted-foreground">Listos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{deliveredOrdersToday}</p>
                  <p className="text-sm text-muted-foreground">Completados Hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Orders */}
        <h2 className="text-2xl font-bold text-foreground mb-4">Pedidos Activos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enhancedOrders.filter(order => order.estado !== "entregado" && order.estado !== "cancelado").map((order) => {
            const StatusIcon = getStatusIcon(order.estado);
            return (
              <Card key={order.id_pedido} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Mesa {order.tableNumber}</CardTitle>
                    <Badge className={getStatusColor(order.estado)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {order.estado === "pendiente" ? "Pendiente" : order.estado === "preparando" ? "Preparando" : order.estado === "listo" ? "Listo" : order.estado === "entregado" ? "Entregado" : "Cancelado"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Cliente: {order.clientName}</p>
                  <p className="text-sm text-muted-foreground">Atendido por: {order.employeeName}</p>
                  <p className="text-sm text-muted-foreground">Fecha: {new Date(order.fecha).toLocaleString()}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-sm text-foreground">{item.cantidad}x {item.nombre} (${item.precio_unitario.toFixed(2)})</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Select
                      value={order.estado}
                      onValueChange={(value) => handleUpdateOrderStatus(order.id_pedido, value as Pedido["estado"])}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Cambiar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {["pendiente", "preparando", "listo", "entregado", "cancelado"].map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditOrderClick(order)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order.id_pedido)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Completed Orders */}
        <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Pedidos Completados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enhancedOrders.filter(order => order.estado === "entregado" || order.estado === "cancelado").map((order) => {
            const StatusIcon = getStatusIcon(order.estado);
            return (
              <Card key={order.id_pedido} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Mesa {order.tableNumber}</CardTitle>
                    <Badge className={getStatusColor(order.estado)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {order.estado === "entregado" ? "Entregado" : "Cancelado"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Cliente: {order.clientName}</p>
                  <p className="text-sm text-muted-foreground">Atendido por: {order.employeeName}</p>
                  <p className="text-sm text-muted-foreground">Fecha: {new Date(order.fecha).toLocaleString()}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span className="text-sm text-foreground">{item.cantidad}x {item.nombre} (${item.precio_unitario.toFixed(2)})</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-lg font-bold text-foreground">
                      ${order.total.toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order.id_pedido)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Editar Pedido" : "Agregar Nuevo Pedido"}</DialogTitle>
            <DialogDescription>
              {editingOrder ? "Modifica los detalles del pedido." : "Introduce los detalles del nuevo pedido."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id_cliente" className="text-right">
                Cliente
              </Label>
              <Select
                value={newOrderData.id_cliente}
                onValueChange={(value) => setNewOrderData({ ...newOrderData, id_cliente: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id_cliente} value={cliente.id_cliente.toString()}>
                      {cliente.nombre} {cliente.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id_empleado" className="text-right">
                Empleado
              </Label>
              <Select
                value={newOrderData.id_empleado}
                onValueChange={(value) => setNewOrderData({ ...newOrderData, id_empleado: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {empleados.map((empleado) => (
                    <SelectItem key={empleado.id_empleado} value={empleado.id_empleado.toString()}>
                      {empleado.nombre} {empleado.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id_mesa" className="text-right">
                Mesa
              </Label>
              <Select
                value={newOrderData.id_mesa}
                onValueChange={(value) => setNewOrderData({ ...newOrderData, id_mesa: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una mesa" />
                </SelectTrigger>
                <SelectContent>
                  {mesas.map((mesa) => (
                    <SelectItem key={mesa.id_mesa} value={mesa.id_mesa.toString()}>
                      Mesa {mesa.numero_mesa} (Capacidad: {mesa.capacidad})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha" className="text-right">
                Fecha y Hora
              </Label>
              <Input
                id="fecha"
                type="datetime-local"
                value={newOrderData.fecha}
                onChange={(e) => setNewOrderData({ ...newOrderData, fecha: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estado" className="text-right">
                Estado
              </Label>
              <Select
                value={newOrderData.estado}
                onValueChange={(value) => setNewOrderData({ ...newOrderData, estado: value as Pedido["estado"] })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {["pendiente", "preparando", "listo", "entregado", "cancelado"].map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Order Items Section */}
            <div className="col-span-4 border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-2">Artículos del Pedido</h3>
              <div className="space-y-2">
                {newOrderItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span>{item.cantidad}x {getProductName(parseInt(item.id_producto))} (${item.precio_unitario.toFixed(2)})</span>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveOrderItem(index)}>
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Select
                  value={currentOrderItem.id_producto}
                  onValueChange={handleProductSelectForOrderItem}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map((product) => (
                      <SelectItem key={product.id_producto} value={product.id_producto.toString()}>
                        {product.nombre} (${product.precio.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Cantidad"
                  value={currentOrderItem.cantidad}
                  onChange={(e) => setCurrentOrderItem({ ...currentOrderItem, cantidad: parseInt(e.target.value) || 1 })}
                  className="w-24"
                />
                <Button onClick={handleAddOrderItem}>Añadir Artículo</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveOrder}>
              {editingOrder ? "Guardar Cambios" : "Agregar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderManagement;

