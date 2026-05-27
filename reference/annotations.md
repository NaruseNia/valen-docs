# Annotations

## Declaring an Annotation

Use `annotation class` to define a custom annotation.

```valen
annotation class Deprecated(pub message: String)

annotation class Serializable    // Marker (no parameters)

@Target("type", "field")
annotation class JsonName(pub name: String)
```

### Parameter Types

Annotation parameters accept **literals only**:

`String`, `Int`, `Float`, `Bool`, `Long`, `Double`, `Char`

### @Target

Use `@Target("type")`, `@Target("type", "field", "method")`, etc. to restrict where the annotation can be applied. The targets are stored in the HIR.

::: warning
**`@Target` validation is not implemented.** The target strings are parsed and stored, but the compiler does **not** check whether an annotation is applied to a valid target. For example, applying a field-only annotation to a class compiles without error.
:::

### @Retention

Default retention is `RUNTIME`.

::: warning
**`@Retention` is not implemented.** Parsing, storage, and JVM bytecode reflection of retention are all unimplemented.
:::

### JVM Representation

Emitted as `@interface` (`ACC_INTERFACE | ACC_ABSTRACT | ACC_ANNOTATION`).

## Applying Annotations

| Form | When to Use |
|---|---|
| `@Name` | Marker annotation (no arguments) |
| `@Name("value")` | Single parameter (name omitted) |
| `@Name(key = "value")` | Named argument |
| `@Name(a = 1, b = "x")` | Multiple named arguments |

```valen
@Deprecated(message = "use NewApi")
pub class OldApi {}

@JsonName("user_name")         // Single param — name can be omitted
pub name: String

@Serializable                  // Marker — no () needed
data class User(pub name: String);
```

### Applicable Targets

Top-level declarations (`class`, `data class`, `enum`, `trait`, `fn`) and fields / constructor parameters.

### Java Annotations

Imported Java annotations can be applied with `@Foo(...)` syntax. The syntax is the same as for Valen-defined annotations.

::: warning
**Java annotation parameter type checking is not implemented.** The compiler does not resolve Java annotation definitions from the classpath, so parameter types are not validated. Application is trust-based.
:::

## `@valen.Closed`

The only built-in annotation. Enables exhaustive `match` on Java sealed hierarchies.

### Rules

| Rule | Detail |
|---|---|
| Who writes it | Java library authors (not Valen code) |
| Target | Java `sealed interface` or `sealed class` |
| Effect | Valen compiler treats the hierarchy as closed-world for `match` |
| Without it | Java `sealed` types require `_` wildcard in `match` |

### Java Side

```java
package com.example;
import valen.Closed;

@Closed
public sealed interface Color permits Red, Blue, Green {}
```

### Valen Side

```valen
import com.example.Color;

match color {
    Color.Red => ...,
    Color.Blue => ...,
    Color.Green => ...,   // Exhaustive — no _ needed
}
```

### Without `@valen.Closed`

```valen
match color {
    Color.Red => ...,
    Color.Blue => ...,
    Color.Green => ...,
    _ => ...,             // Required — compile error if omitted
}
```
