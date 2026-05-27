# Enums (Algebraic Data Types)

If you've ever wished Java's `enum` could carry different data per variant, you're going to love this. Valen's `enum` is a full algebraic data type — a sum type where each variant can hold its own payload. It's one of the four pillars of the language, and honestly, once you get used to it, going back to plain enums feels like using a flip phone.

## Defining an Enum

```valen
enum Shape {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}
```

- `Circle` holds a radius
- `Rect` holds a width and height
- `Point` holds nothing — it's just a tag

That's it. No class hierarchies, no visitor pattern, no factory methods. The type system knows exactly what variants exist, and the compiler enforces that you handle all of them.

## Constructing Variants

Use the `::` scope operator to create a variant. Payload fields use named arguments:

```valen
let circle = Shape::Circle(r = 5.0);
let rect = Shape::Rect(w = 10.0, h = 20.0);
let point = Shape::Point;
```

### Variant Shorthand

When the compiler already knows which enum you mean (from a type annotation, return type, or match scrutinee), you can skip the enum name and use dot syntax:

```valen
let c: Shape = .Circle(r = 5.0);   // Shape::Circle(r = 5.0)
let p: Shape = .Point;              // Shape::Point

fn origin() -> Shape {
    .Point                           // inferred from return type
}
```

This shorthand works everywhere the expected type is known — variable declarations, function arguments, return expressions, and match arms. If the compiler can't figure it out, it'll ask you to use the full `Shape::Circle(...)` form.

The shorthand also works in patterns:

```valen
match color {
    .Red => "red",
    .Green => "green",
    .Blue(v) => f"blue({v})",
}

if let .Some(x) = opt {
    x
}
```

See [Pattern Matching](./pattern-matching) for more details on shorthand in patterns.

## `derives` — Auto-Generated Methods

Enums can use the `derives(...)` clause to auto-generate methods for payload variants. Place it after the enum name, before the body `{`:

```valen
enum Shape derives(Eq, Hash, Display, Clone) {
    Circle(r: Float),
    Rect(w: Float, h: Float),
    Point,
}
```

| Derive    | What You Get | Applies To |
|-----------|-------------|------------|
| `Eq`      | `equals(Object) -> Boolean` | Payload variants only |
| `Hash`    | `hashCode() -> Int` | Payload variants only |
| `Display` | `toString() -> String` | Payload variants only |
| `Clone`   | `copy(...) -> Self` | Payload variants only |

No-payload variants (like `Point`) are singletons, so identity comparison is sufficient — derives don't affect them.

## Adding Methods

Enums can have methods via inherent `impl` blocks. This is how you attach behavior directly to an enum:

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

let s = Shape::Circle(r = 3.0);
println(s.describe());  // "circle with radius 3.0"
```

Methods defined in `impl EnumName { ... }` are available on all variants. Under the hood, they're emitted on the sealed interface, so every variant class inherits them.

You can also implement traits for enums:

```valen
trait Area {
    fn area(self) -> Float;
}

impl Area for Shape {
    fn area(self) -> Float {
        match self {
            .Circle(r) => 3.14159 * r * r,
            .Rect(w, h) => w * h,
            .Point => 0.0,
        }
    }
}

let s = Shape::Circle(r = 3.0);
println(f"{s.area()}");  // 28.27431
```

This keeps data and behavior cleanly separated. The enum defines *what* the data looks like; the `impl` blocks define *what you can do* with it.

## A Richer Example

```valen
enum JsonValue {
    Null,
    Bool(value: Bool),
    Number(value: Float),
    Str(value: String),
    Array(items: List<JsonValue>),
    Object(entries: Map<String, JsonValue>),
}

impl JsonValue {
    fn display(self) -> String {
        match self {
            .Null => "null",
            .Bool(v) => f"{v}",
            .Number(v) => f"{v}",
            .Str(v) => f"\"{v}\"",
            .Array(_) => "[...]",
            .Object(_) => "{...}",
        }
    }
}
```

Recursive types work naturally — `Array` contains a `List<JsonValue>`, and the compiler is perfectly happy with that.

## Enum vs Sealed Class

Both enum and sealed class represent a closed set of types. The difference is in what each variant/subtype is allowed to do:

| | Enum | Sealed Class |
|---|---|---|
| **What it is** | ADT — a sum of data | Closed OOP hierarchy |
| **Per-variant state** | Only declared payload | Independent fields and state |
| **Methods** | Via `impl EnumName { ... }` | Class body + inherent impl |
| **Per-variant trait impl** | Not allowed | Allowed |
| **Inheritance from subtypes** | Not allowed | Allowed (if `open`/`abstract`) |
| **Visibility differences** | No per-variant differences | Each subtype can differ |
| **Best for** | Data classification | Behavior hierarchies |

### When to use enum

Use `enum` when your variants are pure data and behavior is shared across all of them:

```valen
enum Color {
    Red,
    Green,
    Blue,
    Custom(r: Int, g: Int, b: Int),
}
```

### When to use sealed class

Use `sealed class` when each subtype needs its own methods or state:

```valen
sealed class Widget;

class Button(pub label: String) : Widget() {
    fn click(self) {
        println(f"Button '{self.label}' clicked");
    }
}

class TextField(pub placeholder: String, mut value: String) : Widget() {
    fn clear(mut self) {
        self.value = "";
    }
}
```

**Rule of thumb:** start with `enum`. If you find yourself wishing a variant had its own independent state or methods, switch to `sealed class`.

## On the JVM

Under the hood, Valen enums compile to Java sealed interfaces and records:

```java
// Shape enum becomes:
public sealed interface Shape
    permits Shape$Circle, Shape$Rect, Shape$Point {}

// Payload variants → records
public record Shape$Circle(float r) implements Shape {}
public record Shape$Rect(float w, float h) implements Shape {}

// No-payload variants → singletons
public final class Shape$Point implements Shape {
    public static final Shape$Point INSTANCE = new Shape$Point();
    private Shape$Point() {}
}
```

Java code can work with Valen enums using `$`-separated names (e.g., `Shape$Circle`). Payload variants become records with named components; no-payload variants become singletons for memory efficiency.

Inherent `impl` and trait `impl` methods are emitted on the sealed interface side, so they're available on all variants.

## Next Steps

- [Pattern Matching](./pattern-matching) — the other half of the ADT story
- [Traits](./traits) — how to add behavior to enums
