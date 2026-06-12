# Technical Debt — Output Template

**Path**: `{OUTPUT_DIR}/debt.md`

~~~markdown
<!-- Analyzed: {ISO timestamp} | Scope: {scope} -->
# Technical Debt

## Summary

[detected] debt items identified. [count] high severity, [count] medium, [count] low. [Brief characterization of overall codebase health.]

## Debt Inventory

| # | Item | Type | Severity | Location | Description |
|---|---|---|---|---|---|
| 1 | [name] | [complexity/dead-code/coverage/dependency/inconsistency/missing-abstraction] | [high/medium/low] | [file:line] | [description] |

## Complexity Hotspots

| File | Function | Cyclomatic Complexity | Lines | Issue |
|---|---|---|---|---|
| [file:line] | [function] | [value] | [count] | [description] |

## Coverage Gaps

| Area | Type | Impact | Description |
|---|---|---|---|
| [module or feature] | [no-tests/partial/critical-path-untested] | [high/medium/low] | [description] |

## Dependency Issues

| Dependency | Issue | Current | Latest | Risk |
|---|---|---|---|---|
| [package] | [outdated/deprecated/vulnerable/unmaintained] | [version] | [version] | [high/medium/low] |
~~~
