import { useEffect, useState } from "react";
import { Users, Calendar, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { getMesas, getReservas, createReserva, updateMesa, getClientes, updateReserva } from "../lib/api";

interface Mesa {
  id_mesa: number;
  numero_mesa: number;
  capacidad: number;
  estado: "disponible" | "ocupada" | "reservada";
  currentGuests?: number; // Added currentGuests
}

interface Reserva {
  id_reserva: number;
  id_cliente: number;
  id_mesa: number;
  fecha_hora: string;
  numero_personas: number;
  estado: "confirmada" | "cancelada";
}

interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
}

interface EnhancedTable extends Mesa {
  currentGuests?: number;
  reservationTime?: string;
  activeReservation?: Reserva;
}

const TableManagement = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false); // New state for assign dialog
  const [assignError, setAssignError] = useState<string | null>(null); // New state for assign error
  const [reservationError, setReservationError] = useState<string | null>(null); // New state for reservation error
  const [selectedTable, setSelectedTable] = useState<EnhancedTable | null>(null);
  const [assignTableData, setAssignTableData] = useState<{ id_mesa: number; numero_personas: number } | null>(null); // New state for assign data
  const [newReservationData, setNewReservationData] = useState({
    id_cliente: "",
    id_mesa: "",
    fecha_hora: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
    numero_personas: 1,
    estado: "confirmada",
  });

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const [fetchedMesas, fetchedReservas, fetchedClientes] = await Promise.all([
        getMesas(),
        getReservas(),
        getClientes(),
      ]);
      setMesas(fetchedMesas);
      console.log("Fetched Mesas:", fetchedMesas); // Debug log
      setReservas(fetchedReservas);
      console.log("Fetched Reservas:", fetchedReservas); // Debug log
      setClientes(fetchedClientes);
    } catch (err) {
      setError("Error al cargar los datos de mesas.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const getClientName = (id_cliente: number) => {
    const cliente = clientes.find((c) => c.id_cliente === id_cliente);
    return cliente ? `${cliente.nombre} ${cliente.apellido || ""}`.trim() : "Desconocido";
  };

  const enhancedTables: EnhancedTable[] = mesas.map((mesa) => {
    console.log("Original Mesa:", mesa); // Debug log
    const activeReservation = reservas.find(
      (reserva) =>
        reserva.id_mesa === mesa.id_mesa &&
        reserva.estado === "confirmada" &&
        new Date(reserva.fecha_hora) > new Date() // Only consider future or current reservations
    );
    console.log("Active Reservation for Mesa", mesa.id_mesa, ":", activeReservation); // Debug log

    const enhanced = {
      ...mesa,
      currentGuests:
        mesa.estado === "disponible"
          ? 0
          : mesa.estado === "ocupada"
          ? mesa.currentGuests
          : activeReservation
          ? activeReservation.numero_personas
          : 0,
      reservationTime: activeReservation
        ? new Date(activeReservation.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined,
      activeReservation: activeReservation || undefined,
    };
    console.log("Enhanced Table:", enhanced); // Debug log
    return enhanced;
  });

  const getStatusColor = (status: Mesa["estado"]) => {
    switch (status) {
      case "disponible":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "ocupada":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "reservada":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const availableTablesCount = enhancedTables.filter(t => t.estado === "disponible").length;
  const occupiedTablesCount = enhancedTables.filter(t => t.estado === "ocupada").length;
  const reservedTablesCount = enhancedTables.filter(t => t.estado === "reservada").length;

  const handleNewReservationClick = (mesaId?: number) => {
    setNewReservationData({
      id_cliente: "",
      id_mesa: mesaId ? mesaId.toString() : "",
      fecha_hora: new Date().toISOString().slice(0, 16),
      numero_personas: 1,
      estado: "confirmada",
    });
    setIsReservationDialogOpen(true);
  };

  const handleSaveReservation = async () => {
    setReservationError(null); // Clear previous errors

    if (!newReservationData.id_mesa) {
      setReservationError("Por favor, selecciona una mesa.");
      return;
    }

    const selectedMesa = mesas.find(m => m.id_mesa === parseInt(newReservationData.id_mesa));
    if (!selectedMesa) {
      setReservationError("Mesa seleccionada no encontrada.");
      return;
    }

    if (newReservationData.numero_personas > selectedMesa.capacidad) {
      setReservationError(`El número de personas excede la capacidad de la mesa (${selectedMesa.capacidad}).`);
      setTimeout(() => setReservationError(null), 3000); // Clear error after 3 seconds
      return;
    }

    try {
      const reservationToSave = {
        ...newReservationData,
        id_cliente: parseInt(newReservationData.id_cliente),
        id_mesa: parseInt(newReservationData.id_mesa),
        numero_personas: parseInt(newReservationData.numero_personas.toString()),
      };
      await createReserva(reservationToSave);

      // Update table status to 'reservada'
      const reservedTable = mesas.find(m => m.id_mesa === reservationToSave.id_mesa);
      if (reservedTable) {
        await updateMesa(reservedTable.id_mesa, { ...reservedTable, estado: "reservada" });
      }

      setIsReservationDialogOpen(false);
      fetchTableData(); // Re-fetch data to update the list
    } catch (err) {
      setReservationError("Error al guardar la reserva.");
      console.error(err);
    }
  };

  const handleSaveAssignment = async () => {
    if (!assignTableData || !selectedTable) return;

    setAssignError(null); // Clear previous errors

    const { id_mesa, numero_personas } = assignTableData;

    if (isNaN(numero_personas) || numero_personas <= 0) {
      setAssignError("Por favor, introduce un número válido de personas.");
      return;
    }

    if (numero_personas > selectedTable.capacidad) {
      setAssignError(`El número de personas excede la capacidad de la mesa (${selectedTable.capacidad}).`);
      setTimeout(() => setAssignError(null), 3000); // Clear error after 3 seconds
      return;
    }

    try {
      await updateMesa(id_mesa, { ...selectedTable, estado: "ocupada", currentGuests: numero_personas });
      setIsAssignDialogOpen(false);
      fetchTableData(); // Re-fetch data to update the list
    } catch (err) {
      setAssignError("Error al asignar la mesa.");
      console.error(err);
    }
  };

  const handleAssignTable = (table: Mesa) => {
    setSelectedTable(table); // Set the table to be assigned
    setAssignTableData({ id_mesa: table.id_mesa, numero_personas: 1 });
    setIsAssignDialogOpen(true);
  };

  const handleVacateTable = async (table: Mesa) => {
    if (window.confirm(`¿Estás seguro de que quieres desocupar la Mesa ${table.numero_mesa} (marcar como disponible)?`)) {
      try {
        // Update table status and currentGuests
        await updateMesa(table.id_mesa, { ...table, estado: "disponible", currentGuests: 0 });

        // Find and cancel any active reservation for this table
        const activeReservation = reservas.find(
          (reserva) =>
            reserva.id_mesa === table.id_mesa &&
            reserva.estado === "confirmada" &&
            new Date(reserva.fecha_hora) > new Date()
        );

        if (activeReservation) {
          await updateReserva(activeReservation.id_reserva, { ...activeReservation, estado: "cancelada" });
        }

        setIsDetailsDialogOpen(false); // Close details dialog after vacating
        fetchTableData(); // Re-fetch data to update the list
      } catch (err) {
        setError("Error al desocupar la mesa.");
        console.error(err);
      }
    }
  };

  const handleViewDetails = (table: EnhancedTable) => {
    setSelectedTable(table);
    setIsDetailsDialogOpen(true);
  };

  if (loading) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl">Cargando mesas...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background p-6 flex justify-center items-center text-2xl text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gestión de Mesas</h1>
            <p className="text-muted-foreground">Monitorea disposición de asientos y reservas</p>
          </div>
          <Button onClick={handleNewReservationClick}>Nueva Reserva</Button>
        </div>

        {/* Table Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mesas Disponibles</p>
                  <p className="text-3xl font-bold text-green-500">{availableTablesCount}</p>
                </div>
                <Users className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mesas Ocupadas</p>
                  <p className="text-3xl font-bold text-red-500">{occupiedTablesCount}</p>
                </div>
                <Users className="h-10 w-10 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mesas Reservadas</p>
                  <p className="text-3xl font-bold text-blue-500">{reservedTablesCount}</p>
                </div>
                <Calendar className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Disposición del Salón</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {enhancedTables.map((table) => (
            <Card
              key={table.id_mesa}
              className={`hover:shadow-lg transition-all cursor-pointer ${
                table.estado === "disponible" ? "hover:border-green-500" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-2xl font-bold text-foreground">
                        {table.numero_mesa}
                      </span>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(table.estado)}>
                    {table.estado === "disponible" ? "Disponible" : table.estado === "ocupada" ? "Ocupada" : "Reservada"}
                  </Badge>

                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>
                        {table.currentGuests || 0}/{table.capacidad}
                      </span>
                    </div>
                    
                    {table.reservationTime && (
                      <div className="flex items-center justify-center gap-1 text-sm text-primary">
                        <Clock className="h-3 w-3" />
                        <span>{table.reservationTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    {table.estado === "disponible" && (
                      <Button size="sm" onClick={() => handleAssignTable(table)}>
                        Asignar
                      </Button>
                    )}
                    {table.estado === "reservada" && (
                      <Button size="sm" onClick={() => handleNewReservationClick(table.id_mesa)}>
                        Ver/Editar Reserva
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(table)}>
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* New Reservation Dialog */}
      <Dialog open={isReservationDialogOpen} onOpenChange={setIsReservationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
            <DialogDescription>
              Crea una nueva reserva para una mesa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {reservationError && <div className="text-red-500 text-sm col-span-4">{reservationError}</div>}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="id_cliente" className="text-right">
                Cliente
              </Label>
              <Select
                value={newReservationData.id_cliente}
                onValueChange={(value) => setNewReservationData({ ...newReservationData, id_cliente: value })}
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
              <Label htmlFor="id_mesa" className="text-right">
                Mesa
              </Label>
              <Select
                value={newReservationData.id_mesa}
                onValueChange={(value) => setNewReservationData({ ...newReservationData, id_mesa: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una mesa" />
                </SelectTrigger>
                <SelectContent>
                  {mesas.filter(m => m.estado === "disponible" || m.id_mesa.toString() === newReservationData.id_mesa).map((mesa) => (
                    <SelectItem key={mesa.id_mesa} value={mesa.id_mesa.toString()}>
                      Mesa {mesa.numero_mesa} (Capacidad: {mesa.capacidad})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha_hora" className="text-right">
                Fecha y Hora
              </Label>
              <Input
                id="fecha_hora"
                type="datetime-local"
                value={newReservationData.fecha_hora}
                onChange={(e) => setNewReservationData({ ...newReservationData, fecha_hora: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numero_personas" className="text-right">
                Personas
              </Label>
              <Input
                id="numero_personas"
                type="number"
                value={newReservationData.numero_personas}
                onChange={(e) => setNewReservationData({ ...newReservationData, numero_personas: parseInt(e.target.value) || 1 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estado" className="text-right">
                Estado
              </Label>
              <Select
                value={newReservationData.estado}
                onValueChange={(value) => setNewReservationData({ ...newReservationData, estado: value as Reserva["estado"] })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {["confirmada", "cancelada"].map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReservationDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveReservation}>
              Guardar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Table Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Mesa {selectedTable?.numero_mesa}</DialogTitle>
            <DialogDescription>
              Introduce el número de personas para esta mesa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {assignError && <div className="text-red-500 text-sm col-span-4">{assignError}</div>}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assign_numero_personas" className="text-right">
                Personas
              </Label>
              <Input
                id="assign_numero_personas"
                type="number"
                value={assignTableData?.numero_personas || 1}
                onChange={(e) => setAssignTableData(prev => prev ? { ...prev, numero_personas: parseInt(e.target.value) || 1 } : null)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAssignment}>
              Asignar Mesa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Detalles de Mesa {selectedTable?.numero_mesa}</DialogTitle>
            <DialogDescription>
              Información detallada sobre la mesa y su estado actual.
            </DialogDescription>
          </DialogHeader>
          {selectedTable && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Número de Mesa:</span>
                <span>{selectedTable.numero_mesa}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Capacidad:</span>
                <span>{selectedTable.capacidad} personas</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Estado:</span>
                <Badge className={getStatusColor(selectedTable.estado)}>
                  {selectedTable.estado.charAt(0).toUpperCase() + selectedTable.estado.slice(1)}
                </Badge>
              </div>
              {selectedTable.activeReservation && (
                <>
                  <h3 className="text-lg font-semibold mt-4">Reserva Activa</h3>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="font-medium">Cliente:</span>
                    <span>{getClientName(selectedTable.activeReservation.id_cliente)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="font-medium">Fecha y Hora:</span>
                    <span>{new Date(selectedTable.activeReservation.fecha_hora).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="font-medium">Personas:</span>
                    <span>{selectedTable.activeReservation.numero_personas}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="font-medium">Estado Reserva:</span>
                    <span>{selectedTable.activeReservation.estado}</span>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            {(selectedTable?.estado === "ocupada" || selectedTable?.estado === "reservada") && (
              <Button variant="destructive" onClick={() => selectedTable && handleVacateTable(selectedTable)}>
                Desocupar Mesa
              </Button>
            )}
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TableManagement;

