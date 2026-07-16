import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function PosRegisterPage() {
  const ctx = await requirePermission("sales.create");

  const [location, sessions] = await Promise.all([
    prisma.location.findFirst({
      where: { tenantId: ctx.tenantId, isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cashRegisterSession.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { openedAt: "desc" },
      take: 10,
    }),
  ]);

  if (!location) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay ubicaciones activas.
      </p>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Abrir caja</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/api/pos/register/open"
            method="post"
            className="space-y-3"
          >
            <input type="hidden" name="locationId" value={location.id} />
            <div className="grid gap-2">
              <Label htmlFor="registerName">Nombre de caja</Label>
              <Input
                id="registerName"
                name="registerName"
                defaultValue="Caja principal"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="openingFloatAmount">Fondo inicial</Label>
              <Input
                id="openingFloatAmount"
                name="openingFloatAmount"
                type="number"
                defaultValue="0"
                step="0.01"
              />
            </div>
            <Button type="submit">Abrir</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cierre de caja</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/api/pos/register/close"
            method="post"
            className="space-y-3"
          >
            <div className="grid gap-2">
              <Label htmlFor="sessionId">Sesion</Label>
              <Input
                id="sessionId"
                name="sessionId"
                placeholder="UUID de sesion abierta"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="closingAmount">Monto de cierre</Label>
              <Input
                id="closingAmount"
                name="closingAmount"
                type="number"
                step="0.01"
                required
              />
            </div>
            <Button type="submit" variant="outline">
              Cerrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Resumen de sesiones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border border-border/70 p-3 text-sm"
            >
              <p className="font-medium">{session.registerName}</p>
              <p className="text-muted-foreground">
                {session.status} | Abierta{" "}
                {new Date(session.openedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
