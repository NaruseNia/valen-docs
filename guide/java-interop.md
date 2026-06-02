# Java Interop

Valen runs on the JVM, and it's not shy about it. You can import Java classes, call Java methods, iterate over Java collections, and use the entire Java ecosystem — all without wrappers or codegen. The only catch: Valen makes you be honest about null and exceptions.

## Importing Java Types

Use `import` with the fully qualified class name:

```valen
import java.util.List;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
```

### Aliasing With `as`

Long class names? Name collisions? Use `as`:

```valen
import java.util.concurrent.ConcurrentHashMap as CMap;

let cache = CMap<String, Int>();
```

## Constructors — The One Exception to `safe`

Java constructors don't need `safe` or `unsafe`. They always return a non-null instance (or they throw and no object exists at all), so Valen lets you call them directly:

```valen
let list = ArrayList();
let map = HashMap<String, Int>();
```

That's it. No ceremony.

## Calling Java Methods

Here's the rule: **every Java method call should be wrapped in `safe { }` or `unsafe { }`**. A bare call is discouraged and will eventually be a compile error.

```valen
// Will be a compile error in the future — bare Java method call
let content = Files.readString(path);

// OK — wrapped in safe
let content = safe { Files.readString(path) };

// OK — wrapped in unsafe (you're on your own)
let content = unsafe { Files.readString(path) };
```

Why? Because Java methods can throw exceptions and return null. Valen won't let you pretend otherwise.

::: info Enforcement coming soon
The `safe`/`unsafe` requirement for Java method calls is part of Valen's design, but the compiler does not currently reject bare calls. Bare calls still compile. Future versions will enforce this rule, so adopting `safe`/`unsafe` now is recommended.
:::

### The Three Modes

| Syntax | Return Type | Exceptions | Null |
|---|---|---|---|
| `safe { expr }` | `Result<Option<T>, JavaException>` | Wrapped in `Err` | `None` for null |
| `safe? expr` | `Option<T>` | Early return via `?` | `None` for null |
| `unsafe { expr }` | `T` (non-nullable) | Pass-through (crash) | NPE risk |

::: tip Use `safe` by default
Reach for `unsafe` only when you're absolutely certain the call won't throw and won't return null. When in doubt, `safe` is your friend.
:::

## Null Handling: `T?` and `Option<T>` Are Different

This is a critical distinction in Valen:

| Type | What It Is | When It Appears |
|---|---|---|
| `T?` | Nullable type — JVM null is a valid value | Java method returns, Java interop |
| `Option<T>` | Valen-native ADT enum (`Some(T)` / `None`) | Valen-native code |

**`T?` is NOT sugar for `Option<T>`.** They are completely separate types in Valen's type system.

- `T?` maps to JVM boxed types (e.g., `Int?` becomes `java/lang/Integer`)
- `Option<T>` is a real Valen enum with `Some` and `None` variants

When you call a Java method inside `safe { }`, the return value is typed as `T?` (nullable), because Java methods can always return null — even when they pinky-promise they won't:

```valen
import java.util.HashMap;

let map = HashMap<String, String>();
safe { map.put("key", "value") };

// map.get() returns V in Java, but T? in Valen's safe context
let result = safe { map.get("key") };
// result: Result<String?, JavaException>
```

`void` methods come back as `Unit` — no nullable wrapping needed.

Kotlin chose the "platform type `T!`" approach — maybe null, maybe not, who knows? Valen says: it's always `T?`. Boringly safe.

### The `?` Operator Does Not Work on `T?`

The `?` (try) operator works on `Option<T>` and `Result<T, E>` but **not on `T?`**. If you need to convert a nullable value, handle it explicitly.

## Collections: `for` Just Works

Java `Iterable` types work directly with `for`:

```valen
import java.util.ArrayList;

let names = ArrayList<String>();
safe { names.add("Alice") };
safe { names.add("Bob") };

for name in names {
    println(name);
}
```

Under the hood this compiles to the `.iterator()` / `hasNext()` / `next()` pattern. Nothing fancy, just works.

## Generic Type Tracking

Valen reads Java class signatures to track generic type arguments:

```valen
import java.util.HashMap;
import java.util.ArrayList;

let map = HashMap<String, Int>();
let list = ArrayList<String>();
let nested = HashMap<String, ArrayList<Int>>();

// Omit type args if inference is enough
let inferred = ArrayList();  // ArrayList<Any>
```

Type variables like `K`, `V` get resolved from the instance's type arguments, so `map.get("key")` knows it returns `String?`, not `Any?`.

## `@valen.Closed` — Exhaustive Match on Java Sealed Types

Valen's own `enum`, `sealed class`, and `sealed trait` get exhaustive `match` checking automatically. But Java sealed types are trickier — the classpath could change, adding new permitted subtypes behind your back.

### Default: Open-World

Without `@valen.Closed`, Java sealed types require a wildcard `_` arm:

```valen
// Java: sealed interface Color permits Red, Blue, Green
// No @valen.Closed annotation

match color {
    Color.Red => "red",
    Color.Blue => "blue",
    Color.Green => "green",
    _ => "unknown",  // Required! Skip it and the compiler yells.
}
```

### Opt-In: `@valen.Closed`

If the Java library author annotates their sealed hierarchy with `@valen.Closed`, Valen treats it as a closed world:

```java
// Java side — the library author adds this
package com.example;

import valen.Closed;

@Closed
public sealed interface Color permits Red, Blue, Green {}
public final class Red implements Color {}
public final class Blue implements Color {}
public final class Green implements Color {}
```

```valen
// Valen side — exhaustive match works
import com.example.Color;

match color {
    Color.Red => "red",
    Color.Blue => "blue",
    Color.Green => "green",
    // All cases covered. Compiler is happy.
}
```

::: info @valen.Closed is a Java-side annotation
You don't write `@valen.Closed` in Valen code. It's for Java library authors to declare "this hierarchy is stable, I promise."
:::

## Classpath Configuration

### JDK Auto-Detection

`valenc` automatically finds your JDK standard library via `JAVA_HOME`. Classes like `java.util.ArrayList` work out of the box — no flags needed.

### Adding Libraries

For third-party JARs, use `--classpath`:

```sh
valenc compile --classpath lib/guava.jar:lib/commons.jar src/main.vln
```

- Separate paths with `:` (Linux/macOS) or `;` (Windows)
- Accepts JAR files, JMOD files, and directories
- JDK classes are always available regardless of `--classpath`

## Quick Reference

| Task | How |
|---|---|
| Import a Java class | `import java.util.List;` |
| Alias a long name | `import ... as Alias;` |
| Call a Java method safely | `safe { javaMethod() }` |
| Call with `?` propagation | `safe? javaMethod()` |
| Construct a Java object | `ArrayList()` (no `safe` needed) |
| Handle null from Java | It's `T?` — a nullable type (not `Option<T>`) |
| Iterate a Java collection | `for item in list { ... }` |
| Exhaustive match on sealed | Library needs `@valen.Closed` |
| Add to classpath | `valenc compile --classpath path.jar` |

## What's Next?

- [Inline & Reified](./inline-reified) — inlined functions and runtime type info
- [Error Handling](./error-handling) — deeper dive into `safe`, `Result`, and `?`
