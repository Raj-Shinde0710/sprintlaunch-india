import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:-translate-y-0.5",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-0.5",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        founder: "bg-gradient-to-r from-founder to-founder-glow text-white hover:shadow-[0_8px_30px_hsl(24_95%_53%/0.35)] hover:-translate-y-1",
        builder: "bg-gradient-to-r from-builder to-builder-glow text-white hover:shadow-[0_8px_30px_hsl(168_76%_42%/0.35)] hover:-translate-y-1",
        backer: "bg-gradient-to-r from-backer to-backer-glow text-white hover:shadow-[0_8px_30px_hsl(262_83%_58%/0.35)] hover:-translate-y-1",
        founderOutline: "border-2 border-founder text-founder bg-founder-light hover:bg-founder hover:text-white hover:-translate-y-0.5",
        builderOutline: "border-2 border-builder text-builder bg-builder-light hover:bg-builder hover:text-white hover:-translate-y-0.5",
        backerOutline: "border-2 border-backer text-backer bg-backer-light hover:bg-backer hover:text-white hover:-translate-y-0.5",
        hero: "bg-white text-foreground hover:bg-white/90 hover:-translate-y-1 shadow-lg",
        heroOutline: "border-2 border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
