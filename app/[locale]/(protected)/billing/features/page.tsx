import { requireAuth } from "@/server/auth";
import { getBillingFeaturesForTenant } from "@/server/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BillingFeaturesPage() {
  const ctx = await requireAuth();
  const features = await getBillingFeaturesForTenant(ctx.tenantId);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Billing features</h1>
        <p className="text-sm text-muted-foreground">
          Plan actual: {features.planCode}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Features y limites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {features.features.map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm"
            >
              <span>{feature.key}</span>
              <span className="text-muted-foreground">
                {feature.limit === null
                  ? feature.enabled
                    ? "enabled"
                    : "disabled"
                  : `limit ${feature.limit}`}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
