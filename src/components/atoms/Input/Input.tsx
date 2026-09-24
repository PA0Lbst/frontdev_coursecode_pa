import { forwardRef, type ComponentProps } from "react";

export type InputProps = Omit<ComponentProps<"input">, "ref">;

const baseClasses =
  "w-full rounded-lg border border-border transition-colors hover:border-border-strong focus-visible:border-primary bg-surface px-4 py-2 text-base text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed";

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = "text", className, ...props },
  ref,
) {
  const classes = [baseClasses, className].filter(Boolean).join(" ");

  return <input {...props} ref={ref} type={type} className={classes} />;
});

export { Input };
export default Input;
