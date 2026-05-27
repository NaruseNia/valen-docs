# Unsafe & Safe

Valen's type system and failure model work hard to keep you safe — null is `Option`, Java exceptions become `Result`, and downcasts require proof. But sometimes you know something the compiler doesn't, and you need to tell it "trust me on this one."

That's what `unsafe` is for. It's an explicit opt-out of safety guarantees. And `safe` is its counterpart — an explicit opt-in to wrapping Java's wild behavior into Valen's orderly type system.

## `safe { }` Block

The `safe` block catches Java exceptions and wraps them into `Result<T, JavaException>`. It's the standard way to call Java methods:

```valen
let result = safe { file.readString() };
// result: Result<String?, JavaException>
```

If the Java method succeeds, you get `Ok(value)`. If it throws, you get `Err(JavaException)`. Java return values are automatically typed as `T?` (nullable) because Java methods can always return null.

### Shorthand: `safe expr`

For one-liners, drop the braces:

```valen
let r = safe file.readString();  // Result<String?, JavaException>
```

Exactly equivalent to `safe { file.readString() }`.

### `safe?` — Combine With Early Return

`safe? expr` is `safe { expr }?` in one shot — call the method, wrap exceptions, then `?`-unwrap:

```valen
fn read_content(path: String) -> Result<String?, JavaException> {
    let text: String? = safe? Files.readString(Paths.get(path));
    // If the Java method threw, we already returned Err
    Ok(text)
}
```

## `unsafe { }` Block

An `unsafe` block lets you perform operations that Valen normally forbids:

```valen
let pos: Position = unsafe { obj as Position };
```

The block is an expression — it evaluates to the value of its last expression.

### Shorthand

For single expressions, you can drop the braces:

```valen
let pos: Position = unsafe obj as Position;
```

Same semantics, less punctuation.

## What's Allowed Inside `unsafe`

Three things become possible inside an `unsafe` block:

### 1. Unchecked Downcasts

Normally, `obj as ConcreteType` is only allowed for safe conversions (like numeric widening). Inside `unsafe`, you can downcast without a safety net:

```valen
let shape: Any = get_something();
let circle: Circle = unsafe { shape as Circle };
// If shape isn't actually a Circle: ClassCastException at runtime
```

### 2. Skipping Exception Handling

Java method calls inside `unsafe` don't get exception wrapping. If the method throws, the exception propagates raw — no `Result`, no `Err`, just a crash:

```valen
// safe version — exception becomes Result
let content = safe { file.readString() };  // Result<String?, JavaException>

// unsafe version — exception goes boom
let content: String = unsafe { file.readString() };  // String (or explosion)
```

### 3. Treating Null as Non-Null

Inside `unsafe`, Java return values are treated as non-nullable. If the method actually returns null, you get an NPE:

```valen
// safe version — null becomes T?
let result = safe { map.get("key") };  // Result<String?, JavaException>

// unsafe version — null becomes NPE
let val: String = unsafe { map.get("key") };  // NPE if key is missing
```

## `unsafe fn`

If an entire function operates in unsafe territory, mark the function itself:

```valen
unsafe fn rawAccess(ptr: Long) -> Int {
    // Entire body is implicitly unsafe
    // No need for unsafe { } blocks inside
    ...
}
```

The catch: calling an `unsafe fn` **requires** an `unsafe` block at the call site:

```valen
let v = unsafe { rawAccess(ptr) };
```

This makes every `unsafe fn` call visible and auditable. Code reviewers can grep for `unsafe` and find every spot where guarantees are relaxed.

## `safe` vs `unsafe` Side by Side

| | `safe { expr }` | `unsafe { expr }` |
|---|---|---|
| **Return type** | `Result<T?, JavaException>` | `T` (non-nullable) |
| **Exceptions** | Caught, wrapped in `Err` | Pass-through (crash) |
| **Null handling** | `T?` (nullable) | `T` (NPE risk) |
| **Use case** | Default for Java calls | When you've verified safety |

## When to Use `unsafe`

The short answer: **almost never**. Here are the legitimate cases:

- **You've already checked the type** and a safe downcast would be redundant
- **You're wrapping a Java API** that you've verified never returns null or throws in your usage
- **Performance-critical hot paths** where the `Result`/`Option` overhead genuinely matters (measure first!)

## When NOT to Use `unsafe`

- "I'm pretty sure this Java method doesn't return null" — you're wrong, use `safe`
- "The exception handling is too verbose" — use `safe?` shorthand instead
- "I don't want to match on Option" — use `unwrapOr` or `map`

::: warning Keep it small
An `unsafe` block should be as narrow as possible — ideally one expression. If you find yourself writing `unsafe { ... }` around 20 lines of code, reconsider. The goal is to isolate the dangerous operation, not to disable the safety system wholesale.
:::

## Quick Reference

| Operation | Safe Way | Unsafe Way |
|---|---|---|
| Java method call | `safe { method() }` | `unsafe { method() }` |
| Java method + `?` | `safe? method()` | — |
| Null handling | `T?` (nullable) | `T` (NPE risk) |
| Downcast | Not available outside `unsafe` | `unsafe { obj as Type }` |
| Numeric widening | `42 as Long` (no `unsafe` needed) | — |
| Call `unsafe fn` | — | `unsafe { dangerousFn() }` |

## What's Next?

- [Annotations](./annotations) — custom metadata for types and fields
- [Error Handling](./error-handling) — the safe way to handle failures
