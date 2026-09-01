import { prisma } from "@/lib/prisma";
import { PosScreen } from "@/components/pos/posScreen";
import { requirePermission } from "@/server/auth";

export default async function PosPage() {
  const ctx = await requirePermission("sales.create");

  const location = await prisma.location.findFirst({
    where: {
      tenantId: ctx.tenantId,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!location) {
    return (
      <div className="rounded-xl border border-border/70 p-5 text-sm text-muted-foreground">
        No hay ubicaciones configuradas. Crea una en seed o desde configuracion.
      </div>
    );
  }

  const openSession = await prisma.cashRegisterSession.findFirst({
    where: {
      tenantId: ctx.tenantId,
      locationId: location.id,
      status: "OPEN",
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  if (!openSession) {
    return (
      <div className="space-y-3 rounded-xl border border-border/70 p-5">
        <h1 className="text-xl font-semibold">POS</h1>
        <p className="text-sm text-muted-foreground">
          No hay caja abierta. Ve a /pos/register para abrir una sesion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Punto de venta</h1>
        <p className="text-sm text-muted-foreground">
          Sesion activa: {openSession.registerName}
        </p>
      </header>

      <PosScreen locationId={location.id} sessionId={openSession.id} />
    </div>
  );
}
