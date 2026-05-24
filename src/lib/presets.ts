export type PresetId = "interior" | "exterior_mendung" | "exterior_cerah" | "aerial_view_mendung";

export type RenderPreset = {
  id: PresetId;
  name: string;
  description: string;
  thumbnail: string;
  prompt: string;
};

export const RENDER_PRESETS: RenderPreset[] = [
  {
    id: "interior",
    name: "Interior",
    description: "Optimized for indoor spaces with natural and artificial lighting.",
    thumbnail: "/panoramas/living-room.jpg",
    prompt:
      "Transform this SketchUp 360 panorama into a photorealistic interior architectural render. Preserve the room layout, camera position, openings, furniture placement, and main geometry. Improve materials, lighting, soft shadows, reflections, ceiling details, fabric texture, plants, and realistic styling."
  },
  {
    id: "exterior_mendung",
    name: "Exterior Mendung",
    description: "Overcast outdoor lighting for soft, diffused results.",
    thumbnail: "/panoramas/outdoor-terrace.jpg",
    prompt:
      "Transform this SketchUp 360 panorama into a photorealistic exterior render under cloudy overcast lighting. Preserve massing, landscape layout, paths, camera position, and main geometry. Add realistic diffused daylight, wet-soft material response, natural vegetation, and balanced architectural detail."
  },
  {
    id: "exterior_cerah",
    name: "Exterior Cerah",
    description: "Bright sunny outdoor lighting with crisp shadows.",
    thumbnail: "/panoramas/mountain-resort.jpg",
    prompt:
      "Transform this SketchUp 360 panorama into a photorealistic sunny exterior render. Preserve building geometry, view direction, landscape organization, and camera position. Add bright tropical daylight, crisp shadows, realistic sky, natural materials, plants, and polished architectural presentation quality."
  },
  {
    id: "aerial_view_mendung",
    name: "Aerial View Mendung",
    description: "Overcast aerial lighting for balanced, soft tones.",
    thumbnail: "/panoramas/aerial-view.jpg",
    prompt:
      "Transform this SketchUp aerial 360 panorama into a photorealistic overcast architectural visualization. Preserve the site plan, coastline or landscape structure, roads, buildings, and camera position. Improve atmosphere, terrain detail, soft cloudy lighting, vegetation, and presentation realism."
  }
];

export function getPresetById(id: PresetId): RenderPreset {
  return RENDER_PRESETS.find((preset) => preset.id === id) ?? RENDER_PRESETS[0];
}
