import type { PresetId } from "@/lib/presets";
import type { RenderJobStatus } from "@/lib/render-jobs";

export type Scene = {
  id: string;
  name: string;
  projectId: string;
  presetId: PresetId;
  status: RenderJobStatus;
  sourceSize: string;
  renderSize: string;
  finalSize: string;
  sourceWeight: string;
  renderWeight: string;
  finalWeight: string;
  notes: string;
  jobId: string;
  image: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  scenes: number;
  updatedAt: string;
  cover: string;
  ready: number;
  rendering: number;
  failed: number;
};

export const projects: Project[] = [
  {
    id: "villa-bali",
    name: "Villa Bali Interior",
    scenes: 18,
    updatedAt: "Updated 2h ago",
    cover: "/panoramas/living-room.jpg",
    ready: 14,
    rendering: 3,
    failed: 1
  },
  {
    id: "mountain-resort",
    name: "Mountain Resort",
    scenes: 24,
    updatedAt: "Updated 5h ago",
    cover: "/panoramas/mountain-resort.jpg",
    ready: 20,
    rendering: 2,
    failed: 2
  },
  {
    id: "urban-office",
    name: "Urban Office",
    scenes: 16,
    updatedAt: "Updated 1d ago",
    cover: "/panoramas/urban-office.jpg",
    ready: 12,
    rendering: 2,
    failed: 2
  },
  {
    id: "beach-house",
    name: "Beach House",
    scenes: 20,
    updatedAt: "Updated 2d ago",
    cover: "/panoramas/outdoor-terrace.jpg",
    ready: 17,
    rendering: 1,
    failed: 2
  },
  {
    id: "aerial-survey",
    name: "Aerial Survey Project",
    scenes: 36,
    updatedAt: "Updated 3d ago",
    cover: "/panoramas/aerial-view.jpg",
    ready: 28,
    rendering: 4,
    failed: 4
  }
];

export const scenes: Scene[] = [
  {
    id: "living-room",
    name: "Living Room Panorama",
    projectId: "villa-bali",
    presetId: "interior",
    status: "ready",
    sourceSize: "2048 x 1024",
    renderSize: "3840 x 1920",
    finalSize: "4096 x 2048",
    sourceWeight: "2.4 MB",
    renderWeight: "5.8 MB",
    finalWeight: "9.7 MB",
    notes: "Make lighting warmer, keep natural materials",
    jobId: "job_8f3c2a7d9e1b4f6a",
    image: "/panoramas/living-room.jpg",
    updatedAt: "Updated 10m ago"
  },
  {
    id: "master-bedroom",
    name: "Master Bedroom",
    projectId: "villa-bali",
    presetId: "interior",
    status: "ready",
    sourceSize: "2048 x 1024",
    renderSize: "3840 x 1920",
    finalSize: "4096 x 2048",
    sourceWeight: "2.0 MB",
    renderWeight: "5.1 MB",
    finalWeight: "8.8 MB",
    notes: "Soft warm hotel suite lighting",
    jobId: "job_bedroom_001",
    image: "/panoramas/master-bedroom.jpg",
    updatedAt: "Updated 30m ago"
  },
  {
    id: "kitchen-dining",
    name: "Kitchen & Dining",
    projectId: "villa-bali",
    presetId: "interior",
    status: "rendering_openai",
    sourceSize: "2048 x 1024",
    renderSize: "3840 x 1920",
    finalSize: "4096 x 2048",
    sourceWeight: "2.1 MB",
    renderWeight: "-",
    finalWeight: "-",
    notes: "Evening ambience with concealed lighting",
    jobId: "job_kitchen_002",
    image: "/panoramas/kitchen-dining.jpg",
    updatedAt: "Rendering now"
  },
  {
    id: "outdoor-terrace",
    name: "Outdoor Terrace",
    projectId: "villa-bali",
    presetId: "exterior_cerah",
    status: "ready",
    sourceSize: "2048 x 1024",
    renderSize: "3840 x 1920",
    finalSize: "4096 x 2048",
    sourceWeight: "2.6 MB",
    renderWeight: "6.4 MB",
    finalWeight: "10.1 MB",
    notes: "Sunny tropical terrace with sea view",
    jobId: "job_terrace_003",
    image: "/panoramas/outdoor-terrace.jpg",
    updatedAt: "Updated 1h ago"
  },
  {
    id: "bathroom",
    name: "Bathroom",
    projectId: "villa-bali",
    presetId: "interior",
    status: "ready",
    sourceSize: "2048 x 1024",
    renderSize: "3840 x 1920",
    finalSize: "4096 x 2048",
    sourceWeight: "1.8 MB",
    renderWeight: "4.9 MB",
    finalWeight: "7.8 MB",
    notes: "Stone texture, spa mood, soft indirect light",
    jobId: "job_bathroom_004",
    image: "/panoramas/bathroom.jpg",
    updatedAt: "Updated 2h ago"
  },
  {
    id: "aerial-view",
    name: "Aerial View",
    projectId: "villa-bali",
    presetId: "aerial_view_mendung",
    status: "uploaded",
    sourceSize: "2048 x 1024",
    renderSize: "3840 x 1920",
    finalSize: "4096 x 2048",
    sourceWeight: "3.0 MB",
    renderWeight: "-",
    finalWeight: "-",
    notes: "Keep coastline and resort massing clear",
    jobId: "job_aerial_005",
    image: "/panoramas/aerial-view.jpg",
    updatedAt: "Uploaded"
  },
  {
    id: "guest-bedroom",
    name: "Guest Bedroom",
    projectId: "villa-bali",
    presetId: "interior",
    status: "failed",
    sourceSize: "2048 x 1024",
    renderSize: "3840 x 1920",
    finalSize: "4096 x 2048",
    sourceWeight: "1.9 MB",
    renderWeight: "-",
    finalWeight: "-",
    notes: "Needs retry after provider timeout",
    jobId: "job_guest_failed",
    image: "/panoramas/guest-bedroom.jpg",
    updatedAt: "Failed"
  }
];
