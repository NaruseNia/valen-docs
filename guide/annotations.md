# Annotations

Annotations attach metadata to declarations — think of them as sticky notes for the compiler and runtime. If you've used Java annotations, this will feel familiar. Valen uses the `@Foo` syntax and compiles annotations to standard JVM annotation interfaces.

## Defining an Annotation

Use `annotation class` to declare one:

```valen
annotation class Deprecated(pub message: String)

annotation class Serializable  // No parameters — a marker annotation

@Target("type", "field")
annotation class JsonName(pub name: String)
```

That's it. No `@interface`, no `Retention` boilerplate. Valen defaults to `RUNTIME` retention and emits the JVM annotation metadata automatically.

## Using Annotations

Place `@AnnotationName(args)` before a declaration:

```valen
@Deprecated(message = "use NewApi instead")
pub class OldApi {}

@Serializable
data class User(pub name: String, pub age: Int);
```

### Named Arguments

Parameters use named argument syntax:

```valen
@Deprecated(message = "use NewApi instead")
pub fn oldMethod() -> Unit { ... }
```

### Single-Parameter Shorthand

If an annotation has exactly one parameter, you can skip the name:

```valen
@JsonName("user_name")
pub name: String
```

This is equivalent to `@JsonName(name = "user_name")`.

### Marker Annotations

No parameters? No parentheses needed:

```valen
@Serializable
data class Config(pub debug: Bool);
```

## Parameter Rules

Annotation parameters are restricted to **literals only**:

- `String`, `Int`, `Float`, `Bool`, `Long`, `Double`, `Char`

No expressions, no function calls, no references to constants. This keeps annotations simple and resolvable at compile time.

## Where You Can Apply Them

Annotations work on:

- **Types:** `class`, `data class`, `enum`, `trait`
- **Functions:** `fn` at top level or in a class
- **Fields** and **constructor parameters**

```valen
@Deprecated(message = "legacy")
pub class LegacyService {
    @JsonName("svc_name")
    pub name: String,
}
```

## `@Target` — Restricting Placement

Use `@Target` on an annotation class to declare where it's allowed:

```valen
@Target("type")
annotation class Entity

@Target("field", "method")
annotation class Inject
```

Valid targets: `"type"`, `"field"`, `"method"`.

::: info @Target validation is not enforced
The compiler parses `@Target` and stores the target information, but **does not currently validate** that annotations are applied only to the declared targets. For example, a `@Target("field")` annotation applied to a class will compile without error. Target validation is planned for a future release.
:::

## `@Retention`

Valen's design default is `RUNTIME` retention — annotations are available via reflection at runtime.

::: info @Retention is not implemented
The `@Retention` annotation is not currently parsed or enforced. All annotations are treated as having runtime retention. Custom retention policies (SOURCE, CLASS) are planned for a future release.
:::

## `@valen.Closed` — The One Built-In

Valen ships with one special annotation: `@valen.Closed`. It's for Java library authors to mark their `sealed` hierarchies as safe for exhaustive `match` in Valen.

```java
// Java side
import valen.Closed;

@Closed
public sealed interface Shape permits Circle, Rect {}
```

```valen
// Valen side — exhaustive match works
match shape {
    Shape.Circle => "circle",
    Shape.Rect => "rect",
    // No _ needed — @valen.Closed guarantees the set is closed
}
```

You don't write `@valen.Closed` in Valen code — it's a Java-side annotation. See [Java Interop](./java-interop) for the full story.

## Java Annotations

You can import and apply Java annotations to Valen declarations. The `@Foo(...)` syntax is the same for both Valen-defined and Java-defined annotations:

```valen
import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
pub class User {
    @Id
    pub id: Long,
    pub name: String,
}
```

::: warning Parameter validation is trust-based
For Java annotations, Valen does not validate parameter types, required fields, or annotation targets at compile time. It parses what you write and emits it to bytecode on trust. If you get a parameter wrong or miss a required field, the error surfaces at runtime — not at compile time. This is because Java annotation definitions are resolved via classpath, and full classpath resolution for annotation metadata is not yet implemented.
:::

## What's Next?

- [Traits](./traits) — defining behavior contracts with `trait` and `impl`
- [Java Interop](./java-interop) — using Java types, methods, and annotations
