"use client";

import {
  Box,
  ChevronDown,
  CircleHelp,
  Download,
  ExternalLink,
  Folder,
  LayoutGrid,
  List,
  LogOut,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  UploadCloud,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { logout } from "@/app/auth/actions";
import { PanoramaSphere, type PanoramaController } from "@/components/PanoramaSphere";
import { formatFileSize, validatePanoramaFile } from "@/lib/panorama";
import { RENDER_PRESETS, type PresetId } from "@/lib/presets";
import { getJobProgress, getStatusLabel, type RenderJobStatus } from "@/lib/render-jobs";
import type { WorkspaceData, WorkspaceProject, WorkspaceScene } from "@/lib/workspace-types";

type Page = "projects" | "viewer";
type ViewMode = "grid" | "list";

type MotionStyle = CSSProperties & {
  "--tile-index"?: number;
};

type RenderState = {
  error: string;
  fileLabel: string;
  message: string;
  pending: boolean;
  selectedProjectId: string;
  selectedPresetId: PresetId;
  validation: string[];
};

const EMPTY_RENDER_STATE: RenderState = {
  error: "",
  fileLabel: "",
  message: "",
  pending: false,
  selectedProjectId: "",
  selectedPresetId: "interior",
  validation: []
};

export function WorkspaceApp({
  initialPage,
  initialProjectId,
  initialWorkspace
}: {
  initialPage: Page;
  initialProjectId?: string;
  initialWorkspace: WorkspaceData;
}) {
  const [page, setPage] = useState<Page>(initialPage);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [activeProjectId, setActiveProjectId] = useState(
    getValidProjectId(initialProjectId, initialWorkspace.projects)
  );
  const [activeSceneId, setActiveSceneId] = useState(getInitialSceneId(activeProjectId, initialWorkspace.scenes));

  const activeProject = workspace.projects.find((project) => project.id === activeProjectId) ?? workspace.projects[0];
  const activeScene =
    workspace.scenes.find((scene) => scene.id === activeSceneId) ??
    workspace.scenes.find((scene) => scene.projectId === activeProject?.id) ??
    workspace.scenes[0];

  function navigateTo(nextPage: Page) {
    setPage(nextPage);
    updatePageUrl(nextPage, activeProjectId);
  }

  function openViewer(projectId: string, sceneId?: string) {
    setActiveProjectId(projectId);
    setActiveSceneId(sceneId ?? getInitialSceneId(projectId, workspace.scenes));
    setPage("viewer");
    updatePageUrl("viewer", projectId);
  }

  function applyProject(project: WorkspaceProject) {
    setWorkspace((current) => ({
      ...current,
      dataSource: "supabase",
      projects: [project, ...current.projects]
    }));
    setActiveProjectId(project.id);
  }

  function applyScene(scene: WorkspaceScene) {
    setWorkspace((current) => {
      const scenes = [scene, ...current.scenes.filter((item) => item.id !== scene.id)];
      const projects = current.projects.map((project) => summarizeProject(project, scenes, scene));

      return { ...current, projects, scenes };
    });
    setActiveProjectId(scene.projectId);
    setActiveSceneId(scene.id);
  }

  return (
    <main className={`app-shell ${page === "viewer" ? "viewer-mode" : ""}`}>
      <TopBar page={page} onNavigate={navigateTo} />
      {page === "projects" ? (
        <ProjectsPage
          activeProjectId={activeProjectId}
          onCreateProject={applyProject}
          onCreateScene={applyScene}
          onNavigate={navigateTo}
          onOpenViewer={openViewer}
          workspace={workspace}
        />
      ) : (
        <ViewerPage onNavigate={navigateTo} project={activeProject} scene={activeScene} scenes={workspace.scenes} />
      )}
    </main>
  );
}

function summarizeProject(project: WorkspaceProject, scenes: WorkspaceScene[], changedScene: WorkspaceScene) {
  if (project.id !== changedScene.projectId) {
    return project;
  }

  const projectScenes = scenes.filter((scene) => scene.projectId === project.id);

  return {
    ...project,
    failed: projectScenes.filter((scene) => scene.status === "failed").length,
    image: changedScene.image || projectScenes[0]?.image || project.image,
    ready: projectScenes.filter((scene) => scene.status === "ready").length,
    rendering: projectScenes.filter((scene) => scene.status === "rendering_openai" || scene.status === "upscaling_topaz").length,
    scenes: projectScenes.length,
    updatedAt: changedScene.updatedAt
  };
}

function updatePageUrl(page: Page, projectId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = page === "viewer" && projectId ? `/viewer?project=${encodeURIComponent(projectId)}` : "/projects";
  window.history.pushState(null, "", nextUrl);
}

function getValidProjectId(projectId: string | undefined, projects: WorkspaceProject[]) {
  if (projectId && projects.some((project) => project.id === projectId)) {
    return projectId;
  }

  return projects[0]?.id ?? "";
}

function getInitialSceneId(projectId: string, scenes: WorkspaceScene[]) {
  return scenes.find((scene) => scene.projectId === projectId)?.id ?? scenes[0]?.id ?? "";
}

function TopBar({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return (
    <header className="top-bar">
      <button className="brand-button" onClick={() => onNavigate("projects")} type="button" aria-label="Open projects">
        <Box size={27} strokeWidth={1.75} />
        <span>360 Render</span>
      </button>
      <nav className="page-tabs" aria-label="Main pages">
        <button className={page === "projects" ? "active" : ""} onClick={() => onNavigate("projects")} type="button">
          Projects
        </button>
        <button className={page === "viewer" ? "active" : ""} onClick={() => onNavigate("viewer")} type="button">
          Viewer
        </button>
      </nav>
      <form action={logout} className="top-actions">
        <button className="top-menu" type="submit" aria-label="Log out">
          <LogOut size={23} strokeWidth={2.1} />
        </button>
      </form>
    </header>
  );
}

function ProjectsPage({
  activeProjectId,
  onCreateProject,
  onCreateScene,
  onNavigate,
  onOpenViewer,
  workspace
}: {
  activeProjectId: string;
  onCreateProject: (project: WorkspaceProject) => void;
  onCreateScene: (scene: WorkspaceScene) => void;
  onNavigate: (page: Page) => void;
  onOpenViewer: (id: string, sceneId?: string) => void;
  workspace: WorkspaceData;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Last updated");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filteredProjects = workspace.projects.filter((project) => project.name.toLowerCase().includes(normalized));

    return sort === "Name" ? [...filteredProjects].sort((a, b) => a.name.localeCompare(b.name)) : filteredProjects;
  }, [query, sort, workspace.projects]);

  return (
    <section className="page-layout projects-layout">
      <SideRail active="projects" onNavigate={onNavigate} />
      <div className="projects-content">
        <div className="projects-title-row">
          <div>
            <h1>Projects</h1>
            <p>
              {workspace.projects.length} projects
              {workspace.dataSource === "error" ? " - database connection needs setup" : ""}
            </p>
          </div>
        </div>

        {workspace.dataSource === "error" ? (
          <p className="workspace-alert" role="alert">
            {workspace.errorMessage}
          </p>
        ) : null}

        <WorkspaceCreatePanel onCreateProject={onCreateProject} />
        <RenderUploadPanel activeProjectId={activeProjectId} projects={workspace.projects} onCreateScene={onCreateScene} />

        <div className="projects-toolbar">
          <label className="search-control">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." />
          </label>
          <div className="sort-controls">
            <span>Sort by</span>
            <label className="select-control">
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option>Last updated</option>
                <option>Name</option>
              </select>
              <ChevronDown size={17} />
            </label>
            <div className="view-toggle" aria-label="View mode">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} type="button" aria-label="Grid view">
                <LayoutGrid size={19} />
              </button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} type="button" aria-label="List view">
                <List size={21} />
              </button>
            </div>
          </div>
        </div>

        {visibleProjects.length ? (
          <div className={`project-gallery ${viewMode}`}>
            {visibleProjects.map((project, index) => (
              <ProjectCard
                active={project.id === activeProjectId}
                index={index}
                key={project.id}
                project={project}
                onOpenViewer={() => onOpenViewer(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="workspace-empty">
            <Folder size={34} />
            <h2>No projects yet</h2>
            <p>Create a project, then upload a 2:1 panorama to start the render pipeline.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function WorkspaceCreatePanel({ onCreateProject }: { onCreateProject: (project: WorkspaceProject) => void }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function createProject() {
    setPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/projects", {
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const payload = (await response.json()) as { error?: string; project?: { id: string; name: string; updated_at: string } };

      if (!response.ok || !payload.project) {
        throw new Error(payload.error || "Project could not be created.");
      }

      onCreateProject({
        failed: 0,
        id: payload.project.id,
        image: "/panoramas/living-room.jpg",
        name: payload.project.name,
        ready: 0,
        rendering: 0,
        scenes: 0,
        updatedAt: "Updated just now"
      });
      setName("");
      setMessage("Project created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Project could not be created.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="workspace-panel" aria-label="Create project">
      <div>
        <h2>Create project</h2>
        <p>Set up a Supabase-backed workspace before uploading scenes.</p>
      </div>
      <label>
        <span>Project name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Villa Bali Interior" />
      </label>
      <button className="new-button" disabled={pending || !name.trim()} onClick={createProject} type="button">
        <Plus size={18} />
        <span>{pending ? "Creating..." : "New"}</span>
      </button>
      {message ? <p className="workspace-message">{message}</p> : null}
    </section>
  );
}

function RenderUploadPanel({
  activeProjectId,
  onCreateScene,
  projects
}: {
  activeProjectId: string;
  onCreateScene: (scene: WorkspaceScene) => void;
  projects: WorkspaceProject[];
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<RenderState>({ ...EMPTY_RENDER_STATE, selectedProjectId: activeProjectId });
  const selectedProjectId = state.selectedProjectId || activeProjectId || projects[0]?.id || "";

  async function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const dimensions = await readImageDimensions(file);
    const validation = validatePanoramaFile({
      height: dimensions.height,
      mimeType: file.type,
      name: file.name,
      size: file.size,
      width: dimensions.width
    });

    setState((current) => ({
      ...current,
      error: validation.valid ? "" : "Upload a JPG, PNG, or WebP equirectangular panorama with a 2:1 ratio.",
      fileLabel: `${file.name} - ${dimensions.width} x ${dimensions.height} - ${formatFileSize(file.size)}`,
      validation: validation.checks.map((check) => `${check.status === "valid" ? "Pass" : "Needs fix"}: ${check.label}`)
    }));
  }

  async function submitRender() {
    const file = fileRef.current?.files?.[0];

    if (!file || !selectedProjectId) {
      setState((current) => ({ ...current, error: "Choose a project and upload panorama before rendering." }));
      return;
    }

    setState((current) => ({ ...current, error: "", message: "", pending: true }));

    try {
      const formData = new FormData();
      formData.set("image", file);
      formData.set("presetId", state.selectedPresetId);
      formData.set("projectId", selectedProjectId);
      formData.set("sceneName", file.name.replace(/\.[^.]+$/, ""));

      const response = await fetch("/api/render-jobs", {
        body: formData,
        method: "POST"
      });
      const payload = (await response.json()) as {
        error?: string;
        id?: string;
        image?: string;
        sceneId?: string;
        status?: RenderJobStatus;
        topaz?: { processId?: string };
      };

      if (!response.ok || !payload.id || !payload.sceneId) {
        throw new Error(payload.error || "Render job could not be created.");
      }

      const scene: WorkspaceScene = {
        id: payload.sceneId,
        image: payload.image ?? "/panoramas/living-room.jpg",
        jobId: payload.id,
        name: file.name.replace(/\.[^.]+$/, ""),
        notes: "",
        presetId: state.selectedPresetId,
        projectId: selectedProjectId,
        status: payload.status ?? "rendering_openai",
        topazProcessId: payload.topaz?.processId,
        updatedAt: "Updated just now"
      };

      onCreateScene(scene);
      setState((current) => ({
        ...current,
        message: payload.topaz?.processId ? "Render started. Topaz is upscaling the final panorama." : "Render job created.",
        pending: false
      }));

      if (payload.topaz?.processId) {
        void pollTopazStatus(payload.topaz.processId, scene).catch((error) => {
          setState((current) => ({
            ...current,
            error: error instanceof Error ? error.message : "Topaz status could not be checked."
          }));
        });
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : "Render job could not be created.",
        pending: false
      }));
    }
  }

  async function pollTopazStatus(processId: string, scene: WorkspaceScene) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const response = await fetch(`/api/topaz/status/${encodeURIComponent(processId)}`);
      const payload = (await response.json()) as {
        error?: string;
        finalAsset?: { signedUrl?: string };
        renderStatus?: RenderJobStatus;
        status?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Topaz status could not be checked.");
      }

      if (payload.renderStatus === "ready" && payload.finalAsset?.signedUrl) {
        onCreateScene({
          ...scene,
          image: payload.finalAsset.signedUrl,
          status: "ready",
          updatedAt: "Updated just now"
        });
        setState((current) => ({ ...current, message: "Final Topaz panorama is ready." }));
        return;
      }

      if (payload.renderStatus === "failed") {
        onCreateScene({ ...scene, status: "failed", updatedAt: "Updated just now" });
        setState((current) => ({ ...current, error: "Topaz could not finish this render." }));
        return;
      }

      setState((current) => ({
        ...current,
        message: payload.status ? `Topaz status: ${payload.status}` : "Topaz is still processing."
      }));
      await waitForNextPoll(attempt);
    }

    setState((current) => ({
      ...current,
      message: "Topaz is still processing. Refresh the project in a few minutes to check again."
    }));
  }

  return (
    <section className="workspace-panel upload-panel" aria-label="Upload panorama">
      <div>
        <h2>Upload panorama</h2>
        <p>Create a render job from a 2:1 equirectangular image.</p>
      </div>
      <label>
        <span>Project</span>
        <select
          value={selectedProjectId}
          onChange={(event) => setState((current) => ({ ...current, selectedProjectId: event.target.value }))}
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Preset</span>
        <select
          value={state.selectedPresetId}
          onChange={(event) => setState((current) => ({ ...current, selectedPresetId: event.target.value as PresetId }))}
        >
          {RENDER_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </label>
      <label className="upload-drop">
        <UploadCloud size={20} />
        <span>{state.fileLabel || "Choose JPG, PNG, or WebP panorama"}</span>
        <input ref={fileRef} accept="image/jpeg,image/png,image/webp" onChange={(event) => handleFile(event.target.files?.[0])} type="file" />
      </label>
      {state.validation.length ? (
        <ul className="workspace-checks">
          {state.validation.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      ) : null}
      {state.error ? <p className="workspace-alert">{state.error}</p> : null}
      {state.message ? <p className="workspace-message">{state.message}</p> : null}
      <button className="new-button" disabled={state.pending || !selectedProjectId} onClick={submitRender} type="button">
        <UploadCloud size={18} />
        <span>{state.pending ? "Rendering..." : "Start render"}</span>
      </button>
    </section>
  );
}

function waitForNextPoll(attempt: number) {
  const delayMs = Math.min(30000, 6000 + attempt * 2000);

  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

function ProjectCard({
  active,
  index,
  project,
  onOpenViewer
}: {
  active: boolean;
  index: number;
  project: WorkspaceProject;
  onOpenViewer: () => void;
}) {
  return (
    <article className={`project-tile ${active ? "active" : ""}`} style={{ "--tile-index": index } as MotionStyle}>
      <button className="project-preview" onClick={onOpenViewer} type="button" aria-label={`Open ${project.name} in viewer`}>
        <img src={project.image} alt="" />
      </button>
      <div className="project-meta">
        <button className="project-name" onClick={onOpenViewer} type="button">
          <span>{project.name}</span>
          <small>
            {project.updatedAt} - {project.scenes} scenes
          </small>
        </button>
        <div className="tile-actions">
          <StatusBadge label={`${project.ready} ready`} />
          <StatusBadge label={`${project.rendering} rendering`} />
          <button className="icon-button" onClick={onOpenViewer} type="button" aria-label={`Open ${project.name}`}>
            <ExternalLink size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ViewerPage({
  onNavigate,
  project,
  scene,
  scenes
}: {
  onNavigate: (page: Page) => void;
  project?: WorkspaceProject;
  scene?: WorkspaceScene;
  scenes: WorkspaceScene[];
}) {
  const panoramaRef = useRef<PanoramaController | null>(null);
  const image = scene?.image ?? project?.image ?? "/panoramas/living-room.jpg";

  return (
    <section className="viewer-stage">
      <PanoramaSphere src={image} onReady={(viewer) => (panoramaRef.current = viewer)} />
      <div className="viewer-scrim" />
      <SideRail active="viewer" onNavigate={onNavigate} />
      <div className="viewer-title">
        <h1>{scene?.name ?? project?.name ?? "No project selected"}</h1>
        <p>{scene ? `${getStatusLabel(scene.status)} - ${scenes.length} loaded scenes` : "Viewer"}</p>
        {scene ? <progress value={getJobProgress(scene.status)} max={100} aria-label="Render progress" /> : null}
      </div>
      <div className="viewer-controls" aria-label="Viewer controls">
        <button onClick={() => panoramaRef.current?.zoom(8)} type="button" aria-label="Reset view">
          <RefreshCcw size={27} />
        </button>
        <div className="zoom-group">
          <button onClick={() => panoramaRef.current?.zoomOut(12)} type="button" aria-label="Zoom out">
            <ZoomOut size={24} />
          </button>
          <span />
          <button onClick={() => panoramaRef.current?.zoomIn(12)} type="button" aria-label="Zoom in">
            <ZoomIn size={25} />
          </button>
        </div>
        <button onClick={() => panoramaRef.current?.toggleFullscreen()} type="button" aria-label="Fullscreen">
          <FrameCorners />
        </button>
        <a href={image} aria-label="Download current panorama" download>
          <Download size={24} />
        </a>
        <button type="button" aria-label="Viewer settings">
          <Settings size={30} />
        </button>
      </div>
    </section>
  );
}

function SideRail({ active, onNavigate }: { active: Page; onNavigate: (page: Page) => void }) {
  const items: Array<{ key: Page; label: string; icon: ReactNode; selected?: boolean }> = [
    { key: "viewer", label: "Viewer", icon: <Box size={27} />, selected: active === "viewer" },
    { key: "projects", label: "Projects", icon: <Folder size={27} />, selected: active === "projects" }
  ];

  return (
    <aside className="side-rail" aria-label="Workspace rail">
      <nav>
        {items.map((item) => (
          <button
            className={item.selected ? "active" : ""}
            key={item.key}
            onClick={() => onNavigate(item.key)}
            type="button"
            aria-label={item.label}
          >
            {item.icon}
          </button>
        ))}
      </nav>
      <button className="rail-help" type="button" aria-label="Help">
        <CircleHelp size={23} />
      </button>
    </aside>
  );
}

function StatusBadge({ label }: { label: string }) {
  return <span className="status-badge">{label}</span>;
}

function FrameCorners() {
  return (
    <svg className="frame-corners" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
    </svg>
  );
}

function readImageDimensions(file: File): Promise<{ height: number; width: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ height: image.naturalHeight, width: image.naturalWidth });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image dimensions could not be read."));
    };
    image.src = url;
  });
}
