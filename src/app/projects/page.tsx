import { WorkspaceApp } from "@/components/WorkspaceApp";
import { getWorkspaceData } from "@/lib/server/workspace-data";

export default async function ProjectsPage() {
  const initialWorkspace = await getWorkspaceData();

  return <WorkspaceApp initialPage="projects" initialWorkspace={initialWorkspace} />;
}
