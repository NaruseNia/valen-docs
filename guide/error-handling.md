# Error Handling

Most languages give you one or two ways to deal with failure and then wish you luck. Valen gives you four — but each one has exactly one job. No overlap, no ambiguity, no "should I throw or return null?" debates at 2 AM.

## The Four Mechanisms

| Mechanism | When to Use | One-Liner |
|---|---|---|
| `Option<T>` | Value might be absent | "Not found" is a normal outcome |
| `Result<T, E>` | Something can fail recoverably | The caller can (and should) handle it |
| `panic` | Contract violation, unreachable code | "This is a bug. Stop everything." |
| Exception | Java FFI boundary only | Java threw something; you catch it at the border |

::: warning No `throw` in Valen
`throw` doesn't exist. If you want to express failure, you return `Option` or `Result`. If something is catastrophically wrong, you `panic`. If Java throws at you, you wrap it in `safe { }`. That's the deal.
:::

## Option — "It Might Not Be There"

`Option<T>` represents a value that may or may not exist. It has two variants: `Some(value)` and `None`.

```valen
fn find_user(id: Int) -> Option<User> {
    if id == 1 {
        Some(User(name = "Alice", age = 30))
    } else {
        None
    }
}

match find_user(42) {
    Some(u) => println(f"Found: {u.name}"),
    None => println("User not found"),
}
```

### Option Methods

| Method | Signature | What It Does |
|---|---|---|
| `map` | `fn map<U>(self, f: fn(T) -> U) -> Option<U>` | Transform the inner value |
| `flatMap` | `fn flatMap<U>(self, f: fn(T) -> Option<U>) -> Option<U>` | Chain optional operations |
| `unwrapOr` | `fn unwrapOr(self, default: T) -> T` | Get the value or a fallback |
| `filter` | `fn filter(self, predicate: fn(T) -> Bool) -> Option<T>` | Keep only if predicate passes |
| `isSome` | `fn isSome(self) -> Bool` | Is there a value? |
| `isNone` | `fn isNone(self) -> Bool` | Is it empty? |

## `T?` — Nullable Type (Not `Option<T>`)

Here's something important: **`T?` is NOT sugar for `Option<T>`.** They are completely separate types.

| Type | What It Is | Used For |
|---|---|---|
| `Option<T>` | Valen-native ADT enum with `Some(T)` / `None` | Valen-native absence modeling |
| `T?` | Nullable type (`Ty::Nullable`) | JVM null interop, Java method returns |

`Option<T>` is a Valen enum — it's a proper ADT with pattern matching. `T?` is a type-system annotation that says "this value might be JVM null." They exist in different layers of the language.

When does `T?` appear? Primarily in Java interop — when a `safe { }` block calls a Java method, the return value is typed as `T?` because Java methods can always return null. See [Java Interop](./java-interop) for the full story.

### The `?` Operator Works on `Option` and `Result` — NOT on `T?`

The `?` (try) operator extracts the success value or early-returns the failure. It works on:

- `Option<T>` — extracts `Some(v)` or returns `None`
- `Result<T, E>` — extracts `Ok(v)` or returns `Err(e)`

It does **not** work on `T?` (nullable types). If you have a nullable value from Java interop, you'll need to handle it with pattern matching or conversion.

## Result — "This Might Fail, But You Can Handle It"

`Result<T, E>` is either `Ok(value)` or `Err(error)`.

### The Error Trait

```valen
trait Error {
    fn message(self) -> String;
}
```

One method. That's all. Define your error types as enums and implement it:

```valen
enum AppError {
    NotFound(id: Int),
    Forbidden(reason: String),
    IoFailed(detail: String),
}

impl Error for AppError {
    fn message(self) -> String {
        match self {
            AppError::NotFound(id) => f"not found: {id}",
            AppError::Forbidden(reason) => f"forbidden: {reason}",
            AppError::IoFailed(detail) => f"I/O error: {detail}",
        }
    }
}
```

::: info No `E: Error` constraint
`Result<T, E>` does not require `E` to implement the `Error` trait. You can use any type as the error — `String`, an enum, a data class, whatever makes sense. Implementing `Error` is recommended but not enforced.
:::

### Using Result

```valen
fn load_config(path: String) -> Result<Config, AppError> {
    let content = read_file(path);
    match content {
        Ok(text) => parse_config(text),
        Err(e) => Err(AppError::IoFailed(detail = e.message())),
    }
}
```

### Result Methods

| Method | Signature | What It Does |
|---|---|---|
| `map` | `fn map<U>(self, f: fn(T) -> U) -> Result<U, E>` | Transform the success value |
| `mapErr` | `fn mapErr<F>(self, f: fn(E) -> F) -> Result<T, F>` | Transform the error value |
| `flatMap` | `fn flatMap<U>(self, f: fn(T) -> Result<U, E>) -> Result<U, E>` | Chain fallible operations |
| `unwrapOr` | `fn unwrapOr(self, default: T) -> T` | Get value or default |
| `isOk` | `fn isOk(self) -> Bool` | Did it succeed? |
| `isErr` | `fn isErr(self) -> Bool` | Did it fail? |

## The `?` Operator — Early Return, Minus the Boilerplate

The `?` operator is the reason you won't drown in nested `match` expressions. Place it after a `Result` or `Option`, and it either extracts the success value or immediately returns the failure.

### `?` on Result

```valen
fn find_user(id: Int) -> Result<User, DbError> {
    let row = query(id)?;  // Err? Return it immediately.
    Ok(User::from_row(row))
}
```

When the error types differ, use `mapErr` to convert:

```valen
fn load(path: String) -> Result<Data, AppError> {
    let content = read_file(path)
        .mapErr(|e| AppError::IoFailed(detail = e.message()))?;

    parse(content)
        .mapErr(|e| AppError::IoFailed(detail = e.message()))
}
```

No implicit error conversion magic. You always know exactly what's happening.

::: info Error type checking
The type checker verifies that `?` is applied to a `Result` or `Option` and that the enclosing function returns the same wrapper type. However, it does not currently verify that the `E` type in `Result<T, E>` matches between the `?` expression and the function return type. Use `mapErr` to convert between error types explicitly.
:::

### `?` on Option

Works the same way, but the enclosing function must return `Option`:

```valen
fn first_char_upper(s: String) -> Option<Char> {
    let c = s.chars().first()?;  // None? Return None.
    Some(c.to_uppercase())
}
```

### Option to Result? Convert Explicitly.

You can't use `?` on an `Option` inside a function that returns `Result`. Convert first:

```valen
// Option -> Result: use match or a helper
let value = find_something()
    .map(|v| Ok(v))
    .unwrapOr(Err(AppError::NotFound(id = 42)));
```

## `safe { }` — Taming Java Exceptions

Java methods throw exceptions. Valen methods don't. The `safe { }` block is the bridge between these two worlds — it catches Java exceptions and wraps them into `Result<Option<T>, JavaException>`.

```valen
fn read_safe(path: String) -> Result<Option<String>, JavaException> {
    safe { java.nio.file.Files.readString(java.nio.file.Paths.get(path)) }
}
```

If the Java method succeeds and returns non-null, you get `Ok(Some(value))`. If it returns null, you get `Ok(None)`. If it throws, you get `Err(JavaException)`. This three-way split cleanly separates success, absence, and failure.

### Shorthand: `safe expr`

For one-liners, drop the braces:

```valen
let r = safe file.readString();  // Result<Option<String>, JavaException>
```

This is exactly equivalent to `safe { file.readString() }`.

### `safe?` — The Combo Move

`safe? expr` is `safe { expr }?` in one shot. It calls the Java method, wraps any exception into a Result, then `?`-unwraps it:

```valen
fn read_content(path: String) -> Result<String?, JavaException> {
    let text: String? = safe? Files.readString(Paths.get(path));
    // If the Java method threw, we already returned Err
    Ok(text)
}
```

This is the most common pattern for Java interop — short, safe, and clear.

## Practical Patterns

### Chaining `?` Through Multiple Calls

```valen
fn process(id: Int) -> Result<Report, AppError> {
    let user = find_user(id)?;
    let data = load_data(user.data_id)?;
    let report = generate_report(data)?;
    Ok(report)
}
```

Each `?` is a potential early exit. The happy path reads top-to-bottom with no nesting.

### Match on Result

When you need to handle both cases explicitly:

```valen
match load_config("app.toml") {
    Ok(config) => start_server(config),
    Err(AppError::NotFound(_)) => {
        println("Config not found, using defaults");
        start_server(default_config())
    },
    Err(e) => {
        println(f"Fatal: {e.message()}");
        panic("cannot start");
    },
}
```

### unwrapOr — Provide a Default

```valen
let name = find_user(id)
    .map(|u| u.name)
    .unwrapOr("Guest");
```

No unwrap-and-pray. Always provide a fallback.

## Summary

```
Value might be absent?            -> Option<T>
Operation might fail recoverably? -> Result<T, E>
JVM null from Java interop?       -> T? (nullable type)
Bug or unreachable code?          -> panic
Java method might throw?          -> safe { } to get a Result
Want it even shorter?             -> safe? expr
```

Every failure in Valen is visible in the type signature. No hidden `throws`, no surprise nulls, no `catch (Exception e)` safety nets. You see it, you handle it, you move on.

## What's Next?

- [Java Interop](./java-interop) — the full story on `safe`, `unsafe`, and working with Java libraries
- [Unsafe](./unsafe) — for when you want to live dangerously (responsibly)
