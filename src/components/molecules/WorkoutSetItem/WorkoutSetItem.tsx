"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { EXERCISE_CATALOG } from "@/data/exerciseCatalog";
import { type WorkoutSet } from "@/generated/prisma/browser";

export type WorkoutSetItemProps = {
  set: WorkoutSet;
  readOnly?: boolean;
  onUpdate?: (set: WorkoutSet) => void | Promise<void>;
  onDelete?: (id: number) => void | Promise<void>;
};

const WorkoutSetItem = function WorkoutSetItem({
  set,
  readOnly = false,
  onUpdate,
  onDelete,
}: WorkoutSetItemProps) {
  const [editing, setEditing] = useState(false);
  const [exercise, setExercise] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const trimmedExercise = exercise.trim();
  const parsedReps = Number(reps);
  const parsedWeight = Number(weight);
  const isValid =
    trimmedExercise !== "" &&
    Number.isInteger(parsedReps) &&
    Number.isFinite(parsedWeight);

  function enterEdit() {
    setExercise(set.exercise);
    setReps(String(set.reps));
    setWeight(String(set.weight));
    setEditing(true);
  }

  async function handleSave() {
    if (!isValid) {
      return;
    }
    setSaving(true);
    try {
      await onUpdate?.({
        ...set,
        exercise: trimmedExercise,
        reps: parsedReps,
        weight: parsedWeight,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete?.(set.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {editing ? (
        <>
          <label
            className="text-sm font-medium"
            htmlFor={`workout-set-item-exercise-${set.id}`}
          >
            Exercise
          </label>
          <Input
            id={`workout-set-item-exercise-${set.id}`}
            list={`workout-set-item-exercise-list-${set.id}`}
            value={exercise}
            onChange={(event) => setExercise(event.target.value)}
          />
          <datalist id={`workout-set-item-exercise-list-${set.id}`}>
            {EXERCISE_CATALOG.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <label
            className="text-sm font-medium"
            htmlFor={`workout-set-item-reps-${set.id}`}
          >
            Reps
          </label>
          <Input
            id={`workout-set-item-reps-${set.id}`}
            type="number"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
          />
          <label
            className="text-sm font-medium"
            htmlFor={`workout-set-item-weight-${set.id}`}
          >
            Weight (kg)
          </label>
          <Input
            id={`workout-set-item-weight-${set.id}`}
            type="number"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
          <Button
            variant="primary"
            disabled={!isValid || saving}
            onClick={handleSave}
          >
            Save
          </Button>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 font-semibold">{set.exercise}</p>
            <p className="shrink-0 text-sm text-muted">
              {set.reps} × {set.weight} kg
            </p>
            <p className="shrink-0 text-sm text-muted">
              {set.createdAt.toLocaleDateString("en-US")}
            </p>
            {readOnly ? null : (
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="secondary" onClick={enterEdit}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={deleting}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export { WorkoutSetItem };
export default WorkoutSetItem;
