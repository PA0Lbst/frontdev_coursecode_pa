import Link from "next/link";
import { WorkoutSetList } from "@/components/organisms/WorkoutSetList/WorkoutSetList";
import { PageTemplate } from "@/components/templates/PageTemplate/PageTemplate";
import { type WorkoutSet } from "@/generated/prisma/browser";

export type ReadOnlyWorkoutPageProps = {
  username?: string;
  signOut?: () => Promise<void>;
  pendingRequestCount?: number;
  title: string;
  sets: WorkoutSet[];
  backHref: string;
  backLabel?: string;
};

const ReadOnlyWorkoutPage = function ReadOnlyWorkoutPage({
  username,
  signOut,
  pendingRequestCount,
  title,
  sets,
  backHref,
  backLabel = "Back",
}: ReadOnlyWorkoutPageProps) {
  return (
    <PageTemplate
      username={username}
      onSignOut={signOut}
      pendingRequestCount={pendingRequestCount}
    >
      <div className="mx-auto w-full max-w-2xl">
        <Link href={backHref} className="text-sm underline">
          {backLabel}
        </Link>
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <WorkoutSetList sets={[...sets].reverse()} readOnly />
      </div>
    </PageTemplate>
  );
};

export { ReadOnlyWorkoutPage };
export default ReadOnlyWorkoutPage;
