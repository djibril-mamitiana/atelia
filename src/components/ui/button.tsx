import * as React from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

// One signal colour does the selling: the spark-orange primary is the only
// filled CTA on light backgrounds; graphite is the calm secondary.
const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-graphite hover:bg-[#ff7440] shadow-[0_1px_0_rgba(255,255,255,0.35)_inset]",
  secondary: "bg-graphite text-white hover:bg-graphite-3",
  outline: "border border-ink/25 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-white",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-danger text-white hover:opacity-90",
  // For dark surfaces.
  light: "border border-white/30 bg-white/5 text-white backdrop-blur hover:border-white hover:bg-white hover:text-graphite",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[15px]",
};

const base =
  "group/btn inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.005em] " +
  "transition-[background-color,color,border-color,transform,box-shadow] duration-300 ease-out active:scale-[0.98] " +
  "disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}

type LinkButtonProps = React.ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
};

export function LinkButton({ variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return (
    <Link className={cn(base, variantClasses[variant], sizeClasses[size], className)} {...props} />
  );
}
