import Link from "next/link";
import { Activity, ArrowRight, Boxes, ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardModulePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tDashboard = await getTranslations("mvp.dashboard");
  const tModules = await getTranslations("mvp.modules");
  const tProducts = await getTranslations("products");
  const tCustomers = await getTranslations("customers");
  const tInventory = await getTranslations("inventory");
  const tQuotes = await getTranslations("quotes");
  const tNav = await getTranslations("nav");

  const dashboardModules = [
    {
      title: tCustomers("title"),
      description: tModules("customersDescription"),
      apiPath: "/api/customers",
      service: "server/customers/service/customer.service.ts",
    },
    {
      title: tProducts("title"),
      description: tModules("productsDescription"),
      apiPath: "/api/products",
      service: "server/products/service/product.service.ts",
    },
    {
      title: tInventory("title"),
      description: tModules("inventoryDescription"),
      apiPath: "/api/inventory",
      service: "server/inventory/service/inventory.service.ts",
    },
    {
      title: tQuotes("title"),
      description: tModules("quotesDescription"),
      apiPath: "/api/quotes",
      service: "server/quotes/service/quote.service.ts",
    },
    {
      title: tNav("settings"),
      description: tModules("subscriptionsDescription"),
      apiPath: `/${locale}/settings`,
      service: "app/[locale]/(protected)/settings/page.tsx",
    },
  ] as const;

  return (
    <Card className="glass-panel glass-glow border-primary/25 bg-linear-to-br from-card/80 via-card/70 to-primary/12">
      <CardHeader>
        <Badge variant="info" className="w-fit gap-1">
          <Activity className="size-3.5" />
          {tDashboard("badge")}
        </Badge>
        <CardTitle>{tNav("dashboard")}</CardTitle>
        <CardDescription>{tDashboard("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {dashboardModules.map((item) => (
            <div
              key={item.title}
              className="glass-soft rounded-xl px-3 py-3 text-sm"
            >
              <div className="flex items-start gap-2">
                <Boxes className="mt-0.5 size-3.5 text-primary" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tDashboard("serviceLabel")}: {item.service}
                  </p>
                  <Link
                    href={item.apiPath}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {tDashboard("openApi")}
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Link
          href={`/${locale}/login`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {tDashboard("backToLogin")}
        </Link>
        <Link href={`/${locale}`} className={buttonVariants({ size: "sm" })}>
          {tDashboard("backToHub")}
          <ArrowRight className="size-3.5" />
        </Link>
      </CardFooter>
    </Card>
  );
}
