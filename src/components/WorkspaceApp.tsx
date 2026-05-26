"use client";

import {
  Box,
  ChevronDown,
  CircleHelp,
  Copy,
  ExternalLink,
  Folder,
  LayoutGrid,
  List,
  LogOut,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { useMemo, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { logout } from "@/app/auth/actions";
import { PanoramaSphere, type PanoramaController } from "@/components/PanoramaSphere";

type Page = "projects" | "viewer";
type ViewMode = "grid" | "list";

type Project = {
  id: string;
  name: string;
  updatedAt: string;
  image: string;
};

type MotionStyle = CSSProperties & {
  "--tile-index"?: number;
};

const projects: Project[] = [
  {
    id: "beach-house",
    name: "Beach House",
    updatedAt: "Updated May 12, 2024",
    image: "/panoramas/outdoor-terrace.jpg"
  },
  {
    id: "hotel-lobby",
    name: "Hotel Lobby",
    updatedAt: "Updated Apr 28, 2024",
    image: "/panoramas/living-room.jpg"
  },
  {
    id: "art-gallery",
    name: "Art Gallery",
    updatedAt: "Updated Apr 21, 2024",
    image: "/panoramas/urban-office.jpg"
  },
  {
    id: "penthouse",
    name: "Penthouse",
    updatedAt: "Updated Apr 15, 2024",
    image: "/panoramas/outdoor-terrace.jpg"
  },
  {
    id: "creative-studio",
    name: "Creative Studio",
    updatedAt: "Updated Apr 10, 2024",
    image: "/panoramas/aerial-view.jpg"
  },
  {
    id: "retail-showroom",
    name: "Retail Showroom",
    updatedAt: "Updated Apr 5, 2024",
    image: "/panoramas/living-room.jpg"
  },
  {
    id: "office-hq",
    name: "Office HQ",
    updatedAt: "Updated Mar 29, 2024",
    image: "/panoramas/mountain-resort.jpg"
  },
  {
    id: "hotel-room-501",
    name: "Hotel Room 501",
    updatedAt: "Updated Mar 18, 2024",
    image: "/panoramas/urban-office.jpg"
  }
];

export function WorkspaceApp({ initialPage, initialProjectId }: { initialPage: Page; initialProjectId?: string }) {
  const [page, setPage] = useState<Page>(initialPage);
  const [activeProjectId, setActiveProjectId] = useState(getValidProjectId(initialProjectId));
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];

  function navigateTo(nextPage: Page) {
    setPage(nextPage);
    updatePageUrl(nextPage, activeProjectId);
  }

  function openViewer(projectId: string) {
    setActiveProjectId(projectId);
    setPage("viewer");
    updatePageUrl("viewer", projectId);
  }

  return (
    <main className={`app-shell ${page === "viewer" ? "viewer-mode" : ""}`}>
      <TopBar page={page} onNavigate={navigateTo} />
      {page === "projects" ? (
        <ProjectsPage activeProjectId={activeProjectId} onNavigate={navigateTo} onOpenViewer={openViewer} />
      ) : (
        <ViewerPage onNavigate={navigateTo} project={activeProject} />
      )}
    </main>
  );
}

function updatePageUrl(page: Page, projectId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = page === "viewer" ? `/viewer?project=${encodeURIComponent(projectId)}` : "/projects";
  window.history.pushState(null, "", nextUrl);
}

function getValidProjectId(projectId?: string) {
  if (projectId && projects.some((project) => project.id === projectId)) {
    return projectId;
  }

  return projects[0].id;
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
  onNavigate,
  onOpenViewer
}: {
  activeProjectId: string;
  onNavigate: (page: Page) => void;
  onOpenViewer: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Last updated");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(normalized));

    return sort === "Name" ? [...filteredProjects].sort((a, b) => a.name.localeCompare(b.name)) : filteredProjects;
  }, [query, sort]);

  return (
    <section className="page-layout projects-layout">
      <SideRail active="projects" onNavigate={onNavigate} />
      <div className="projects-content">
        <div className="projects-title-row">
          <div>
            <h1>Projects</h1>
            <p>{projects.length} projects</p>
          </div>
          <div className="primary-actions">
            <IconButton label="Grid tools" icon={LayoutGrid} />
            <IconButton label="Filter projects" icon={SlidersHorizontal} />
            <button className="new-button" type="button">
              <Plus size={18} />
              <span>New</span>
            </button>
          </div>
        </div>

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
      </div>
    </section>
  );
}

function ProjectCard({
  active,
  index,
  project,
  onOpenViewer
}: {
  active: boolean;
  index: number;
  project: Project;
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
          <small>{project.updatedAt}</small>
        </button>
        <div className="tile-actions">
          <IconButton label={`Open ${project.name}`} icon={ExternalLink} onClick={onOpenViewer} />
          <IconButton label={`Duplicate ${project.name}`} icon={Copy} />
          <IconButton label={`More actions for ${project.name}`} icon={MoreHorizontal} />
        </div>
      </div>
    </article>
  );
}

function ViewerPage({ onNavigate, project }: { onNavigate: (page: Page) => void; project: Project }) {
  const panoramaRef = useRef<PanoramaController | null>(null);

  return (
    <section className="viewer-stage">
      <PanoramaSphere src={project.image} onReady={(viewer) => (panoramaRef.current = viewer)} />
      <div className="viewer-scrim" />
      <SideRail active="viewer" onNavigate={onNavigate} />
      <div className="viewer-title">
        <h1>{project.name}</h1>
        <p>Viewer</p>
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

function IconButton({
  label,
  icon: Icon,
  onClick
}: {
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  onClick?: () => void;
}) {
  return (
    <button className="icon-button" onClick={onClick} type="button" aria-label={label}>
      <Icon size={20} />
    </button>
  );
}

function FrameCorners() {
  return (
    <svg className="frame-corners" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
    </svg>
  );
}
