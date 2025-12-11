import { NavLink } from "./NavLink";
import { ChefHat, ClipboardList, UtensilsCrossed, Package, TrendingUp, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const Navigation = () => {
  const navigate = useNavigate();
  const navItems = [
    { to: "/", icon: ChefHat, label: "Inicio" },
    { to: "/menu", icon: UtensilsCrossed, label: "Menú" },
    { to: "/orders", icon: ClipboardList, label: "Pedidos" },
    { to: "/tables", icon: Package, label: "Mesas" },
    { to: "/inventory", icon: Package, label: "Inventario" },
    { to: "/analytics", icon: TrendingUp, label: "Análisis" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">RestaurantOS</span>
          </div>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                activeClassName="text-primary bg-secondary font-medium"
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </NavLink>
            ))}
            <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
