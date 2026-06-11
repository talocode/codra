import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const rustPaths = [
  path.join(repoRoot, "crates/codra-protocol/src/lib.rs"),
  path.join(repoRoot, "crates/codra-protocol/src/agent_loop.rs"),
];

const rustSource = rustPaths.map((filePath) => readFileSync(filePath, "utf8")).join("\n");

const RAW = "raw";
const CAMEL = "camel";

const DOMAIN_CONFIGS = [
  {
    label: "task-loop",
    tsPath: path.join(repoRoot, "packages/shared/task-loop.ts"),
    fieldNameStyle: CAMEL,
    unions: ["TaskStatus"],
    interfaces: [
      "Task",
      "TaskPlan",
      "TaskStep",
      "FileChange",
      "CommandRun",
      "VerificationResult",
      "TaskEvent",
      "WorkspaceFileNode",
      "DetectedCommand",
      "WorkspaceContext",
    ],
    inlineUnions: [
      {
        rustEnum: "FileNodeKind",
        tsInterface: "WorkspaceFileNode",
        tsField: "kind",
      },
    ],
  },
  {
    label: "planner",
    tsPath: path.join(repoRoot, "packages/shared/planner.ts"),
    fieldNameStyle: CAMEL,
    unions: ["PlanStatus", "PlanningMode", "PlanStepStatus", "PlanStepKind"],
    interfaces: [
      "TaskRequest",
      "TaskContext",
      "RiskItem",
      "AssumptionItem",
      "PlanDependency",
      "PlanStep",
      "ArchitectureProposal",
      "ExecutionPlan",
      "PlannerOutput",
      "PlannerDecision",
    ],
  },
  {
    label: "executor",
    tsPath: path.join(repoRoot, "packages/shared/executor.ts"),
    fieldNameStyle: CAMEL,
    unions: [
      "ExecutionStatus",
      "ExecutionMode",
      "StepExecutionStatus",
      "ActionKind",
      "PatchProposalStatus",
    ],
    interfaces: [
      "ExecutionState",
      "ObservationRecord",
      "PatchProposal",
      "StepExecutionRecord",
      "ActionIntent",
    ],
  },
  {
    label: "verifier",
    tsPath: path.join(repoRoot, "packages/shared/verifier.ts"),
    fieldNameStyle: CAMEL,
    unions: [
      "VerificationStatus",
      "VerificationCheckKind",
      "VerificationSeverity",
      "FailureClassification",
    ],
    interfaces: [
      "VerificationCheck",
      "VerificationFinding",
      "RetryRecommendation",
      "RetryRequest",
      "VerificationState",
    ],
  },
  {
    label: "agent-loop",
    tsPath: path.join(repoRoot, "packages/shared/agent-loop.ts"),
    fieldNameStyle: CAMEL,
    unions: [
      "AgentLoopState",
      "AgentFinishReason",
      "AgentApiResponseStatus",
      "AgentContentClassification",
      "AgentApiErrorClass",
      "AgentGoalVerdict",
      "AgentLoopEventType",
    ],
    interfaces: ["AgentLoopTransition", "AgentLoopDecision"],
  },
];

function parseRustStruct(name) {
  const match = rustSource.match(
    new RegExp(`pub struct ${name} \\{([\\s\\S]*?)\\n\\}`, "m"),
  );
  if (!match) return null;

  return [...match[1].matchAll(/^\s*pub\s+(\w+):\s+([^,]+),$/gm)].map((m) => ({
    name: m[1],
    type: m[2].trim(),
  }));
}

function parseRustEnumVariants(name) {
  const match = rustSource.match(
    new RegExp(`pub enum ${name} \\{([\\s\\S]*?)\\n\\}`, "m"),
  );
  if (!match) return null;

  return [...match[1].matchAll(/^\s*(\w+),$/gm)].map((m) => m[1]);
}

function parseTsInterface(tsSource, name) {
  const match = tsSource.match(
    new RegExp(`export interface ${name} \\{([\\s\\S]*?)\\n\\}`, "m"),
  );
  if (!match) return null;

  return [...match[1].matchAll(/^\s*(\w+)(\?)?:\s+([^;]+);$/gm)].map((m) => ({
    name: m[1],
    optional: m[2] === "?",
    type: m[3].trim(),
  }));
}

function parseTsUnion(tsSource, name) {
  const match = tsSource.match(
    new RegExp(`export type ${name} =([\\s\\S]*?);`, "m"),
  );
  if (!match) return null;

  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function toSnakeCase(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .toLowerCase();
}

function snakeToCamel(value) {
  return value.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function mapRustFieldName(name, style) {
  if (style === CAMEL) {
    return snakeToCamel(name);
  }
  return name;
}

function compareUnion(tsSource, rustEnumName, issuePrefix, issues) {
  const rustVariants = parseRustEnumVariants(rustEnumName);
  const tsVariants = parseTsUnion(tsSource, rustEnumName);

  if (!rustVariants) {
    issues.push(`${issuePrefix} missing Rust enum: ${rustEnumName}`);
    return;
  }
  if (!tsVariants) {
    issues.push(`${issuePrefix} missing TS union: ${rustEnumName}`);
    return;
  }

  const expected = rustVariants.map(toSnakeCase);
  const missingInTs = expected.filter(
    (variant) => !tsVariants.includes(variant),
  );
  const extraInTs = tsVariants.filter((variant) => !expected.includes(variant));

  if (missingInTs.length) {
    issues.push(
      `${issuePrefix} ${rustEnumName} missing TS variants: ${missingInTs.join(", ")}`,
    );
  }
  if (extraInTs.length) {
    issues.push(
      `${issuePrefix} ${rustEnumName} has extra TS variants: ${extraInTs.join(", ")}`,
    );
  }
}

function compareInterface(
  tsSource,
  structName,
  fieldNameStyle,
  issuePrefix,
  issues,
) {
  const rustFields = parseRustStruct(structName);
  const tsFields = parseTsInterface(tsSource, structName);

  if (!rustFields) {
    issues.push(`${issuePrefix} missing Rust struct: ${structName}`);
    return;
  }
  if (!tsFields) {
    issues.push(`${issuePrefix} missing TS interface: ${structName}`);
    return;
  }

  const rustFieldNames = rustFields.map((field) =>
    mapRustFieldName(field.name, fieldNameStyle),
  );
  const tsFieldNames = tsFields.map((field) => field.name);

  const missingInTs = rustFieldNames.filter(
    (name) => !tsFieldNames.includes(name),
  );
  const extraInTs = tsFieldNames.filter(
    (name) => !rustFieldNames.includes(name),
  );

  if (missingInTs.length) {
    issues.push(
      `${issuePrefix} ${structName} missing TS fields: ${missingInTs.join(", ")}`,
    );
  }
  if (extraInTs.length) {
    issues.push(
      `${issuePrefix} ${structName} has extra TS fields: ${extraInTs.join(", ")}`,
    );
  }
}

function compareInlineUnion(tsSource, config, issuePrefix, issues) {
  const rustVariants = parseRustEnumVariants(config.rustEnum)?.map(toSnakeCase);
  const tsFields = parseTsInterface(tsSource, config.tsInterface) ?? [];
  const targetField = tsFields.find((field) => field.name === config.tsField);

  if (!rustVariants) {
    issues.push(`${issuePrefix} missing Rust enum: ${config.rustEnum}`);
    return;
  }
  if (!targetField) {
    issues.push(
      `${issuePrefix} ${config.tsInterface} missing TS field: ${config.tsField}`,
    );
    return;
  }

  const tsVariants = [...targetField.type.matchAll(/"([^"]+)"/g)].map(
    (m) => m[1],
  );
  const missingInTs = rustVariants.filter(
    (variant) => !tsVariants.includes(variant),
  );
  const extraInTs = tsVariants.filter(
    (variant) => !rustVariants.includes(variant),
  );

  if (missingInTs.length) {
    issues.push(
      `${issuePrefix} ${config.tsInterface}.${config.tsField} missing TS variants: ${missingInTs.join(", ")}`,
    );
  }
  if (extraInTs.length) {
    issues.push(
      `${issuePrefix} ${config.tsInterface}.${config.tsField} has extra TS variants: ${extraInTs.join(", ")}`,
    );
  }
}

const issues = [];
const checkedSummary = [];

for (const domain of DOMAIN_CONFIGS) {
  const tsSource = readFileSync(domain.tsPath, "utf8");
  const issuePrefix = `[${domain.label}]`;

  for (const unionName of domain.unions ?? []) {
    compareUnion(tsSource, unionName, issuePrefix, issues);
  }

  for (const interfaceName of domain.interfaces ?? []) {
    compareInterface(
      tsSource,
      interfaceName,
      domain.fieldNameStyle ?? RAW,
      issuePrefix,
      issues,
    );
  }

  for (const inlineUnion of domain.inlineUnions ?? []) {
    compareInlineUnion(tsSource, inlineUnion, issuePrefix, issues);
  }

  checkedSummary.push(
    `${domain.label}: ${(domain.unions ?? []).length} unions, ${(domain.interfaces ?? []).length} interfaces${domain.inlineUnions?.length ? `, ${domain.inlineUnions.length} inline union checks` : ""}`,
  );
}

if (issues.length > 0) {
  console.error("Shared protocol sync check failed:\n");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Shared protocol sync check passed.");
for (const line of checkedSummary) {
  console.log(`- ${line}`);
}
