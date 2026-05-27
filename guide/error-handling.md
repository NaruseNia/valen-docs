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

### The `T?` Shorthand

`T?` is sugar for `Option<T>`. Use whichever reads better:

```valen
fn first_name(full_name: String?) -> String {
    match full_name {
        Some(name) => name,
        None => "Anonymous",
    }
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

## Result — "This Might Fail, But You Can Handle It"

`Result<T, E>` is either `Ok(value)` or `Err(error)`. The error type `E` must implement the `Error` trait.

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

**Important:** `?` only propagates errors of the **same type**. If the error types differ, you need `mapErr` to convert:

```valen
fn load(path: String) -> Result<Data, AppError> {
    let content = read_file(path)
        .mapErr(|e| AppError::IoFailed(detail = e.message()))?;

    parse(content)
        .mapErr(|e| AppError::IoFailed(detail = e.message()))
}
```

No implicit error conversion magic. You always know exactly what's happening.

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

Java methods throw exceptions. Valen methods don't. The `safe { }` block is the bridge between these two worlds — it catches Java exceptions and wraps them into `Result<T?, JavaException>`.

```valen
fn read_safe(path: String) -> Result<String?, JavaException> {
    safe { java.nio.file.Files.readString(java.nio.file.Paths.get(path)) }
}
```

If the Java method succeeds, you get `Ok(value)`. If it throws, you get `Err(JavaException)`. Java's null becomes `T?` (because Java methods can always return null — even when they pinky-promise they won't).

### Shorthand: `safe expr`

For one-liners, drop the braces:

```valen
let r = safe file.readString();  // Result<String?, JavaException>
```

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
Bug or unreachable code?          -> panic
Java method might throw?          -> safe { } to get a Result
Want it even shorter?             -> safe? expr
```

Every failure in Valen is visible in the type signature. No hidden `throws`, no surprise nulls, no `catch (Exception e)` safety nets. You see it, you handle it, you move on.

## What's Next?

- [Java Interop](./java-interop) — the full story on `safe`, `unsafe`, and working with Java libraries
- [Unsafe](./unsafe) — for when you want to live dangerously (responsibly)
