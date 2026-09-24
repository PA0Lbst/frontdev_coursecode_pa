import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { Header } from "@/components/organisms/Header/Header";

export type PageTemplateProps = Omit<ComponentProps<"div">, "ref"> & {
  children: ReactNode;
  username?: string;
  pendingRequestCount?: number;
  onSignOut?: () => Promise<void>;
};

const PageTemplate = forwardRef<HTMLDivElement, PageTemplateProps>(
  function PageTemplate({ children, username, pendingRequestCount, onSignOut, className, ...props }, ref) {
    const classes = ["flex min-h-screen flex-col bg-background", className]
      .filter(Boolean)
      .join(" ");

    return (
      <div {...props} ref={ref} className={classes}>
        <Header
          username={username}
          pendingRequestCount={pendingRequestCount}
          onSignOut={onSignOut}
        />
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    );
  },
);

export { PageTemplate };
export default PageTemplate;
