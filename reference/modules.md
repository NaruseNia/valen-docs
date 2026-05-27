# Modules & Visibility

## Package Declaration

Every `.vln` file must start with a `package` declaration. Omitting it is a compile error.

```valen
package com.example.app;
```

- Java-style dot-separated path
- Must match the filesystem directory hierarchy

## Import Syntax

```valen
import java.util.List;                                    // Single type
import java.util.concurrent.ConcurrentHashMap as CMap;    // Alias
```

| Form | Example |
|---|---|
| Single import | `import java.util.List;` |
| Aliased import | `import java.util.HashMap as HMap;` |
| Selective import (`{A, B}`) | **Not supported** |
| Glob import (`*`) | **Not supported** |

## Module

A module is the **semantic ownership unit** within a build target. It governs orphan rules, `sealed` permit scope, and `internal` visibility.

Modules are **build-tool driven** — there is no `module` declaration in Valen source.

| Build Mode | Module ID |
|---|---|
| Gradle plugin | Gradle subproject name = 1 module |
| `valenc` CLI | `valenc --module <name> src/*.vln` |

### Key Rules

- Multiple source files can belong to the same module (file boundary ≠ module boundary)
- One module may contain multiple packages
- `sealed class` subtypes must reside in the same module
- Orphan rule checks ownership at the module level (see [Traits](./traits))

### Package vs. Module

| Concept | Role |
|---|---|
| **Package** | Source hierarchy + namespace only |
| **Module** | Ownership unit for visibility, orphan rule, sealed permits |

## Visibility

| Modifier | Scope | Default? |
|---|---|---|
| `pub` | Visible everywhere | No |
| `internal` | Same module only | **Yes** (default) |
| `private` | Declaration-private (within class body or top-level file) | No |

```valen
pub fn api() -> String { "public" }
internal fn helper() -> String { "same module" }   // Same as no modifier
private fn secret() -> String { "this file only" }
```

## Scope Operators

| Operator | Usage | Example |
|---|---|---|
| `::` | Enum variant, associated function | `Shape::Circle(r = 5.0)`, `User::from_name("Alice")` |
| `.` | Package path, type path, value member | `java.util.HashMap`, `user.name` |
