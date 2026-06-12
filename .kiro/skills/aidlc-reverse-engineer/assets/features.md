# Features — Output Template

**Path**: `{OUTPUT_DIR}/features.md`

~~~markdown
<!-- Analyzed: {ISO timestamp} | Scope: {scope} -->
# Features

## Summary

[detected] features identified. [count] complete, [count] partial, [count] stubbed. [Brief characterization.]

## Feature Inventory

| Feature | Status | Modules | Routes | Entities |
|---|---|---|---|---|
| [name] | [complete/partial/stubbed] | [list] | [list] | [list] |

## Feature Details

### [Feature Name]

- **Status**: [complete/partial/stubbed]
- **Description**: [what this feature does from a user perspective]

#### User-Facing Capabilities

- [capability 1]
- [capability 2]

#### Implementing Code Paths

| Component | File | Function/Class |
|---|---|---|
| [route/service/model] | [file:line] | [name] |
~~~
