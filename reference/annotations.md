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

### Retention & Target

| Attribute | Default |
|---|---|
| Retention | `RUNTIME` |
| Target | `TYPE` + `FIELD` + `METHOD` |

Override target with `@Target("type")`, `@Target("type", "field", "method")`, etc.

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

Imported Java annotations can be applied with `@Foo(...)`. Parameter validation is trust-based (no compile-time check against Java annotation metadata).

::: warning
Applying Java annotations **from** Valen code is currently not supported. Java annotations must be added in Java source files.
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
