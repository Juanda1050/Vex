import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  basePrice: string | number;
};

type CartRow = {
  product: ProductRow;
  quantity: number;
  unitPrice: number;
};

type PosCartPanelProps = {
  cart: CartRow[];
  total: number;
  busy: boolean;
  onCheckout: () => void;
};

function PosCartPanel({ cart, total, busy, onCheckout }: PosCartPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrito</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-80 space-y-2 overflow-auto pr-2">
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin productos.</p>
          ) : (
            cart.map((row) => (
              <div
                key={row.product.id}
                className="rounded-lg border border-border/70 p-3 text-sm"
              >
                <p className="font-medium">{row.product.name}</p>
                <p className="text-muted-foreground">
                  {row.quantity} x ${row.unitPrice.toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="rounded-lg border border-border/70 p-3">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold">${total.toFixed(2)}</p>
        </div>

        <Button
          className="w-full"
          onClick={onCheckout}
          disabled={busy || cart.length === 0}
        >
          Checkout
        </Button>
      </CardContent>
    </Card>
  );
}

export { PosCartPanel };
export type { CartRow, ProductRow };
