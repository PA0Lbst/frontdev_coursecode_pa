"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatWorkoutDate } from "@/data/workoutLabel";

export type WorkoutCardProps = {
  id: number;
  label: string;
  date: Date;
  exerciseCount: number;
  href?: string;
  onDelete?: () => void | Promise<void>;
  deleting?: boolean;
};

const WorkoutCard = function WorkoutCard({
  id,
  label,
  date,
  exerciseCount,
  href = `/workouts/${id}`,
  onDelete,
  deleting = false,
}: WorkoutCardProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const count = `${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}`;

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuRef.current?.querySelector("button")?.focus();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleDelete() {
    setOpen(false);
    await onDelete?.();
  }

  return (
    <article className="relative rounded-xl border border-zinc-200 bg-white shadow-sm hover:shadow-md">
      <Link
        href={href}
        className={`block rounded-xl p-4 ${onDelete ? "pr-16" : "pr-4"} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black`}
      >
        <h3 className="truncate text-lg font-semibold">{label}</h3>
        <p className="text-sm text-zinc-500">{formatWorkoutDate(date)}</p>
        <p className="text-sm text-zinc-500">{count}</p>
      </Link>
      {onDelete ? (
      <div ref={menuRef} className="absolute right-2 top-2">
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-xl leading-none text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          aria-label={`Actions for ${label}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          ⋯
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-12 z-10 min-w-40 rounded-xl border border-zinc-200 bg-white p-1 shadow-md"
          >
            <button
              type="button"
              role="menuitem"
              disabled={deleting}
              onClick={handleDelete}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7h16" />
                <path d="M10 11v6M14 11v6" />
                <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
                <path d="M9 7V4h6v3" />
              </svg>
              Delete
            </button>
          </div>
        ) : null}
      </div>
      ) : null}
    </article>
  );
};

export { WorkoutCard };
export default WorkoutCard;
