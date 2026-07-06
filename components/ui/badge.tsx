import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap shadow-sm transition-[background-color,border-color,color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/92",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/85",
        success: "bg-success text-success-foreground [a]:hover:bg-success/90",
        warning: "bg-warning text-warning-foreground [a]:hover:bg-warning/90",
        info: "bg-info text-info-foreground [a]:hover:bg-info/90",
        destructive:
          "bg-destructive text-destructive-foreground focus-visible:border-destructive focus-visible:ring-destructive/25 [a]:hover:bg-destructive/92",
        outline:
          "border-border bg-background text-foreground [a]:hover:bg-muted [a]:hover:text-foreground",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground shadow-none",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
