/*
 * Atomic Design atom. Tailwind variants are defined in this file.
 */
import { forwardRef, type ComponentProps } from "react";

export type ButtonProps = Omit<ComponentProps<"button">, "ref"> & {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
};

const variantClasses = {
  primary: "bg-black shadow-sm text-white hover:bg-zinc-800",
  secondary: "border border-zinc-200 bg-zinc-100 text-black hover:bg-zinc-200",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-2.5 text-lg",
};

const baseClasses =
  "relative inline-flex items-center justify-center rounded-full font-medium transition-colors active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed";

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    type = "button",
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-disabled={disabled || loading ? true : undefined}
      className={classes}
    >
      <span className={loading ? "invisible" : undefined}>{children}</span>
      {loading ? (
        <span
          className="absolute inset-0 flex items-center justify-center gap-1"
          aria-hidden
        >
          <span className="h-1 w-1 rounded-full bg-current animate-pulse" />
          <span className="h-1 w-1 rounded-full bg-current animate-pulse" />
          <span className="h-1 w-1 rounded-full bg-current animate-pulse" />
        </span>
      ) : null}
    </button>
  );
});

export { Button };
export default Button;
