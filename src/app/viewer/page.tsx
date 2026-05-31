import { WorkspaceApp } from "@/components/WorkspaceApp";
import { getWorkspaceData } from "@/lib/server/workspace-data";

type ViewerSearchParams = Promise<{
  project?: string;
}>;

export default async function ViewerPage({ searchParams }: { searchParams: ViewerSearchParams }) {
  const params = await searchParams;
  const initialWorkspace = await getWorkspaceData();

  return <WorkspaceApp initialPage="viewer" initialProjectId={params.project} initialWorkspace={initialWorkspace} />;
}
