import { requireAuth } from "@/server/auth";
import { getBillingFeaturesForTenant } from "@/server/plans";
import { PageHeader } from "@/components/layout/page-header";
import { getModuleIcon } from "@/lib/modules/module-icons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BillingFeaturesPage() {
  const ctx = await requireAuth();
  const features = await getBillingFeaturesForTenant(ctx.tenantId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing features"
        description={`Current plan: ${features.planCode}`}
        icon={getModuleIcon("billing")}
      />

      <Card className="rounded-[1.75rem] surface-1 p-1 ">
        <CardHeader>
          <CardTitle>Features &amp; limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {features.features.map((feature) => (
            <div
              key={feature.key}
              className="flex items-center justify-between rounded-lg border border-border/70 bg-background/40 px-3 py-2.5 text-sm"
            >
              <span className="font-medium text-foreground">{feature.key}</span>
              {feature.limit === null ? (
                <Badge variant={feature.enabled ? "success" : "secondary"}>
                  {feature.enabled ? "Enabled" : "Disabled"}
                </Badge>
              ) : (
                <span className="text-muted-foreground">
                  Limit: {feature.limit}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
