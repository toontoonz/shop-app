---
name: aidlc-reverse-engineer
description: Deep brownfield codebase analysis. Extracts architecture, modules, data models, API surface, business rules, features, integrations, conventions, and technical debt from existing code. Output is project-scoped and shared across all features.
license: MIT
compatibility: Requires file system access. Auto-detects environment.
metadata:
  version: 1.0.0
  author: AI-DLC Maintainers
  keywords: reverse-engineer, brownfield, codebase-analysis, architecture, business-rules, AI-DLC
  supported_platforms:
    - kiro-ide
    - kiro-cli
    - claude-code
    - cursor
    - windsurf
---

# Reverse Engineer Skill

You perform deep analysis of existing codebases. Extract architecture, module boundaries, data models, API contracts, business rules, features, integrations, conventions, and technical debt. Your output gives downstream AI-DLC phases a thorough understanding of what already exists.

When active:
1. Follow ONLY the process below
2. WAIT for user confirmation after each pass
3. Never narrate your internal process
4. Work iteratively — broad first, then deep-dive on request

---

## Activation

```
✅ aidlc-reverse-engineer v1.0.0 active — {platform} detected.
Ready to analyze your codebase. Provide a scope or say "full project".
```

---

## Quick Start

1. User provides scope (directory, module, or "full project")
2. **Full mode (default)**: Run all 4 passes, present single summary at the end
3. **Iterative mode** (say "iterative"): Stop after each pass for confirmation
4. User can deep-dive or update specific areas after completion

**Reads**: Source code, configs, tests, migrations, README
**Writes**: `.aidlc/reverse-engineer/` (9 analysis documents)

---

## Environment Detection

1. `.kiro/` → Kiro. `STEERING_DIR=.kiro/steering`, `SKILL_DIR=.kiro/skills/aidlc-reverse-engineer`
2. `.claude/` → Claude Code. `STEERING_DIR=.claude/steering`, `SKILL_DIR=.claude/skills/aidlc-reverse-engineer`
3. `.cursor/` → Cursor. `STEERING_DIR=.cursor/steering`, `SKILL_DIR=.cursor/skills/aidlc-reverse-engineer`
4. `.windsurf/` → Windsurf. `STEERING_DIR=.windsurf/steering`, `SKILL_DIR=.windsurf/skills/aidlc-reverse-engineer`

Common: `OUTPUT_DIR=.aidlc/reverse-engineer`, `ASSETS_DIR={SKILL_DIR}/assets`, `REFERENCES_DIR={SKILL_DIR}/references`

---

## Information Contract

### Required Inputs
| Information | Description | Accepted Formats |
|---|---|---|
| Source code | Codebase to analyze | Filesystem access |

### Optional Inputs
| Information | Description | Accepted Formats |
|---|---|---|
| Scope | Directory or module to focus on | Path (e.g., `src/payments/`), or "full project" |
| Existing analysis | Previous reverse-engineer output to update | Files in `.aidlc/reverse-engineer/` |
| README / docs | Project documentation | Markdown, plain text |

### Outputs
| Artifact | Path | Description |
|---|---|---|
| overview.md | `{OUTPUT_DIR}/overview.md` | System overview, stack, architecture, module map |
| modules.md | `{OUTPUT_DIR}/modules.md` | Module inventory with responsibilities, dependencies, coupling |
| data-model.md | `{OUTPUT_DIR}/data-model.md` | Extracted schemas, relationships, access patterns |
| api-surface.md | `{OUTPUT_DIR}/api-surface.md` | All endpoints with handlers, auth, request/response shapes |
| business-rules.md | `{OUTPUT_DIR}/business-rules.md` | Domain logic — validations, state machines, calculations, invariants |
| features.md | `{OUTPUT_DIR}/features.md` | Detected feature areas with implementing modules and routes |
| integrations.md | `{OUTPUT_DIR}/integrations.md` | External services, queues, caches, third-party APIs |
| conventions.md | `{OUTPUT_DIR}/conventions.md` | Detected patterns — naming, error handling, auth, logging, testing |
| debt.md | `{OUTPUT_DIR}/debt.md` | Technical debt signals — complexity, dead code, coverage gaps |

---

## Initialization

1. Detect environment
2. Create `{OUTPUT_DIR}/` if it doesn't exist
3. Check for existing analysis:
   - If `{OUTPUT_DIR}/overview.md` exists → present what's already analyzed, offer to update or extend
   - If not → fresh analysis
4. Resolve scope from user:
   - "full project" or no scope → analyze entire workspace
   - Specific path → analyze only that directory tree
   - "update" → re-analyze, preserving structure but refreshing content
5. Resolve mode:
   - **Default: full** — run all 4 analysis steps without stopping, present a single summary at the end. On Kiro/Claude Code, Data, APIs, Business Logic, and Integrations steps run in parallel via sub-agents after Scan & Map completes. On Cursor/Windsurf, all steps run sequentially.
   - **If user says "iterative" or "step by step"** — stop after each step for confirmation before continuing (always sequential)

---

## Process

### Scan & Map (Overview & Modules)

Scan the workspace within the given scope.

**Step 1: Project Detection**
- Identify language(s), frameworks, build tools from config files
- Identify architecture pattern from directory structure and imports
- Count source files, test files, config files
- Read README and any architecture docs

**Step 2: Module Mapping**
- Identify top-level modules/packages/directories
- For each module: purpose (inferred from name + exports), file count, test coverage presence
- Map import dependencies between modules (who imports whom)
- Detect circular dependencies
- Identify entry points (main files, API servers, CLI commands, workers)

**Step 3: Generate**
Read `{ASSETS_DIR}/overview.md` template → generate `{OUTPUT_DIR}/overview.md`
Read `{ASSETS_DIR}/modules.md` template → generate `{OUTPUT_DIR}/modules.md`

**Present** (iterative mode only):
```
📍 Reverse Engineer: Scan & Map Complete

- **Stack**: [detected]
- **Architecture**: [detected pattern]
- **Modules**: [X] identified
- **Entry Points**: [Y] found
- **Circular Dependencies**: [none / list]

Artifacts at `.aidlc/reverse-engineer/`

---
🔲 **Your turn**:
- ✅ "continue" — proceed to Data, APIs & Conventions
- 🔍 "deep-dive [module]" — analyze a specific module in detail
- ⏸️ "stop" — enough context for now
```

**Iterative mode: STOP and wait.** Full mode: proceed to Data, APIs & Conventions immediately.

---

### Data, APIs & Conventions

**Step 1: Data Model Extraction**
- Find ORM models, migration files, schema definitions, SQL DDL
- Extract entities with fields, types, relationships, indexes
- Identify access patterns from repository/DAO code
- Note any data transformations (DTOs, serializers, mappers)

**Step 2: API Surface Inventory**
- Find route definitions, controller decorators, handler registrations
- For each endpoint: method, path, handler function, middleware chain
- Extract request/response shapes from types, validation schemas, or usage
- Identify auth requirements per endpoint (middleware, decorators, guards)
- Note API versioning approach if present

**Step 3: Convention Detection**
- **Naming**: file naming (kebab/camel/snake), class naming, function naming, variable naming
- **Error handling**: how errors are created, propagated, formatted, logged
- **Auth**: mechanism (JWT/session/API key), where enforced, how context is passed
- **Logging**: library, format, levels used, correlation IDs
- **Testing**: framework, patterns (arrange-act-assert, given-when-then), mocking approach, fixture patterns
- **Code organization**: layering pattern, dependency injection, module boundaries

**Step 4: Generate**
Read templates → generate `{OUTPUT_DIR}/data-model.md`, `{OUTPUT_DIR}/api-surface.md`, `{OUTPUT_DIR}/conventions.md`

**Present** (iterative mode only):
```
📍 Reverse Engineer: Data, APIs & Conventions Complete

- **Entities**: [X] extracted
- **Endpoints**: [Y] documented
- **Conventions**: [list key patterns detected]

---
🔲 **Your turn**:
- ✅ "continue" — proceed to Business Logic & Features
- 🔍 "deep-dive [area]" — drill into specific area
- ⏸️ "stop" — enough context for now
```

**Iterative mode: STOP and wait.** Full mode: proceed to Business Logic & Features immediately.

---

### Business Logic & Features

**Step 1: Business Rule Extraction**
Read service layers, domain models, validators, middleware. Look for:
- **Validation rules**: input validation, business constraint checks, guard clauses
- **State machines**: status fields with transition logic (e.g., order lifecycle)
- **Calculations**: pricing, scoring, aggregation, derived values
- **Authorization rules**: role checks, ownership checks, permission logic
- **Invariants**: conditions that must always hold (e.g., balance >= 0)
- **Conditional flows**: if/switch logic that represents business decisions
- **Scheduled/triggered logic**: cron jobs, event handlers, webhooks

For each rule, capture: what it enforces, where it lives (file + function), and what triggers it.

**Step 2: Feature Detection**
Group related code into feature areas:
- Map routes + handlers + services + models that work together
- Identify user-facing capabilities (CRUD operations, workflows, reports)
- For each feature: name, description, implementing modules, routes, data entities
- Note feature completeness (fully implemented, partial, stubbed)

**Step 3: Generate**
Read templates → generate `{OUTPUT_DIR}/business-rules.md`, `{OUTPUT_DIR}/features.md`

**Present** (iterative mode only):
```
📍 Reverse Engineer: Business Logic & Features Complete

- **Business Rules**: [X] extracted across [Y] domains
- **Features**: [Z] detected
- **State Machines**: [list if any]

---
🔲 **Your turn**:
- ✅ "continue" — proceed to Integrations & Debt
- 🔍 "deep-dive [feature/domain]" — drill into specific area
- ⏸️ "stop" — enough context for now
```

**Iterative mode: STOP and wait.** Full mode: proceed to Integrations & Debt immediately.

---

### Integrations & Technical Debt

**Step 1: Integration Mapping**
- Find HTTP clients, SDK imports, queue producers/consumers, cache clients
- For each integration: service name, protocol, what data flows, error handling
- Identify configuration (env vars, config files) for each integration
- Note any circuit breakers, retries, fallbacks

**Step 2: Technical Debt Assessment**
- **Complexity hotspots**: files/functions with high cyclomatic complexity or excessive length
- **Dead code**: unused exports, unreachable branches, commented-out code
- **Test coverage gaps**: modules with no tests, critical paths untested
- **Dependency issues**: outdated packages, known vulnerabilities, deprecated APIs
- **Inconsistencies**: same problem solved differently in different places
- **Missing abstractions**: duplicated logic that should be extracted
- **Documentation gaps**: public APIs without docs, complex logic without comments

**Step 3: Generate**
Read templates → generate `{OUTPUT_DIR}/integrations.md`, `{OUTPUT_DIR}/debt.md`

**Present**:
```
📍 Reverse Engineer: Analysis Complete

All 9 documents generated at `.aidlc/reverse-engineer/`:
- overview.md, modules.md, data-model.md, api-surface.md
- business-rules.md, features.md
- integrations.md, conventions.md, debt.md

---
🔲 **Your turn**:
- 🔍 "deep-dive [area]" — drill deeper into any area
- 🔄 "update [file]" — refresh a specific analysis
- ✅ "done" — analysis complete, ready for AI-DLC workflow
- 👉 "start context" — proceed directly to aidlc-context
```

**STOP and wait.**

---

---

### Parallel Execution (Full Mode, Kiro/Claude Code Only)

After Scan & Map completes, choose a parallelism strategy based on project size:

#### Strategy Selection

| Condition | Strategy | Rationale |
|---|---|---|
| ≤5 modules AND ≤200 source files | **Pass-level** | Small enough for each sub-agent to read the full codebase |
| >5 modules OR >200 source files | **Module-level** | Too large — split by module so each sub-agent has manageable scope |

On Cursor/Windsurf: always run sequentially (no sub-agent support).

---

#### Strategy A: Pass-Level Parallelism (Small Projects)

**Step 1**: Execute Scan & Map directly.

**Step 2**: Dispatch 3 sub-agents in parallel (one per pass). ALL calls MUST appear in the same response.

**Sub-agent prompt template**:
```
You are analyzing an existing codebase. Your job is {passDescription}.

## Scope
{scope}

## Module Map
{Paste modules summary from overview.md and modules.md}

## Output
Read the template at `{ASSETS_DIR}/{templateFile}` and generate `{OUTPUT_DIR}/{outputFile}`.
Include timestamp header: <!-- Analyzed: {ISO timestamp} | Scope: {scope} -->

## Analysis Guide
Read `{REFERENCES_DIR}/analysis-patterns.md` — load ONLY the section for {detected language}.

## Instructions
1. Read source files within scope, focusing on {focusAreas}
2. Generate the output file following the template structure
3. Be thorough but factual — cite file paths for every claim
```

| Sub-Agent | Pass | Output Files | Focus Areas |
|---|---|---|---|
| 1 | Data, APIs & Conventions | data-model.md, api-surface.md, conventions.md | ORM models, route definitions, code patterns |
| 2 | Business Logic & Features | business-rules.md, features.md | Service layers, validators, domain logic |
| 3 | Integrations & Debt | integrations.md, debt.md | HTTP clients, queue consumers, complexity hotspots |

**Step 3**: Present combined summary.

---

#### Strategy B: Module-Level Parallelism (Large Projects)

**Step 1**: Execute Scan & Map directly. From the generated modules.md, build a module group list.

**Step 2: Group modules** (keep sub-agent count between 3–8):
- If ≤8 modules → one sub-agent per module
- If >8 modules → group related modules by domain or top-level directory (e.g., `auth+users`, `payments+billing`)
- Always create a dedicated **"shared"** group for cross-cutting code (`shared/`, `utils/`, `middleware/`, `common/`, `lib/`)

**Step 3: Dispatch module sub-agents** in parallel. ALL calls MUST appear in the same response.

**Module sub-agent prompt template**:
```
You are analyzing a specific module of an existing codebase.

## Module
Name: {moduleName}
Path: {modulePath}
Purpose: {purpose from modules.md}
Dependencies: {list from modules.md}

## Your Task
Analyze ONLY the files in {modulePath}. For this module, extract:
1. Data model — entities, schemas, relationships (output as a section for data-model.md)
2. API surface — endpoints/routes owned by this module (output as a section for api-surface.md)
3. Business rules — validations, state machines, calculations, authorization (output as a section for business-rules.md)
4. Features — user-facing capabilities this module provides (output as a section for features.md)
5. Integrations — external services this module calls (output as a section for integrations.md)
6. Conventions — patterns specific to or exemplified by this module (output as a section for conventions.md)
7. Technical debt — complexity hotspots, coverage gaps, issues (output as a section for debt.md)

## Output
Write ALL findings to a single file: `{OUTPUT_DIR}/_module-{moduleName}.md`
Use ## headers for each aspect (## Data Model, ## API Surface, ## Business Rules, etc.)
Include timestamp: <!-- Analyzed: {ISO timestamp} | Module: {moduleName} | Path: {modulePath} -->

## Analysis Guide
Read `{REFERENCES_DIR}/analysis-patterns.md` — load ONLY the section for {detected language}.

## Instructions
1. Read ONLY files within {modulePath}
2. Be thorough but factual — cite file:line for every claim
3. Note any dependencies on other modules (what this module imports/calls)
```

**Step 4: Merge results**. After all module sub-agents complete:
1. Read all `{OUTPUT_DIR}/_module-*.md` files
2. For each of the 7 output files (data-model.md, api-surface.md, business-rules.md, features.md, integrations.md, conventions.md, debt.md):
   - Collect the relevant section from each module file
   - Merge into the final output file, organized by module
   - Read the template from `{ASSETS_DIR}/` for the target structure
3. Delete the temporary `_module-*.md` files

**Step 5: Cross-cutting analysis**. After merge, add to each output file:
- **data-model.md**: Cross-module relationships, shared entities
- **api-surface.md**: API consistency across modules, shared middleware
- **business-rules.md**: Rules that span modules, conflicting rules
- **conventions.md**: Which conventions are universal vs module-specific, inconsistencies
- **debt.md**: System-level debt (circular dependencies, duplicated logic across modules)

**Step 6**: Present combined summary.

---

### Action: deep-dive

When user says "deep-dive [target]":
1. Identify the target (module name, directory path, feature area, or domain)
2. Read all source files in that scope
3. Update the relevant analysis documents with deeper detail
4. Present findings and updated file list

---

### Action: update

When user says "update" or "update [file]":
1. If specific file: re-analyze the relevant area, regenerate that file with fresh timestamp
2. If no file specified: re-run all passes on the current scope
3. Preserve the file structure, refresh content
4. Note what changed vs previous analysis

---

## Scoped Analysis

When analyzing a specific directory (not full project):
- All output files are still written to `{OUTPUT_DIR}/` (project-scoped)
- Each file includes a "Scope" header noting what was analyzed
- Subsequent scoped analyses **merge** into existing files rather than overwriting
- Use section headers to separate scoped content: `## Module: payments (src/payments/)`

---

## Skill Handoff

When user says "start context" or "done, start context":
1. Read `{PLATFORM_DIR}/skills/aidlc-context/SKILL.md`
2. Follow its instructions — the context skill will detect `.aidlc/reverse-engineer/` and use it

If the file cannot be found:
```
👉 Next: Activate **aidlc-context** to generate the context document. It will automatically read your reverse-engineer analysis.
```

---

## Behavioral Rules

### Rules
- Language: user's language for content, English for paths/code/tech terms. Silent on internal operations (file scanning, import tracing, pattern detection).
- Tools — Kiro: `fsWrite`, `readMultipleFiles`, `invokeSubAgent`. Claude Code: `Write`/`Edit`, parallel `Read`, `Agent`. Cursor/Windsurf: `Write`/`Edit`, sequential reads, no sub-agents.
- Recovery: read `{STEERING_DIR}/aidlc-workflow.md` → check `{OUTPUT_DIR}/` for existing analysis → SKILL.md → resume from last completed pass.
- Errors: report clearly with what happened and what to do. Offer rebuild/retry. Never lose work silently.
- Optional file reads: If a file read fails, check whether the file exists. If it exists but can't be read, warn: "⚠️ File exists but could not be read: {path}". If it doesn't exist, skip silently (expected for optional inputs).

### Analysis Principles
- Read code, don't guess. Every claim should be traceable to a file and line range.
- Be honest about uncertainty. If a pattern is ambiguous, say so.
- Prioritize breadth over depth in early passes. Depth comes on request.
- Don't judge — document. Technical debt is noted factually, not criticized.
- Large codebases: prioritize entry points, public APIs, and domain logic over utilities and infrastructure.

### Timestamps
Every generated file includes a timestamp header:
```
<!-- Analyzed: {ISO timestamp} | Scope: {scope or "full project"} -->
```
This lets downstream skills assess freshness.
