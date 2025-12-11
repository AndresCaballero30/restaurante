import { useEffect, useState } from "react";
import { DollarSign, Users, UtensilsCrossed, TrendingUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import heroImage from "@/assets/restaurant-hero.jpg";
import { getPedidos, getMesas, getDetallesPedidos } from "../lib/api";

interface Pedido {
  id_pedido: number;
  estado: "pendiente" | "preparando" | "listo" | "entregado" | "cancelado";
  fecha: string;
  total: number;
}

interface Mesa {
  id_mesa: number;
  estado: "disponible" | "ocupada" | "reservada";
}

interface DetallePedido {
  id_detalle: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
}

const Dashboard = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [detallesPedidos, setDetallesPedidos] = useState<DetallePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPedidos, fetchedMesas, fetchedDetallesPedidos] = await Promise.all([
          getPedidos(),
          getMesas(),
          getDetallesPedidos(),
        ]);
        setPedidos(fetchedPedidos);
        setMesas(fetchedMesas);
        setDetallesPedidos(fetchedDetallesPedidos);
      } catch (err) {
        setError("Error al cargar los datos del dashboard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- Calculations ---

  // Helper to get date in YYYY-MM-DD format
  const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

  const calculateRevenue = (filteredPedidos: Pedido[]) => {
    return filteredPedidos.reduce((sum, pedido) => {
      const items = detallesPedidos.filter(d => d.id_pedido === pedido.id_pedido);
      const orderTotal = items.reduce((itemSum, item) => itemSum + item.cantidad * item.precio_unitario, 0);
      return sum + orderTotal;
    }, 0);
  };

  // Today's and Yesterday's Revenue
  const todayStr = toYYYYMMDD(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toYYYYMMDD(yesterday);

  const deliveredOrders = pedidos.filter(p => p.estado === 'entregado');

  const totalRevenueToday = calculateRevenue(
    deliveredOrders.filter(p => p.fecha.startsWith(todayStr))
  );

  const totalRevenueYesterday = calculateRevenue(
    deliveredOrders.filter(p => p.fecha.startsWith(yesterdayStr))
  );

  const dailyGrowth = totalRevenueYesterday > 0 
    ? ((totalRevenueToday - totalRevenueYesterday) / totalRevenueYesterday) * 100 
    : totalRevenueToday > 0 ? 100 : 0;

  // Weekly Growth
  const now = new Date();
  const last7DaysDeliveredOrders = deliveredOrders.filter(p => {
    const pagoDate = new Date(p.fecha);
    const diffDays = (now.getTime() - pagoDate.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7;
  });

  const previous7DaysDeliveredOrders = deliveredOrders.filter(p => {
    const pagoDate = new Date(p.fecha);
    const diffDays = (now.getTime() - pagoDate.getTime()) / (1000 * 3600 * 24);
    return diffDays > 7 && diffDays <= 14;
  });

  const last7DaysRevenue = calculateRevenue(last7DaysDeliveredOrders);
  const previous7DaysRevenue = calculateRevenue(previous7DaysDeliveredOrders);

  const weeklyGrowth = previous7DaysRevenue > 0
    ? ((last7DaysRevenue - previous7DaysRevenue) / previous7DaysRevenue) * 100
    : last7DaysRevenue > 0 ? 100 : 0;

  // Other stats
  const activeOrders = pedidos.filter(
    (pedido) =>
      pedido.estado === "pendiente" ||
      pedido.estado === "preparando" ||
      pedido.estado === "listo"
  ).length;

  const occupiedTables = mesas.filter((mesa) => mesa.estado === "ocupada").length;
  const totalTables = mesas.length;
  const occupiedTablesPercentage = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;

  if (loading) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl">Cargando dashboard...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        <img 
          src={heroImage} 
          alt="Restaurant Interior" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent">
          <div className="container mx-auto px-4 h-full flex flex-col justify-center">
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Sistema de Gestión de Restaurante
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Control completo de las operaciones de tu restaurante en una plataforma elegante
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Ingresos de Hoy"
            value={`$${totalRevenueToday.toFixed(2)}`}
            icon={DollarSign}
            trend={`${dailyGrowth >= 0 ? '+' : ''}${dailyGrowth.toFixed(1)}% desde ayer`}
            trendUp={dailyGrowth >= 0}
          />
          <StatCard
            title="Pedidos Activos"
            value={activeOrders.toString()}
            icon={UtensilsCrossed}
            trend="En cocina"
          />
          <StatCard
            title="Mesas Ocupadas"
            value={`${occupiedTables}/${totalTables}`}
            icon={Users}
            trend={`${occupiedTablesPercentage.toFixed(0)}% capacidad`}
            trendUp
          />
          <StatCard
            title="Crecimiento Semanal"
            value={`${weeklyGrowth >= 0 ? '+' : ''}${weeklyGrowth.toFixed(1)}%`}
            icon={TrendingUp}
            trend="Comparado a los 7 días previos"
            trendUp={weeklyGrowth >= 0}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Gestión de Menú"
            description="Crea y organiza el menú de tu restaurante con categorías, precios y disponibilidad"
            href="/menu"
            color="primary"
          />
          <QuickActionCard
            title="Procesamiento de Pedidos"
            description="Rastrea pedidos desde su creación hasta su entrega con actualizaciones de cocina en tiempo real"
            href="/orders"
            color="accent"
          />
          <QuickActionCard
            title="Gestión de Mesas"
            description="Administra reservas, asignación de mesas y disposición de asientos"
            href="/tables"
            color="restaurant-gold"
          />
          <QuickActionCard
            title="Control de Inventario"
            description="Monitorea niveles de stock, rastrea ingredientes y gestiona proveedores"
            href="/inventory"
            color="restaurant-success"
          />
          <QuickActionCard
            title="Análisis de Ventas"
            description="Ve reportes detallados sobre ingresos, platillos populares e insights del negocio"
            href="/analytics"
            color="primary"
          />
          <QuickActionCard
            title="Gestión de Personal"
            description="Coordina tu equipo, horarios y seguimiento de rendimiento"
            href="/staff"
            color="accent"
          />
        </div>
      </div>
    </div>
  );
};

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  color: string;
}

const QuickActionCard = ({ title, description, href, color }: QuickActionCardProps) => {
  return (
    <a
      href={href}
      className="group block p-6 bg-card rounded-xl border border-border hover:border-primary transition-all duration-300 hover:shadow-lg"
    >
      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground">
        {description}
      </p>
      <div className="mt-4 text-primary font-medium group-hover:translate-x-2 transition-transform inline-block">
        Ver Detalles →
      </div>
    </a>
  );
};

export default Dashboard;
