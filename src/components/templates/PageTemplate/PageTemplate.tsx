import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { Footer } from "@/components/organisms/Footer/Footer";
import { Header } from "@/components/organisms/Header/Header";

export type PageTemplateProps = Omit<ComponentProps<"div">, "ref"> & {
  children: ReactNode;
  username?: string;
  onSignOut?: () => Promise<void>;
};

const PageTemplate = forwardRef<HTMLDivElement, PageTemplateProps>(
  function PageTemplate({ children, username, onSignOut, className, ...props }, ref) {
    const classes = ["flex min-h-screen flex-col bg-zinc-50", className]
      .filter(Boolean)
      .join(" ");

    return (
      <div {...props} ref={ref} className={classes}>
        <Header username={username} onSignOut={onSignOut} />
        <main className="flex-1 px-6 py-8">{children}</main>
        <Footer />
      </div>
    );
  },
);

export { PageTemplate };
export default PageTemplate;
