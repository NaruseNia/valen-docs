# Inline & Reified

The JVM erases generic type parameters at runtime. This is fine 99% of the time — until you need `value is T` and the JVM shrugs. Valen's `inline fn` and `reified` type parameters solve this by inlining the function body at the call site, preserving concrete type information where it matters.

## `inline fn` — Inlining at the Call Site

An `inline fn` has its body copy-pasted (conceptually) into every call site. The primary benefit: **lambda arguments are also inlined**, eliminating the overhead of boxing them into `Function` objects.

```valen
inline fn <T> measure(block: fn() -> T) -> T {
    let start = System.nanoTime();
    let result = block();
    println(f"elapsed: {System.nanoTime() - start}ns");
    result
}

fn main() {
    let answer = measure(|| { 42 });
    // The lambda body is inlined here — no Function object allocated
}
```

This is the same idea as Kotlin's `inline fun`. If you're writing a utility that takes a lambda and performance matters, `inline fn` is your tool.

### Lambda Inlining

When you pass a lambda to an `inline fn`, the lambda's body is expanded directly into the surrounding code. No anonymous class, no `invoke()` call, no allocation:

```valen
inline fn <T> run(block: fn() -> T) -> T {
    block()
}

fn main() {
    let x = run(|| { 42 });
    // After inlining, this is effectively: let x = 42;
}
```

::: info Lambda arity limit
Inline functions currently support lambda parameters with up to 2 arguments (e.g., `fn(A, B) -> C`). Lambdas with 3+ parameters are not supported.
:::

## `reified T` — Types That Survive Erasure

Normally, `T` is erased at runtime. Mark it `reified` inside an `inline fn`, and the compiler substitutes the concrete type at each call site:

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}

let a = isInstance<String>("hello");  // true — checks instanceof String
let b = isInstance<Int>("hello");     // false — checks instanceof Integer
```

Without `reified`, `value is T` would be a compile error — the JVM has no idea what `T` is at runtime.

### What You Can Do With `reified T`

| Operation | Syntax | What Happens |
|---|---|---|
| Type check | `value is T` | `instanceof` against the concrete type |
| Cast | `value as T` | Cast to the concrete type |

That's the complete list. These two operations are the only ones that work with `reified` type parameters.

::: warning `T::class` is not implemented
The `T::class` syntax for getting a `Class` object from a reified type parameter is planned but **not yet available**. If you need the class object, pass it as an explicit parameter for now:

```valen
// Instead of T::class, pass the class explicitly:
fn <T> fromJson(json: String, cls: Class<T>) -> T {
    deserialize(json, cls) as T
}
```
:::

### Practical Example: Type-Safe Filtering

```valen
inline fn <reified T> filterByType(items: List<Any>) -> List<T> {
    let result = ArrayList<T>();
    for item in items {
        if item is T {
            safe { result.add(item as T) };
        }
    }
    result
}

let mixed: List<Any> = getItems();
let strings: List<String> = filterByType<String>(mixed);
```

### Mixing Reified and Non-Reified

You can have some type parameters `reified` and others not:

```valen
inline fn <reified T, U> checkAndMap(value: Any, f: fn(T) -> U) -> Option<U> {
    if value is T {
        Some(f(value as T))
    } else {
        None
    }
}

let result = checkAndMap<String, Int>("hello", |s| s.length());
// T = String (reified, used in `is` check)
// U = Int (not reified, doesn't need to be)
```

## Restrictions

There are a few ground rules:

- **`reified` only works in `inline fn`.** You can't use it on regular functions, class type parameters, or trait type parameters. The compiler needs to inline the body to substitute the type.

- **No recursion.** An `inline fn` calling itself would expand infinitely. The compiler catches this and reports an error.

- **No non-local return.** You can't `return` from the enclosing function inside a lambda passed to `inline fn`. Use tail expressions instead.

- **Recompilation cascade.** Changing an `inline fn`'s body means every call site needs recompilation. Keep inline functions small.

- **Lambda arity max 2.** Lambda parameters can take at most 2 arguments.

## Java Interop

From Java's perspective, an `inline fn` is just a regular method. Java can call it — but the inlining doesn't happen. The method executes as a normal call.

More importantly, **`reified` has no effect when called from Java**. JVM type erasure applies, so `value is T` won't work correctly:

```valen
// Valen side
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}
```

```java
// Java side — calls it as a normal method
// reified is lost, T is erased. Don't rely on this.
ValenUtils.isInstance(someObj);
```

If you need the `reified` behavior, call the function from Valen code.

::: tip When to reach for `inline fn`
1. Your function takes a lambda and you want zero allocation overhead
2. You need `reified T` for runtime type operations (`is` / `as`)
3. The function body is small (big bodies = bytecode bloat)

If none of these apply, a regular `fn` is simpler and compiles faster.
:::

## What's Next?

- [Unsafe](./unsafe) — bypassing Valen's safety guarantees when you know what you're doing
- [Generics](./generics) — the full generics story including variance and bounds
