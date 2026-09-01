"use client";

import { useMemo, useState } from "react";
import { PosPaymentMethod } from "@prisma/client";
import { ShoppingCartIcon } from "lucide-react";

import { PosCartPanel, type CartRow, type ProductRow } from "@/components/pos/posCartPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type PosScreenProps = {
  locationId: string;
  sessionId: string;
};

export function PosScreen({ locationId, sessionId }: PosScreenProps) {
  const [scan, setScan] = useState("");
  const [saleId, setSaleId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartRow[]>([]);
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const total = useMemo(
    () => cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [cart],
  );

  async function ensureSale() {
    if (saleId) return saleId;

    const created = await fetch("/api/pos/sales", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const payload = await created.json();
    if (!created.ok || !payload?.data?.id) {
      throw new Error(payload?.error ?? "No se pudo crear la venta POS.");
    }

    setSaleId(payload.data.id);
    return payload.data.id as string;
  }

  async function resolveCode(raw: string) {
    const response = await fetch("/api/pos/scan/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: raw }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error ?? "producto no encontrado");
    }

    return payload.data as ProductRow;
  }

  async function addFromScan(rawCode?: string) {
    const code = (rawCode ?? scan).trim();
    if (!code) return;

    setBusy(true);
    setStatus("");

    try {
      const product = await resolveCode(code);
      const resolvedSaleId = await ensureSale();

      const found = cart.find((row) => row.product.id === product.id);
      const unitPrice = Number(product.basePrice ?? 0);
      const nextQty = (found?.quantity ?? 0) + 1;

      const addItemResponse = await fetch(
        `/api/pos/sales/${resolvedSaleId}/items`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
            unitPrice,
          }),
        },
      );

      const addPayload = await addItemResponse.json();
      if (!addItemResponse.ok) {
        throw new Error(addPayload?.error ?? "No se pudo agregar al carrito.");
      }

      setCart((prev) => {
        if (found) {
          return prev.map((row) =>
            row.product.id === product.id ? { ...row, quantity: nextQty } : row,
          );
        }

        return [...prev, { product, quantity: 1, unitPrice }];
      });

      setScan("");
      setStatus(`${product.name} agregado`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "producto no encontrado";
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    if (!saleId || cart.length === 0) return;

    setBusy(true);
    setStatus("");

    try {
      const response = await fetch(`/api/pos/sales/${saleId}/checkout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          locationId,
          clientTxnId: `${saleId}-${Date.now()}`,
          payments: [
            {
              method: PosPaymentMethod.CASH,
              amount: total,
            },
          ],
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Checkout fallido.");
      }

      setCart([]);
      setSaleId(null);
      setStatus("Venta completada");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Checkout fallido.";
      setStatus(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 pb-20 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:pb-0">
      <Card>
        <CardHeader>
          <CardTitle>POS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Scanner HID: enfoca este input y escanea (input + Enter).
          </p>
          <Input
            value={scan}
            onChange={(event) => setScan(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void addFromScan();
              }
            }}
            placeholder="Escanear barcode o SKU"
            autoFocus
          />
          <div className="flex gap-2">
            <Button onClick={() => void addFromScan()} disabled={busy}>
              Agregar
            </Button>
            <Button
              variant="outline"
              onClick={() => setCart([])}
              disabled={busy}
            >
              Limpiar carrito
            </Button>
          </div>
          {status ? (
            <p className="text-sm text-muted-foreground">{status}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="hidden lg:block">
        <PosCartPanel
          cart={cart}
          total={total}
          busy={busy}
          onCheckout={() => void checkout()}
        />
      </div>

      <Sheet>
        <SheetTrigger
          render={
            <Button className="fixed inset-x-4 bottom-4 z-40 shadow-lg lg:hidden" />
          }
        >
          <ShoppingCartIcon className="size-4" />
          {cart.length > 0
            ? `Carrito (${cart.length}) · $${total.toFixed(2)}`
            : "Carrito"}
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto lg:hidden">
          <SheetHeader>
            <SheetTitle>Carrito</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <PosCartPanel
              cart={cart}
              total={total}
              busy={busy}
              onCheckout={() => void checkout()}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
