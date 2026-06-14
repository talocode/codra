import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const shell = {
  bg: "#0a0d12",
  panel: "#101720",
  panel2: "#0f141c",
  border: "rgba(255,255,255,0.08)",
  text: "#eef2ff",
  muted: "#93a4bd",
  accent: "#7dd3fc",
  success: "#a7f3d0",
};

const SceneTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ color: shell.text, fontSize: 52, fontWeight: 700, letterSpacing: -1.5 }}>
      {title}
    </div>
    {subtitle ? <div style={{ color: shell.muted, fontSize: 23, marginTop: 10 }}>{subtitle}</div> : null}
  </div>
);

const Caption = ({ text }: { text: string }) => (
  <div style={{ color: shell.text, fontSize: 24, lineHeight: 1.35, maxWidth: 900 }}>{text}</div>
);

const TerminalWindow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: "linear-gradient(180deg, #111827, #0a0d12)", border: `1px solid ${shell.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 30px 90px rgba(0,0,0,0.45)" }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "14px 18px", background: "rgba(255,255,255,0.04)", borderBottom: `1px solid ${shell.border}` }}>
      <div style={{ width: 12, height: 12, borderRadius: 999, background: "#ff5f57" }} />
      <div style={{ width: 12, height: 12, borderRadius: 999, background: "#febc2e" }} />
      <div style={{ width: 12, height: 12, borderRadius: 999, background: "#28c840" }} />
      <div style={{ marginLeft: 10, color: shell.muted, fontSize: 14 }}>codra-demo</div>
    </div>
    <div style={{ padding: 24, fontFamily: "Menlo, Monaco, Consolas, monospace", fontSize: 28, color: shell.text }}>{children}</div>
  </div>
);

const TypeCommand = ({ command, frame, start, cps = 14 }: { command: string; frame: number; start: number; cps?: number }) => {
  const chars = Math.max(0, Math.min(command.length, Math.floor((frame - start) / (30 / cps))));
  return <span>{command.slice(0, chars)}<span style={{ opacity: frame > start + command.length * 2 ? 0 : 1 }}>▋</span></span>;
};

const FileCard = ({ path, note }: { path: string; note: string }) => (
  <div style={{ border: `1px solid ${shell.border}`, background: shell.panel, borderRadius: 16, padding: 16, marginTop: 12 }}>
    <div style={{ color: shell.accent, fontSize: 18, marginBottom: 8 }}>{path}</div>
    <div style={{ color: shell.muted, fontSize: 18 }}>{note}</div>
  </div>
);

const CTA = ({ text }: { text: string }) => (
  <div style={{ display: "inline-flex", padding: "14px 22px", borderRadius: 999, background: shell.text, color: "#08101a", fontSize: 20, fontWeight: 700 }}>
    {text}
  </div>
);

const Scene = ({ children }: { children: React.ReactNode }) => (
  <AbsoluteFill style={{ background: `radial-gradient(circle at top, #111827 0%, ${shell.bg} 60%)`, padding: 64 }}>
    {children}
  </AbsoluteFill>
);

export const CodraDemo = () => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: shell.bg }}>
      <Sequence from={0} durationInFrames={5 * fps}>
        <Scene>
          <SceneTitle title="Introducing Codra" subtitle="Open-source, local-first AI coding agent" />
          <div style={{ marginTop: 48, color: shell.accent, fontSize: 22, letterSpacing: 4, textTransform: "uppercase" }}>Talocode</div>
        </Scene>
      </Sequence>
      <Sequence from={5 * fps} durationInFrames={8 * fps}>
        <Scene>
          <Caption text="Start with:" />
          <div style={{ height: 26 }} />
          <TerminalWindow>
            <div><TypeCommand command="npx @talocode/codra" frame={frame} start={5 * fps + 10} cps={16} /></div>
            <div style={{ marginTop: 18, color: shell.muted, fontSize: 20 }}>Or install it locally:</div>
            <div style={{ marginTop: 12, color: shell.success, fontSize: 24 }}>npm i -g @talocode/codra</div>
          </TerminalWindow>
        </Scene>
      </Sequence>
      <Sequence from={13 * fps} durationInFrames={12 * fps}>
        <Scene><SceneTitle title="Initialize project memory." /><TerminalWindow><div>codra init</div><div style={{ color: shell.success, marginTop: 14, fontSize: 21 }}>Create local workspace and memory files.</div><div style={{ marginTop: 18 }}><div style={{ color: shell.muted, fontSize: 18 }}>Writing .codra/...</div></div></TerminalWindow></Scene>
      </Sequence>
      <Sequence from={25 * fps} durationInFrames={8 * fps}>
        <Scene><SceneTitle title="Understand your codebase." /><TerminalWindow><div>codra understand</div><FileCard path=".codra/graph/knowledge-graph.json" note="Repository relationships and context graph." /><FileCard path=".codra/graph/summary.md" note="Readable repo summary for follow-up runs." /></TerminalWindow></Scene>
      </Sequence>
      <Sequence from={33 * fps} durationInFrames={8 * fps}>
        <Scene><SceneTitle title="Check your environment." /><TerminalWindow><div>codra doctor</div><div style={{ marginTop: 20, color: shell.success }}>All required local checks passed.</div><div style={{ marginTop: 14, color: shell.muted }}>codra memory status</div><div style={{ marginTop: 8, color: shell.text }}>Project context stays local.</div></TerminalWindow></Scene>
      </Sequence>
      <Sequence from={41 * fps} durationInFrames={7 * fps}>
        <Scene>
          <Caption text="Open-source. Local-first. Built for real software work." />
          <div style={{ height: 28 }} />
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <CTA text="npx @talocode/codra" />
            <div style={{ display: "inline-flex", padding: "14px 22px", borderRadius: 999, background: shell.panel, color: shell.text, fontSize: 20, fontWeight: 700, border: `1px solid ${shell.border}` }}>npm i -g @talocode/codra</div>
          </div>
          <div style={{ height: 24 }} />
          <div style={{ color: shell.muted, fontSize: 18 }}>Talocode / Codra</div>
        </Scene>
      </Sequence>
    </AbsoluteFill>
  );
};
