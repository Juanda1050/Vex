export const STEP_KEYS = [
  "dashboard",
  "products",
  "customers",
  "quotes",
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export interface TutorialExampleMetric {
  label: string;
  value: string;
  accent: string;
}

export interface TutorialExampleRow {
  title: string;
  subtitle: string;
  status: string;
  amount: string;
}

export interface TutorialStepExample {
  section: string;
  metrics: TutorialExampleMetric[];
  rows: TutorialExampleRow[];
}

export const STEP_EXAMPLES: Record<StepKey, TutorialStepExample> = {
  dashboard: {
    section: "Dashboard",
    metrics: [
      {
        label: "Ventas",
        value: "$42.8k",
        accent: "bg-success/15 text-success",
      },
      { label: "Pedidos", value: "186", accent: "bg-info/15 text-info" },
      { label: "Margen", value: "27%", accent: "bg-primary/15 text-primary" },
    ],
    rows: [
      {
        title: "Resumen diario",
        subtitle: "Rendimiento por canal",
        status: "Actualizado",
        amount: "+12.4%",
      },
      {
        title: "Top productos",
        subtitle: "Rotacion semanal",
        status: "Activo",
        amount: "$8.9k",
      },
    ],
  },
  products: {
    section: "Inventario",
    metrics: [
      { label: "SKU", value: "248", accent: "bg-primary/15 text-primary" },
      {
        label: "Stock bajo",
        value: "16",
        accent: "bg-warning/20 text-warning",
      },
      { label: "Nuevos", value: "34", accent: "bg-info/15 text-info" },
    ],
    rows: [
      {
        title: "Auriculares Pro",
        subtitle: "Categoria: Audio",
        status: "Disponible",
        amount: "$129",
      },
      {
        title: 'Monitor 27"',
        subtitle: "Categoria: Oficina",
        status: "Stock bajo",
        amount: "$319",
      },
    ],
  },
  customers: {
    section: "Clientes",
    metrics: [
      {
        label: "Activos",
        value: "1,284",
        accent: "bg-success/15 text-success",
      },
      { label: "Nuevos", value: "72", accent: "bg-info/15 text-info" },
      {
        label: "Recurrentes",
        value: "64%",
        accent: "bg-primary/15 text-primary",
      },
    ],
    rows: [
      {
        title: "Comercial Rivera",
        subtitle: "Ultima compra: hace 3 dias",
        status: "Premium",
        amount: "$2.1k",
      },
      {
        title: "Nova Studio",
        subtitle: "Ultima compra: hoy",
        status: "Activo",
        amount: "$860",
      },
    ],
  },
  quotes: {
    section: "Cotizaciones",
    metrics: [
      { label: "Abiertas", value: "23", accent: "bg-info/15 text-info" },
      { label: "Aceptadas", value: "11", accent: "bg-success/15 text-success" },
      {
        label: "Pipeline",
        value: "$19.4k",
        accent: "bg-primary/15 text-primary",
      },
    ],
    rows: [
      {
        title: "Q-2026-184",
        subtitle: "Paquete corporativo",
        status: "Pendiente",
        amount: "$3.4k",
      },
      {
        title: "Q-2026-187",
        subtitle: "Renovacion anual",
        status: "En revision",
        amount: "$2.8k",
      },
    ],
  },
};
