import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

const COLORS = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  primary: '#58a6ff',
  secondary: '#3fb950',
  accent: '#f0f6fc',
  muted: '#8b949e',
  warning: '#d29922',
  brand: '#58c4dd',
};

const FONT_BOLD = { fontFamily: 'DejaVu Sans, sans-serif', fontWeight: 'bold' };
const FONT_REGULAR = { fontFamily: 'DejaVu Sans, sans-serif' };
const FONT_MONO = { fontFamily: 'DejaVu Sans Mono, monospace' };

const fadeIn = (frame: number, start: number, duration: number, extrapolate = 'clamp') =>
  interpolate(frame, [start, start + duration], [0, 1], { extrapolateRight: extrapolate as any });

const scaleIn = (frame: number, start: number) =>
  spring({ frame: frame - start, fps: 30, config: { damping: 12, mass: 0.5 } });

const TypewriterText: React.FC<{ text: string; startFrame: number; color?: string; fontSize?: number }> = ({
  text, startFrame, color = COLORS.accent, fontSize = 28
}) => {
  const frame = useCurrentFrame();
  const chars = Math.max(0, Math.floor(fadeIn(frame, startFrame, 30) * text.length));
  return (
    <span style={{ color, fontSize, fontFamily: 'DejaVu Sans Mono, monospace' }}>
      {text.slice(0, chars)}
      {chars < text.length && <span style={{ opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0, color: COLORS.primary }}>|</span>}
    </span>
  );
};

const Box: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: COLORS.surface,
    borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    padding: 24,
    ...style,
  }}>
    {children}
  </div>
);

const OpeningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const logoScale = scaleIn(frame, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div style={{ textAlign: 'center', opacity: fadeIn(frame, 0, 20) }}>
        <div style={{ transform: `scale(${logoScale})`, marginBottom: 30 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.brand})`,
            margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 36, ...FONT_BOLD }}>C</span>
          </div>
        </div>
        <h1 style={{ color: COLORS.accent, fontSize: 64, margin: '0 0 12 0', ...FONT_BOLD }}>Codra Code</h1>
        <p style={{ color: COLORS.brand, fontSize: 36, margin: '0 0 8 0', ...FONT_REGULAR }}>v0.2.4</p>
        <div style={{ marginTop: 30, opacity: fadeIn(frame, 25, 15) }}>
          <p style={{ color: COLORS.muted, fontSize: 24, ...FONT_REGULAR }}>
            Composer UI · Auth Sanitization · Slash Commands
          </p>
        </div>
        <div style={{ marginTop: 40, opacity: fadeIn(frame, 45, 15) }}>
          <p style={{ color: COLORS.secondary, fontSize: 20, ...FONT_REGULAR }}>
            Local-first coding agent from Talocode
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ComposerUIScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, justifyContent: 'center', padding: 60 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', opacity: fadeIn(frame, 0, 15) }}>
        <h2 style={{ color: COLORS.brand, fontSize: 32, ...FONT_BOLD, marginBottom: 20 }}>
          New Composer UI
        </h2>

        <div style={{
          background: COLORS.surface, borderRadius: 12,
          border: `1px solid ${COLORS.border}`, padding: 30, marginBottom: 20,
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20, opacity: fadeIn(frame, 10, 10) }}>
            <span style={{ color: COLORS.brand, fontSize: 28, ...FONT_BOLD }}>codra-code</span>
            <p style={{ color: COLORS.muted, fontSize: 16 }}>Local-first coding agent by Talocode</p>
          </div>

          <div style={{
            border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 20, marginBottom: 16,
            opacity: fadeIn(frame, 25, 15),
          }}>
            <span style={{ color: COLORS.muted, fontSize: 18 }}>Ask Codra to build, fix, review, test, or understand this repo...</span>
          </div>

          <div style={{ opacity: fadeIn(frame, 45, 10), color: COLORS.muted, fontSize: 16 }}>
            <span style={{ color: COLORS.primary }}>Build</span>
            <span> · ollama/llama3.1 · local · confirm-edits</span>
          </div>
        </div>

        <div style={{ opacity: fadeIn(frame, 60, 15) }}>
          <p style={{ color: COLORS.secondary, fontSize: 22, ...FONT_REGULAR }}>
            Centered layout · Status bar · Responsive design
          </p>
          <p style={{ color: COLORS.muted, fontSize: 18 }}>
            Works on wide and narrow terminals
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const AuthScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, justifyContent: 'center', padding: 60 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', opacity: fadeIn(frame, 0, 15) }}>
        <h2 style={{ color: COLORS.brand, fontSize: 32, ...FONT_BOLD, marginBottom: 24 }}>
          Auth & Hosted Gating
        </h2>

        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <Box style={{ flex: 1, opacity: fadeIn(frame, 15, 10) }}>
            <span style={{ color: COLORS.secondary, fontSize: 18, ...FONT_BOLD }}>Local Mode</span>
            <p style={{ color: COLORS.muted, fontSize: 16, marginTop: 8 }}>
              Mock · Ollama<br />
              No auth required
            </p>
          </Box>
          <Box style={{ flex: 1, opacity: fadeIn(frame, 25, 10) }}>
            <span style={{ color: COLORS.primary, fontSize: 18, ...FONT_BOLD }}>Hosted Mode</span>
            <p style={{ color: COLORS.muted, fontSize: 16, marginTop: 8 }}>
              OpenAI · Anthropic · Gemini<br />
              Tera account required
            </p>
          </Box>
        </div>

        <Box style={{ opacity: fadeIn(frame, 40, 10) }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: COLORS.primary, fontSize: 16, ...FONT_MONO }}>$ codra-code login</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: COLORS.primary, fontSize: 16, ...FONT_MONO }}>$ codra-code auth status</span>
          </div>
          <div>
            <span style={{ color: COLORS.secondary, fontSize: 16, ...FONT_MONO }}>
              ✓ Signed in as user@example.com
            </span>
          </div>
        </Box>

        <div style={{ marginTop: 24, opacity: fadeIn(frame, 60, 10) }}>
          <p style={{ color: COLORS.muted, fontSize: 20, ...FONT_REGULAR }}>
            Safe token storage · Never prints secrets
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SlashCommandsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, justifyContent: 'center', padding: 60 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', opacity: fadeIn(frame, 0, 15) }}>
        <h2 style={{ color: COLORS.brand, fontSize: 32, ...FONT_BOLD, marginBottom: 20 }}>
          Slash Command Picker
        </h2>

        <Box style={{ opacity: fadeIn(frame, 10, 10), marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: COLORS.primary, fontSize: 16, ...FONT_MONO }}>$ /</span>
            <span style={{ color: COLORS.muted, fontSize: 16, ...FONT_MONO }}>  # Press / to open picker</span>
          </div>
        </Box>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
          {['/status', '/auth', '/login', '/model', '/provider', '/help', '/doctor', '/git', '/skills'].map((cmd, i) => (
            <div key={cmd} style={{
              background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}`,
              padding: '8px 16px', opacity: fadeIn(frame, 25 + i * 5, 8),
            }}>
              <span style={{ color: COLORS.secondary, fontSize: 18, ...FONT_MONO }}>{cmd}</span>
            </div>
          ))}
        </div>

        <div style={{ opacity: fadeIn(frame, 75, 10) }}>
          <p style={{ color: COLORS.secondary, fontSize: 22, ...FONT_REGULAR }}>
            Type <span style={{ ...FONT_MONO, color: COLORS.brand }}>/</span> for interactive menu
          </p>
          <p style={{ color: COLORS.muted, fontSize: 18 }}>
            Auth · Model · Status · Project · Plan · Build · Review · Test
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ModelPickerScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, justifyContent: 'center', padding: 60 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', opacity: fadeIn(frame, 0, 15) }}>
        <h2 style={{ color: COLORS.brand, fontSize: 32, ...FONT_BOLD, marginBottom: 20 }}>
          Model & Provider Picker
        </h2>

        <Box style={{ opacity: fadeIn(frame, 10, 10), marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: COLORS.primary, fontSize: 18, ...FONT_MONO }}>Select Provider:</span>
          </div>
          {[
            { name: 'ollama', desc: 'Local models (llama3.1, mistral, codestral)', color: COLORS.secondary },
            { name: 'openai', desc: 'GPT-4o mini, GPT-4o', color: COLORS.accent },
            { name: 'mock', desc: 'Test mode (no API calls)', color: COLORS.muted },
          ].map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', marginBottom: 4, borderRadius: 6,
              background: i === 0 ? COLORS.surface : 'transparent',
              opacity: fadeIn(frame, 25 + i * 8, 8),
            }}>
              <span style={{ color: p.color, fontSize: 18, ...FONT_MONO }}>{p.name}</span>
              <span style={{ color: COLORS.muted, fontSize: 14 }}>{p.desc}</span>
            </div>
          ))}
        </Box>

        <Box style={{ opacity: fadeIn(frame, 55, 10) }}>
          <span style={{ color: COLORS.secondary, fontSize: 16, ...FONT_MONO }}>
            ✓ Persisted to ~/.codra/config.json
          </span>
        </Box>
      </div>
    </AbsoluteFill>
  );
};

const AuthSanitizationScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, justifyContent: 'center', padding: 60 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', opacity: fadeIn(frame, 0, 15) }}>
        <h2 style={{ color: COLORS.brand, fontSize: 32, ...FONT_BOLD, marginBottom: 20 }}>
          Auth HTML Sanitization
        </h2>

        <Box style={{ opacity: fadeIn(frame, 10, 10), marginBottom: 20, borderColor: COLORS.warning }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: COLORS.muted, fontSize: 14, ...FONT_MONO }}>Before (v0.2.3):</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#f85149', fontSize: 16, ...FONT_MONO }}>
              ✗ Error: &lt;!DOCTYPE html&gt;&lt;html&gt;...
            </span>
          </div>
          <div>
            <span style={{ color: COLORS.muted, fontSize: 14, ...FONT_MONO }}>
              (Raw HTML dump — confusing and insecure)
            </span>
          </div>
        </Box>

        <Box style={{ opacity: fadeIn(frame, 35, 10), borderColor: COLORS.secondary }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: COLORS.secondary, fontSize: 14, ...FONT_MONO }}>After (v0.2.4):</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ color: '#f85149', fontSize: 16, ...FONT_MONO }}>
              ✗ Login failed: Tera auth endpoint was not found.
            </span>
          </div>
          <div>
            <span style={{ color: COLORS.muted, fontSize: 14, ...FONT_MONO }}>
              Local mode still works: codra-code --mock /status
            </span>
          </div>
        </Box>

        <div style={{ marginTop: 24, opacity: fadeIn(frame, 60, 10) }}>
          <p style={{ color: COLORS.secondary, fontSize: 20, ...FONT_REGULAR }}>
            Smart HTML detection · Clean error messages · No secrets leaked
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div style={{ textAlign: 'center', opacity: fadeIn(frame, 0, 15) }}>
        <h1 style={{ color: COLORS.accent, fontSize: 48, ...FONT_BOLD, marginBottom: 30 }}>
          Install Codra Code v0.2.4
        </h1>

        <div style={{
          background: COLORS.surface, borderRadius: 12, border: `1px solid ${COLORS.border}`,
          padding: 24, marginBottom: 24, display: 'inline-block',
          opacity: fadeIn(frame, 15, 10),
        }}>
          <span style={{ color: COLORS.secondary, fontSize: 24, ...FONT_MONO }}>
            npm install -g @talocode/codra-code
          </span>
        </div>

        <div style={{ opacity: fadeIn(frame, 30, 10) }}>
          <p style={{ color: COLORS.brand, fontSize: 22, ...FONT_REGULAR, marginBottom: 8 }}>
            github.com/talocode/codra
          </p>
          <p style={{ color: COLORS.muted, fontSize: 18, ...FONT_REGULAR }}>
            Local-first · Open-source · Built for real software work
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const logoScale = spring({ frame, fps: 30, config: { damping: 8 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div style={{ textAlign: 'center', opacity: fadeIn(frame, 0, 15) }}>
        <div style={{ transform: `scale(${logoScale})`, marginBottom: 24 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.brand})`,
            margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 28, ...FONT_BOLD }}>C</span>
          </div>
        </div>
        <h2 style={{ color: COLORS.accent, fontSize: 40, margin: '0 0 8 0', ...FONT_BOLD }}>Codra Code v0.2.4</h2>
        <p style={{ color: COLORS.muted, fontSize: 22, ...FONT_REGULAR }}>
          A local-first coding agent for real software work
        </p>
        <p style={{ color: COLORS.muted, fontSize: 18, marginTop: 16, ...FONT_REGULAR }}>
          by Talocode
        </p>
        <div style={{ marginTop: 30, opacity: fadeIn(frame, 30, 15) }}>
          <p style={{ color: COLORS.secondary, fontSize: 16, ...FONT_REGULAR }}>
            github.com/talocode/codra
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CodraCodeV024: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      {/* Scene 1: Opening (0-5s) */}
      <Sequence from={0} durationInFrames={5 * fps}>
        <OpeningScene />
      </Sequence>

      {/* Scene 2: Composer UI (5-12s) */}
      <Sequence from={5 * fps} durationInFrames={7 * fps}>
        <ComposerUIScene />
      </Sequence>

      {/* Scene 3: Auth & Hosted Gating (12-19s) */}
      <Sequence from={12 * fps} durationInFrames={7 * fps}>
        <AuthScene />
      </Sequence>

      {/* Scene 4: Slash Commands (19-26s) */}
      <Sequence from={19 * fps} durationInFrames={7 * fps}>
        <SlashCommandsScene />
      </Sequence>

      {/* Scene 5: Model Picker (26-33s) */}
      <Sequence from={26 * fps} durationInFrames={7 * fps}>
        <ModelPickerScene />
      </Sequence>

      {/* Scene 6: Auth Sanitization (33-40s) */}
      <Sequence from={33 * fps} durationInFrames={7 * fps}>
        <AuthSanitizationScene />
      </Sequence>

      {/* Scene 7: CTA (40-47s) */}
      <Sequence from={40 * fps} durationInFrames={7 * fps}>
        <CTAScene />
      </Sequence>

      {/* Scene 8: Closing (47-52s) */}
      <Sequence from={47 * fps} durationInFrames={5 * fps}>
        <ClosingScene />
      </Sequence>
    </AbsoluteFill>
  );
};
