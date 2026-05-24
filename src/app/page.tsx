"use client";

import {
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CloudUpload,
  Cuboid,
  Download,
  File,
  Folder,
  Gauge,
  Globe2,
  Grid2X2,
  ImageIcon,
  Info,
  ListFilter,
  Loader2,
  Maximize,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  XCircle,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PanoramaSphere } from "@/components/PanoramaSphere";
import { projects as seedProjects, scenes as seedScenes, type Scene } from "@/lib/mock-data";
import { formatFileSize, validatePanoramaFile, type PanoramaValidationCheck } from "@/lib/panorama";
import { getActiveStepIndex, getJobProgress, getNextJobStatus, getStatusLabel, JOB_STEPS, type RenderJobStatus } from "@/lib/render-jobs";
import { getPresetById, RENDER_PRESETS, type PresetId } from "@/lib/presets";

type Screen = "projects" | "project" | "upload" | "job" | "viewer";

type UploadedFileState = {
  name: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  previewUrl: string;
  checks: PanoramaValidationCheck[];
  valid: boolean;
};

const nowLabel = "May 24, 2026 12:20 AM";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("projects");
  const [selectedSceneId, setSelectedSceneId] = useState("living-room");
  const [scenes, setScenes] = useState<Scene[]>(seedScenes);
  const [upload, setUpload] = useState<UploadedFileState | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("interior");
  const [notes, setNotes] = useState("Make lighting warmer, keep natural materials");
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];

  useEffect(() => {
    if (screen !== "job") {
      return;
    }

    const scene = scenes.find((item) => item.id === selectedSceneId);
    if (!scene || scene.status === "ready" || scene.status === "failed") {
      return;
    }

    const timer = window.setTimeout(() => {
      setScenes((currentScenes) =>
        currentScenes.map((item) =>
          item.id === selectedSceneId ? { ...item, status: getNextJobStatus(item.status), updatedAt: "Rendering now" } : item
        )
      );
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [screen, scenes, selectedSceneId]);

  async function handleFile(file: File) {
    const dimensions = await readImageDimensions(file);
    const info = {
      name: file.name,
      mimeType: file.type,
      width: dimensions.width,
      height: dimensions.height,
      size: file.size
    };
    const validation = validatePanoramaFile(info);

    setUpload({
      ...info,
      previewUrl: URL.createObjectURL(file),
      checks: validation.checks,
      valid: validation.valid
    });
  }

  function createMockJob() {
    const image = upload?.previewUrl ?? getPresetById(selectedPreset).thumbnail;
    const nextScene: Scene = {
      id: `uploaded-${Date.now()}`,
      name: upload?.name.replace(/\.[^.]+$/, "") || "New Panorama",
      projectId: "villa-bali",
      presetId: selectedPreset,
      status: "rendering_openai",
      sourceSize: upload ? `${upload.width} x ${upload.height}` : "2048 x 1024",
      renderSize: "3840 x 1920",
      finalSize: "4096 x 2048",
      sourceWeight: upload ? formatFileSize(upload.size) : "1.2 MB",
      renderWeight: "-",
      finalWeight: "-",
      notes,
      jobId: `job_${Math.random().toString(16).slice(2, 10)}`,
      image,
      updatedAt: "Rendering now"
    };

    setScenes((currentScenes) => [nextScene, ...currentScenes]);
    setSelectedSceneId(nextScene.id);
    setScreen("job");
  }

  return (
    <main className="app-frame">
      <Sidebar active={screen} onNavigate={setScreen} />
      <section className="workspace">
        {screen === "projects" && <ProjectsScreen onOpenProject={() => setScreen("project")} onUpload={() => setScreen("upload")} />}
        {screen === "project" && (
          <ProjectScreen
            selectedScene={selectedScene}
            scenes={scenes}
            onSelectScene={setSelectedSceneId}
            onOpenViewer={() => setScreen("viewer")}
            onOpenJob={() => setScreen("job")}
          />
        )}
        {screen === "upload" && (
          <UploadScreen
            upload={upload}
            selectedPreset={selectedPreset}
            notes={notes}
            onFile={handleFile}
            onPreset={setSelectedPreset}
            onNotes={setNotes}
            onCreateJob={createMockJob}
          />
        )}
        {screen === "job" && <JobScreen scene={selectedScene} onViewScene={() => setScreen("viewer")} />}
        {screen === "viewer" && <ViewerScreen scene={selectedScene} scenes={scenes} onSelectScene={setSelectedSceneId} />}
      </section>
    </main>
  );
}

function Sidebar({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  const items: Array<{ screen: Screen; label: string; icon: React.ReactNode }> = [
    { screen: "projects", label: "Projects", icon: <Grid2X2 size={18} /> },
    { screen: "job", label: "Jobs", icon: <BarChart3 size={18} /> },
    { screen: "viewer", label: "Viewer", icon: <Globe2 size={18} /> },
    { screen: "upload", label: "Settings", icon: <Settings size={18} /> }
  ];

  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate("projects")} type="button">
        <span className="brand-mark">
          <Sparkles size={21} />
        </span>
        <span>360 Render</span>
      </button>
      <nav className="nav-list">
        {items.map((item) => (
          <button
            key={item.label}
            className={`nav-item ${active === item.screen ? "active" : ""}`}
            onClick={() => onNavigate(item.screen)}
            type="button"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="mini-panel">
          <span>Storage Usage</span>
          <strong>256 GB / 1 TB</strong>
          <div className="meter">
            <i />
          </div>
          <small>25%</small>
        </div>
        <div className="mini-panel plan">
          <strong>Pro Plan</strong>
          <span>Renews on Aug 12, 2026</span>
          <button type="button">Manage Plan</button>
        </div>
        <div className="profile">
          <span>AR</span>
          <div>
            <strong>Alex Render</strong>
            <small>alex@360render.com</small>
          </div>
          <ChevronDown size={15} />
        </div>
      </div>
    </aside>
  );
}

function ProjectsScreen({ onOpenProject, onUpload }: { onOpenProject: () => void; onUpload: () => void }) {
  return (
    <div className="screen">
      <HeaderActions title="Projects" subtitle="Manage and organize your 360 panorama render projects." onUpload={onUpload} />
      <div className="project-grid">
        {seedProjects.map((project) => (
          <button className="project-card" key={project.id} onClick={onOpenProject} type="button">
            <img src={project.cover} alt="" />
            <div className="card-body">
              <div className="row between">
                <h3>{project.name}</h3>
                <MoreHorizontal size={18} />
              </div>
              <p>
                <Grid2X2 size={15} /> {project.scenes} Scenes <Clock3 size={15} /> {project.updatedAt}
              </p>
              <div className="status-stats">
                <StatusStat tone="ready" value={project.ready} label="Ready" />
                <StatusStat tone="rendering" value={project.rendering} label="Rendering" />
                <StatusStat tone="failed" value={project.failed} label="Failed" />
              </div>
            </div>
          </button>
        ))}
        <button className="new-project-card" type="button">
          <Plus size={34} />
          <strong>New Project</strong>
          <span>Start a new 360 panorama render project</span>
        </button>
      </div>
      <div className="summary-bar">
        <SummaryMetric icon={<Folder size={24} />} value="5" label="Total Projects" />
        <SummaryMetric icon={<CheckCircle2 size={25} />} value="91" label="Scenes Ready" tone="ready" />
        <SummaryMetric icon={<Loader2 size={25} />} value="12" label="Rendering" tone="rendering" />
        <SummaryMetric icon={<XCircle size={25} />} value="11" label="Failed" tone="failed" />
        <SummaryMetric icon={<Gauge size={25} />} value="256 GB" label="Storage Used" />
      </div>
    </div>
  );
}

function ProjectScreen({
  selectedScene,
  scenes,
  onSelectScene,
  onOpenViewer,
  onOpenJob
}: {
  selectedScene: Scene;
  scenes: Scene[];
  onSelectScene: (id: string) => void;
  onOpenViewer: () => void;
  onOpenJob: () => void;
}) {
  const preset = getPresetById(selectedScene.presetId);

  return (
    <div className="screen project-detail">
      <div className="breadcrumb">Projects / Villa Bali Interior</div>
      <div className="title-row">
        <div>
          <h1>Villa Bali Interior</h1>
          <p>
            <Grid2X2 size={16} /> 12 Scenes <Clock3 size={16} /> Updated 2h ago
          </p>
        </div>
        <button className="icon-button" type="button">
          <MoreHorizontal size={20} />
        </button>
      </div>
      <div className="detail-layout">
        <aside className="scene-rail panel">
          <h2>Scenes</h2>
          <label className="search-field compact">
            <Search size={16} />
            <input placeholder="Search scenes..." />
          </label>
          <div className="filter-row">
            {["All", "Ready", "Rendering", "Failed", "Uploaded"].map((item) => (
              <button className={item === "All" ? "active" : ""} key={item} type="button">
                {item}
              </button>
            ))}
          </div>
          <div className="scene-list">
            {scenes.map((scene) => (
              <button
                className={`scene-row ${selectedScene.id === scene.id ? "active" : ""}`}
                key={scene.id}
                onClick={() => onSelectScene(scene.id)}
                type="button"
              >
                <img src={scene.image} alt="" />
                <span>
                  <strong>{scene.name}</strong>
                  <StatusPill status={scene.status} compact />
                </span>
                <MoreHorizontal size={16} />
              </button>
            ))}
          </div>
          <small>{scenes.length} scenes</small>
        </aside>
        <section className="scene-main">
          <div className="hero-pano">
            <img src={selectedScene.image} alt="" />
            <div className="pano-floating">
              <button type="button">‹</button>
              <button onClick={onOpenViewer} type="button">
                <Globe2 size={18} />
              </button>
              <button type="button">›</button>
            </div>
          </div>
          <div className="tabs">
            {["Overview", "Versions", "Details", "Activity"].map((tab) => (
              <button className={tab === "Overview" ? "active" : ""} key={tab} type="button">
                {tab}
              </button>
            ))}
          </div>
          <div className="overview-grid">
            <div className="panel comparison">
              <h2>Comparison</h2>
              <div className="comparison-grid">
                <VersionCard title="Original" badge="Uploaded" image={selectedScene.image} size={selectedScene.sourceSize} weight={selectedScene.sourceWeight} />
                <VersionCard title="OpenAI Render" image={selectedScene.image} size={selectedScene.renderSize} weight={selectedScene.renderWeight} />
                <VersionCard title="Topaz Final" badge="Final" image={selectedScene.image} size={selectedScene.finalSize} weight={selectedScene.finalWeight} />
              </div>
              <div className="metadata-table">
                <span>Preset</span>
                <strong>{preset.name}</strong>
                <span>Notes</span>
                <strong>{selectedScene.notes}</strong>
                <span>Render Job ID</span>
                <strong>{selectedScene.jobId}</strong>
                <span>Model</span>
                <strong>gpt-image-2</strong>
                <span>Topaz Model</span>
                <strong>Photo AI v2</strong>
              </div>
            </div>
            <div className="panel action-stack">
              <button onClick={onOpenViewer} type="button">
                <Globe2 size={20} /> View 360
              </button>
              <button type="button">
                <Download size={20} /> Download Final
              </button>
              <button onClick={onOpenJob} type="button">
                <RefreshCcw size={20} /> Rerender
              </button>
              <button className="danger" type="button">
                <Trash2 size={20} /> Delete
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function UploadScreen({
  upload,
  selectedPreset,
  notes,
  onFile,
  onPreset,
  onNotes,
  onCreateJob
}: {
  upload: UploadedFileState | null;
  selectedPreset: PresetId;
  notes: string;
  onFile: (file: File) => void;
  onPreset: (preset: PresetId) => void;
  onNotes: (notes: string) => void;
  onCreateJob: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canCreate = upload?.valid ?? false;

  function selectFile(fileList: FileList | null) {
    const file = fileList?.item(0);
    if (file) {
      onFile(file);
    }
  }

  return (
    <div className="screen upload-screen">
      <HeaderActions title="Upload New Scene" subtitle="Upload a 2:1 equirectangular panorama image" onUpload={() => inputRef.current?.click()} />
      <div className="upload-layout">
        <section>
          <div
            className="dropzone panel"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              selectFile(event.dataTransfer.files);
            }}
          >
            <CloudUpload size={72} />
            <strong>Drag & drop your panorama here</strong>
            <span>or</span>
            <button onClick={() => inputRef.current?.click()} type="button">
              <File size={18} /> Choose File
            </button>
            <input
              ref={inputRef}
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => selectFile(event.target.files)}
              type="file"
            />
          </div>
          {upload && (
            <>
              <div className="uploaded-file panel">
                <img src={upload.previewUrl} alt="" />
                <div>
                  <strong>{upload.name}</strong>
                  <p>
                    {upload.width} x {upload.height} <span>JPG</span> <span>{formatFileSize(upload.size)}</span>
                  </p>
                </div>
                <button type="button">
                  <X size={20} />
                </button>
              </div>
              <div className="validation panel">
                {upload.checks.map((check) => (
                  <div key={check.label}>
                    {check.status === "valid" ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                    <span>{check.label}</span>
                    <b>{check.status === "valid" ? "Valid" : "Invalid"}</b>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
        <aside className="panel preset-panel">
          <h2>
            Choose Preset <Info size={16} />
          </h2>
          <div className="preset-list">
            {RENDER_PRESETS.map((preset) => (
              <button
                className={`preset-card ${preset.id === selectedPreset ? "active" : ""}`}
                key={preset.id}
                onClick={() => onPreset(preset.id)}
                type="button"
              >
                <img src={preset.thumbnail} alt="" />
                <span>
                  <strong>{preset.name}</strong>
                  <small>{preset.description}</small>
                </span>
                <i>{preset.id === selectedPreset && <Check size={15} />}</i>
              </button>
            ))}
          </div>
          <label className="notes-field">
            <span>Notes (Optional)</span>
            <textarea maxLength={500} onChange={(event) => onNotes(event.target.value)} value={notes} />
            <small>{notes.length} / 500</small>
          </label>
          <button className="primary-action" disabled={!canCreate} onClick={onCreateJob} type="button">
            <UploadCloud size={20} /> Upload & Create Job
          </button>
          <p className="secure-note">Your files are private and secure</p>
        </aside>
      </div>
    </div>
  );
}

function JobScreen({ scene, onViewScene }: { scene: Scene; onViewScene: () => void }) {
  const progress = getJobProgress(scene.status);
  const activeIndex = getActiveStepIndex(scene.status);
  const preset = getPresetById(scene.presetId);

  return (
    <div className="screen job-screen">
      <div className="breadcrumb">Projects / Villa Bali Interior / Jobs / {scene.jobId}</div>
      <div className="title-row">
        <div>
          <h1>Render Job</h1>
          <p>{scene.name}</p>
        </div>
        <button className="secondary-button" onClick={onViewScene} type="button">
          <Cuboid size={19} /> View Scene
        </button>
      </div>
      <section className="panel timeline-panel">
        <div className="timeline-line" />
        {JOB_STEPS.map((step, index) => {
          const isDone = scene.status === "ready" || index < activeIndex;
          const isActive = index === activeIndex && scene.status !== "ready";
          return (
            <div className={`timeline-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`} key={step.status}>
              <span>{isDone ? <Check size={28} /> : null}</span>
              <strong>{step.title}</strong>
              <small>{isDone ? nowLabel : isActive ? "In Progress" : "Pending"}</small>
            </div>
          );
        })}
      </section>
      <section className="panel progress-panel">
        <div className="row between">
          <div>
            <h2>{getStatusLabel(scene.status)} {scene.status !== "ready" && scene.status !== "failed" ? "in progress..." : ""}</h2>
            <p>{scene.status === "upscaling_topaz" ? "Enhancing panorama through Topaz Photo AI" : "Generating enhanced panorama with gpt-image-2"}</p>
          </div>
          <strong className="percent">{progress}%</strong>
        </div>
        <div className="progress-track">
          <i style={{ width: `${progress}%` }} />
        </div>
        <p>
          <Clock3 size={18} /> This usually takes 1-2 minutes
        </p>
      </section>
      <section className="panel job-details">
        <div className="row between">
          <h2>Job Details</h2>
          <StatusPill status={scene.status} />
        </div>
        <div className="details-grid">
          <DetailRow icon={<ImageIcon size={23} />} label="Preset" value={preset.name} />
          <DetailRow icon={<CalendarDays size={23} />} label="Created" value={nowLabel} />
          <DetailRow icon={<Cuboid size={23} />} label="Model" value="gpt-image-2" />
          <DetailRow icon={<Clock3 size={23} />} label="Started" value={nowLabel} />
          <DetailRow icon={<Maximize size={23} />} label="Output Size" value="3840 x 1920" />
          <DetailRow icon={<Sparkles size={23} />} label="Topaz Model" value="Photo AI v2" />
        </div>
      </section>
    </div>
  );
}

function ViewerScreen({ scene, scenes, onSelectScene }: { scene: Scene; scenes: Scene[]; onSelectScene: (id: string) => void }) {
  return (
    <div className="screen viewer-screen">
      <div className="viewer-header">
        <div>
          <div className="breadcrumb">Projects / Villa Bali Interior / {scene.name}</div>
          <h1>
            {scene.name} <StatusPill status="ready" />
          </h1>
        </div>
        <div className="toolbar-actions">
          <button type="button">
            <Download size={18} /> Download
          </button>
          <button type="button">
            <Share2 size={18} /> Share
          </button>
          <button type="button">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
      <div className="viewer-card">
        <PanoramaSphere src={scene.image} />
        <div className="viewer-controls">
          <button type="button">
            <ZoomIn size={22} />
          </button>
          <button type="button">
            <ZoomOut size={22} />
          </button>
          <button type="button">
            <Globe2 size={22} />
          </button>
          <button type="button">
            <Maximize size={22} />
          </button>
          <button type="button">
            <RefreshCcw size={22} />
          </button>
        </div>
      </div>
      <div className="thumb-rail">
        {scenes.map((item) => (
          <button className={item.id === scene.id ? "active" : ""} key={item.id} onClick={() => onSelectScene(item.id)} type="button">
            <img src={item.image} alt="" />
            <span>{item.name.replace(" Panorama", "")}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HeaderActions({ title, subtitle, onUpload }: { title: string; subtitle: string; onUpload: () => void }) {
  return (
    <header className="screen-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="header-tools">
        <label className="search-field">
          <Search size={17} />
          <input placeholder="Search projects..." />
        </label>
        <button className="icon-button" type="button">
          <ListFilter size={20} />
        </button>
        <button className="light-button" type="button">
          <Plus size={19} /> New Project
        </button>
        <button onClick={onUpload} type="button">
          <CloudUpload size={18} /> Upload Scene
        </button>
      </div>
    </header>
  );
}

function StatusStat({ tone, value, label }: { tone: "ready" | "rendering" | "failed"; value: number; label: string }) {
  return (
    <span className={`stat ${tone}`}>
      {tone === "ready" && <CheckCircle2 size={22} />}
      {tone === "rendering" && <Loader2 size={22} />}
      {tone === "failed" && <XCircle size={22} />}
      <b>{value}</b>
      <small>{label}</small>
    </span>
  );
}

function SummaryMetric({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone?: string }) {
  return (
    <div className={tone ? `summary-metric ${tone}` : "summary-metric"}>
      {icon}
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function StatusPill({ status, compact = false }: { status: RenderJobStatus; compact?: boolean }) {
  return <span className={`status-pill ${status} ${compact ? "compact" : ""}`}>{compact ? null : <i />} {getStatusLabel(status)}</span>;
}

function VersionCard({ title, badge, image, size, weight }: { title: string; badge?: string; image: string; size: string; weight: string }) {
  return (
    <div className="version-card">
      <div className="row between">
        <strong>{title}</strong>
        {badge && <small>{badge}</small>}
      </div>
      <img src={image} alt="" />
      <p>
        <span>{size}</span>
        <span>{weight}</span>
      </p>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="detail-row">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      reject(new Error("Unable to read image dimensions."));
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });
}
