import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive button-press scale-press glow-on-hover",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:text-primary-foreground hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-white shadow-lg hover:bg-destructive/90 hover:text-white hover:shadow-xl hover:shadow-destructive/30 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 hover:-translate-y-0.5",
        outline:
          "border-2 bg-background text-foreground shadow-md hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-lg hover:-translate-y-0.5 dark:bg-input/30 dark:border-input dark:text-foreground dark:hover:bg-primary dark:hover:text-primary-foreground dark:hover:border-primary",
        secondary:
          "bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90 hover:text-secondary-foreground hover:shadow-xl hover:shadow-secondary/30 hover:-translate-y-0.5",
        ghost: "text-foreground hover:bg-primary/10 hover:text-primary hover:shadow-md hover:-translate-y-0.5 dark:hover:bg-primary/20 dark:hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-lg gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
