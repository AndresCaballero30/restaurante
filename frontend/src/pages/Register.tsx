import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        toast.success("Usuario registrado exitosamente");
        navigate("/login");
      } else {
        const { message } = await response.json();
        setError(message);
        toast.error(message);
      }
    } catch (err) {
      const errorMessage = "Error al registrarse.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center items-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Registrarse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Elige un nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Elige una contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button onClick={handleRegister} className="w-full">
              Registrarse
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              ¿Ya tienes una cuenta? Inicia Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
