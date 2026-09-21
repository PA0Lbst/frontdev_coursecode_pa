"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { WorkoutCard } from "@/components/molecules/WorkoutCard/WorkoutCard";
import { PageTemplate } from "@/components/templates/PageTemplate/PageTemplate";
import { workoutLabel } from "@/data/workoutLabel";
import { type WorkoutSession } from "@/generated/prisma/browser";

export type WorkoutSessionSummary = WorkoutSession & { setCount: number };

export type WorkoutListPageProps = {
  username?: string;
  pendingRequestCount?: number;
  signOut?: () => Promise<void>;
  initialSessions?: WorkoutSessionSummary[];
  // Creates the workout and opens it (the route action redirects to /workouts/[id]).
  createSession: (input: { name?: string | null }) => Promise<void>;
  deleteSession: (id: number) => Promise<void>;
};

function toClientSession<T extends WorkoutSession>(session: T): T {
  return { ...session, createdAt: new Date(session.createdAt) };
}

const WorkoutListPage = function WorkoutListPage({
  username,
  pendingRequestCount,
  signOut,
  initialSessions,
  createSession,
  deleteSession,
}: WorkoutListPageProps) {
  const [sessions, setSessions] = useState<WorkoutSessionSummary[]>(() =>
    (initialSessions ?? []).map(toClientSession),
  );
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdding(true);
    try {
      await createSession({ name });
      setName("");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Something went wrong. Try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await deleteSession(id);
      setSessions((current) => current.filter((item) => item.id !== id));
      setErrorMessage(null);
    } catch {
      setErrorMessage("Something went wrong. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PageTemplate
      username={username}
      pendingRequestCount={pendingRequestCount}
      onSignOut={signOut}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        {errorMessage ? (
          <p className="text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="workout-list-name">
              Name
            </label>
            <Input
              id="workout-list-name"
              className="min-h-11 text-base"
              placeholder="Workout name (optional)"
              autoComplete="off"
              enterKeyHint="done"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="min-h-11 w-full sm:w-auto"
            disabled={adding}
          >
            Add workout
          </Button>
        </form>
        {sessions.length === 0 ? <p>No workouts yet.</p> : null}
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <WorkoutCard
                id={session.id}
                label={workoutLabel(session)}
                date={session.createdAt}
                exerciseCount={session.setCount}
                deleting={deletingId === session.id}
                onDelete={() => handleDelete(session.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </PageTemplate>
  );
};

export { WorkoutListPage };
export default WorkoutListPage;
