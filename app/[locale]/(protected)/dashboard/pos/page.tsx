import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PosDashboardPage() {
  const ctx = await requireAuth();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [salesToday, ticketAgg, topProducts] = await Promise.all([
    prisma.sale.aggregate({
      where: {
        tenantId: ctx.tenantId,
        saleDate: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.sale.aggregate({
      where: {
        tenantId: ctx.tenantId,
        saleDate: {
          gte: start,
          lte: end,
        },
      },
      _avg: {
        total: true,
      },
    }),
    prisma.$queryRaw<
      Array<{
        productName: string;
        qty: Prisma.Decimal;
        revenue: Prisma.Decimal;
        profit: Prisma.Decimal;
      }>
    >`
      SELECT
        si.description AS "productName",
        SUM(si.quantity) AS qty,
        SUM(si.subtotal) AS revenue,
        SUM((si."unitPrice" - si.cost) * si.quantity) AS profit
      FROM sale_items si
      INNER JOIN sales s ON s.id = si."saleId"
      WHERE s."tenantId" = ${ctx.tenantId}::uuid
        AND s."saleDate" >= ${start}
        AND s."saleDate" <= ${end}
      GROUP BY si.description
      ORDER BY qty DESC
      LIMIT 5
    `,
  ]);

  const salesTotal = Number(salesToday._sum.total ?? 0);
  const salesCount = salesToday._count.id ?? 0;
  const avgTicket = Number(ticketAgg._avg.total ?? 0);
  const utility = topProducts.reduce(
    (acc, row) => acc + Number(row.profit ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">POS dashboard</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Ventas dia</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${salesTotal.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {salesCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ticket promedio</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${avgTicket.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Utilidad</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            ${utility.toFixed(2)}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Top productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topProducts.map((item) => (
            <div
              key={item.productName}
              className="rounded-lg border border-border/70 px-3 py-2 text-sm"
            >
              <p className="font-medium">{item.productName}</p>
              <p className="text-muted-foreground">
                Cantidad: {Number(item.qty).toFixed(2)} | Revenue: $
                {Number(item.revenue).toFixed(2)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
