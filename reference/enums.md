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

## `derives(...)` Clause

Enums can declare `derives(...)` to auto-generate methods for payload variants.

```valen
enum Shape derives(Eq, Hash, Display, Clone) {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}
```

**Syntax:** `derives(Trait1, Trait2, ...)` — placed after the enum name (and generic parameters), before the body `{`.

### Derivable Traits

| Trait     | Generated Method                | Applies To |
|-----------|---------------------------------|------------|
| `Eq`     | `equals(Object) -> Boolean`     | Payload variants only |
| `Hash`   | `hashCode() -> Int`             | Payload variants only |
| `Display` | `toString() -> String`         | Payload variants only |
| `Clone`  | `copy(...) -> Self`             | Payload variants only |

Bare variants (no payload) are singletons — identity equals is sufficient, so derives do not apply to them.

The generation logic is shared with `data class` (same `data_class_methods` module).

## Inherent Methods via `impl`

Enums can have methods through inherent `impl` blocks:

```valen
enum Shape {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}

impl Shape {
    fn describe(self) -> String {
        match self {
            .Circle(r) => f"circle with radius {r}",
            .Rect(w, h) => f"rect {w}x{h}",
            .Point => "point",
        }
    }

    fn is_circle(self) -> Boolean {
        match self {
            .Circle(_) => true,
            _ => false,
        }
    }
}
```

- `impl EnumName { ... }` — inherent methods, available on all variants.
- `impl Trait for EnumName { ... }` — trait implementation.
- Methods are emitted on the sealed interface, so all variants can use them.

## `enum` vs `sealed class`

| Aspect              | `enum`                             | `sealed class`                         |
|---------------------|------------------------------------|----------------------------------------|
| Purpose             | Data sum (ADT)                     | Closed OOP hierarchy                   |
| Variant state       | Payload fields only                | Own state, methods, trait impls         |
| Own methods         | Via `impl` blocks                  | In class body or `impl` blocks         |
| Inheritance         | None (flat)                        | Parent-child hierarchy                 |
| Per-variant visibility | Not possible                    | Each subtype decides independently     |

**Rule of thumb:** start with `enum`. Upgrade to `sealed class` when variants need their own independent methods or state.

## JVM Bytecode Representation

| Variant Kind      | JVM Representation                     |
|-------------------|----------------------------------------|
| With payload      | `record` implementing a `sealed interface` |
| Without payload   | Singleton class with `INSTANCE` field  |

```java
// Shape.valen -> Shape.class + Shape$Circle.class + Shape$Rect.class + Shape$Point.class
// Each variant is emitted as a separate top-level .class file

// sealed interface (enum itself)
public sealed interface Shape permits Shape$Circle, Shape$Rect, Shape$Point {}

// payload variant -> record (extends java.lang.Record)
public final record Shape$Circle(float r) implements Shape {}
public final record Shape$Rect(float w, float h) implements Shape {}

// bare variant -> singleton class
public final class Shape$Point implements Shape {
    public static final Shape$Point INSTANCE = new Shape$Point();
    private Shape$Point() {}
}
```

Key points:
- The enum itself becomes a `sealed interface` with a `PermittedSubclasses` attribute.
- Payload variants become `record` classes with `private final` fields and public getters.
- Bare variants become singleton classes with a static `INSTANCE` field.
- Variant classes are **separate top-level `.class` files**, not `static` nested classes. The `$` in the binary name follows Java naming convention but the class structure is independent.
- Valen `Float` maps to JVM `float` (32-bit). Valen `Double` maps to JVM `double` (64-bit).
- `derives(...)` generates `equals` / `hashCode` / `toString` / `copy` on payload variant records.
- Inherent impl and trait impl methods are emitted on the sealed interface.

Variant binary name: `EnumName$VariantName` (Java inner-class naming convention).
