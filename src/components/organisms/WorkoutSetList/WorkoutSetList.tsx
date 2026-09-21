"use client";

import { WorkoutSetForm } from "@/components/molecules/WorkoutSetForm/WorkoutSetForm";
import { WorkoutSetItem } from "@/components/molecules/WorkoutSetItem/WorkoutSetItem";
import { type WorkoutSet } from "@/generated/prisma/browser";

export type WorkoutSetListProps = {
  sets: WorkoutSet[];
  readOnly?: boolean;
  onAdd?: (item: {
    exercise: string;
    reps: number;
    weight: number;
  }) => void | Promise<void>;
  onUpdate?: (set: WorkoutSet) => void | Promise<void>;
  onDelete?: (id: number) => void | Promise<void>;
};

const WorkoutSetList = function WorkoutSetList({
  sets,
  readOnly = false,
  onAdd,
  onUpdate,
  onDelete,
}: WorkoutSetListProps) {
  return (
    <div className="flex min-w-80 flex-col gap-6">
      {readOnly || !onAdd ? null : <WorkoutSetForm onAdd={onAdd} />}
      {sets.length === 0 ? <p>No sets yet.</p> : null}
      <ul>
        {sets.map((set) => (
          <li key={set.id}>
            <WorkoutSetItem
              set={set}
              readOnly={readOnly}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export { WorkoutSetList };
export default WorkoutSetList;
