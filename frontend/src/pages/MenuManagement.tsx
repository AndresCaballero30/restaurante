import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getProductos, getCategoriasProducto, createProducto, updateProducto, deleteProducto } from "../lib/api";

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  id_categoria: number;
}

interface CategoriaProducto {
  id_categoria: number;
  nombre: string;
}

const MenuManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [newProductData, setNewProductData] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    id_categoria: "",
  });

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const fetchedProductos = await getProductos();
      const fetchedCategorias = await getCategoriasProducto();
      setProductos(fetchedProductos);
      setCategorias(fetchedCategorias);
    } catch (err) {
      setError("Error al cargar los datos del menú.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const getCategoryName = (id_categoria: number) => {
    const category = categorias.find(cat => cat.id_categoria === id_categoria);
    return category ? category.nombre : "Desconocida";
  };

  const filteredItems = productos.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(item.id_categoria).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProductClick = () => {
    setEditingProduct(null);
    setNewProductData({
      nombre: "",
      descripcion: "",
      precio: 0,
      stock: 0,
      id_categoria: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditProductClick = (product: Producto) => {
    setEditingProduct(product);
    setNewProductData({
      nombre: product.nombre,
      descripcion: product.descripcion,
      precio: product.precio,
      stock: product.stock,
      id_categoria: product.id_categoria.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (id_producto: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este platillo?")) {
      try {
        await deleteProducto(id_producto);
        fetchMenuData(); // Re-fetch data to update the list
      } catch (err) {
        setError("Error al eliminar el platillo.");
        console.error(err);
      }
    }
  };

  const handleSaveProduct = async () => {
    try {
      const productToSave = {
        ...newProductData,
        precio: parseFloat(newProductData.precio.toString()),
        stock: parseInt(newProductData.stock.toString()),
        id_categoria: parseInt(newProductData.id_categoria),
      };

      if (editingProduct) {
        await updateProducto(editingProduct.id_producto, productToSave);
      } else {
        await createProducto(productToSave);
      }
      setIsDialogOpen(false);
      fetchMenuData(); // Re-fetch data to update the list
    } catch (err) {
      setError("Error al guardar el platillo.");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl">Cargando menú...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gestión de Menú</h1>
            <p className="text-muted-foreground">Crea y administra el menú de tu restaurante</p>
          </div>
          <Button className="gap-2" onClick={handleAddProductClick}>
            <Plus className="h-4 w-4" />
            Agregar Nuevo Platillo
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar platillos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        {categorias.map((category) => (
          <div key={category.id_categoria} className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">{category.nombre}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems
                .filter((item) => item.id_categoria === category.id_categoria)
                .map((item) => (
                  <Card key={item.id_producto} className="hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.nombre}</CardTitle>
                          <Badge
                            variant={item.stock > 0 ? "default" : "secondary"}
                            className="mt-2"
                          >
                            {item.stock > 0 ? "Disponible" : "Agotado"}
                          </Badge>
                        </div>
                        <span className="text-xl font-bold text-primary">
                          ${item.precio}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{item.descripcion}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleEditProductClick(item)}>
                          <Edit2 className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={() => handleDeleteProduct(item.id_producto)}>
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Platillo" : "Agregar Nuevo Platillo"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica los detalles del platillo." : "Introduce los detalles del nuevo platillo."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={newProductData.nombre}
                onChange={(e) => setNewProductData({ ...newProductData, nombre: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descripcion" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="descripcion"
                value={newProductData.descripcion}
                onChange={(e) => setNewProductData({ ...newProductData, descripcion: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="precio" className="text-right">
                Precio
              </Label>
              <Input
                id="precio"
                type="number"
                value={newProductData.precio}
                onChange={(e) => setNewProductData({ ...newProductData, precio: parseFloat(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock" className="text-right">
                Stock
              </Label>
              <Input
                id="stock"
                type="number"
                value={newProductData.stock}
                onChange={(e) => setNewProductData({ ...newProductData, stock: parseInt(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categoria" className="text-right">
                Categoría
              </Label>
              <Select
                value={newProductData.id_categoria}
                onValueChange={(value) => setNewProductData({ ...newProductData, id_categoria: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id_categoria} value={cat.id_categoria.toString()}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? "Guardar Cambios" : "Agregar Platillo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuManagement;

