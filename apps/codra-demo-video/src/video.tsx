import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

const palette = {
  bg: "#05070a",
  panel: "#0b1118",
  panelSoft: "#0f1722",
  border: "rgba(255,255,255,0.08)",
  text: "#f4f7fb",
  muted: "#98a7bb",
  accent: "#f97316",
  accentSoft: "#60a5fa",
  success: "#86efac",
};


const Scene = ({ children }: { children: React.ReactNode }) => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 50% 10%, rgba(249,115,22,0.12), transparent 28%), radial-gradient(circle at 75% 0%, rgba(96,165,250,0.10), transparent 24%), linear-gradient(180deg, #070b10 0%, #05070a 100%)",
      padding: 72,
      color: palette.text,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}
  >
    {children}
  </AbsoluteFill>
);

const Title = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div style={{ marginBottom: 32 }}>
    <div style={{ fontSize: 66, fontWeight: 800, letterSpacing: -2, lineHeight: 1.02 }}>{title}</div>
    {subtitle ? <div style={{ marginTop: 12, color: palette.muted, fontSize: 26, lineHeight: 1.35 }}>{subtitle}</div> : null}
  </div>
);

const Caption = ({ text }: { text: string }) => (
  <div style={{ color: palette.text, fontSize: 28, lineHeight: 1.45, maxWidth: 980 }}>{text}</div>
);

const TerminalWindow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      borderRadius: 24,
      background: "linear-gradient(180deg, #111827 0%, #080c12 100%)",
      border: `1px solid ${palette.border}`,
      boxShadow: "0 24px 100px rgba(0,0,0,0.45)",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "14px 18px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: `1px solid ${palette.border}`,
      }}
    >
      <Dot color="#ff5f56" />
      <Dot color="#ffbd2e" />
      <Dot color="#27c93f" />
      <div style={{ marginLeft: 10, color: palette.muted, fontSize: 16 }}>codra-demo</div>
    </div>
    <div
      style={{
        padding: 28,
        fontFamily: 'SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        fontSize: 30,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  </div>
);

const Dot = ({ color }: { color: string }) => <div style={{ width: 12, height: 12, borderRadius: 999, background: color }} />;

const TypingCommand = ({ command, frame, start, fps, cps = 14 }: { command: string; frame: number; start: number; fps: number; cps?: number }) => {
  const chars = Math.max(0, Math.min(command.length, Math.floor((frame - start) / (fps / cps))));
  const visible = command.slice(0, chars);
  const done = chars >= command.length;
  return (
    <span>
      {visible}
      <span style={{ opacity: done ? 0 : 1 }}>▋</span>
    </span>
  );
};

const FileTree = ({ files }: { files: string[] }) => (
  <div
    style={{
      marginTop: 20,
      padding: 18,
      borderRadius: 18,
      background: palette.panelSoft,
      border: `1px solid ${palette.border}`,
      fontSize: 22,
      color: palette.text,
    }}
  >
    {files.map((file) => (
      <div key={file} style={{ padding: "4px 0", color: file.includes("README") ? palette.accent : palette.text }}>
        {file}
      </div>
    ))}
  </div>
);

const ReleaseCard = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      marginTop: 18,
      borderRadius: 20,
      padding: 20,
      background: "linear-gradient(180deg, rgba(249,115,22,0.12), rgba(15,23,34,0.95))",
      border: `1px solid rgba(249,115,22,0.35)`,
    }}
  >
    {children}
  </div>
);

const TalocodeFooter = () => (
  <div
    style={{
      position: "absolute",
      left: 72,
      right: 72,
      bottom: 52,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: palette.muted,
      fontSize: 18,
      letterSpacing: 0.2,
    }}
  >
    <div>Talocode · Codra</div>
    <div>Build with AI, local-first.</div>
  </div>
);

const SceneShell = ({ children }: { children: React.ReactNode }) => (
  <Scene>
    {children}
    <TalocodeFooter />
  </Scene>
);

export const CodraHarnessDemo = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: palette.bg }}>
      <Sequence from={0} durationInFrames={5 * fps}>
        <SceneShell>
          <div style={{ display: "flex", height: "100%", alignItems: "center" }}>
            <div style={{ maxWidth: 980 }}>
              <div style={{ color: palette.accentSoft, fontSize: 22, letterSpacing: 5, textTransform: "uppercase", marginBottom: 14 }}>
                Codra v0.1.5 Project Harness
              </div>
              <Title title="A local operating layer for every repo." subtitle="Project memory. Safe commands. Release discipline. All in the repo." />
              <ReleaseCard>
                <div style={{ fontSize: 22, color: palette.muted }}>Local-first. No remote agent execution. No model dependency.</div>
              </ReleaseCard>
            </div>
          </div>
        </SceneShell>
      </Sequence>

      <Sequence from={5 * fps} durationInFrames={6 * fps}>
        <SceneShell>
          <Title title="Install it." subtitle="Start from the terminal." />
          <div style={{ maxWidth: 1100 }}>
            <TerminalWindow>
              <div>
                <TypingCommand command="npx @talocode/codra" frame={frame} start={5 * fps + 8} fps={fps} cps={16} />
              </div>
              <div style={{ marginTop: 18, color: palette.muted, fontSize: 22 }}>or</div>
              <div style={{ marginTop: 10, color: palette.success, fontSize: 28 }}>npm install -g @talocode/codra</div>
            </TerminalWindow>
          </div>
        </SceneShell>
      </Sequence>

      <Sequence from={11 * fps} durationInFrames={9 * fps}>
        <SceneShell>
          <Title title="Harness init." subtitle="Generate .codra/harness/ for the repo." />
          <div style={{ maxWidth: 1180 }}>
            <TerminalWindow>
              <div>codra harness init</div>
              <ReleaseCard>
                <div style={{ fontSize: 24, color: palette.muted, marginBottom: 12 }}>Generated files</div>
                <FileTree
                  files={[
                    ".codra/harness/README.md",
                    ".codra/harness/project.json",
                    ".codra/harness/memory.md",
                    ".codra/harness/commands.json",
                    ".codra/harness/permissions.json",
                    ".codra/harness/release-checklist.md",
                    ".codra/harness/demo-video-checklist.md",
                  ]}
                />
              </ReleaseCard>
            </TerminalWindow>
          </div>
        </SceneShell>
      </Sequence>

      <Sequence from={20 * fps} durationInFrames={8 * fps}>
        <SceneShell>
          <Title title="Harness status." subtitle="Detect project metadata, commands, and missing setup." />
          <div style={{ maxWidth: 1160 }}>
            <TerminalWindow>
              <div>codra harness status</div>
              <ReleaseCard>
                <div style={{ fontSize: 22, color: palette.text }}>- .codra/harness exists</div>
                <div style={{ fontSize: 22, color: palette.text, marginTop: 8 }}>- project name detected</div>
                <div style={{ fontSize: 22, color: palette.text, marginTop: 8 }}>- package manager detected</div>
                <div style={{ fontSize: 22, color: palette.text, marginTop: 8 }}>- commands detected</div>
                <div style={{ fontSize: 22, color: palette.text, marginTop: 8 }}>- missing recommended files listed</div>
              </ReleaseCard>
            </TerminalWindow>
          </div>
        </SceneShell>
      </Sequence>

      <Sequence from={28 * fps} durationInFrames={8 * fps}>
        <SceneShell>
          <Title title="Harness doctor." subtitle="Validate the repo’s local agent operating layer." />
          <div style={{ maxWidth: 1120 }}>
            <TerminalWindow>
              <div>codra harness doctor</div>
              <ReleaseCard>
                <div style={{ fontSize: 22, color: palette.success }}>✓ All harness files exist</div>
                <div style={{ fontSize: 22, color: palette.success, marginTop: 8 }}>✓ JSON files are valid</div>
                <div style={{ fontSize: 22, color: palette.success, marginTop: 8 }}>✓ Release checklist exists</div>
                <div style={{ fontSize: 22, color: palette.success, marginTop: 8 }}>✓ Demo video checklist exists</div>
              </ReleaseCard>
            </TerminalWindow>
          </div>
        </SceneShell>
      </Sequence>

      <Sequence from={36 * fps} durationInFrames={10 * fps}>
        <SceneShell>
          <Title title="Why it matters." subtitle="Memory. Permissions. Release discipline. Demo-video checklist. Local-first workflow." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18, maxWidth: 1180 }}>
            <ReleaseCard>
              <div style={{ fontSize: 24, color: palette.text }}>Memory</div>
              <div style={{ fontSize: 20, color: palette.muted, marginTop: 8 }}>Keep project decisions in the repo.</div>
            </ReleaseCard>
            <ReleaseCard>
              <div style={{ fontSize: 24, color: palette.text }}>Permissions</div>
              <div style={{ fontSize: 20, color: palette.muted, marginTop: 8 }}>Make safe actions explicit.</div>
            </ReleaseCard>
            <ReleaseCard>
              <div style={{ fontSize: 24, color: palette.text }}>Release discipline</div>
              <div style={{ fontSize: 20, color: palette.muted, marginTop: 8 }}>Keep shipping steps visible and repeatable.</div>
            </ReleaseCard>
            <ReleaseCard>
              <div style={{ fontSize: 24, color: palette.text }}>Demo checklist</div>
              <div style={{ fontSize: 20, color: palette.muted, marginTop: 8 }}>Make the release story easy to show.</div>
            </ReleaseCard>
          </div>
        </SceneShell>
      </Sequence>

      <Sequence from={46 * fps} durationInFrames={8 * fps}>
        <SceneShell>
          <div style={{ display: "flex", height: "100%", alignItems: "center" }}>
            <div>
              <Title title="Codra." subtitle="Build with AI. Part of the Talocode open-source ecosystem." />
              <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
                <div
                  style={{
                    padding: "16px 24px",
                    borderRadius: 999,
                    background: palette.text,
                    color: "#0b1118",
                    fontSize: 22,
                    fontWeight: 800,
                  }}
                >
                  npx @talocode/codra
                </div>
                <div style={{ color: palette.muted, fontSize: 20 }}>codra harness init · codra harness status · codra harness doctor</div>
              </div>
            </div>
          </div>
        </SceneShell>
      </Sequence>
    </AbsoluteFill>
  );
};
