export function formatWorkoutDate(date: Date) {
  const value = new Date(date);
  const day = String(value.getUTCDate()).padStart(2, "0");
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${value.getUTCFullYear()}`;
}

export function workoutLabel(session: { name: string | null; createdAt: Date }) {
  return session.name ? session.name : "Untitled workout";
}
