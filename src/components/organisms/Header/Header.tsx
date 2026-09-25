"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, useState, type ComponentProps } from "react";
import { Button } from "@/components/atoms/Button/Button";

export type HeaderProps = Omit<ComponentProps<"header">, "ref"> & {
  username?: string;
  pendingRequestCount?: number;
  onSignOut?: () => Promise<void>;
};

const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
  { username, pendingRequestCount = 0, onSignOut, className, ...props },
  ref,
) {
  const pathname = usePathname();
  const onFriends = pathname === "/friends" || pathname?.startsWith("/friends/");
  const onWorkouts =
    pathname === "/" || pathname === "/workouts" || pathname?.startsWith("/workouts/");
  const linkClasses = "inline-flex min-h-11 items-center gap-1 text-sm underline-offset-4 hover:underline";
  const [signingOut, setSigningOut] = useState(false);
  const classes = [
    "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-zinc-200 bg-white px-6 py-4",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  async function handleSignOut() {
    if (!onSignOut) return;
    setSigningOut(true);
    try {
      await onSignOut();
    } catch {
      // signOut redirects on success; nothing to reset on failure beyond re-enabling.
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header {...props} ref={ref} className={classes}>
      <h1 className="text-xl font-semibold text-black">Workoutish</h1>
      {username ? (
        <>
          <nav aria-label="Main" className="flex items-center gap-4">
            <Link
              href="/"
              className={linkClasses}
              aria-current={onWorkouts ? "page" : undefined}
            >
              Workouts
            </Link>
            <Link
              href="/friends"
              className={linkClasses}
              aria-current={onFriends ? "page" : undefined}
            >
              Friends
              {pendingRequestCount > 0 ? (
                <>
                  <span
                    aria-hidden="true"
                    className="rounded-full bg-black px-2 text-xs text-white"
                  >
                    {pendingRequestCount}
                  </span>
                  <span className="sr-only">
                    ({pendingRequestCount} pending requests)
                  </span>
                </>
              ) : null}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/account" className="text-sm underline">
              {username}
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              Sign out
            </Button>
          </div>
        </>
      ) : null}
    </header>
  );
});

export { Header };
export default Header;
