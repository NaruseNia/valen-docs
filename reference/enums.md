# Enums (ADT)

Valen enums are **Rust-style algebraic data types** (sum types), completely separate from the class hierarchy. They are closed — `match` over an enum is exhaustive.

## Declaration

```valen
enum Shape {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}
```

## Variant Forms

| Form                        | Description             | Example                    |
|-----------------------------|-------------------------|----------------------------|
| `Variant`                   | Bare (no payload)       | `Point`                    |
| `Variant(field: Type, ...)` | Named fields            | `Circle(r: Float)`        |

Positional (unnamed) fields are not supported — all payload fields are named.

## Construction

Full-path syntax with `::`:

```valen
let s = Shape::Circle(r = 5.0);
let p = Shape::Point;
```

## Shorthand Construction: `.Variant`

When the expected type is known, the enum name can be omitted:

```valen
let c: Color = .Red;
let b: Color = .Blue(42);

fn make() -> Color {
    .Green
}
```

### Inference Rules

1. If the expected type is a named enum type, search that enum for the variant.
2. If there is no expected type, search all in-scope enums by variant name (ambiguity is an error).
3. If inference fails, use the fully qualified `EnumName::Variant` form.

## Shorthand in Patterns

`.Variant` also works in `match`, `if let`, `while let`, and `let else`:

```valen
match color {
    .Red => "red",
    .Blue(v) => f"blue({v})",
    .Green => "green",
}

if let .Some(x) = opt {
    use(x);
}
```

## Adding Methods via impl

Enums cannot have methods in the declaration body. Use `impl` blocks instead:

### Inherent impl

```valen
impl Shape {
    fn describe(self) -> String {
        match self {
            Shape::Circle(r) => f"circle r={r}",
            Shape::Rect(w, h) => f"rect {w}x{h}",
            Shape::Point => "point",
        }
    }
}
```

### Trait impl

```valen
impl Area for Shape {
    fn area(self) -> Float {
        match self {
            Shape::Circle(r) => 3.14159 * r * r,
            Shape::Rect(w, h) => w * h,
            Shape::Point => 0.0,
        }
    }
}
```

## enum vs sealed class

| Aspect              | `enum`                             | `sealed class`                         |
|---------------------|------------------------------------|----------------------------------------|
| Purpose             | Data sum (ADT)                     | Closed OOP hierarchy                   |
| Variant state       | Payload fields only                | Own state, methods, trait impls         |
| Own methods         | No (via `impl` only)              | Yes (in class body)                    |
| Inheritance         | None (flat)                        | Parent–child hierarchy                 |
| Per-variant visibility | Not possible                    | Each subtype decides independently     |

**Rule of thumb:** start with `enum`. Upgrade to `sealed class` when variants need their own methods or state.

## JVM Bytecode Representation

| Variant kind      | JVM representation                     |
|-------------------|----------------------------------------|
| With payload      | `record` implementing a `sealed interface` |
| Without payload   | Singleton class with `INSTANCE` field  |

```java
// Shape in Java bytecode:
public sealed interface Shape permits Shape$Circle, Shape$Rect, Shape$Point {}
public static final record Shape$Circle(double r) implements Shape {}
public static final record Shape$Rect(double w, double h) implements Shape {}
public static final class Shape$Point implements Shape {
    public static final Shape$Point INSTANCE = new Shape$Point();
}
```

Variant binary name: `EnumName$VariantName` (Java inner-class convention).
