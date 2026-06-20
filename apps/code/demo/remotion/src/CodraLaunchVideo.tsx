import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from 'remotion';

const COLORS = {
  background: '#0d1117',
  primary: '#58a6ff',
  secondary: '#3fb950',
  accent: '#f0f6fc',
  muted: '#8b949e',
  success: '#3fb950',
};

const TerminalScene: React.FC<{
  title: string;
  commands: string[];
  caption: string;
}> = ({ title, commands, caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        padding: 60,
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Title */}
        <div
          style={{
            marginBottom: 30,
            opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <span style={{ color: COLORS.muted, fontSize: 24 }}>$ </span>
          <span style={{ color: COLORS.accent, fontSize: 24 }}>{title}</span>
        </div>

        {/* Terminal Output */}
        <div
          style={{
            backgroundColor: '#161b22',
            borderRadius: 12,
            padding: 30,
            border: `1px solid #30363d`,
          }}
        >
          {commands.map((cmd, i) => (
            <div
              key={i}
              style={{
                marginBottom: 15,
                opacity: interpolate(frame, [i * 15, i * 15 + 15], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              <span style={{ color: COLORS.secondary, fontFamily: 'monospace' }}>
                {cmd}
              </span>
            </div>
          ))}
        </div>

        {/* Caption */}
        <div
          style={{
            marginTop: 30,
            textAlign: 'center',
            opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <span style={{ color: COLORS.accent, fontSize: 28 }}>{caption}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TextScene: React.FC<{
  title: string;
  subtitle: string;
  caption: string;
}> = ({ title, subtitle, caption }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        padding: 60,
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <h1 style={{ color: COLORS.accent, fontSize: 48, marginBottom: 20 }}>
            {title}
          </h1>
          <p style={{ color: COLORS.muted, fontSize: 28 }}>{subtitle}</p>
        </div>

        <div
          style={{
            marginTop: 40,
            opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <span style={{ color: COLORS.accent, fontSize: 28 }}>{caption}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        padding: 60,
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <h1 style={{ color: COLORS.accent, fontSize: 48, marginBottom: 30 }}>
            Available Now
          </h1>
          <div style={{ fontSize: 28, color: COLORS.muted, lineHeight: 1.8 }}>
            <p style={{ marginBottom: 15 }}>
              <span style={{ color: COLORS.secondary }}>npm</span> install -g @talocode/codra-code
            </p>
            <p style={{ marginBottom: 15 }}>
              <span style={{ color: COLORS.primary }}>github.com/talocode/codra</span>
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        padding: 60,
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          <h1 style={{ color: COLORS.accent, fontSize: 56, marginBottom: 20 }}>
            Codra Code v0.1.6
          </h1>
          <p style={{ color: COLORS.muted, fontSize: 28 }}>
            A local-first coding agent for real software work
          </p>
          <p style={{ color: COLORS.muted, fontSize: 20, marginTop: 20 }}>
            by Talocode
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CodraLaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0d1117' }}>
      {/* Scene 1: Hook (0-3s) */}
      <Sequence from={0} durationInFrames={90}>
        <TerminalScene
          title="npm install -g @talocode/codra-code"
          commands={['Installing @talocode/codra-code...', '✓ Installed successfully']}
          caption="Install a local-first coding agent in one command"
        />
      </Sequence>

      {/* Scene 2: Pain/Context (3-8s) */}
      <Sequence from={90} durationInFrames={150}>
        <TextScene
          title="Tired of black-box AI?"
          subtitle="AI coding tools that can't see your code, don't understand your project, and require constant context."
          caption="There's a better way."
        />
      </Sequence>

      {/* Scene 3: Product Workflow (8-25s) */}
      <Sequence from={240} durationInFrames={510}>
        <TerminalScene
          title="codra-code --mock \"/status\""
          commands={[
            'Codra Code Status:',
            '  Version: 0.1.6',
            '  Provider: mock',
            '  Model: gpt-4o-mini',
            '  Mode: Test Mode (Mock)',
            '  Project: /your/project',
          ]}
          caption="Codra Code runs from your terminal. Local-first. Open-source."
        />
      </Sequence>

      {/* Scene 4: Skills & Plugins (25-35s) */}
      <Sequence from={750} durationInFrames={300}>
        <TerminalScene
          title="codra-code --mock \"/skills\""
          commands={[
            'Installed Skills:',
            '  - codra-code-review',
            '  - codra-local-first',
            '  - codra-release',
            '  - codra-testing',
          ]}
          caption="Skills. Plugins. MCP. Built for real software work."
        />
      </Sequence>

      {/* Scene 5: Tera Login (35-42s) */}
      <Sequence from={1050} durationInFrames={210}>
        <TextScene
          title="Connect to Tera"
          subtitle="Authenticate with your Tera account for the full ecosystem."
          caption="codra-code login"
        />
      </Sequence>

      {/* Scene 6: Proof (42-50s) */}
      <Sequence from={1260} durationInFrames={240}>
        <TerminalScene
          title="codra-code --mock \"/git status\""
          commands={[
            'M src/index.ts',
            'M README.md',
            '?? new-feature.ts',
          ]}
          caption="Real git integration. Real file editing. Real control."
        />
      </Sequence>

      {/* Scene 7: CTA (50-58s) */}
      <Sequence from={1500} durationInFrames={240}>
        <CTAScene />
      </Sequence>

      {/* Scene 8: Closing (58-60s) */}
      <Sequence from={1740} durationInFrames={60}>
        <ClosingScene />
      </Sequence>
    </AbsoluteFill>
  );
};
