"use client";

import Link from "next/link";
import { useState } from "react";
import { WorkoutSetList } from "@/components/organisms/WorkoutSetList/WorkoutSetList";
import { PageTemplate } from "@/components/templates/PageTemplate/PageTemplate";
import { type WorkoutSet } from "@/generated/prisma/browser";

export type WorkoutPageProps = {
  username?: string;
  pendingRequestCount?: number;
  signOut?: () => Promise<void>;
  title: string;
  initialSets?: WorkoutSet[];
  createSet: (input: {
    exercise: string;
    reps: number;
    weight: number;
  }) => Promise<WorkoutSet>;
  updateSet: (input: {
    id: number;
    exercise: string;
    reps: number;
    weight: number;
  }) => Promise<WorkoutSet>;
  deleteSet: (id: number) => Promise<void>;
};

function toClientSet(set: WorkoutSet): WorkoutSet {
  return { ...set, createdAt: new Date(set.createdAt) };
}

const WorkoutPage = function WorkoutPage({
  username,
  pendingRequestCount,
  signOut,
  title,
  initialSets,
  createSet,
  updateSet,
  deleteSet,
}: WorkoutPageProps) {
  const [sets, setSets] = useState<WorkoutSet[]>(() =>
    [...(initialSets ?? [])].reverse().map(toClientSet),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onAdd({
    exercise,
    reps,
    weight,
  }: {
    exercise: string;
    reps: number;
    weight: number;
  }) {
    try {
      const returned = await createSet({ exercise, reps, weight });
      setSets((current) => [toClientSet(returned), ...current]);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("Something went wrong. Try again.");
      throw error;
    }
  }

  async function onUpdate(set: WorkoutSet) {
    try {
      const returned = await updateSet({
        id: set.id,
        exercise: set.exercise,
        reps: set.reps,
        weight: set.weight,
      });
      setSets((current) =>
        current.map((item) =>
          item.id === set.id ? toClientSet(returned) : item,
        ),
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("Something went wrong. Try again.");
      throw error;
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteSet(id);
      setSets((current) => current.filter((item) => item.id !== id));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage("Something went wrong. Try again.");
      throw error;
    }
  }

  return (
    <PageTemplate
      username={username}
      pendingRequestCount={pendingRequestCount}
      onSignOut={signOut}
    >
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="text-sm underline">
          Back to workouts
        </Link>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        {errorMessage ? (
          <p className="mb-4 text-red-600" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <WorkoutSetList
          sets={sets}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </PageTemplate>
  );
};

export { WorkoutPage };
export default WorkoutPage;
