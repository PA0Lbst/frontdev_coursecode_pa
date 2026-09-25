import { forwardRef, type ComponentProps } from "react";

export type InputProps = Omit<ComponentProps<"input">, "ref">;

const baseClasses =
  "w-full rounded-lg border border-zinc-200 transition-colors hover:border-zinc-400 focus-visible:border-black bg-white px-4 py-2 text-base text-black placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed";

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = "text", className, ...props },
  ref,
) {
  const classes = [baseClasses, className].filter(Boolean).join(" ");

  return <input {...props} ref={ref} type={type} className={classes} />;
});

export { Input };
export default Input;
