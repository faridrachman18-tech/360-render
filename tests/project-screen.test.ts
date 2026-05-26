import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(fileURLToPath(new URL("../src/components/WorkspaceApp.tsx", import.meta.url)), "utf8");

describe("project detail screen", () => {
  it("does not render the scenes rail panel", () => {
    expect(workspaceSource).not.toContain('className="scene-rail panel"');
    expect(workspaceSource).not.toContain('placeholder="Search scenes..."');
  });
});

describe("app navigation", () => {
  it("does not expose a jobs page", () => {
    expect(workspaceSource).not.toContain('{ screen: "job", label: "Jobs"');
    expect(workspaceSource).not.toContain('screen === "job"');
    expect(workspaceSource).not.toContain("function JobScreen");
    expect(workspaceSource).not.toContain("Rerender");
  });
});
