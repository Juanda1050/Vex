export const STEP_KEYS = [
  "dashboard",
  "products",
  "customers",
  "quotes",
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export interface TutorialExampleMetric {
  labelKey: string;
  value: string;
  accent: string;
}

export interface TutorialExampleRow {
  titleKey: string;
  subtitleKey: string;
  statusKey: string;
  amount: string;
}

export interface TutorialStepExample {
  sectionKey: string;
  metrics: TutorialExampleMetric[];
  rows: TutorialExampleRow[];
}

export const STEP_EXAMPLES: Record<StepKey, TutorialStepExample> = {
  dashboard: {
    sectionKey: "preview.sections.dashboard",
    metrics: [
      {
        labelKey: "preview.metrics.sales",
        value: "$42.8k",
        accent: "bg-success/15 text-success",
      },
      {
        labelKey: "preview.metrics.orders",
        value: "186",
        accent: "bg-info/15 text-info",
      },
      {
        labelKey: "preview.metrics.margin",
        value: "27%",
        accent: "bg-primary/15 text-primary",
      },
    ],
    rows: [
      {
        titleKey: "preview.rows.dailySummary.title",
        subtitleKey: "preview.rows.dailySummary.subtitle",
        statusKey: "preview.rows.dailySummary.status",
        amount: "+12.4%",
      },
      {
        titleKey: "preview.rows.topProducts.title",
        subtitleKey: "preview.rows.topProducts.subtitle",
        statusKey: "preview.rows.topProducts.status",
        amount: "$8.9k",
      },
    ],
  },
  products: {
    sectionKey: "preview.sections.inventory",
    metrics: [
      {
        labelKey: "preview.metrics.sku",
        value: "248",
        accent: "bg-primary/15 text-primary",
      },
      {
        labelKey: "preview.metrics.lowStock",
        value: "16",
        accent: "bg-warning/20 text-warning",
      },
      {
        labelKey: "preview.metrics.newItems",
        value: "34",
        accent: "bg-info/15 text-info",
      },
    ],
    rows: [
      {
        titleKey: "preview.rows.headphones.title",
        subtitleKey: "preview.rows.headphones.subtitle",
        statusKey: "preview.rows.headphones.status",
        amount: "$129",
      },
      {
        titleKey: "preview.rows.monitor.title",
        subtitleKey: "preview.rows.monitor.subtitle",
        statusKey: "preview.rows.monitor.status",
        amount: "$319",
      },
    ],
  },
  customers: {
    sectionKey: "preview.sections.customers",
    metrics: [
      {
        labelKey: "preview.metrics.active",
        value: "1,284",
        accent: "bg-success/15 text-success",
      },
      {
        labelKey: "preview.metrics.newCustomers",
        value: "72",
        accent: "bg-info/15 text-info",
      },
      {
        labelKey: "preview.metrics.returning",
        value: "64%",
        accent: "bg-primary/15 text-primary",
      },
    ],
    rows: [
      {
        titleKey: "preview.rows.rivera.title",
        subtitleKey: "preview.rows.rivera.subtitle",
        statusKey: "preview.rows.rivera.status",
        amount: "$2.1k",
      },
      {
        titleKey: "preview.rows.nova.title",
        subtitleKey: "preview.rows.nova.subtitle",
        statusKey: "preview.rows.nova.status",
        amount: "$860",
      },
    ],
  },
  quotes: {
    sectionKey: "preview.sections.quotes",
    metrics: [
      {
        labelKey: "preview.metrics.open",
        value: "23",
        accent: "bg-info/15 text-info",
      },
      {
        labelKey: "preview.metrics.accepted",
        value: "11",
        accent: "bg-success/15 text-success",
      },
      {
        labelKey: "preview.metrics.pipeline",
        value: "$19.4k",
        accent: "bg-primary/15 text-primary",
      },
    ],
    rows: [
      {
        titleKey: "preview.rows.quote184.title",
        subtitleKey: "preview.rows.quote184.subtitle",
        statusKey: "preview.rows.quote184.status",
        amount: "$3.4k",
      },
      {
        titleKey: "preview.rows.quote187.title",
        subtitleKey: "preview.rows.quote187.subtitle",
        statusKey: "preview.rows.quote187.status",
        amount: "$2.8k",
      },
    ],
  },
};
