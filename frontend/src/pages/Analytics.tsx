import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, UtensilsCrossed, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { getPedidos, getDetallesPedidos, getProductos, getPagos } from "../lib/api";

interface Pedido {
  id_pedido: number;
  total: number;
  fecha: string;
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
  precio: number;
}

interface Pago {
  id_pago: number;
  id_pedido: number;
  monto: number;
  fecha: string;
}

const Analytics = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [detallesPedidos, setDetallesPedidos] = useState<DetallePedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedPedidos, fetchedDetallesPedidos, fetchedProductos, fetchedPagos] = await Promise.all([
        getPedidos(),
        getDetallesPedidos(),
        getProductos(),
        getPagos(),
      ]);
      setPedidos(fetchedPedidos);
      setDetallesPedidos(fetchedDetallesPedidos);
      setProductos(fetchedProductos);
      setPagos(fetchedPagos);
    } catch (err) {
      setError("Error al cargar los datos de análisis.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calcular estadísticas
  const totalOrders = pedidos.length;
  const totalRevenue = pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Determinar el lunes más reciente
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajustar para obtener el lunes
  const mostRecentMonday = new Date(today.setDate(diff));
  mostRecentMonday.setHours(0, 0, 0, 0);

  // Ingresos Semanales (Lunes a Domingo)
  const weeklyRevenue = pedidos
    .filter((pedido) => {
      const pedidoDate = new Date(pedido.fecha);
      return pedidoDate >= mostRecentMonday && pedidoDate < new Date(mostRecentMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
    })
    .reduce((sum, pedido) => sum + pedido.total, 0);

  // Platillos Más Vendidos
  const dishSales: { [key: number]: { orders: number; revenue: number } } = {};
  detallesPedidos.forEach((detalle) => {
    if (!dishSales[detalle.id_producto]) {
      dishSales[detalle.id_producto] = { orders: 0, revenue: 0 };
    }
    dishSales[detalle.id_producto].orders += detalle.cantidad;
    dishSales[detalle.id_producto].revenue += detalle.cantidad * detalle.precio_unitario;
  });

  const topDishes = Object.entries(dishSales)
    .map(([id_producto, data]) => {
      const producto = productos.find((p) => p.id_producto === parseInt(id_producto));
      return {
        name: producto ? producto.nombre : "Producto Desconocido",
        orders: data.orders,
        revenue: data.revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4); // Los 4 platillos principales

  // Ingresos por Día para Gráfico (Lunes a Domingo)
  const revenueByDayMap: { [key: string]: number } = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date(mostRecentMonday);
    date.setDate(mostRecentMonday.getDate() + i);
    const dayKey = date.toISOString().split('T')[0]; // AAAA-MM-DD
    revenueByDayMap[dayKey] = 0;
  }

  pedidos.forEach(pedido => {
    const pedidoDate = new Date(pedido.fecha);
    const dayKey = pedidoDate.toISOString().split('T')[0];
    if (revenueByDayMap[dayKey] !== undefined) {
      revenueByDayMap[dayKey] += pedido.total;
    }
  });

  const revenueByDay = Object.entries(revenueByDayMap)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    .map(([date, revenue]) => ({
      day: new Date(date).toLocaleDateString('es-ES', { weekday: 'short' }),
      revenue: revenue,
    }));

  // Horas Pico
  const ordersByHour: { [key: number]: number } = {};
  pedidos.forEach(pedido => {
    const orderDate = new Date(pedido.fecha);
    const hour = orderDate.getHours();
    ordersByHour[hour] = (ordersByHour[hour] || 0) + 1;
  });

  let peakHour = -1;
  let maxOrders = 0;
  for (const hour in ordersByHour) {
    if (ordersByHour[hour] > maxOrders) {
      maxOrders = ordersByHour[hour];
      peakHour = parseInt(hour);
    }
  }

  const peakHoursRange = peakHour !== -1 ? `${peakHour}:00 - ${peakHour + 1}:00` : "N/A";

  if (loading) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl">Cargando análisis...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Análisis de Ventas</h1>
            <p className="text-muted-foreground">Rastrea el rendimiento y obtén insights del negocio</p>
          </div>
          <Button onClick={fetchData}>Actualizar Datos</Button>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Ingresos Semanales"
            value={`$${weeklyRevenue.toFixed(2)}`}
            icon={DollarSign}
            trend="+18.2% vs semana pasada" // Marcador de posición por ahora
            trendUp
          />
          <StatCard
            title="Pedidos Totales"
            value={totalOrders.toString()}
            icon={UtensilsCrossed}
            trend="+23 hoy" // Placeholder for now
            trendUp
          />
          <StatCard
            title="Valor Promedio de Pedido"
            value={`$${averageOrderValue.toFixed(2)}`}
            icon={TrendingUp}
            trend="+$4.20 vs semana pasada" // Placeholder for now
            trendUp
          />
          <StatCard
            title="Días Activos"
            value="7/7" // Placeholder for now
            icon={Calendar}
            trend="100% disponibilidad" // Placeholder for now
            trendUp
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Dishes */}
          <Card>
            <CardHeader>
              <CardTitle>Platillos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDishes.map((dish, index) => (
                  <div key={dish.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{dish.name}</p>
                        <p className="text-sm text-muted-foreground">{dish.orders} pedidos</p>
                      </div>
                    </div>
                    <span className="font-bold text-foreground">${dish.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Semanales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {revenueByDay.map((day) => {
                  const maxRevenue = Math.max(...revenueByDay.map((d) => d.revenue));
                  const percentage = (day.revenue / maxRevenue) * 100;

                  return (
                    <div key={day.day}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{day.day}</span>
                        <span className="text-sm font-bold text-foreground">
                          ${day.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights de Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Horas Pico</p>
                <p className="text-2xl font-bold text-foreground">{peakHoursRange}</p>
                <p className="text-sm text-green-500">Mejor ventana de ingresos</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tiempo de Espera Promedio</p>
                <p className="text-2xl font-bold text-foreground">18 min</p>
                <p className="text-sm text-green-500">-3 min de mejora</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Satisfacción del Cliente</p>
                <p className="text-2xl font-bold text-foreground">4.8/5.0</p>
                <p className="text-sm text-green-500">+0.3 este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
