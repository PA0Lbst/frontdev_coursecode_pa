import { forwardRef, type ComponentProps } from "react";

export type TextareaProps = Omit<ComponentProps<"textarea">, "ref">;

const baseClasses =
  "w-full min-h-24 border border-zinc-200 bg-white px-4 py-2 text-base text-black placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50 disabled:cursor-not-allowed";

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
    const classes = [baseClasses, className].filter(Boolean).join(" ");

    return <textarea {...props} ref={ref} className={classes} />;
  },
);

export { Textarea };
export default Textarea;
