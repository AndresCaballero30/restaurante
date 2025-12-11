import { useEffect, useState } from "react";
import { Package, AlertTriangle, TrendingDown, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProductos, getCategoriasProducto, createProducto, updateProducto, deleteProducto, createCategoriaProducto, updateCategoriaProducto, deleteCategoriaProducto } from "../lib/api";

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

interface InventoryItem extends Producto {
  reorderLevel: number; // Assuming a default reorder level for now
}

const InventoryManagement = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [productFormData, setProductFormData] = useState<Producto>({
    id_producto: 0,
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    id_categoria: 0,
  });

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoriaProducto | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<CategoriaProducto>({
    id_categoria: 0,
    nombre: "",
  });

  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<number | null>(null);
  const [newCategoryIdForReassign, setNewCategoryIdForReassign] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedProductos = await getProductos();
      const fetchedCategorias = await getCategoriasProducto();
      setProductos(fetchedProductos);
      setCategorias(fetchedCategorias);
    } catch (err) {
      setError("Error al cargar los datos del inventario.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const inventory: InventoryItem[] = productos.map(p => ({
    ...p,
    reorderLevel: 10, // Default reorder level, can be made configurable
  }));

  const getCategoryName = (id_categoria: number) => {
    const category = categorias.find(cat => cat.id_categoria === id_categoria);
    return category ? category.nombre : "Desconocida";
  };

  const lowStockItems = inventory.filter(item => item.stock <= item.reorderLevel);
  const uniqueCategories = Array.from(new Set(categorias.map(item => item.nombre)));

  const getStockPercentage = (quantity: number, reorderLevel: number) => {
    // Calculate percentage relative to reorder level, maxing at 100%
    return Math.min(100, (quantity / (reorderLevel * 2)) * 100);
  };

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= reorderLevel * 0.5) return "critical";
    if (quantity <= reorderLevel) return "low";
    return "good";
  };

  const handleOpenProductDialog = (product?: Producto) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData(product);
    } else {
      setEditingProduct(null);
      setProductFormData({
        id_producto: 0,
        nombre: "",
        descripcion: "",
        precio: 0,
        stock: 0,
        id_categoria: categorias[0]?.id_categoria || 0, // Default to first category
      });
    }
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        await updateProducto(editingProduct.id_producto, productFormData);
      } else {
        await createProducto(productFormData);
      }
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      setProductFormData({
        id_producto: 0,
        nombre: "",
        descripcion: "",
        precio: 0,
        stock: 0,
        id_categoria: 0,
      });
      fetchData(); // Re-fetch data to update the list
    } catch (err) {
      setError("Error al guardar el producto.");
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id_producto: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        await deleteProducto(id_producto);
        fetchData(); // Re-fetch data to update the list
      } catch (err) {
        setError("Error al eliminar el producto.");
        console.error(err);
      }
    }
  };

  const handleOpenCategoryDialog = (category?: CategoriaProducto) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData(category);
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        id_categoria: 0,
        nombre: "",
      });
    }
    setIsCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await updateCategoriaProducto(editingCategory.id_categoria, categoryFormData);
      } else {
        await createCategoriaProducto(categoryFormData);
      }
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryFormData({
        id_categoria: 0,
        nombre: "",
      });
      fetchData(); // Re-fetch data to update the list
    } catch (err) {
      setError("Error al guardar la categoría.");
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id_categoria: number) => {
    const productsInCategory = productos.filter(p => p.id_categoria === id_categoria);

    if (productsInCategory.length > 0) {
      setCategoryToDeleteId(id_categoria);
      setIsReassignDialogOpen(true);
    } else {
      if (window.confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
        try {
          await deleteCategoriaProducto(id_categoria);
          fetchData(); // Re-fetch data to update the list
        } catch (err) {
          setError("Error al eliminar la categoría.");
          console.error(err);
        }
      }
    }
  };

  const handleReassignProductsAndDeleteCategory = async () => {
    if (categoryToDeleteId === null || newCategoryIdForReassign === null) return;

    try {
      // Update products to new category
      const productsToReassign = productos.filter(p => p.id_categoria === categoryToDeleteId);
      await Promise.all(productsToReassign.map(p =>
        updateProducto(p.id_producto, { ...p, id_categoria: newCategoryIdForReassign })
      ));

      // Delete the original category
      await deleteCategoriaProducto(categoryToDeleteId);

      setIsReassignDialogOpen(false);
      setCategoryToDeleteId(null);
      setNewCategoryIdForReassign(null);
      fetchData(); // Re-fetch data to update the list
    } catch (err) {
      setError("Error al reasignar productos y eliminar categoría.");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl">Cargando inventario...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gestión de Inventario</h1>
            <p className="text-muted-foreground">Rastrea niveles de stock y gestiona productos</p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2" onClick={() => handleOpenProductDialog()}>
              <Plus className="h-4 w-4" />
              Agregar Producto
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleOpenCategoryDialog()}>
              <Plus className="h-4 w-4" />
              Agregar Categoría
            </Button>
          </div>
        </div>

        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Productos Totales</p>
                  <p className="text-3xl font-bold text-foreground">{productos.length}</p>
                </div>
                <Package className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-destructive/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alertas de Stock Bajo</p>
                  <p className="text-3xl font-bold text-destructive">{lowStockItems.length}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categorías</p>
                  <p className="text-3xl font-bold text-foreground">{uniqueCategories.length}</p>
                </div>
                <TrendingDown className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="mb-8 border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Alerta de Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.id_producto} className="flex items-center justify-between">
                    <span className="text-foreground font-medium">{item.nombre}</span>
                    <Badge variant="destructive">
                      {item.stock} unidades restantes
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory by Category */}
        {categorias.map((category) => (
          <div key={category.id_categoria} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">{category.nombre}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenCategoryDialog(category)}>
                  Editar Categoría
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id_categoria)}>
                  Eliminar Categoría
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory
                .filter((item) => item.id_categoria === category.id_categoria)
                .map((item) => {
                  const stockStatus = getStockStatus(item.stock, item.reorderLevel);
                  const stockPercentage = getStockPercentage(item.stock, item.reorderLevel);

                  return (
                    <Card key={item.id_producto} className="hover:shadow-lg transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{item.nombre}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {/* Proveedor: {item.supplier} */}
                            </p>
                          </div>
                          <Badge
                            variant={
                              stockStatus === "critical"
                                ? "destructive"
                                : stockStatus === "low"
                                ? "secondary"
                                : "default"
                            }
                          >
                            {item.stock} unidades
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Nivel de Stock</span>
                              <span className="text-foreground font-medium">
                                {stockPercentage.toFixed(0)}%
                              </span>
                            </div>
                            <Progress
                              value={stockPercentage}
                              className={
                                stockStatus === "critical"
                                  ? "[&>div]:bg-destructive"
                                  : stockStatus === "low"
                                  ? "[&>div]:bg-yellow-500"
                                  : "[&>div]:bg-green-500" // Changed to green for good stock
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Reordenar en:</span>
                            <span className="text-foreground">
                              {item.reorderLevel} unidades
                            </span>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenProductDialog(item)}>
                              Editar
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteProduct(item.id_producto)}>
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
        ))}
      </div>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Edita los detalles del producto." : "Agrega un nuevo producto al inventario."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={productFormData.nombre}
                onChange={(e) => setProductFormData({ ...productFormData, nombre: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descripcion" className="text-right">
                Descripción
              </Label>
              <Input
                id="descripcion"
                value={productFormData.descripcion}
                onChange={(e) => setProductFormData({ ...productFormData, descripcion: e.target.value })}
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
                value={productFormData.precio}
                onChange={(e) => setProductFormData({ ...productFormData, precio: parseFloat(e.target.value) || 0 })}
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
                value={productFormData.stock}
                onChange={(e) => setProductFormData({ ...productFormData, stock: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id_categoria" className="text-right">
                Categoría
              </Label>
              <Select
                value={productFormData.id_categoria.toString()}
                onValueChange={(value) => setProductFormData({ ...productFormData, id_categoria: parseInt(value) })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((category) => (
                    <SelectItem key={category.id_categoria} value={category.id_categoria.toString()}>
                      {category.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? "Guardar Cambios" : "Agregar Producto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoría" : "Agregar Categoría"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Edita el nombre de la categoría." : "Agrega una nueva categoría de producto."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre-categoria" className="text-right">
                Nombre
              </Label>
              <Input
                id="nombre-categoria"
                value={categoryFormData.nombre}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, nombre: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? "Guardar Cambios" : "Agregar Categoría"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Products Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reasignar Productos</DialogTitle>
            <DialogDescription>
              Esta categoría tiene productos asociados. Por favor, reasigna estos productos a otra categoría antes de eliminarla.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-category" className="text-right">
                Nueva Categoría
              </Label>
              <Select
                value={newCategoryIdForReassign?.toString() || ""}
                onValueChange={(value) => setNewCategoryIdForReassign(parseInt(value))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias
                    .filter((cat) => cat.id_categoria !== categoryToDeleteId) // Cannot reassign to itself
                    .map((category) => (
                      <SelectItem key={category.id_categoria} value={category.id_categoria.toString()}>
                        {category.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReassignProductsAndDeleteCategory} disabled={newCategoryIdForReassign === null}>
              Reasignar y Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;
