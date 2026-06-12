# System Overview — Output Template

**Path**: `{OUTPUT_DIR}/overview.md`

~~~markdown
<!-- Analyzed: {ISO timestamp} | Scope: {scope} -->
# System Overview

## Summary

[10-line digest of the system: what it does, who it serves, how it's built, key architectural decisions, current state, and notable characteristics. Written as a concise narrative paragraph.]

## Stack

| Layer | Technology |
|---|---|
| Language | [detected] |
| Framework | [detected] |
| Runtime | [detected] |
| Database | [detected] |
| Cache | [detected or N/A] |
| Infrastructure | [detected or N/A] |
| Build Tool | [detected] |
| Package Manager | [detected] |

## Architecture Pattern

**Pattern**: [detected — e.g., Layered Monolith, Modular Monolith, Microservices, Serverless]

```
[ASCII diagram showing high-level architecture]

  ┌──────────┐     ┌──────────┐
  │  Client   │────▶│  API     │
  └──────────┘     └────┬─────┘
                        │
                   ┌────▼─────┐
                   │  Service  │
                   └────┬─────┘
                        │
                   ┌────▼─────┐
                   │    DB     │
                   └──────────┘
```

## Entry Points

| Entry Point | Type | File | Description |
|---|---|---|---|
| [detected] | [http/cli/worker/cron] | [file:line] | [description] |

## Project Statistics

| Metric | Value |
|---|---|
| Source Files | [count] |
| Test Files | [count] |
| Lines of Code | [count] |
| Dependencies | [count] |
| Dev Dependencies | [count] |
| Config Files | [count] |
~~~
