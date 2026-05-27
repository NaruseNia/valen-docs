# Error Model

Valen separates failure handling into four distinct mechanisms. Each has exactly one job — no overlap, no ambiguity.

## The Four Mechanisms

| Mechanism | Purpose | Typical Use |
|---|---|---|
| `Option<T>` | Value absence | "Not found" is a normal outcome |
| `Result<T, E>` | Recoverable failure (`E: Error`) | Caller can and should handle it |
| `panic` | Contract violation / unreachable | Bug detected — stop the program |
| Exception | Java FFI boundary only | Java threw; you catch at the border |

`throw` does not exist in Valen. Domain failure uses `Option` / `Result`. Catastrophic errors use `panic`. Java exceptions are wrapped via `safe { }`.

## Option\<T\>

`Option<T>` (sugar: `T?`) represents a value that may or may not exist. Two variants: `Some(value)` and `None`.

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

`Result<T, E>` represents a computation that can succeed (`Ok(value)`) or fail (`Err(error)`). `E` must implement the `Error` trait.

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

Defined in `valen.core`. All `Result<T, E>` error types must implement it.

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
| `Result<T, E>` | `Ok(v)` → `v`, `Err(e)` → early return `Err(e)` | Enclosing function returns `Result<U, E>` with **same `E`** |
| `Option<T>` | `Some(v)` → `v`, `None` → early return `None` | Enclosing function returns `Option<U>` |

- `?` does **not** auto-convert between error types. Use `map_err` for explicit conversion.
- `Option` → `Result` implicit promotion is forbidden.

```valen
fn find_user(id: Int) -> Result<User, DbError> {
    let row = query(id)?;   // DbError → DbError (same type, OK)
    Ok(User::from_row(row))
}

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

**Return type:** `Result<T?, JavaException>`

- Exception → `Err(JavaException)`
- Success → `Ok(value)`, where non-void returns are `T?` (nullable)
- `void` methods return `Unit`

```valen
fn read_safe(path: String) -> Result<String?, JavaException> {
    safe { java.nio.file.Files.readString(java.nio.file.Paths.get(path)) }
}
```

### `safe expr` (Shorthand)

Equivalent to `safe { expr }`.

```valen
let r = safe file.readString();  // Result<String?, JavaException>
```

### `safe? expr`

Equivalent to `safe { expr }?`. Unwraps the `Result` via `?` and returns `T?`.

```valen
let s: String? = safe? file.readString();
```

## Java Method Call Modes

| Syntax | Return Type | Exception Handling | Null Handling |
|---|---|---|---|
| `safe { expr }` / `safe expr` | `Result<T?, JavaException>` | Wrapped in `Err` | `T?` (nullable) |
| `safe? expr` | `T?` | Early return via `?` | `T?` (nullable) |
| `unsafe { expr }` / `unsafe expr` | `T` (non-nullable) | Pass-through (crash) | NPE risk |
| Bare call | **Compile error** | — | — |

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

### `unsafe fn`

The entire function body is an implicit unsafe context. Callers must wrap invocations in `unsafe { }`.

```valen
unsafe fn rawAccess(ptr: Long) -> Int { ... }

let v = unsafe { rawAccess(ptr) };
```

## panic

`panic` stops the program on contract violations or unreachable states. It is not for recoverable errors.

```valen
panic("invariant violated: negative count");
```

Use `Option` / `Result` for expected failures. Reserve `panic` for bugs.
