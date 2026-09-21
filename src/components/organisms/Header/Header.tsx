"use client";

import Link from "next/link";
import { forwardRef, useState, type ComponentProps } from "react";
import { Button } from "@/components/atoms/Button/Button";

export type HeaderProps = Omit<ComponentProps<"header">, "ref"> & {
  username?: string;
  onSignOut?: () => Promise<void>;
};

const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
  { username, onSignOut, className, ...props },
  ref,
) {
  const [signingOut, setSigningOut] = useState(false);
  const classes = [
    "flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-4",
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
        <nav className="flex items-center gap-3">
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
        </nav>
      ) : null}
    </header>
  );
});

export { Header };
export default Header;
