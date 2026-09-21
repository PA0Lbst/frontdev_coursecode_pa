"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { EXERCISE_CATALOG } from "@/data/exerciseCatalog";

export type WorkoutSetFormProps = {
  onAdd: (item: {
    exercise: string;
    reps: number;
    weight: number;
  }) => void | Promise<void>;
};

const WorkoutSetForm = function WorkoutSetForm({ onAdd }: WorkoutSetFormProps) {
  const [exercise, setExercise] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [adding, setAdding] = useState(false);

  const trimmedExercise = exercise.trim();
  const parsedReps = Number(reps);
  const parsedWeight = Number(weight);
  const isValid =
    trimmedExercise !== "" &&
    Number.isInteger(parsedReps) &&
    Number.isFinite(parsedWeight);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) {
      return;
    }
    setAdding(true);
    try {
      await onAdd({
        exercise: trimmedExercise,
        reps: parsedReps,
        weight: parsedWeight,
      });
      setExercise("");
      setReps("");
      setWeight("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <label className="text-sm font-medium" htmlFor="workout-set-form-exercise">
        Exercise
      </label>
      <Input
        id="workout-set-form-exercise"
        list="workout-set-form-exercise-list"
        value={exercise}
        onChange={(event) => setExercise(event.target.value)}
      />
      <datalist id="workout-set-form-exercise-list">
        {EXERCISE_CATALOG.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <label className="text-sm font-medium" htmlFor="workout-set-form-reps">
        Reps
      </label>
      <Input
        id="workout-set-form-reps"
        type="number"
        value={reps}
        onChange={(event) => setReps(event.target.value)}
      />
      <label className="text-sm font-medium" htmlFor="workout-set-form-weight">
        Weight (kg)
      </label>
      <Input
        id="workout-set-form-weight"
        type="number"
        value={weight}
        onChange={(event) => setWeight(event.target.value)}
      />
      <Button type="submit" variant="primary" disabled={!isValid || adding}>
        Add
      </Button>
    </form>
  );
};

export { WorkoutSetForm };
export default WorkoutSetForm;
