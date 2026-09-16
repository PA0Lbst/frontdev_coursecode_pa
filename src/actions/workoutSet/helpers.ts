export function parseSetFields(input: {
  exercise: string;
  reps: number;
  weight: number;
}): { exercise: string; reps: number; weight: number } {
  const exercise = input.exercise.trim();
  if (exercise === "") {
    throw new Error("Exercise is required");
  }
  if (!Number.isInteger(input.reps) || input.reps < 1) {
    throw new Error("Reps must be a positive integer");
  }
  if (!Number.isFinite(input.weight) || input.weight < 0) {
    throw new Error("Weight must be a non-negative number");
  }
  return { exercise, reps: input.reps, weight: input.weight };
}
