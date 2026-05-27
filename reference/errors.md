# Error Model

Valen separates failure handling into four distinct mechanisms. Each has exactly one job — no overlap, no ambiguity.

## The Four Mechanisms

| Mechanism | Purpose | Typical Use |
|---|---|---|
| `Option<T>` | Value absence | "Not found" is a normal outcome |
| `Result<T, E>` | Recoverable failure | Caller can and should handle it |
| `panic` | Contract violation / unreachable | Bug detected — stop the program |
| Exception | Java FFI boundary only | Java threw; you catch at the border |

`throw` does not exist in Valen. Domain failure uses `Option` / `Result`. Catastrophic errors use `panic`. Java exceptions are wrapped via `safe { }`.

## Option\<T\>

`Option<T>` represents a value that may or may not exist. Two variants: `Some(value)` and `None`.

::: info
`T?` is **not** sugar for `Option<T>`. `T?` is a distinct nullable JVM type (`Ty::Nullable`). See [Java Interop](./java-interop) for details.
:::

### Methods

| Method | Signature | Description |
|---|---|---|
| `map` | `fn map<U>(self, f: fn(T) -> U) -> Option<U>` | Transform the inner value if `Some` |
| `flatMap` | `fn flatMap<U>(self, f: fn(T) -> Option<U>) -> Option<U>` | Chain computations that may fail |
| `filter` | `fn filter(self, f: fn(T) -> Bool) -> Option<T>` | Keep `Some` only if predicate holds |
| `unwrapOr` | `fn unwrapOr(self, default: T) -> T` | Extract value or use default |
| `isSome` | `fn isSome(self) -> Bool` | `true` if `Some` |
| `isNone` | `fn isNone(self) -> Bool` | `true` if `None` |

## Result\<T, E\>

`Result<T, E>` represents a computation that can succeed (`Ok(value)`) or fail (`Err(error)`).

::: info
`E` has **no** `E: Error` trait constraint. The stdlib defines `Result<T, E>` without a bound on `E`, and the type checker does not enforce one. Any type can be used as `E`. A future version may introduce an `E: Error` requirement, but currently it is unconstrained.
:::

### Methods

| Method | Signature | Description |
|---|---|---|
| `map` | `fn map<U>(self, f: fn(T) -> U) -> Result<U, E>` | Transform the success value |
| `mapErr` | `fn mapErr<F>(self, f: fn(E) -> F) -> Result<T, F>` | Transform the error value |
| `flatMap` | `fn flatMap<U>(self, f: fn(T) -> Result<U, E>) -> Result<U, E>` | Chain fallible computations |
| `unwrapOr` | `fn unwrapOr(self, default: T) -> T` | Extract value or use default |
| `isOk` | `fn isOk(self) -> Bool` | `true` if `Ok` |
| `isErr` | `fn isErr(self) -> Bool` | `true` if `Err` |

## Error Trait

Defined in `valen.core`. User-defined error types can implement it, but it is not required by `Result`.

```valen
trait Error {
    fn message(self) -> String;
}
```

User-defined error types:

```valen
enum AppError {
    NotFound(id: Int),
    Forbidden(reason: String),
}

impl Error for AppError {
    fn message(self) -> String {
        match self {
            AppError::NotFound(id) => f"not found: {id}",
            AppError::Forbidden(reason) => f"forbidden: {reason}",
        }
    }
}
```

## The `?` Operator

| Context | Behavior | Requirement |
|---|---|---|
| `Result<T, E>` | `Ok(v)` → `v`, `Err(e)` → early return `Err(e)` | Enclosing function returns `Result<..>` |
| `Option<T>` | `Some(v)` → `v`, `None` → early return `None` | Enclosing function returns `Option<..>` |

- `Option` → `Result` implicit promotion is forbidden.
- `?` cannot be used on `T?` (nullable types). It only works on `Option<T>` and `Result<T, E>`.

::: warning
**Error type identity is not verified.** The type checker confirms the target is `Result<T, E>` or `Option<T>` and that the enclosing function returns the same wrapper type, but it does **not** check that the `E` types match. Using `?` across different error types compiles without error. Use `map_err` for explicit conversion to maintain correctness.
:::

```valen
fn find_user(id: Int) -> Result<User, DbError> {
    let row = query(id)?;   // DbError → DbError (same type, OK)
    Ok(User::from_row(row))
}

// Different error types — use map_err for conversion
fn load(path: String) -> Result<Data, AppError> {
    let content = read_file(path)
        .map_err(|e| AppError::IoFailed(e.message()))?;
    parse(content)
        .map_err(|e| AppError::ParseFailed(e.message()))
}

fn first_char(s: String) -> Option<Char> {
    let c = s.chars().first()?;
    Some(c.to_uppercase())
}
```

## `safe { }` Block

Wraps Java method calls, catching exceptions and normalizing null.

**Return type:** `Result<T, JavaException>` (where non-void Java returns are `T?` inside the `Ok`)

- Exception → `Err(JavaException)`
- Success → `Ok(value)`, where non-void returns are `T?` (nullable)
- `void` methods return `Unit`

```valen
fn read_safe(path: String) -> Result<String, JavaException> {
    safe { java.nio.file.Files.readString(java.nio.file.Paths.get(path)) }
}
```

### `safe expr` (Shorthand)

Equivalent to `safe { expr }`. No braces needed for a single expression.

```valen
let r = safe file.readString();  // Result<String?, JavaException>
```

### `safe? expr`

Equivalent to `safe { expr }?`. Unwraps the `Result` via `?` and returns `T?` directly.

```valen
let s: String? = safe? file.readString();
// equivalent to: safe { file.readString() }?
```

## Java Method Call Modes

| Syntax | Return Type | Exception Handling | Null Handling |
|---|---|---|---|
| `safe { expr }` / `safe expr` | `Result<T?, JavaException>` | Wrapped in `Err` | `T?` (nullable) |
| `safe? expr` | `T?` | Early return via `?` | `T?` (nullable) |
| `unsafe { expr }` / `unsafe expr` | `T` (non-nullable) | Pass-through (crash) | NPE risk |

::: warning Future
Bare Java method calls (without `safe` or `unsafe`) are intended to be a compile error, but **this restriction is not currently enforced**. Bare calls compile successfully. A future version will reject them.
:::

**Exception:** Java constructor calls require no `safe`/`unsafe` wrapper. Constructors always return non-null; if they throw, no object is created.

```valen
let list = ArrayList();  // No safe/unsafe needed
```

## `unsafe` Block / `unsafe fn`

Bypasses Valen's type and failure-model safety guarantees.

### Permitted Operations Inside `unsafe`

| Operation | Example | Risk |
|---|---|---|
| Unchecked downcast | `obj as ConcreteType` | `ClassCastException` |
| Java exception bypass | Java calls without catch | Unhandled exception |
| Non-nullable null | `let x: String = unsafe { null };` | NPE |

### `unsafe` Shorthand

Single-expression form without braces:

```valen
let pos: Position = unsafe obj as Position;
// equivalent to: unsafe { obj as Position }
```

### `unsafe fn`

The entire function body is an implicit unsafe context. Callers must wrap invocations in `unsafe { }`.

```valen
unsafe fn rawAccess(ptr: Long) -> Int { ... }

let v = unsafe { rawAccess(ptr) };
```

## `as` Cast

`expr as Type` performs a type cast. Safety depends on the conversion:

- **Safe (no `unsafe` needed):** Numeric widening (`42 as Long`, `'A' as Int`)
- **Unsafe required:** Downcast (`obj as Position` — `ClassCastException` risk)

```valen
let x: Long = 42 as Long;                     // safe widening
let pos: Position = unsafe { obj as Position }; // unsafe downcast
```

## panic

`panic` stops the program on contract violations or unreachable states. It is not for recoverable errors.

```valen
panic("invariant violated: negative count");
```

Use `Option` / `Result` for expected failures. Reserve `panic` for bugs.
