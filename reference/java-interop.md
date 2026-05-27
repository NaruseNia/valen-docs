# Java Interop

Valen runs on the JVM and can use Java libraries directly. This page covers the rules and mechanisms for interoperating with Java code.

## Import Syntax

```valen
import java.util.List;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap as CMap;
```

| Form | Example |
|---|---|
| Single import | `import java.util.List;` |
| Aliased import | `import java.util.HashMap as HMap;` |
| Selective / glob | **Not supported** |

## Constructor Calls

Java constructors require **no** `safe` or `unsafe` wrapper. Constructors always return non-null; if they throw, no object is created.

```valen
let list = ArrayList();
let map = HashMap<String, Int>();
```

## Method Calls

Bare Java method calls are a **compile error**. Every call must be wrapped.

| Mode | Return Type | Exceptions | Nulls |
|---|---|---|---|
| `safe { expr }` | `Result<T?, JavaException>` | Caught → `Err` | `T?` (nullable) |
| `safe expr` | `Result<T?, JavaException>` | Caught → `Err` | `T?` (nullable) |
| `safe? expr` | `T?` | Early return via `?` | `T?` (nullable) |
| `unsafe { expr }` | `T` (non-nullable) | Pass-through | NPE risk |
| `unsafe expr` | `T` (non-nullable) | Pass-through | NPE risk |

```valen
// safe block — full control
let result = safe { file.readString() };  // Result<String?, JavaException>

// safe? — unwrap Result, keep Option
let content: String? = safe? file.readString();

// unsafe — no safety net
let raw: String = unsafe { file.readString() };
```

## Null Handling

All Java method return values inside `safe { }` are typed as `T?` (`Option<T>`). There are no platform types (`T!`) — Java values are always treated as potentially null.

```valen
let val: Option<String> = safe { map.get("key") }?;

match val {
    Some(v) => println(v),
    None => println("not found"),
}
```

`void` methods return `Unit` (not nullable).

## Collection Iteration

Java types implementing `Iterable` (`ArrayList`, `HashSet`, `LinkedList`, etc.) work with `for` loops directly. Element type is `Any`.

```valen
import java.util.ArrayList;

let list = ArrayList();
list.add("hello");
list.add("world");

for item in list {
    println(item);
}
```

Internally desugared to `.iterator()` → `hasNext()` / `next()`.

## `@valen.Closed`

Enables exhaustive `match` on Java `sealed` hierarchies. Applied by the Java library author.

| Scenario | `match` Behavior |
|---|---|
| `@valen.Closed` present | Exhaustive check enabled — no `_` needed |
| `@valen.Closed` absent | Open-world — `_` wildcard **required** |

```java
// Java side
@valen.Closed
public sealed interface Color permits Red, Blue, Green {}
```

```valen
// Valen side — exhaustive
match color {
    Color.Red => ...,
    Color.Blue => ...,
    Color.Green => ...,
}
```

See [Annotations](./annotations) for details.

## Classpath Configuration

`valenc` reads Java `.class` files from the classpath for type information.

| Source | How It Works |
|---|---|
| JDK standard library | Auto-detected from `JAVA_HOME` (`java.base.jmod` on Java 9+, `rt.jar` on Java 8) |
| External libraries | `valenc compile --classpath lib/guava.jar:lib/commons.jar src/main.vln` |

- Multiple paths separated by `:` (Linux/macOS) or `;` (Windows)
- Accepts JAR files, JMOD files, and directories

## `inline fn` Visibility from Java

| Aspect | Behavior |
|---|---|
| Java sees `inline fn` as | A normal method (no inlining) |
| `reified` from Java | Ignored — standard type erasure applies |
| Lambda inlining | Does not apply when called from Java |

```valen
inline fn <reified T> isInstance(value: Any) -> Bool {
    value is T
}
```

```java
// Java — callable but reified has no effect
boolean result = ValenClass.isInstance(obj);
```

To benefit from `reified`, call from Valen code.
