# Modules & Visibility

## Package Declaration

Every `.vln` file should start with a `package` declaration.

```valen
package com.example.app;
```

- Java-style dot-separated path
- Must match the filesystem directory hierarchy

::: info
Package declaration is **recommended but not enforced**. The parser accepts files without a package declaration, and the resolver does not raise an error. Tests commonly omit it. However, `internal` visibility boundary checks rely on the package path (see [Visibility](#visibility)), so omitting the declaration affects access control.
:::

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

::: warning Not Implemented
The module system described below is **designed but not implemented** in the compiler. `valenc` CLI has no `--module` flag, and the Gradle plugin does not yet exist. The current `internal` visibility is controlled by **package path comparison**, not module ID. See [Visibility](#visibility) for the current behavior.
:::

A module is the **semantic ownership unit** within a build target. It governs orphan rules, `sealed` permit scope, and `internal` visibility.

Modules are **build-tool driven** — there is no `module` declaration in Valen source.

| Build Mode | Module ID |
|---|---|
| Gradle plugin | Gradle subproject name = 1 module |
| `valenc` CLI | `valenc --module <name> src/*.vln` (not yet implemented) |

### Design Rules

- Multiple source files can belong to the same module (file boundary ≠ module boundary)
- One module may contain multiple packages
- One package may span multiple modules (syntactically legal but not recommended)
- `sealed class` subtypes must reside in the same module
- Orphan rule checks ownership at the module level (see [Traits](./traits))

### Package vs. Module

| Concept | Role |
|---|---|
| **Package** | Source hierarchy + namespace |
| **Module** | Ownership unit for visibility, orphan rule, sealed permits |

## Visibility

| Modifier | Scope | Default? |
|---|---|---|
| `pub` | Visible everywhere | No |
| `internal` | Same package (current implementation) | **Yes** (default) |
| `private` | Declaration-private (within class body or top-level file) | No |

When no visibility modifier is specified, `internal` is the default.

### Current `internal` Implementation

Since the module system is not yet implemented, `internal` visibility is determined by **package path comparison**:

```
check_visibility_from_package():
  def_package == accessor_package → allowed
  either is None → denied
  packages differ → denied
```

- Files in the same package can access each other's `internal` members.
- Files in different packages cannot.
- Files without package declarations can access each other's members (both `None`).

::: info Future
Once the module system is implemented, `internal` scope will change from package path to module ID.
:::

```valen
pub fn api() -> String { "public" }
internal fn helper() -> String { "same package" }   // Same as no modifier
private fn secret() -> String { "this file only" }
```

## Scope Operators

| Operator | Usage | Example |
|---|---|---|
| `::` | Enum variant, associated function | `Shape::Circle(r = 5.0)`, `User::from_name("Alice")` |
| `.` | Package path, type path, value member | `java.util.HashMap`, `user.name` |

### Terminology

Valen uses these three terms only:

| Term | Meaning |
|---|---|
| **method** | Has `self` receiver, called on a value |
| **associated function** | No `self`, defined in class body, called via `Type::name()` |
| **enum variant** | A variant of an enum |

The term `static` is **not used** in Valen specifications (except when referring to Java's `static` in interop contexts).
