import { WorkspaceApp } from "@/components/WorkspaceApp";

type ViewerSearchParams = Promise<{
  project?: string;
}>;

export default async function ViewerPage({ searchParams }: { searchParams: ViewerSearchParams }) {
  const params = await searchParams;

  return <WorkspaceApp initialPage="viewer" initialProjectId={params.project} />;
}
