import Link from "next/link";
import { WorkoutCard } from "@/components/molecules/WorkoutCard/WorkoutCard";
import { type WorkoutSessionSummary } from "@/components/pages/WorkoutListPage/WorkoutListPage";
import { PageTemplate } from "@/components/templates/PageTemplate/PageTemplate";
import { workoutLabel } from "@/data/workoutLabel";

export type FriendWorkoutsPageProps = {
  username?: string;
  signOut?: () => Promise<void>;
  pendingRequestCount?: number;
  friendUsername: string;
  sessions: WorkoutSessionSummary[];
};

const FriendWorkoutsPage = function FriendWorkoutsPage({
  username,
  signOut,
  pendingRequestCount,
  friendUsername,
  sessions,
}: FriendWorkoutsPageProps) {
  return (
    <PageTemplate
      username={username}
      onSignOut={signOut}
      pendingRequestCount={pendingRequestCount}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <Link href="/friends" className="text-sm underline">
            Back to friends
          </Link>
          <h2 className="text-lg font-semibold">{friendUsername}&apos;s workouts</h2>
        </div>
        {sessions.length === 0 ? <p>No workouts yet.</p> : null}
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <WorkoutCard
                id={session.id}
                href={`/friends/${friendUsername}/${session.id}`}
                label={workoutLabel(session)}
                date={session.createdAt}
                exerciseCount={session.setCount}
              />
            </li>
          ))}
        </ul>
      </div>
    </PageTemplate>
  );
};

export { FriendWorkoutsPage };
export default FriendWorkoutsPage;
